import 'server-only';

import { streamText, type ModelMessage } from 'ai';

import { PROFILE } from '@/entities/profile';
import {
  groqChatModel,
  isGroqConfigured,
  isOpenRouterConfigured,
  openRouterChatModel,
} from '@/shared/api/index.server';

import {
  CANNED,
  type CannedReason,
  clientKey,
  createDailyBudget,
  createRateLimiter,
  createStreamRedactor,
  DEFAULT_ALLOWED_HOSTS,
  detectInjection,
  detectPrivateTopic,
  FENCE_RULES,
  fenceUserText,
  hostsInText,
  isAllowedOrigin,
  LIMITS,
  parseBlockedTerms,
  parseChatRequest,
  PUBLIC_EMAIL,
  readBodyCapped,
  type RedactOptions,
} from './guardrails';
import { buildSystemPrompt } from './system-prompt';

/** How long a provider may take to send its first text before the next one is tried; two tries fit in Vercel's 25s response-start limit. */
const FIRST_TEXT_TIMEOUT_MS = 10_000;
/** Hard stop for a reply once it has started streaming. */
const STREAM_TIMEOUT_MS = 30_000;
/** Conservative generation: replies are under 100 words (RULES 3), so 400 tokens is ample headroom. */
const GENERATION = { maxOutputTokens: 400, temperature: 0.3 } as const;

const STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'X-Content-Type-Options': 'nosniff',
} as const;

/** Best-effort, per isolate (see createRateLimiter): 10 questions a minute, 60 an hour per IP. */
const rateLimiter = createRateLimiter([
  { limit: 10, ms: 60_000 },
  { limit: 60, ms: 60 * 60_000 },
]);
/** Per-isolate soft cap on model calls per UTC day; past it the terminal answers from its offline notes. */
const dailyBudget = createDailyBudget(2_000);

function jsonError(message: string, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** A guard reply in the same shape as a model reply (200, plain text body), so the terminal prints it and stays live. */
function cannedReply(reason: CannedReason): Response {
  return new Response(CANNED[reason], { status: 200, headers: { ...STREAM_HEADERS, 'X-Chat-Guard': reason } });
}

/** Chat providers whose key is set, in fallback order: OpenRouter first, then Groq. */
function configuredProviders() {
  return [
    { name: 'OpenRouter', model: openRouterChatModel, configured: isOpenRouterConfigured() },
    { name: 'Groq', model: groqChatModel, configured: isGroqConfigured() },
  ].filter((provider) => provider.configured);
}

let promptContext: { system: string; redact: RedactOptions; allowedHosts: string[] } | null = null;

/** System prompt plus the security addendum, and the redaction allowlists derived from it (built once per isolate). */
function getPromptContext() {
  if (!promptContext) {
    const base = buildSystemPrompt();
    const allowedHosts = [...new Set([...DEFAULT_ALLOWED_HOSTS, ...hostsInText(base)])];
    promptContext = {
      system: `${base}\n${FENCE_RULES}`,
      allowedHosts,
      redact: {
        allowedEmails: [PUBLIC_EMAIL, PROFILE.links.email],
        allowedHosts,
        blockedTerms: parseBlockedTerms(process.env.CHAT_REDACT_TERMS),
      },
    };
  }
  return promptContext;
}

/**
 * Reads parts until the first text arrives (true) or the stream errors, aborts or ends empty (false).
 * fullStream is a tee of the result, so a stream read afterwards still starts at the first chunk.
 */
async function hasTextStarted(parts: AsyncIterable<{ type: string }>): Promise<boolean> {
  for await (const part of parts) {
    if (part.type === 'text-delta') return true;
    if (part.type === 'error' || part.type === 'abort') return false;
  }
  return false;
}

/** The model's text stream passed through the redactor, as UTF-8 bytes. `stop(true)` also aborts the model call. */
function guardedBody(
  textStream: AsyncIterable<string>,
  redact: RedactOptions,
  stop: (abortModel: boolean) => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const redactor = createStreamRedactor(redact);
  const iterator = textStream[Symbol.asyncIterator]();

  const finish = (controller: ReadableStreamDefaultController<Uint8Array>, abortModel: boolean) => {
    const tail = redactor.flush();
    if (tail.text) controller.enqueue(encoder.encode(tail.text));
    controller.close();
    stop(abortModel);
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const { value, done } = await iterator.next();
          if (done) return finish(controller, false);
          const out = redactor.push(value);
          if (out.text) controller.enqueue(encoder.encode(out.text));
          if (out.stop) {
            controller.close();
            stop(true);
            await iterator.return?.();
            return;
          }
          if (out.text) return;
        }
      } catch (error) {
        console.error('Chat Error: stream interrupted:', error instanceof Error ? error.message : error);
        finish(controller, true);
      }
    },
    async cancel() {
      stop(true);
      await iterator.return?.();
    },
  });
}

