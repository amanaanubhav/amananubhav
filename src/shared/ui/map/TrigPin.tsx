'use client';

import type { ReactElement } from 'react';
// clsx, not cn: tailwind-merge (unconfigured) treats `text-caption` as a colour and drops it.
import { clsx } from 'clsx';

export interface TrigPinProps {
  /** Position in percent of the sheet's viewBox (place inside `ContourSheet` children). */
  xPct: number;
  yPct: number;
  label: string;
  altitudeM?: number;
  approx?: boolean;
  status: 'done' | 'upcoming';
  expanded?: boolean;
  onToggle?: () => void;
  /** Id of the caption card this pin opens. */
  controls?: string;
}

const nf = new Intl.NumberFormat('en');

/**
 * A survey trig point on a sheet: a <button aria-expanded aria-controls> whose triangle is filled for
 * a done trek and drawn in outline for an upcoming one. The open pin turns signal and keeps its
 * label visible, so state never rests on colour alone.
 */
export function TrigPin({
  xPct,
  yPct,
  label,
  altitudeM,
  approx,
  status,
  expanded = false,
  onToggle,
  controls,
}: TrigPinProps): ReactElement {
  const height =
    typeof altitudeM === 'number' ? `, ${approx ? 'about ' : ''}${nf.format(Math.round(altitudeM))} metres` : '';
  const name = `${label}${height}${status === 'upcoming' ? ', planned' : ''}`;

  return (
    <button
      type="button"
      aria-label={name}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      data-status={status}
      className={clsx(
        'group absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-control',
        '[@media(pointer:coarse)]:size-11',
        'text-ink transition-colors duration-hover hover:text-signal aria-expanded:text-signal',
      )}
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 overflow-visible">
        <path
          d="M8 1.6 14.6 13.4H1.4Z"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={clsx('signal-mark stroke-current', status === 'done' ? 'fill-current' : 'fill-ground')}
        />
        {status === 'done' && <circle cx={8} cy={9.4} r={1.4} className="fill-ground" />}
      </svg>
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-ground px-1.5 py-0.5',
          'font-display text-caption font-semibold text-ink opacity-0 transition-opacity duration-hover',
          'group-hover:opacity-100 group-focus-visible:opacity-100',
          expanded && 'opacity-100',
        )}
      >
        {label}
      </span>
    </button>
  );
}
