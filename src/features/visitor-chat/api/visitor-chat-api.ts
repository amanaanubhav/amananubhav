import { addDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import type { VisitorProfile } from '@/entities/chat-thread';
import { messagesCollection, threadDoc } from '@/entities/chat-thread/index.firestore';
import { ensureAnonymousSession, getDb } from '@/shared/api';

import { notifyOwner } from './notify-owner';

/*
 * The chat's Firestore and EmailJS code. `useVisitorChat` loads this module with `import()` on first need (a stored
 * session, Start chat, Send), so it stays out of every route's initial JS (§J.2).
 */

export { subscribeToMessages, subscribeToThread } from '@/entities/chat-thread/index.firestore';
export { ensureAnonymousSession };

/** False when Firebase is not configured (the hook's legacy `getDb()` guard). */
export function hasChatDb(): boolean {
  return getDb() !== null;
}

/**
 * Creates / refreshes the thread document when the visitor starts a chat. Await `ensureAnonymousSession()` first:
 * the write is then issued synchronously (applied to the local cache), so a listener attached right after sees it.
 */
export async function startThread(id: string, { name, email, phone }: VisitorProfile): Promise<void> {
  await setDoc(
    threadDoc(id),
    {
      visitorName: name,
      visitorEmail: email,
      visitorPhone: phone,
      lastActive: serverTimestamp(),
      unreadCount: 0,
    },
    { merge: true },
  );
}

/** Saves the message, updates the parent thread, then emails the owner. */
export async function sendVisitorMessage(
  chatId: string,
  text: string,
  visitor: VisitorProfile,
): Promise<void> {
  await ensureAnonymousSession();

  // 1. Save message to chat history
  await addDoc(messagesCollection(chatId), {
    text: text,
    sender: 'visitor',
    timestamp: serverTimestamp(),
  });

  // 2. Update parent chat document
  await setDoc(
    threadDoc(chatId),
    {
      visitorName: visitor.name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone || '',
      lastMessage: text,
      lastActive: serverTimestamp(),
      unreadCount: 1,
    },
    { merge: true },
  );

  // 3. Trigger Email to Aman using EmailJS (Free Tier)
  await notifyOwner(visitor, text);
}
