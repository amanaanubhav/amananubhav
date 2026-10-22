'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

import { useReducedMotionPreference } from '@/shared/lib/motion-tier';
import { ThemeProvider } from '@/shared/lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  // No sign-in here: Firebase loads and signs in on first use (a stored chat session, Start chat, the Vault, the
  // admin inbox) through `ensureAnonymousSession`, so a visitor who opens neither never contacts it.

  // motion/react follows the OS setting, and the footer "Reduce motion" switch forces it (§C.4).
  const [forcedReduce] = useReducedMotionPreference();

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion={forcedReduce ? 'always' : 'user'}>{children}</MotionConfig>
    </ThemeProvider>
  );
}
