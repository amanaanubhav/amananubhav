import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';

import { getDb } from '@/shared/api';

export const CHAT_THREADS_COLLECTION = 'contact_chats';
export const CHAT_MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Throws when Firestore is not configured, mirroring legacy `doc(db, ...)` with a null db,
 * which threw inside the callers' try/catch. Callers that need a silent guard check getDb() first.
 */
function requireDb(): Firestore {
  const db = getDb();
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

export function threadsCollection(): CollectionReference {
  return collection(requireDb(), CHAT_THREADS_COLLECTION);
}

export function threadDoc(id: string): DocumentReference {
  return doc(requireDb(), CHAT_THREADS_COLLECTION, id);
}

export function messagesCollection(id: string): CollectionReference {
  return collection(requireDb(), CHAT_THREADS_COLLECTION, id, CHAT_MESSAGES_SUBCOLLECTION);
}
