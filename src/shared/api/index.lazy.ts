import { lazyModule } from '@/shared/lib/lazy';

/**
 * On-demand entry to the browser services (§J.2): Firebase and EmailJS reach the browser only through these
 * dynamic imports, so no route's initial JS carries them. Import the services themselves (`@/shared/api`) only
 * from modules that are themselves loaded with `import()`.
 */
export const firebaseApi = lazyModule(() => import('./firebase'));
export const emailApi = lazyModule(() => import('./emailjs'));

/**
 * Loads Firebase and starts the shared anonymous session (one sign-in per page, however many callers). Resolves
 * once auth is ready, so it is also the point to await before a write; it never rejects (a failed load is logged).
 */
export function startAnonymousSession(): Promise<void> {
  return firebaseApi.load().then(
    (api) => api.ensureAnonymousSession(),
    (error: unknown) => {
      console.error('Firebase failed to load:', error);
    },
  );
}
