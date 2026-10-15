import 'server-only';

import { streamText } from 'ai';

import { chatModel, isChatConfigured } from '@/shared/api/index.server';

import { buildSystemPrompt } from './system-prompt';

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/chat. Body: { userQuery: string }. Any client-sent resume/adventure data is ignored;
 * the system prompt is built server-side from entity data. Streams raw text chunks
 * (toTextStreamResponse) so the terminal client keeps reading the body as plain text.
 * Responds 503 when OPENROUTER_API_KEY is missing, so the terminal switches to offline mode.
 */
export async function POST(req: Request): Promise<Response> {
  if (!isChatConfigured()) {
    console.error('Chat Error: OPENROUTER_API_KEY is not set');
    return jsonError('AI chat is not configured', 503);
  }

  try {
    const body: unknown = await req.json();
    const userQuery =
      typeof body === 'object' && body !== null ? (body as { userQuery?: unknown }).userQuery : undefined;

    if (typeof userQuery !== 'string') {
      return jsonError('userQuery must be a string', 400);
    }

    const result = streamText({
      model: chatModel,
      system: buildSystemPrompt(),
      prompt: userQuery,
    });

    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat Error:', error);
    const message = error instanceof Error && error.message ? error.message : 'Internal Server Error';
    return jsonError(message, 500);
  }
}
