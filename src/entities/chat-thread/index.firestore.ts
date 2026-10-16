// Firestore public API of the chat thread. It pulls in `firebase/firestore`, so import it only from modules that
// are themselves loaded with `import()` (§J.2); the Firestore-free API is `index.ts`.
export { threadsCollection, threadDoc, messagesCollection } from './api/refs';
export { subscribeToThreads, subscribeToMessages, subscribeToThread } from './api/subscriptions';
