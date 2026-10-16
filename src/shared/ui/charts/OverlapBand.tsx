'use client';

import { useSyncExternalStore, type ReactElement } from 'react';
import { ChevronDown } from 'lucide-react';
// clsx, not cn: tailwind-merge (unconfigured) treats `text-ui` as a colour and drops it.
import { clsx } from 'clsx';
import type { CSSVars } from '@/shared/lib/css';

export interface OverlapBandProps {
  /** PROFILE.availability.workWindowIST; undefined until Q-20 (then no overlap claim is made). */
  workWindowIST?: readonly [startHour: number, endHour: number];
  /** Default [9, 18] in the visitor's zone. */
  visitorWindow?: readonly [number, number];
  /** auto: vertical below 640 px. */
  orientation?: 'auto' | 'horizontal' | 'vertical';
  caption?: string;
}

const DAY = 1440;
const IST_OFFSET = 330;

/* ------------------------------------------------------------------------------------------------
 * Visitor clock: read once per minute on the client, never on the server (no hydration mismatch).
 * --------------------------------------------------------------------------------------------- */

interface VisitorClock {
  /** A human name for the visitor's zone ("India Standard Time"), never a raw IANA id. */
  zoneName: string;
  /** Visitor's current UTC offset in minutes (east positive), DST-correct for today. */
  offsetMin: number;
  /** Minutes since IST midnight, now. */
  nowIst: number;
  /** Minutes since local midnight, now. */
  nowLocal: number;
}

let clockCache: { key: number; value: VisitorClock } | null = null;

