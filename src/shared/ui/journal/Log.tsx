import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

export type LogEntry = {
  /** Literata italic 14 px, ink-muted ("altitude", "with"). */
  key: string;
  /** Plex Mono 14-15 px, ink. undefined / null / '' => the row is omitted. Numbers are formatted "5,416". */
  value?: ReactNode;
  /** One step smaller, ink-muted ("m", "km"). */
  unit?: string;
  /** Prefixes "~". */
  approx?: boolean;
  /** The value becomes a link (external => new tab + a hidden note). */
  href?: string;
  external?: boolean;
  /** Default true; false for prose values (place names). */
  mono?: boolean;
};

export interface LogProps {
  items: readonly LogEntry[];
  /** Accessible name of the list, e.g. "Field log". */
  label?: string;
  /** auto = strip below 1024 px, column from 1024 px. */
  layout?: 'auto' | 'column' | 'strip';
  className?: string;
}

const NUMBER = new Intl.NumberFormat('en');

function isEmpty(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false;
}

function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

const LINK_CLASSES =
  'rounded-control text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] ' +
  'transition-[text-decoration-thickness] duration-hover hover:decoration-2 ' +
  'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal';

function Value({ entry }: { entry: LogEntry }) {
  const { value, unit, approx, href, external } = entry;
  const text = typeof value === 'number' ? NUMBER.format(value) : value;
  const inner = (
    <>
      {approx ? <span aria-hidden="true">~</span> : null}
      {approx ? <VisuallyHidden>about </VisuallyHidden> : null}
      {text}
      {unit ? <span className="ml-[0.2em] text-[0.875em] text-ink-muted">{unit}</span> : null}
    </>
  );
  if (!href) return inner;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
        {inner}
        <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
      </a>
    );
  }
  return isInternalHref(href) ? (
    <Link href={href} className={LINK_CLASSES}>
      {inner}
    </Link>
  ) : (
    <a href={href} className={LINK_CLASSES}>
      {inner}
    </a>
  );
}

/**
 * The field log (§D.1, §B.4.3): measured facts as a `<dl>`. Keys in Literata italic, values in Plex Mono
 * with tabular figures. Rows with an empty value are dropped; the whole log renders nothing when every row is empty.
 */
export function Log({ items, label, layout = 'auto', className }: LogProps) {
  const rows = items.filter((entry) => !isEmpty(entry.value));
  if (rows.length === 0) return null;

  const strip = layout === 'strip';
  const column = layout === 'column';

  return (
    <dl
      aria-label={label}
      className={`text-caption ${cn(
        'm-0',
        strip && 'flex flex-wrap gap-x-4 gap-y-1',
        column && 'flex flex-col',
        layout === 'auto' && 'flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:flex-nowrap lg:gap-0',
        className,
      )}`}
    >
      {rows.map((entry, index) => (
        <div
          key={`${entry.key}-${index}`}
          className={cn(
            strip && 'flex items-baseline gap-2',
            column && 'border-t border-line py-2 first:border-t-0 first:pt-0',
            layout === 'auto' &&
              'flex items-baseline gap-2 lg:block lg:border-t lg:border-line lg:py-2 lg:first:border-t-0 lg:first:pt-0',
          )}
        >
          <dt className="font-body italic text-ink-muted">{entry.key}</dt>
          <dd
            className={cn(
              'm-0 text-ink',
              entry.mono === false ? 'font-body' : 'font-data [font-variant-numeric:tabular-nums_slashed-zero]',
            )}
          >
            <Value entry={entry} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
