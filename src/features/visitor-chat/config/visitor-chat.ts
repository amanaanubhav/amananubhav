/** localStorage key holding the visitor session `{ name, email, phone, id }`. */
export const VISITOR_SESSION_STORAGE_KEY = 'portfolio_chat_session';

/**
 * How long Start chat and each sent message wait for the server before showing their failed state (with Retry).
 * 12 s: a healthy start or send acknowledges in about a second, a slow phone link with the cold module and the
 * anonymous sign-in in a few; Firestore itself gives the backend 10 s before it reports offline, so the chat never
 * gives up on a write that Firestore still expects to reach the server.
 */
export const CHAT_WAIT_LIMIT_MS = 12_000;
