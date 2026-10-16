import type { ReactNode } from 'react';
import type { CSSVars } from '@/shared/lib/css';
import { cn } from '@/shared/lib/cn';

export interface StampProps {
  children: ReactNode;
  /** signal = signal text and edge (winners); ink (default) = ink text with a line-strong edge. */
  tone?: 'signal' | 'ink';
  /** -3deg; only on /achievements (the one rotated element on the site). */
  rotate?: boolean;
  className?: string;
}

const NARROW: CSSVars = { '--wdth': 75 };

/** An outline rank stamp (§D.1): Archivo 700 at wdth 75, sentence case, 2 px radius. */
export function Stamp({ children, tone = 'ink', rotate = false, className }: StampProps) {
  return (
    <span
      style={NARROW}
      className={`text-caption ${cn(
        'inline-flex items-center whitespace-nowrap rounded-control border px-2 py-0.5',
        "font-display font-bold leading-tight [font-variation-settings:'wdth'_var(--wdth,100)]",
        tone === 'signal' ? 'border-signal text-signal' : 'border-line-strong text-ink',
        rotate && '-rotate-3',
        className,
      )}`}
    >
      {children}
    </span>
  );
}
