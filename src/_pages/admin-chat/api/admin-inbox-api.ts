import { getDb } from '@/shared/api';

/*
 * Everything the inbox needs from Firestore and EmailJS. `useAdminInbox` loads this module with `import()` once the
 * gate is passed, so /admin-chat's initial JS carries neither (§J.2).
 */

export {
  clearThreadMessages,
  deleteThread,
  markThreadRead,
  sendAdminReply,
  setThreadBlocked,
} from './admin-chat-actions';
export { subscribeToMessages, subscribeToThreads } from '@/entities/chat-thread/index.firestore';
export { ensureAnonymousSession } from '@/shared/api';

/** False when Firebase is not configured (the inbox's legacy `getDb()` guard). */
export function hasInboxDb(): boolean {
  return getDb() !== null;
}
