import { OFFLINE_DEFAULT_REPLY, OFFLINE_RESPONSES } from '../config/offline-responses';

/** Exact command match first (own keys only), then the first key contained in the query. */
export function resolveOfflineReply(query: string): string {
  const lowerQuery = query.toLowerCase();
  let reply = OFFLINE_DEFAULT_REPLY;

  // Check for exact command match first
  const exact = Object.hasOwn(OFFLINE_RESPONSES, lowerQuery) ? OFFLINE_RESPONSES[lowerQuery] : undefined;
  if (exact) {
    reply = exact;
  } else {
    // Fuzzy search in keys
    for (const [key, response] of Object.entries(OFFLINE_RESPONSES)) {
      if (lowerQuery.includes(key)) {
        reply = response;
        break;
      }
    }
  }
  return reply;
}
