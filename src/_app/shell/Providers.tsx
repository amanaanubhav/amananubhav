'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/shared/lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  // No sign-in here: Firebase loads and signs in on first use (a stored chat session, Start chat, the Vault, the
  // admin inbox) through `ensureAnonymousSession`, so a visitor who opens neither never contacts it.

  // motion/react follows the OS reduced-motion setting (§C.4).
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
