import 'server-only';

import { streamText } from 'ai';

import {
  groqChatModel,
  isGroqConfigured,
  isOpenRouterConfigured,
  openRouterChatModel,
} from '@/shared/api/index.server';

import { buildSystemPrompt } from './system-prompt';

/** How long a provider may take to send its first text before the next one is tried; two tries fit in Vercel's 25s response-start limit. */
const FIRST_TEXT_TIMEOUT_MS = 10_000;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Chat providers whose key is set, in fallback order: OpenRouter first, then Groq. */
function configuredProviders() {
  return [
    { name: 'OpenRouter', model: openRouterChatModel, configured: isOpenRouterConfigured() },
    { name: 'Groq', model: groqChatModel, configured: isGroqConfigured() },
  ].filter((provider) => provider.configured);
}

/**
 * Reads parts until the first text arrives (true) or the stream errors, aborts or ends empty (false).
 * fullStream is a tee of the result, so a response built afterwards still starts at the first chunk.
 */
async function hasTextStarted(parts: AsyncIterable<{ type: string }>): Promise<boolean> {
  for await (const part of parts) {
    if (part.type === 'text-delta') return true;
    if (part.type === 'error' || part.type === 'abort') return false;
  }
  return false;
}

/**
 * POST /api/chat. Body: { userQuery: string }. Any client-sent resume/adventure data is ignored;
 * the system prompt is built server-side from entity data. Streams raw text chunks
 * (toTextStreamResponse) so the terminal client keeps reading the body as plain text.
 * OpenRouter answers first; Groq takes over when OpenRouter fails before sending any text.
 * Responds 503 when no provider key is set and 502 when every provider fails, so the terminal
 * switches to offline mode.
 */
export async function POST(req: Request): Promise<Response> {
  const providers = configuredProviders();
  if (providers.length === 0) {
    console.error('Chat Error: neither OPENROUTER_API_KEY nor GROQ_API_KEY is set');
    return jsonError('AI chat is not configured', 503);
  }

  try {
    const body: unknown = await req.json();
    const userQuery =
      typeof body === 'object' && body !== null ? (body as { userQuery?: unknown }).userQuery : undefined;

    if (typeof userQuery !== 'string') {
      return jsonError('userQuery must be a string', 400);
    }

    const system = buildSystemPrompt();

    for (const [index, provider] of providers.entries()) {
      const next = providers[index + 1];
      const firstText = new AbortController();
      const timer = setTimeout(() => firstText.abort(), FIRST_TEXT_TIMEOUT_MS);

      const result = streamText({
        model: provider.model,
        system,
        prompt: userQuery,
        abortSignal: firstText.signal,
        // Hand over to the next provider at once instead of retrying this one.
        maxRetries: next ? 0 : 2,
        onError: ({ error }) =>
          console.error(`Chat Error (${provider.name}):`, error instanceof Error ? error.message : error),
      });

      const started = await hasTextStarted(result.fullStream);
      clearTimeout(timer);

      if (started) {
        return result.toTextStreamResponse({
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (firstText.signal.aborted) {
        console.error(`Chat Error (${provider.name}): no text within ${FIRST_TEXT_TIMEOUT_MS / 1000}s`);
      }
      if (next) console.warn(`Chat: ${provider.name} failed, falling back to ${next.name}`);
    }

    return jsonError('AI chat is unavailable', 502);
  } catch (error) {
    console.error('Chat Error:', error);
    const message = error instanceof Error && error.message ? error.message : 'Internal Server Error';
    return jsonError(message, 500);
  }
}
