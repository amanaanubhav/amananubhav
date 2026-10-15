import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { clientEnv } from '@/shared/config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initialized = false;

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
 * Subscribes to auth state and signs in anonymously (legacy App.jsx behaviour).
 * Returns the unsubscribe function; a no-op when Firebase is not configured.
 */
export function ensureAnonymousSession(): () => void {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) return () => {};
  const unsubscribe = onAuthStateChanged(currentAuth, () => {});
  signInAnonymously(currentAuth).catch(console.error);
  return unsubscribe;
}
