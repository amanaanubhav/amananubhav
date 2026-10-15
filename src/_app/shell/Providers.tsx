'use client';

import { useEffect, type ReactNode } from 'react';

import { ensureAnonymousSession } from '@/shared/api';
import { ThemeProvider } from '@/shared/lib/theme';

export function Providers({ children }: { children: ReactNode }) {
  // Legacy App.jsx: anonymous Firebase session once at mount (the user object was never read).
  useEffect(() => ensureAnonymousSession(), []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
