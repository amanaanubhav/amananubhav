import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { HashLink } from './HashLink';

/** `live`: the palette's aqua "you / live" role (PALETTE-SPEC §5.1), e.g. "Open to remote roles". */
export type StatusTone = 'success' | 'warning' | 'neutral' | 'live';

export interface StatusChipProps {
  tone?: StatusTone;
  /** A 14 px lucide icon in place of the dot (e.g. `Wifi`, `WifiOff`). */
  icon?: LucideIcon;
  children: ReactNode;
  /** Makes the chip a link (internal paths use next/link; `#id` jumps go through scrollToTarget). */
  href?: string;
  /** next/link prefetch for an internal `href` (e.g. `false` while the home stage holds the network). */
  prefetch?: boolean;
  className?: string;
}

const DOT: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  neutral: 'bg-ink-muted',
  live: 'bg-live live-halo', // aqua-line: a 6 px graphic (5.76:1 Night, 3.90:1 Day on ground), a 3 px aqua-wash halo
};

const ICON: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  neutral: 'text-ink-muted',
  live: 'text-aqua', // icon only: `live` is a graphics-only role, never text
};

/**
 * A quiet status line (§D.3): a 6 px dot (or a 14 px icon) in the tone color plus text in ink.
 * The text always carries the meaning; the color only repeats it.
 */
export function StatusChip({ tone = 'neutral', icon: Icon, children, href, prefetch, className }: StatusChipProps) {
  const mark = Icon ? (
    <Icon aria-hidden="true" focusable="false" className={cn('size-3.5 shrink-0', ICON[tone])} strokeWidth={2} />
  ) : (
    <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full forced-colors:bg-[CanvasText]', DOT[tone])} />
  );
  // text-caption stays outside cn(): tailwind-merge would read the custom type-scale class as a text color.
  const base = 'inline-flex items-center gap-2 font-body font-medium text-ink';
  const classes = `text-caption ${cn(base, className)}`;

  if (!href) {
    return (
      <span className={classes}>
        {mark}
        <span>{children}</span>
      </span>
    );
  }
  // A link chip (PALETTE-SPEC §5.3, §11): ink with the 1 px link-underline (action-line), 2 px action on hover and focus.
  const linkClasses = `text-caption ${cn(
    base,
    'min-h-6 rounded-control text-link-ink underline decoration-link-underline decoration-1 underline-offset-[0.22em]',
    'transition-[text-decoration-thickness] duration-hover hover:decoration-2 hover:decoration-action',
    'focus-visible:decoration-2 focus-visible:decoration-action',
    className,
  )}`;
  const body = (
    <>
      {mark}
      <span>{children}</span>
    </>
  );
  if (href.startsWith('#') && href.length > 1) {
    return (
      <HashLink href={href} className={linkClasses}>
        {body}
      </HashLink>
    );
  }
  return href.startsWith('/') && !href.startsWith('//') ? (
    <Link href={href} prefetch={prefetch} className={linkClasses}>
      {body}
    </Link>
  ) : (
    <a href={href} className={linkClasses}>
      {body}
    </a>
  );
}