function readClock(): VisitorClock {
  const now = Date.now();
  const key = Math.floor(now / 60_000);
  if (clockCache && clockCache.key === key) return clockCache.value;
  const date = new Date(now);
  const offsetMin = -date.getTimezoneOffset();
  const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();
  const value: VisitorClock = {
    zoneName: zoneLongName(date),
    offsetMin,
    nowIst: mod(utcMin + IST_OFFSET, DAY),
    nowLocal: mod(utcMin + offsetMin, DAY),
  };
  clockCache = { key, value };
  return value;
}
/** The Intl long name ("Central European Summer Time"); a generic phrase when only a GMT offset is known. */
function zoneLongName(date: Date): string {
  try {
    const part = new Intl.DateTimeFormat('en', { timeZoneName: 'long' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value;
    if (part && !/^(GMT|UTC)([+−-]|$)/.test(part)) return part;
  } catch {
    /* fall through to the generic name */
  }
  return 'your time zone';
}

const subscribe = () => () => {};
const serverClock = () => null;

/* ------------------------------------------------------------------------------------------------
 * Time helpers (minutes on a 24-hour circle)
 * --------------------------------------------------------------------------------------------- */

function mod(v: number, m: number): number {
  return ((v % m) + m) % m;
}

function hhmm(min: number): string {
  const m = mod(Math.round(min), DAY);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function utcLabel(offsetMin: number): string {
  if (offsetMin === 0) return 'UTC';
  const sign = offsetMin > 0 ? '+' : '−';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

/** A window [start, end) in minutes, split where it crosses midnight. */
function segments(start: number, end: number): Array<[number, number]> {
  const s = mod(start, DAY);
  const len = mod(end - start, DAY) || (end !== start ? DAY : 0);
  if (len === 0) return [];
  const e = s + len;
  return e <= DAY ? [[s, e]] : [[s, DAY], [0, e - DAY]];
}

function overlapMinutes(a: Array<[number, number]>, b: Array<[number, number]>): number {
  let total = 0;
  for (const [as, ae] of a) for (const [bs, be] of b) total += Math.max(0, Math.min(ae, be) - Math.max(as, bs));
  return total;
}

function durationText(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hours = h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '';
  const minutes = m ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : '';
  return [hours, minutes].filter(Boolean).join(' ');
}

const pct = (min: number) => `${((min / DAY) * 100).toFixed(4)}%`;
const segStyle = ([s, e]: [number, number]) => ({ '--p': pct(s), '--w': pct(e - s) }) as CSSVars;

/* ------------------------------------------------------------------------------------------------
 * Layout CSS (hoisted and de-duplicated by React 19; tokens only)
 * --------------------------------------------------------------------------------------------- */

function verticalRules(scope: string): string {
  return `
${scope} .ob-grid{grid-template-columns:3.5rem minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 24rem;
  grid-template-areas:". l1 l2" "scale t1 t2";column-gap:12px;row-gap:8px}
${scope} .ob-scale,${scope} .ob-track{height:auto}
${scope} .ob-seg{left:0;right:0;width:auto;top:var(--p);height:var(--w);bottom:auto}
${scope} .ob-tick{left:0;right:0;width:auto;top:var(--p);height:1px;bottom:auto}
${scope} .ob-hour{left:auto;right:6px;top:var(--p);transform:translateY(-50%)}
${scope} .ob-hour[data-edge='start']{transform:none}
${scope} .ob-now{left:-4px;right:-4px;width:auto;top:var(--p);height:2px;bottom:auto;transform:translateY(-1px)}`;
}

const BAND_CSS = `
.ob-grid{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"scale" "l1" "t1" "l2" "t2";row-gap:6px}
.ob-scale{grid-area:scale;position:relative;height:1.5rem}
.ob-l1{grid-area:l1;margin-top:6px}.ob-l2{grid-area:l2;margin-top:6px}
.ob-t1{grid-area:t1}.ob-t2{grid-area:t2}
.ob-track{position:relative;height:2rem;background:rgb(var(--c-surface-2));border:1px solid rgb(var(--c-line))}
.ob-seg{position:absolute;top:0;bottom:0;left:var(--p);width:var(--w)}
.ob-tick{position:absolute;top:0;bottom:0;left:var(--p);width:1px;background:rgb(var(--c-line))}
.ob-tick[data-major]{background:rgb(var(--c-line-strong))}
.ob-hour{position:absolute;top:0;left:var(--p);transform:translateX(-50%);white-space:nowrap}
.ob-hour[data-edge='start']{transform:none}
.ob-now{position:absolute;top:-4px;bottom:-4px;left:var(--p);width:2px;transform:translateX(-1px);background:rgb(var(--c-signal))}
.ob-mine{background-image:repeating-linear-gradient(135deg,rgb(var(--c-ink)) 0 1px,transparent 1px 7px);border:1px solid rgb(var(--c-ink))}
.ob-yours{background:rgb(var(--c-ink) / 0.12);border:1px solid rgb(var(--c-ink-muted))}
.ob-tbc{position:absolute;inset:3px;display:flex;align-items:center;justify-content:center;padding:0 8px;text-align:center;
  line-height:1.2;border:1px dashed rgb(var(--c-line-strong));background:rgb(var(--c-surface-2) / 0.88)}
${verticalRules(".ob[data-o='vertical']")}
@media (max-width:639px){${verticalRules(".ob[data-o='auto']")}}
@media (forced-colors:active){.ob-now{background:Highlight}.ob-mine,.ob-yours,.ob-tbc{border-color:CanvasText}}`;

/* ------------------------------------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------------------------------- */

/**
 * Overlap band (G-07): a 24-hour strip in IST against the visitor's working day. The server renders
 * the strip and the IST row; the visitor row and the "now" tick appear after mount, set once without
 * animation. No overlap sentence until `workWindowIST` is known (Q-20).
 */
export function OverlapBand({
  workWindowIST,
  visitorWindow = [9, 18],
  orientation = 'auto',
  caption,
}: OverlapBandProps): ReactElement {
  const clock = useSyncExternalStore(subscribe, readClock, serverClock);

  const mine = workWindowIST ? segments(workWindowIST[0] * 60, workWindowIST[1] * 60) : [];
  const vStartLocal = visitorWindow[0] * 60;
  const vEndLocal = visitorWindow[1] * 60;
  const yours = clock
    ? segments(vStartLocal - clock.offsetMin + IST_OFFSET, vEndLocal - clock.offsetMin + IST_OFFSET)
    : [];
  const overlap = clock && workWindowIST ? overlapMinutes(mine, yours) : null;

  const yoursIstStart = clock ? hhmm(vStartLocal - clock.offsetMin + IST_OFFSET) : '';
  const yoursIstEnd = clock ? hhmm(vEndLocal - clock.offsetMin + IST_OFFSET) : '';
  const mineText = workWindowIST ? `${hhmm(workWindowIST[0] * 60)} to ${hhmm(workWindowIST[1] * 60)} IST` : '';
  const yoursText = `${hhmm(vStartLocal)} to ${hhmm(vEndLocal)}`;

  const sentence =
    overlap === null
      ? null
      : overlap > 0
        ? `Your ${yoursText} overlaps my working day by ${durationText(overlap)}.`
        : `Your ${yoursText} does not overlap my working day in IST.`;

  const imgLabel = [
    'A 24-hour day in India Standard Time.',
    workWindowIST ? `My working day: ${mineText}.` : 'My working hours are to be confirmed.',
    clock ? `Your ${yoursText} (${clock.zoneName}) is ${yoursIstStart} to ${yoursIstEnd} IST.` : '',
    clock ? `Now: ${hhmm(clock.nowIst)} IST.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <figure className="ob min-w-0" data-o={orientation}>
      <style href="aa-overlap-band" precedence="default">
        {BAND_CSS}
      </style>

      <div className="ob-grid" role="img" aria-label={imgLabel}>
        <div className="ob-scale" aria-hidden="true">
          {hours
            .filter((h) => h % 3 === 0)
            .map((h) => (
              <span
                key={h}
                className="ob-hour font-data text-caption tabular text-ink-muted"
                data-edge={h === 0 ? 'start' : undefined}
                style={{ '--p': pct(h * 60) } as CSSVars}
              >
                {hhmm(h * 60)}
              </span>
            ))}
        </div>

        <p className="ob-l1 font-body text-caption text-ink" aria-hidden="true">
          <span className="font-data tabular">IST</span> <span className="text-ink-muted">(UTC+5:30)</span>
          {workWindowIST ? (
            <span className="italic text-ink-muted">, my working day {mineText.replace(' IST', '')}</span>
          ) : (
            <span className="italic text-ink-muted">, my working day to be confirmed</span>
          )}
        </p>
        <div className="ob-track ob-t1" aria-hidden="true">
          {hours.map((h) => (
            <span key={h} className="ob-tick" data-major={h % 3 === 0 ? '' : undefined} style={{ '--p': pct(h * 60) } as CSSVars} />
          ))}
          {mine.map((s, i) => (
            <span key={i} className="ob-seg ob-mine" style={segStyle(s)} />
          ))}
          {/* Q-20 open: a designed placeholder, not an empty bar that reads as "no working hours". */}
          {!workWindowIST && (
            <span className="ob-tbc font-body text-caption italic text-ink-muted">Working hours to be confirmed</span>
          )}
          {clock && <span className="ob-now signal-mark" style={{ '--p': pct(clock.nowIst) } as CSSVars} />}
        </div>

        {/* The visitor row is reserved on the server so nothing shifts when it fills in. */}
        <p className="ob-l2 min-h-[1.45em] font-body text-caption text-ink" aria-hidden="true">
          {clock && (
            <>
              You, <span className="italic">{clock.zoneName}</span>{' '}
              <span className="text-ink-muted">({utcLabel(clock.offsetMin)})</span>
              <span className="text-ink-muted">: </span>
              <span className="font-data tabular">{yoursText}</span>
            </>
          )}
        </p>
        <div className="ob-track ob-t2" aria-hidden="true">
          {hours.map((h) => (
            <span key={h} className="ob-tick" data-major={h % 3 === 0 ? '' : undefined} style={{ '--p': pct(h * 60) } as CSSVars} />
          ))}
          {yours.map((s, i) => (
            <span key={i} className="ob-seg ob-yours" style={segStyle(s)} />
          ))}
          {clock && <span className="ob-now signal-mark" style={{ '--p': pct(clock.nowIst) } as CSSVars} />}
        </div>
      </div>

      {(caption || sentence) && (
        <figcaption className="mt-4 max-w-measure space-y-1">
          {sentence && <span className="block font-body text-body text-ink">{sentence}</span>}
          {caption && <span className="block font-body text-caption italic text-ink-muted">{caption}</span>}
        </figcaption>
      )}

      <details className="group mt-3">
        <summary
          className={clsx(
            'inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded-control font-body text-ui text-ink',
            'underline decoration-signal decoration-1 underline-offset-[0.22em] hover:decoration-2 [&::-webkit-details-marker]:hidden',
          )}
        >
          <span className="group-open:hidden">Show data</span>
          <span className="hidden group-open:inline">Hide data</span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-ui group-open:rotate-180" />
        </summary>
        <table className="mt-3 w-full max-w-xl border-collapse text-left text-caption">
          <caption className="sr-only">Working hours in IST and in your time zone</caption>
          <tbody>
            <tr className="border-b border-line">
              <th scope="row" className="py-2 pr-4 font-body font-normal italic text-ink-muted">My time zone</th>
              <td className="py-2 font-data tabular text-ink">IST, UTC+5:30</td>
            </tr>
            <tr className="border-b border-line">
              <th scope="row" className="py-2 pr-4 font-body font-normal italic text-ink-muted">My working day</th>
              {workWindowIST ? (
                <td className="py-2 font-data tabular text-ink">{mineText}</td>
              ) : (
                <td className="py-2 font-body italic text-ink-muted">To be confirmed</td>
              )}
            </tr>
            {clock && (
              <>
                <tr className="border-b border-line">
                  <th scope="row" className="py-2 pr-4 font-body font-normal italic text-ink-muted">Your working day</th>
                  <td className="py-2 font-data tabular text-ink">
                    {yoursText} {utcLabel(clock.offsetMin)} ({yoursIstStart} to {yoursIstEnd} IST)
                  </td>
                </tr>
                <tr className="border-b border-line">
                  <th scope="row" className="py-2 pr-4 font-body font-normal italic text-ink-muted">Now</th>
                  <td className="py-2 font-data tabular text-ink">
                    {hhmm(clock.nowLocal)} your time, {hhmm(clock.nowIst)} IST
                  </td>
                </tr>
                {overlap !== null && (
                  <tr className="border-b border-line">
                    <th scope="row" className="py-2 pr-4 font-body font-normal italic text-ink-muted">Overlap</th>
                    <td className="py-2 font-data tabular text-ink">{overlap > 0 ? durationText(overlap) : 'None'}</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
