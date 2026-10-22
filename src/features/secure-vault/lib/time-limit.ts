import { VAULT_NETWORK_TIMEOUT_MS } from '../config/vault';

/** The vault's one "can't reach Firestore" line, shown in the panel's existing error slot. */
export const VAULT_UNREACHABLE = 'Vault unreachable. Check your connection and try again.';

/** Thrown when a vault network wait runs past VAULT_NETWORK_TIMEOUT_MS; the message is the visitor-facing copy. */
export class VaultTimeoutError extends Error {
  constructor() {
    super(VAULT_UNREACHABLE);
    this.name = 'VaultTimeoutError';
  }
}

/**
 * Races a Firestore wait against the vault's time limit. The anonymous sign-in never rejects and a query or write
 * can wait for a backend that never answers, so no busy state may rely on them settling. The underlying promise is
 * not cancelled: a write may still land later, so callers that write keep the promise to reconcile on retry.
 */
export function withVaultTimeout<T>(work: Promise<T>, ms: number = VAULT_NETWORK_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new VaultTimeoutError()), ms);
  });
  return Promise.race([work, limit]).finally(() => clearTimeout(timer));
}

/** Firestore reports a server it cannot reach as `unavailable` (e.g. getDocsFromServer while offline). */
export const isVaultUnreachable = (err: unknown): boolean =>
  err instanceof VaultTimeoutError ||
  (typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'unavailable');
