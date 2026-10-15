'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Legacy default is dark; the choice is never persisted. */
  initialIsDark?: boolean;
}

export function ThemeProvider({ children, initialIsDark = true }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(initialIsDark);
  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), []);
  const value = useMemo<ThemeContextValue>(() => ({ isDark, toggleTheme }), [isDark, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
