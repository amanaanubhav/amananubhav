'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import type { ActivityId } from '@/entities/activity';
import { cn } from '@/shared/lib/cn';

export interface TrainingRow {
  id: ActivityId;
  name: string;
  line: string;
  /** Hidden while the deck marks it [TBD] (Q-57). */
  fact?: string;
  soon: boolean;
  href?: string;
  /** The G-18 glyph, rendered on the server (keeps the plates module out of the client bundle). */
  glyph: ReactNode;
}

export interface TrainingLogProps {
  rows: readonly TrainingRow[];
  /** One server-rendered 4:5 plate per row, keyed by discipline id. */
  plates: Readonly<Partial<Record<ActivityId, ReactNode>>>;
  label: string;
  soonLabel: string;
  linkLabel: string;
}

const PLATE_ID = 'discipline-plate';

/**
 * The training log (§G.2, desktop): each discipline is a row button that shows its plate in the one sticky
 * 4:5 plate beside the list. Hover or focus previews a row; a press keeps it. The row whose plate is shown
 * carries `aria-pressed="true"` (§B.10 row state). Plates crossfade in 280 ms (instant under reduced motion).
 */
export function TrainingLog({ rows, plates, label, soonLabel, linkLabel }: TrainingLogProps) {
  const [selected, setSelected] = useState<ActivityId | undefined>(rows[0]?.id);
  const [preview, setPreview] = useState<ActivityId | null>(null);
  const shown = preview ?? selected;

  return (
    <div className="journal-grid mt-16 lg:mt-24">
      <ul
        aria-label={label}
        className="col-[content-start/content-end] m-0 list-none border-t border-line p-0 lg:col-[2/span_7]"
        onPointerLeave={() => setPreview(null)}
      >
        {rows.map((row) => {
          const active = row.id === shown;
          return (
            <li key={row.id} className="border-b border-line">
              <button
                type="button"
                aria-controls={PLATE_ID}
                aria-pressed={active}
                onClick={() => setSelected(row.id)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setPreview(row.id);
                }}
                onFocus={() => setPreview(row.id)}
                onBlur={() => setPreview(null)}
                className={cn(
                  'relative grid w-full grid-cols-[32px_minmax(0,1fr)] items-start gap-x-4 px-3 py-4 text-left',
                  'transition-colors duration-hover ease-settle hover:bg-surface-2',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal',
                  "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-signal before:opacity-0 before:content-['']",
                  'aria-pressed:bg-surface-2 aria-pressed:before:opacity-100',
                  // Forced colors flatten both the row tint and the signal rule; keep the pressed marker as Highlight.
                  'forced-colors:before:[forced-color-adjust:none] forced-colors:before:bg-[Highlight]',
                )}
              >
                <span aria-hidden="true" className={cn('mt-1 text-ink-muted', active && 'text-ink')}>
                  {row.glyph}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-title font-semibold text-ink">
                    {row.name}
                    {row.soon ? ' ' : null}
                    {row.soon ? (
                      <span className="ml-2 font-body text-caption font-normal italic text-ink-muted">{soonLabel}</span>
                    ) : null}
                  </span>
                  <span className="font-body text-ui text-ink-muted [text-wrap:pretty]">{row.line}</span>
                  {row.fact ? <span className="font-data text-caption text-ink">{row.fact}</span> : null}
                </span>
              </button>
              {row.href ? (
                <p className="m-0 pb-4 pl-[60px]">
                  <Link
                    href={row.href}
                    className="rounded-control font-body text-ui text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2"
                  >
                    {linkLabel}
                  </Link>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div
        id={PLATE_ID}
        className="col-[content-start/content-end] mt-8 w-full max-w-[420px] self-start lg:sticky lg:top-24 lg:col-[10/span_4] lg:mt-0"
      >
        <div className="grid">
          {rows.map((row) => {
            const active = row.id === shown;
            return (
              <div
                key={row.id}
                aria-hidden={!active}
                className={cn(
                  '[grid-area:1/1] transition-[opacity,visibility] duration-ui ease-settle',
                  active ? 'visible opacity-100' : 'invisible opacity-0',
                )}
              >
                {plates[row.id]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