/**
 * POST /api/chat. Body: { userQuery: string } (optionally { messages: {role, content}[] } with roles
 * user | assistant). Any client-sent resume/adventure data is ignored; the system prompt is built
 * server-side from entity data. Guardrails (./guardrails): origin check, per-IP rate limit, capped body,
 * validation and normalisation, canned in-character replies for empty, oversized, noise, prompt-extraction
 * and private-detail questions (200, no model call), fenced visitor text with injection warnings,
 * conservative generation and a redacted stream. Streams raw text chunks so the terminal keeps reading
 * the body as plain text. OpenRouter answers first; Groq takes over when OpenRouter fails before sending
 * any text. Responds 503 when no provider key is set or the daily budget is spent and 502 when every
 * provider fails, so the terminal switches to offline mode.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const context = getPromptContext();

    if (!isAllowedOrigin(req.headers.get('origin'), req.headers.get('host'), context.allowedHosts)) {
      return jsonError('Forbidden', 403);
    }

    const limit = rateLimiter.check(clientKey(req.headers));
    if (!limit.ok) {
      console.warn('Chat: rate limited');
      return jsonError('Too many requests', 429, { 'Retry-After': String(limit.retryAfterSec) });
    }

    const providers = configuredProviders();
    if (providers.length === 0) {
      console.error('Chat Error: neither OPENROUTER_API_KEY nor GROQ_API_KEY is set');
      return jsonError('AI chat is not configured', 503);
    }

    const raw = await readBodyCapped(req, LIMITS.maxBodyBytes);
    if (!raw.ok) return jsonError('Request too large', 413);

    let body: unknown;
    try {
      body = JSON.parse(raw.text);
    } catch {
      return jsonError('Body must be JSON', 400);
    }

    const parsed = parseChatRequest(body);
    if (parsed.kind === 'invalid') return jsonError(parsed.error, parsed.status);
    if (parsed.kind === 'canned') return cannedReply(parsed.reason);

    const verdict = detectInjection(parsed.query);
    if (verdict.extraction) {
      console.warn('Chat: prompt-extraction attempt answered from the guard');
      return cannedReply('extraction');
    }
    if (detectPrivateTopic(parsed.query)) return cannedReply('private');
    if (verdict.suspicious) console.warn(`Chat: suspicious input (${verdict.reasons.join(', ')}), fenced`);

    if (!dailyBudget.take()) {
      console.error('Chat Error: daily model-call budget spent in this isolate');
      return jsonError('AI chat is resting', 503);
    }

    const messages: ModelMessage[] = [
      ...parsed.history.map((turn): ModelMessage =>
        turn.role === 'user'
          ? { role: 'user', content: fenceUserText(turn.content, detectInjection(turn.content)) }
          : { role: 'assistant', content: turn.content },
      ),
      { role: 'user', content: fenceUserText(parsed.query, verdict) },
    ];

    for (const [index, provider] of providers.entries()) {
      const next = providers[index + 1];
      const abort = new AbortController();
      const firstTextTimer = setTimeout(() => abort.abort(), FIRST_TEXT_TIMEOUT_MS);

      const result = streamText({
        model: provider.model,
        system: context.system,
        messages,
        ...GENERATION,
        abortSignal: abort.signal,
        // Hand over to the next provider at once instead of retrying this one.
        maxRetries: next ? 0 : 2,
        onError: ({ error }) =>
          console.error(`Chat Error (${provider.name}):`, error instanceof Error ? error.message : error),
      });

      const started = await hasTextStarted(result.fullStream);
      clearTimeout(firstTextTimer);

      if (started) {
        const streamTimer = setTimeout(() => abort.abort(), STREAM_TIMEOUT_MS);
        const stop = (abortModel: boolean) => {
          clearTimeout(streamTimer);
          if (abortModel && !abort.signal.aborted) abort.abort();
        };
        return new Response(guardedBody(result.textStream, context.redact, stop), {
          status: 200,
          headers: STREAM_HEADERS,
        });
      }

      if (abort.signal.aborted) {
        console.error(`Chat Error (${provider.name}): no text within ${FIRST_TEXT_TIMEOUT_MS / 1000}s`);
      }
      if (next) console.warn(`Chat: ${provider.name} failed, falling back to ${next.name}`);
    }

    return jsonError('AI chat is unavailable', 502);
  } catch (error) {
    console.error('Chat Error:', error instanceof Error ? error.message : error);
    return jsonError('Internal Server Error', 500);
  }
}
