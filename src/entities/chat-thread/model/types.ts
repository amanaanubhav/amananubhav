import type { Timestamp } from 'firebase/firestore';

/** Firestore `contact_chats/{chatId}` document (visitor* fields, with legacy name/email/phone fallbacks). */
export type ChatThreadDoc = {
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  lastMessage?: string;
  name?: string;
  email?: string;
  phone?: string;
  lastActive?: Timestamp | null;
  unreadCount?: number;
  isBlocked?: boolean;
};

export type ChatThread = ChatThreadDoc & { id: string };

/** Firestore `contact_chats/{chatId}/messages/{id}` document. */
export type ChatMessage = {
  id: string;
  text: string;
  sender: 'visitor' | 'admin';
  timestamp: Timestamp | null;
};

export type VisitorProfile = { name: string; email: string; phone: string };
