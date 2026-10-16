import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface ArchiveTagProps {
  children: ReactNode;
  /** ink (default) = muted text on a line-strong edge; signal = signal text and edge. */
  tone?: 'ink' | 'signal';
  /** Accepted for compatibility; legacy theme border classes (e.g. "border-zinc-800") are ignored. */
  className?: string;
}

const LEGACY_THEME_CLASS = /^(?:[a-z-]+:)*(?:border|bg|text)-(?:zinc|gray|neutral|slate|stone|white|black)(?:-\d+)?(?:\/\d+)?$/;

function withoutLegacyTheme(className?: string): string | undefined {
  if (!className) return undefined;
  return className
    .split(/\s+/)
    .filter((token) => token && !LEGACY_THEME_CLASS.test(token))
    .join(' ');
}

/** An outline tag stamp for archive rows (§D.3): 2 px radius, Literata 500 14 px, sentence case. */
export function ArchiveTag({ children, tone = 'ink', className }: ArchiveTagProps) {
  return (
    <span
      className={`text-caption ${cn(
        'inline-flex items-center whitespace-nowrap rounded-control border px-1.5 py-px font-body font-medium',
        tone === 'signal' ? 'border-signal text-signal' : 'border-line-strong text-ink-muted',
        withoutLegacyTheme(className),
      )}`}
    >
      {children}
    </span>
  );
}
