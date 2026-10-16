'use client';

import { MotionConfig } from 'motion/react';
import { useEffect, type ReactNode } from 'react';

import { startAnonymousSession } from '@/shared/api/index.lazy';
import { useReducedMotionPreference } from '@/shared/lib/motion-tier';
import { ThemeProvider } from '@/shared/lib/theme';

/** How long the anonymous sign-in may wait for an idle moment after load. */
const SESSION_IDLE_TIMEOUT_MS = 2500;

/** `requestIdleCallback` with a timeout, `setTimeout` where it is missing (Safari). Returns a cancel function. */
function whenIdle(callback: () => void, timeoutMs: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, timeoutMs);
  return () => window.clearTimeout(handle);
}

export function Providers({ children }: { children: ReactNode }) {
  // Legacy App.jsx: an anonymous Firebase session for every visitor. Firebase is fetched on demand (§J.2), so the
  // sign-in starts when the browser is idle after load; the chat and the vault start it earlier if they need it.
  useEffect(
    () =>
      whenIdle(() => {
        void startAnonymousSession();
      }, SESSION_IDLE_TIMEOUT_MS),
    [],
  );

  // motion/react follows the OS setting, and the footer "Reduce motion" switch forces it (§C.4).
  const [forcedReduce] = useReducedMotionPreference();

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion={forcedReduce ? 'always' : 'user'}>{children}</MotionConfig>
    </ThemeProvider>
  );
}
