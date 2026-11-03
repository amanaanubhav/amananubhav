import type { ReactNode } from 'react';
import type { CSSVars } from '@/shared/lib/css';
import { cn } from '@/shared/lib/cn';

export interface StampProps {
  children: ReactNode;
  /**
   * signal (winners) = the oxblood stamp (Update 1.1 §11): an `oxblood-deep` fill on an `oxblood` rim with
   * `on-oxblood` text (7.12:1 Night, 10.78:1 Day) and a metal top glint; placed = ink text on the `accent-2-soft` wash
   * with an `accent-2-line` edge (placed ranks, the Vault Admin role); ink (default) = ink text on a line-strong edge.
   */
  tone?: 'signal' | 'placed' | 'ink';
  /** -3deg; only on /achievements (the one rotated element on the site). */
  rotate?: boolean;
  className?: string;
}

const NARROW: CSSVars = { '--wdth': 75 };

/** A rank stamp (§D.1): Archivo 700 at wdth 75, sentence case, 2 px radius; outlined, or oxblood for winners. */
export function Stamp({ children, tone = 'ink', rotate = false, className }: StampProps) {
  return (
    <span
      style={NARROW}
      className={`text-caption ${cn(
        'inline-flex items-center whitespace-nowrap rounded-control border px-2 py-0.5',
        "font-display font-bold leading-tight [font-variation-settings:'wdth'_var(--wdth,100)]",
        tone === 'signal'
          ? 'glint-metal border-oxblood bg-oxblood-deep text-on-oxblood'
          : tone === 'placed'
            ? 'border-accent-2-line bg-accent-2-soft text-ink'
            : 'border-line-strong text-ink',
        rotate && '-rotate-3',
        className,
      )}`}
    >
      {children}
    </span>
  );
}
