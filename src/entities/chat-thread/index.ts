// Firestore-free public API: types and pure helpers, safe in any route's initial JS. The Firestore refs and
// listeners live in `index.firestore.ts`, which only code loaded with `import()` may import (§J.2).
export type { ChatThreadDoc, ChatThread, ChatMessage, VisitorProfile } from './model/types';
export { toChatId } from './lib/to-chat-id';
export { formatMessageTime } from './lib/format-message-time';
