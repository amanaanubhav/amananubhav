import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { HashLink } from './HashLink';

export type StatusTone = 'success' | 'warning' | 'neutral';

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
};

const ICON: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  neutral: 'text-ink-muted',
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
  const linkClasses = `text-caption ${cn(
    base,
    'min-h-6 rounded-control underline decoration-signal decoration-1 underline-offset-[0.22em]',
    'transition-[text-decoration-thickness] duration-hover hover:decoration-2',
    'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal',
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
