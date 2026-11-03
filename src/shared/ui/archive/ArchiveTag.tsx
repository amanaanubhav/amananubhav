import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface ArchiveTagProps {
  children: ReactNode;
  /**
   * ink (default) = the neutral wash: ink text on `surface-3`, edge coloured as the fill (the 1 px box stays);
   * violet = the code / build / research wash: ink text on `accent-2-soft` with an `accent-2-line` edge, so the tag
   * keeps its shape on the Day ground (the soft fill alone is 1.08:1 there);
   * signal = the trek chip (Update 1.1 §11, oxblood only where it means the trek): an `oxblood-deep` fill on an
   * `oxblood` rim with `on-oxblood` text (7.12:1 Night, 10.78:1 Day) and a metal top glint.
   */
  tone?: 'ink' | 'violet' | 'signal';
  className?: string;
}

/**
 * A tag for archive rows (§D.3): 2 px radius, Literata 14 px at weight 600, sentence case. A tag is a wash
 * (PALETTE-APPLICATION §1.3); its text is always ink, except on the oxblood trek chip.
 */
export function ArchiveTag({ children, tone = 'ink', className }: ArchiveTagProps) {
  return (
    <span
      className={`text-caption ${cn(
        'inline-flex items-center whitespace-nowrap rounded-control border px-1.5 py-px font-body font-semibold',
        tone === 'signal'
          ? 'glint-metal border-oxblood bg-oxblood-deep text-on-oxblood'
          : tone === 'violet'
            ? 'border-accent-2-line bg-accent-2-soft text-ink'
            : 'border-surface-3 bg-surface-3 text-ink',
        className,
      )}`}
    >
      {children}
    </span>
  );
}
