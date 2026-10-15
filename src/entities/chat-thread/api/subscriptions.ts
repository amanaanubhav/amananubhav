import { onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

import { getDb } from '@/shared/api';

import type { ChatMessage, ChatThread, ChatThreadDoc } from '../model/types';
import { messagesCollection, threadDoc, threadsCollection } from './refs';

const noop: Unsubscribe = () => {};

/** All threads, newest activity first (admin inbox). No-op when Firestore is not configured. */
export function subscribeToThreads(cb: (threads: ChatThread[]) => void): Unsubscribe {
  if (!getDb()) return noop;
  const q = query(threadsCollection(), orderBy('lastActive', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const chatList = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ChatThreadDoc),
    }));
    cb(chatList);
  });
}

/** Messages of one thread, oldest first. No-op when Firestore is not configured. */
export function subscribeToMessages(
  chatId: string,
  cb: (messages: ChatMessage[]) => void,
): Unsubscribe {
  if (!getDb()) return noop;
  const q = query(messagesCollection(chatId), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          ...d.data(),
        }) as ChatMessage,
    );
    cb(msgs);
  });
}

/** Existence and block state of one thread document. No-op when Firestore is not configured. */
export function subscribeToThread(
  chatId: string,
  cb: (state: { exists: boolean; isBlocked: boolean }) => void,
): Unsubscribe {
  if (!getDb()) return noop;
  return onSnapshot(threadDoc(chatId), (docSnap) => {
    if (docSnap.exists()) {
      cb({ exists: true, isBlocked: (docSnap.data() as ChatThreadDoc).isBlocked || false });
    } else {
      cb({ exists: false, isBlocked: false });
    }
  });
}
