import type { OfflineKnowledge } from '../config/offline-responses';

let pending: Promise<OfflineKnowledge> | null = null;

/**
 * The offline notes live in their own chunk so they never weigh on the initial JS. The promise is
 * shared, so a preload makes the later offline reply instant; a failed load is forgotten so the next
 * call can try again.
 */
export function loadOfflineKnowledge(): Promise<OfflineKnowledge> {
  pending ??= import('../config/offline-responses').then(
    (mod) => mod.OFFLINE_KNOWLEDGE,
    (error: unknown) => {
      pending = null;
      throw error;
    },
  );
  return pending;
}

/** Fetches the chunk ahead of need (terminal opened, browser idle) so it is cached if the network drops. */
export function preloadOfflineKnowledge(): void {
  loadOfflineKnowledge().catch(() => {
    // Best effort: the offline reply loads it again, and has a fallback line if that fails too.
  });
}
