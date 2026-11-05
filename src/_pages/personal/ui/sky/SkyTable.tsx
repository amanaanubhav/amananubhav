'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';
import { SKY_UI } from '../../config/content';

export interface SkyTableRow {
  id: string;
  /** Name, kind, height, direction, brightness, rises and sets (the order of `SKY_UI.table.headers`). */
  cells: readonly [string, string, string, string, string, string];
}

export interface SkyTableProps {
  /** "Up now from 25° N, 21:40 IST": the table's caption (the summary's lead). */
  caption: string;
  rows: readonly SkyTableRow[];
  /** Told when the disclosure opens or closes (also on a find-in-page reveal). */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Read the sky as a table (FINAL-DESIGN §4.2.1): a disclosure holding a real `<table>` of everything in Up now (name,
 * kind, height, direction, brightness or the Moon's phase, rise and set). The full text alternative. Closed, the region
 * is `hidden="until-found"`, so find-in-page still reaches a star's name and opens it (`beforematch`).
 */
export function SkyTable({ caption, rows, onOpenChange }: SkyTableProps) {
  const [open, setOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  // React has no `hidden="until-found"`; the attribute and the browser's reveal are wired by hand (before paint, so the
  // closed table never flashes open on mount).
  useLayoutEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    if (open) region.removeAttribute('hidden');
    else region.setAttribute('hidden', 'until-found');
  }, [open]);
  // The rise and set cells are the costly ones: the parent computes them only while the table is open.
  const onOpenChangeEvent = useEffectEvent((next: boolean) => onOpenChange?.(next));
  useEffect(() => onOpenChangeEvent(open), [open]);
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const reveal = () => setOpen(true);
    region.addEventListener('beforematch', reveal);
    return () => region.removeEventListener('beforematch', reveal);
  }, []);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="sky-table-region"
        onClick={() => setOpen((v) => !v)}
        className="group/disc inline-flex min-h-10 items-center gap-2 border-0 bg-transparent p-0 font-display text-ui font-semibold text-ink underline decoration-action-line decoration-1 underline-offset-[0.25em] transition-transform duration-micro hover:decoration-action hover:decoration-2 active:scale-[0.97] motion-reduce:active:scale-100 [@media(pointer:coarse)]:min-h-11"
      >
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform duration-[200ms] ease-out group-aria-expanded/disc:rotate-90 motion-reduce:transition-none"
          strokeWidth={2}
        />
        {SKY_UI.table.button}
      </button>
      <div ref={regionRef} id="sky-table-region">
        <div
          role="region"
          aria-labelledby="sky-table-cap"
          tabIndex={0}
          className="mt-2 overflow-x-auto rounded-control border border-line"
        >
          <table className="w-full border-collapse font-body text-caption text-ink">
            <caption id="sky-table-cap" className="sr-only">
              {caption || SKY_UI.table.caption}
            </caption>
            <thead>
              <tr>
                {SKY_UI.table.headers.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap border-b border-line px-2.5 py-2 text-left font-display font-semibold text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {r.cells.map((c, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="border-b border-line px-2.5 py-2 text-left align-top font-display font-semibold text-ink">
                        {c}
                      </th>
                    ) : (
                      <td
                        key={i}
                        className={clsx(
                          'border-b border-line px-2.5 py-2 align-top',
                          i >= 2 && i <= 4 && 'whitespace-nowrap font-data tabular-nums',
                        )}
                      >
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
