/** Firestore namespace used by the legacy SecureContact vault (paths are kept verbatim). */
export const VAULT_APP_ID = 'securevault_v1';

/** Shared secret for the admin decrypt channel (client-visible, exactly as before). */
export const ADMIN_CHANNEL_SECRET = 'Admin_Access_Protocol_v5_Secure_Key_99';
export const ADMIN_CHANNEL_SALT = 'admin_salt_v5';

/** Legacy pseudo-admin username; the passcode check lives in @/shared/config (isAdminPasscode). */
export const ADMIN_USERNAME = 'amananubhav';

export const PBKDF2_ITERATIONS = 2000;

/**
 * Time limit for each vault network wait (sign-in plus the query or write that follows). Firestore marks itself
 * offline after 10 s without a stream, so a server read normally fails on its own first; 12 s is the backstop for
 * waits that never settle, and still leaves a cold sign-in plus first query on a slow connection room to finish.
 */
export const VAULT_NETWORK_TIMEOUT_MS = 12_000;
