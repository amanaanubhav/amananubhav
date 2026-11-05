'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { SKY_UI } from '../../config/content';
import { compass16, type SkyUpItem, type SkyUpNow } from '../../lib/sky-engine';

export interface UpNowListProps {
  up: SkyUpNow;
  selectedId: string | null;
  onPick: (id: string) => void;
}

/** Rows before "Show all" (P1-1, desktop and phones alike). */
const FIRST = 6;

/** "62° up · E": 16 compass points, as the card and the table say it. */
export const upWhere = (o: Pick<SkyUpItem, 'alt' | 'az'>) => `${Math.round(o.alt)}° up · ${compass16(o.az)}`;

/**
 * Up now and Constellations (FINAL-DESIGN §4.2.1, P1-1, P2-5): the brightest things above the horizon and up to four
 * constellations, each a button that selects it in the sky and centres it. The keyboard and screen-reader way into the
 * sky. Each list is one tab stop (roving tabindex; arrows, Home and End move inside it). Desktop rows; phones a
 * two-column grid of 48 px chips.
 */
export function UpNowList({ up, selectedId, onPick }: UpNowListProps) {
  const [showAll, setShowAll] = useState(false);
  const firstExtra = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);
  // After Show all, focus moves to the first row it revealed (the button itself is gone).
  useEffect(() => {
    if (!showAll || revealed.current) return;
    revealed.current = true;
    firstExtra.current?.querySelectorAll<HTMLButtonElement>('button[data-rove]')[FIRST]?.focus();
  }, [showAll]);
  const isDay = up.phase === 'day';
  const items = showAll ? up.items : up.items.slice(0, FIRST);
  const more = !showAll && up.items.length > FIRST ? up.items.length : 0;
  const cons = up.constellations.slice(0, 4);
  return (
    <div ref={firstExtra} className="grid gap-2.5">
      <h3 id="sky-upnow-h" className="m-0 font-display text-ui font-semibold text-ink">
        {SKY_UI.upNow}
      </h3>
      {isDay ? <p className="m-0 font-body text-caption text-ink-muted">{SKY_UI.daySummary}</p> : null}
      <RovingList labelledBy="sky-upnow-h" items={items} selectedId={selectedId} onPick={onPick}>
        {more ? (
          <li className="max-md:col-span-2">
            <button
              type="button"
              tabIndex={-1}
              data-rove
              onClick={() => setShowAll(true)}
              className={clsx(ROW_BASE, 'justify-center text-ink-muted max-md:min-h-12')}
            >
              <span className="font-display text-ui font-semibold">{SKY_UI.showAll(more)}</span>
            </button>
          </li>
        ) : null}
      </RovingList>
      {cons.length ? (
        <>
          <h3 id="sky-cons-h" className="m-0 mt-1.5 font-display text-ui font-semibold text-ink">
            {SKY_UI.constellations}
          </h3>
          <RovingList labelledBy="sky-cons-h" items={cons} selectedId={selectedId} onPick={onPick} />
        </>
      ) : null}
    </div>
  );
}

const ROW_BASE =
  'flex w-full min-h-10 items-center justify-between gap-3 rounded-control border-0 bg-transparent px-2.5 py-1.5 text-left ' +
  'transition-[background-color,transform] duration-micro active:scale-[0.98] active:bg-[var(--press-wash)] motion-reduce:active:scale-100 ' +
  'hover:bg-[var(--hover-wash)] ' +
  'max-md:min-h-12 max-md:flex-col max-md:items-start max-md:justify-center max-md:gap-0.5 max-md:border max-md:border-solid max-md:border-line-strong max-md:bg-surface';

function RovingList({
  labelledBy,
  items,
  selectedId,
  onPick,
  children,
}: {
  labelledBy: string;
  items: readonly SkyUpItem[];
  selectedId: string | null;
  onPick: (id: string) => void;
  children?: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const ids = items.map((o) => o.id);
  // The tab stop: the row last moved to, else the selection, else the first row.
  const stop = active && ids.includes(active) ? active : selectedId && ids.includes(selectedId) ? selectedId : ids[0];

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-rove]') ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const j = ({ ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: buttons.length - 1 } as Record<string, number>)[e.key];
    if (j === undefined) return;
    e.preventDefault();
    const next = buttons[Math.min(Math.max(j, 0), buttons.length - 1)];
    next.focus();
    const id = next.dataset.id;
    if (id) setActive(id);
  };

  return (
    <ul ref={listRef} aria-labelledby={labelledBy} onKeyDown={onKeyDown} className="m-0 grid list-none gap-0.5 p-0 max-md:grid-cols-2 max-md:gap-1.5">
      {items.map((o) => (
        <li key={o.id} className="min-w-0">
          <button
            type="button"
            data-rove
            data-id={o.id}
            tabIndex={o.id === stop ? 0 : -1}
            aria-pressed={o.id === selectedId}
            onClick={() => {
              setActive(o.id);
              onPick(o.id);
            }}
            className={clsx(
              ROW_BASE,
              'aria-pressed:bg-action-soft aria-pressed:shadow-[inset_2px_0_0_var(--action)] max-md:aria-pressed:border-line-strong',
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-2 font-display text-ui font-semibold text-ink">
              {o.kind === 'planet' || o.kind === 'moon' ? (
                <i aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent-2" />
              ) : o.kind === 'star' ? (
                <i aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ink-muted" />
              ) : null}
              <span>{o.name}</span>
            </span>
            <span className="whitespace-nowrap font-data text-caption tabular-nums text-ink-muted">{upWhere(o)}</span>
          </button>
        </li>
      ))}
      {children}
    </ul>
  );
}
