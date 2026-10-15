import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { clientEnv } from '@/shared/config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initialized = false;
let session: Promise<void> | null = null;

/** Lazily initialises Firebase once, in the browser, and only when an apiKey is configured. */
function init(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    if (clientEnv.firebase.apiKey) {
      app = getApps().length > 0 ? getApp() : initializeApp(clientEnv.firebase);
      auth = getAuth(app);
      db = getFirestore(app);
    } else {
      console.warn('Firebase init skipped: Missing API config');
    }
  } catch (error) {
    console.error('Firebase Error:', error);
  }
}

export function getDb(): Firestore | null {
  init();
  return db;
}

export function getFirebaseAuth(): Auth | null {
  init();
  return auth;
}

/**
 * Signs the visitor in anonymously (legacy App.jsx behaviour), once per page: every caller shares one promise, so
 * Firestore writers and listeners can await it before they start. It never rejects: when Firebase is not configured
 * it resolves at once, and a failed sign-in is logged (as before) and retried by the next call, so callers keep
 * their own error handling. Firebase returns the persisted anonymous user instead of creating a new one.
 */
export function ensureAnonymousSession(): Promise<void> {
  if (session) return session;
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) return Promise.resolve();
  session = signInAnonymously(currentAuth).then(
    () => undefined,
    (error: unknown) => {
      console.error(error);
      session = null;
    },
  );
  return session;
}
