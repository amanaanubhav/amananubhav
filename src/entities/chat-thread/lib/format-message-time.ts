import type { Timestamp } from 'firebase/firestore';

/** Identical in FloatingChat.jsx and AdminChat.jsx: HH:MM, '' for pending (null) timestamps. */
export function formatMessageTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
