import type { ChatThread } from '@/entities/chat-thread';

type MaybeTimestamp = { toDate?: () => Date } | null | undefined;

/** The visitor's name as the inbox shows it (legacy fallbacks: name, then the chat id with spaces). */
export function threadName(chat: ChatThread): string {
  return chat.visitorName || chat.name || chat.id.replace(/_/g, ' ');
}

export function threadEmail(chat: ChatThread): string | undefined {
  return chat.visitorEmail || chat.email || undefined;
}

export function threadPhone(chat: ChatThread): string | undefined {
  return chat.visitorPhone || chat.phone || undefined;
}

/** ISO value for `<time dateTime>`; undefined while Firestore has not stamped the document yet. */
export function toDateTime(ts: MaybeTimestamp): string | undefined {
  const date = ts?.toDate?.();
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
}

/** Client-side filter for the conversation search (name, email, last message). */
export function matchesConversation(chat: ChatThread, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [threadName(chat), threadEmail(chat), chat.lastMessage].some((field) => field?.toLowerCase().includes(q));
}

export function conversationCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'conversation' : 'conversations'}`;
}

/** §G.7 copy. */
export const INBOX_COPY = {
  title: 'Inbox',
  gateLead: 'Enter the admin code to open the inbox.',
  gateLabel: 'Admin code',
  gateSubmit: 'Unlock',
  gateError: "That code didn't work. Check it and try again.",
  logout: 'Log out',
  searchLabel: 'Search conversations',
  empty: 'No conversations yet.',
  noMatch: (query: string) => `No conversations match "${query}".`,
  selectPrompt: 'Select a conversation to read it.',
  backToList: 'Conversations',
  block: 'Block',
  unblock: 'Unblock',
  clear: 'Clear chat',
  remove: 'Delete user',
  blocked: 'Blocked',
  blockedComposer: 'This visitor is blocked',
  replyLabel: 'Reply',
  replyPlaceholder: 'Type your reply',
  send: 'Send',
  sendHint: 'Enter sends. Shift + Enter adds a new line.',
  you: 'You',
  noMessages: 'No messages in this conversation.',
} as const;
