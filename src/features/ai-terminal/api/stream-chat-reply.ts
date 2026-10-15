export interface ChatRequestBody {
  userQuery: string;
}

/**
 * POSTs the query to /api/chat and feeds each decoded text chunk to `onChunk`.
 * Throws on a non-OK response so the caller can switch to offline mode.
 */
export async function streamChatReply(
  userQuery: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const body: ChatRequestBody = { userQuery };
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) throw new Error('Uplink Failed');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    onChunk(decoder.decode(value, { stream: true }));
  }
}
