import type { ReactNode } from 'react';
import type { Expedition } from '@/entities/expedition';
import type { LogEntry } from '@/shared/ui/journal';

const nf = new Intl.NumberFormat('en');

/** "5,416 m Thorong La": the number in Plex Mono, the unit one step smaller, the place in Literata. */
export function highPointValue(altitudeM: number | undefined, name: string): ReactNode {
  if (typeof altitudeM !== 'number') return <span className="font-body">{name}</span>;
  return (
    <>
      {nf.format(altitudeM)}
      <span className="ml-[0.2em] text-[0.875em] text-ink-muted">m</span>
      {name ? <span className="ml-[0.5em] font-body text-ink-muted">{name}</span> : null}
    </>
  );
}

function modeText(exp: Expedition): string | undefined {
  if (!exp.mode) return undefined;
  return exp.selfSupported ? `${exp.mode}, self-supported` : exp.mode;
}

/**
 * A trek's field log (§G.4): region, when (never a future date), mode, days, distance, high point,
 * pack. Unknown rows are dropped by `Log`; a planned trek shows its status instead of a date.
 */
export function trekLog(exp: Expedition): LogEntry[] {
  const planned = exp.status === 'upcoming';
  return [
    { key: 'status', value: planned ? 'planned' : undefined, mono: false },
    { key: 'region', value: `${exp.region}, ${exp.country}`, mono: false },
    { key: 'when', value: planned ? undefined : exp.when },
    { key: 'mode', value: modeText(exp), mono: false },
    { key: 'days', value: exp.days },
    { key: 'distance', value: exp.distanceKm, unit: 'km' },
    {
      key: 'high point',
      value: highPointValue(exp.highPoint.altitudeM, exp.highPoint.name),
      approx: typeof exp.highPoint.altitudeM === 'number' && exp.highPoint.approx,
    },
    { key: 'pack', value: exp.packKg, unit: 'kg' },
  ];
}
