import { useCallback, useMemo, useState } from 'react';

import type { ChatMessage } from '@/entities/chat-thread';

/** localStorage key holding `{ [chatId]: lastReadAt }` (epoch ms), so a reply that came while away still shows. */
const LAST_READ_STORAGE_KEY = 'portfolio_chat_read';

type ReadMap = Record<string, number>;

function readMap(): ReadMap {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LAST_READ_STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as ReadMap) : {};
  } catch {
    return {};
  }
}

function writeRead(chatId: string, at: number): void {
  try {
    localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify({ ...readMap(), [chatId]: at }));
  } catch {
    // storage unavailable (private mode): unread lasts for this page only
  }
}

/** A message's server time in ms; `null` while its write is pending. */
export function messageTime(message: ChatMessage): number | null {
  const ts = message.timestamp;
  if (!ts) return null;
  return typeof ts.toMillis === 'function' ? ts.toMillis() : ts.toDate().getTime();
}

/**
 * Aman's replies the visitor has not seen (chat design §3). It reads the messages the thread listener already
 * holds for a stored session, so nothing new loads. Without a stored `lastReadAt` (a session from before this
 * existed) the baseline is the visitor's own last message: replies after it count. `markRead` stores the newest of
 * now and the latest message time (server clocks may run ahead of this one).
 */
export function useUnread(chatId: string | null, messages: ChatMessage[]) {
  const [marked, setMarked] = useState<{ chatId: string; at: number } | null>(null);

  // `chatId` is only ever set after mount (from storage or Start chat), so storage is never read on the server.
  const lastReadAt = useMemo(() => {
    if (!chatId) return null;
    if (marked?.chatId === chatId) return marked.at;
    return readMap()[chatId] ?? null;
  }, [chatId, marked]);

  const { count, since } = useMemo(() => {
    let baseline = lastReadAt;
    if (baseline === null) {
      for (const m of messages) if (m.sender === 'visitor') baseline = Math.max(baseline ?? 0, messageTime(m) ?? 0);
    }
    if (baseline === null) return { count: 0, since: null };
    const from = baseline;
    const fresh = messages.filter((m) => m.sender === 'admin' && (messageTime(m) ?? 0) > from).length;
    return { count: fresh, since: from };
  }, [lastReadAt, messages]);

  const markRead = useCallback(() => {
    if (!chatId) return;
    const latest = messages.reduce((max, m) => Math.max(max, messageTime(m) ?? 0), 0);
    const at = Math.max(Date.now(), latest);
    writeRead(chatId, at);
    setMarked({ chatId, at });
  }, [chatId, messages]);

  return { count, since, markRead };
}
