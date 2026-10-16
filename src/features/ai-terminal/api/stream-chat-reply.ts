export interface ChatRequestBody {
  userQuery: string;
}

/** A non-OK answer from /api/chat; `status` lets the caller tell a rate limit from a dead service. */
export class ChatUplinkError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Uplink Failed (${status})`);
    this.name = 'ChatUplinkError';
    this.status = status;
  }
}

/**
 * POSTs the query to /api/chat and feeds each decoded text chunk to `onChunk`.
 * Throws ChatUplinkError on a non-OK response so the caller can switch to offline mode;
 * `signal` aborts the request (fetch then rejects with an AbortError).
 */
export async function streamChatReply(
  userQuery: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const body: ChatRequestBody = { userQuery };
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) throw new ChatUplinkError(response.status);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    onChunk(decoder.decode(value, { stream: true }));
  }
}
