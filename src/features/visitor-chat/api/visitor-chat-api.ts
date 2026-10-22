import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import type { ChatThreadDoc, VisitorProfile } from '@/entities/chat-thread';
import { messagesCollection, threadDoc } from '@/entities/chat-thread/index.firestore';
import { ensureAnonymousSession, getDb } from '@/shared/api';

import { notifyOwner } from './notify-owner';

/*
 * The chat's Firestore and EmailJS code. `useVisitorChat` loads this module with `import()` on first need (a stored
 * session, Start chat, Send), so it stays out of every route's initial JS (§J.2).
 */

export { subscribeToMessages } from '@/entities/chat-thread/index.firestore';
export { ensureAnonymousSession };

/** False when Firebase is not configured (the hook's legacy `getDb()` guard). */
export function hasChatDb(): boolean {
  return getDb() !== null;
}

/**
 * The visitor's thread document. `confirmed` is true only for a snapshot the server answered (not the offline
 * cache), so a missing thread is acted on only when the server says so. Metadata changes are included: a cache miss
 * later confirmed by the server arrives as a metadata-only change. No-op when Firestore is not configured.
 */
export function subscribeToThread(
  chatId: string,
  cb: (state: { exists: boolean; isBlocked: boolean; confirmed: boolean }) => void,
): () => void {
  if (!getDb()) return () => {};
  return onSnapshot(
    threadDoc(chatId),
    { includeMetadataChanges: true },
    (snap) => {
      const data = snap.exists() ? (snap.data() as ChatThreadDoc) : null;
      cb({ exists: data !== null, isBlocked: data?.isBlocked ?? false, confirmed: !snap.metadata.fromCache });
    },
    (error) => console.error('Error watching chat:', error),
  );
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

/**
 * A new message's document id, made on the client (as `addDoc` does), so the thread can match its optimistic
 * bubble to the listener's copy and mark that one bubble failed if the write is rejected.
 */
export function newMessageId(chatId: string): string {
  return doc(messagesCollection(chatId)).id;
}

/** Sends still waiting for the server, by message id. */
const inFlight = new Map<string, Promise<void>>();

/**
 * Saves the message under `id` (same path and fields as before), updates the parent thread, then emails the owner.
 * A second call for an id still in flight (Retry after the hook's time limit) returns the pending send instead of
 * writing again, so a write that lands late is not doubled and the owner gets one email.
 */
export function sendVisitorMessage(chatId: string, text: string, visitor: VisitorProfile, id: string): Promise<void> {
  const pending = inFlight.get(id);
  if (pending) return pending;
  const send = writeVisitorMessage(chatId, text, visitor, id).finally(() => inFlight.delete(id));
  inFlight.set(id, send);
  return send;
}

async function writeVisitorMessage(chatId: string, text: string, visitor: VisitorProfile, id: string): Promise<void> {
  await ensureAnonymousSession();

  // 1. Save message to chat history
  await setDoc(doc(messagesCollection(chatId), id), {
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
