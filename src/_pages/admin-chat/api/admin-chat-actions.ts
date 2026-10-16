import {
  addDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import type { ChatThread } from '@/entities/chat-thread';
import { messagesCollection, threadDoc } from '@/entities/chat-thread/index.firestore';
import { getDb, isEmailConfigured, sendEmail } from '@/shared/api';

function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

/**
 * Admin reply: adds the message, bumps the thread, then notifies the visitor via EmailJS.
 * Firestore errors propagate to the caller; EmailJS errors are logged here (legacy behaviour).
 */
export async function sendAdminReply(chat: ChatThread, text: string): Promise<void> {
  await addDoc(messagesCollection(chat.id), {
    text: text,
    sender: 'admin',
    timestamp: serverTimestamp(),
  });

  await setDoc(
    threadDoc(chat.id),
    {
      lastMessage: text,
      lastActive: serverTimestamp(),
    },
    { merge: true },
  );

  // Trigger Email to Visitor using EmailJS (Free Tier)
  if (isEmailConfigured()) {
    try {
      const res = await sendEmail('toVisitor', {
        to_email: chat.visitorEmail,
        to_name: chat.visitorName,
        reply_message: text,
      });
      console.log('EmailJS Success (to Visitor):', res.status, res.text);
    } catch (err) {
      console.error('EmailJS Error (to Visitor):', err);
    }
  } else {
    console.warn('EmailJS credentials not configured yet. Check .env file.');
  }
}

/** Deletes every message of the thread but keeps the thread document. */
export async function clearThreadMessages(chatId: string): Promise<void> {
  const messagesSnapshot = await getDocs(messagesCollection(chatId));

  const batch = writeBatch(requireDb());
  messagesSnapshot.forEach((messageDoc) => {
    batch.delete(messageDoc.ref);
  });

  await batch.commit();

  await setDoc(
    threadDoc(chatId),
    {
      lastMessage: '[CHAT CLEARED]',
      unreadCount: 0,
    },
    { merge: true },
  );
}

/** Deletes every message and the thread document itself. */
export async function deleteThread(chatId: string): Promise<void> {
  const messagesSnapshot = await getDocs(messagesCollection(chatId));

  const batch = writeBatch(requireDb());
  messagesSnapshot.forEach((messageDoc) => {
    batch.delete(messageDoc.ref);
  });

  batch.delete(threadDoc(chatId));

  await batch.commit();
}

export function setThreadBlocked(chatId: string, isBlocked: boolean): Promise<void> {
  return setDoc(threadDoc(chatId), { isBlocked }, { merge: true });
}

export function markThreadRead(chatId: string): Promise<void> {
  return setDoc(threadDoc(chatId), { unreadCount: 0 }, { merge: true });
}
