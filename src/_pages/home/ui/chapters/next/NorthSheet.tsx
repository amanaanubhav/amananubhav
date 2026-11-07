import type { ReactElement } from 'react';
import { clsx } from 'clsx';

import type { CSSVars } from '@/shared/lib/css';
import { STORY_HYPSO_STOPS_M, STORY_PALETTE } from '@/shared/config';
import { ContourSheet } from '@/shared/ui/map';

import { NEXT_COPY } from '../../../config/copy';
import { NORTH_SHEET, type NorthSheetPlace } from './north-sheet.generated';
import styles from './next.module.css';

/*
 * The #next static plan sheet (NEXT-DESIGN §4): the still poster of the rest view, top-down, in the house's
 * plan-sheet language (band fills and index contours, the static map's ramp). The steel dashed road from Muktinath
 * (where the walked circuit ends) past Marpha to Humkhola and the oxblood dotted foot route; place marks and labels are HTML (crisp at every size). Server-rendered, no client
 * JS, no raster; both themes through --n / --d (band fills) and the palette tokens (lines, marks, labels).
 */

const N = STORY_PALETTE.night;
const D = STORY_PALETTE.day;
const BAND_STEP_M = 500;
const NON_SCALING = 'non-scaling-stroke' as const;

const rgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** The story map's hypsometric ramp at `m` metres (linear between stops, clamped), as in PlanSheetLayers. */
function rampAt(colors: readonly string[], m: number): string {
  const at = STORY_HYPSO_STOPS_M;
  let i = at.findIndex((_, k) => k < at.length - 1 && m < at[k + 1]);
  if (i < 0) i = at.length - 2;
  const t = Math.min(1, Math.max(0, (m - at[i]) / (at[i + 1] - at[i])));
  const [a, b] = [rgb(colors[i]), rgb(colors[i + 1])];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(' ')})`;
}

const both = (m: number): CSSVars => ({ '--n': rampAt(N.hypso, m), '--d': rampAt(D.hypso, m) }) as CSSVars;

/** Label placement per place: side of the mark, and whether phones keep it (the dots still show the rest). */
type Side = 'right' | 'rightLow' | 'left' | 'aboveLeft' | 'below' | 'belowLeft' | 'belowRight';
/** `stack`: the altitude takes its own line (the summit, so its label stays narrow). */
const PLACEMENT: Readonly<Record<string, { side: Side; minor?: boolean; stack?: boolean }>> = {
  muktinath: { side: 'belowLeft' },
  kagbeni: { side: 'left', minor: true },
  jomsom: { side: 'left', minor: true },
  marpha: { side: 'right' },
  kalopani: { side: 'right', minor: true },
  ghasa: { side: 'left', minor: true },
  tatopani: { side: 'left' },
  narchyang: { side: 'right', minor: true },
  humkhola: { side: 'aboveLeft' },
  'sadhi-kharka': { side: 'belowLeft', minor: true },
  'bhusket-mela': { side: 'rightLow', minor: true },
  panchakunda: { side: 'belowRight', minor: true },
  anbc: { side: 'aboveLeft' },
  'annapurna-i': { side: 'below', stack: true },
};

const nf = new Intl.NumberFormat('en');

function Mark({ place }: { place: NorthSheetPlace }): ReactElement {
  const pos = { left: `${(place.x / NORTH_SHEET.viewBox[0]) * 100}%`, top: `${(place.y / NORTH_SHEET.viewBox[1]) * 100}%` };
  if (place.kind === 'goal' || place.kind === 'summit') {
    return (
      <svg viewBox="0 0 14 13" className={styles.markTri} style={pos} aria-hidden="true">
        <path d="M7 1 13 12H1Z" className={place.kind === 'goal' ? styles.triGoal : styles.triSummit} />
      </svg>
    );
  }
  // The road starts at Muktinath (the circuit's end); Marpha, where the jeep leg begins, is a town on it.
  const kind =
    place.kind === 'circuit-end'
      ? styles.markStart
      : place.kind === 'road' || place.kind === 'jeep-start'
        ? styles.markRoad
        : place.kind === 'trailhead'
          ? styles.markTrail
          : styles.markCamp;
  return <span className={clsx(styles.mark, kind)} style={pos} />;
}

function Label({ place }: { place: NorthSheetPlace }): ReactElement | null {
  const copy = NEXT_COPY.places[place.id];
  const placement = PLACEMENT[place.id];
  if (!copy || !placement) return null;
  const end = placement.side === 'left' || placement.side === 'aboveLeft' || placement.side === 'belowLeft';
  const centre = placement.side === 'below';
  // Commonly cited altitudes: "~" on the route's, none on the summit's surveyed height.
  const approx = place.kind !== 'summit';
  return (
    <span
      className={clsx(
        styles.label,
        styles[placement.side],
        end && styles.alignEnd,
        centre && styles.alignCentre,
        placement.minor && styles.minor,
        'text-caption',
      )}
      style={{ left: `${(place.x / NORTH_SHEET.viewBox[0]) * 100}%`, top: `${(place.y / NORTH_SHEET.viewBox[1]) * 100}%` }}
    >
      <span className={clsx("flex gap-1 font-display font-semibold text-ink", placement.stack ? "flex-col items-center gap-0" : "items-baseline")}>
        <span>{copy.name}</span>
        {typeof place.altitudeM === 'number' ? (
          <span className="tabular font-normal text-ink" style={{ '--wdth': 75 } as CSSVars}>
            {approx ? '~' : ''}
            {nf.format(place.altitudeM)}
            <span className="ml-0.5 text-[0.86em]">m</span>
          </span>
        ) : null}
      </span>
      {copy.note ? <span className="font-body italic text-ink">{copy.note}</span> : null}
    </span>
  );
}

/** The sheet, sized by its caller (`className`, e.g. `w-full`); `meet`, so nothing on it is ever cropped. */
export function NorthSheet({ className }: { className?: string }): ReactElement {
  const { frame, bands, jeep, trek, places, scale: scaleBar } = NORTH_SHEET;
  const half = BAND_STEP_M / 2;
  return (
    <ContourSheet
      data={NORTH_SHEET}
      mode="define"
      routeState="hidden"
      labels="none"
      aspect="meet"
      title={NEXT_COPY.sheet.title}
      desc={NEXT_COPY.sheet.desc}
      className={clsx(styles.sheet, className)}
      underlay={
        <g aria-hidden="true">
          <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} className="plan-fill" style={both(half + BAND_STEP_M)} />
          {bands.map((b) => (
            <path key={b.m} d={b.d} fillRule="evenodd" className="plan-fill" style={both(b.m + half)} />
          ))}
        </g>
      }
      lines={
        <g aria-hidden="true" fill="none">
          {/* The jeep: steel dashes 7 on 5 off, 1.5 px, butt caps, in a 1 px ground casing. */}
          <path d={jeep.d} className={styles.casing} strokeWidth={3.5} strokeLinejoin="round" vectorEffect={NON_SCALING} />
          <path d={jeep.d} className={styles.jeep} strokeWidth={1.5} strokeDasharray="7 5" strokeLinejoin="round" vectorEffect={NON_SCALING} />
          {/* On foot: round oxblood dots, 3.2 px at a 6.5 px pitch, each in a 1 px ground ring. */}
          <path d={trek.d} className={styles.casing} strokeWidth={5.2} strokeDasharray="0 6.5" strokeLinecap="round" vectorEffect={NON_SCALING} />
          <path d={trek.d} className={styles.foot} strokeWidth={3.2} strokeDasharray="0 6.5" strokeLinecap="round" vectorEffect={NON_SCALING} />
          <path
            d={`M${scaleBar.x} ${scaleBar.y - 8}V${scaleBar.y}H${scaleBar.x + scaleBar.lengthPx}V${scaleBar.y - 8}`}
            className={styles.scaleBar}
            strokeWidth={1}
            vectorEffect={NON_SCALING}
          />
        </g>
      }
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [&_*]:pointer-events-none">
        {places.map((p) => (
          <Mark key={`m-${p.id}`} place={p} />
        ))}
        {places.map((p) => (
          <Label key={`l-${p.id}`} place={p} />
        ))}
        <span
          className="absolute -translate-x-1/2 font-data text-caption text-ink"
          style={{
            left: `${((scaleBar.x + scaleBar.lengthPx / 2) / NORTH_SHEET.viewBox[0]) * 100}%`,
            top: `${((scaleBar.y + 6) / NORTH_SHEET.viewBox[1]) * 100}%`,
          }}
        >
          {scaleBar.km} {NEXT_COPY.sheet.km}
        </span>
      </div>
    </ContourSheet>
  );
}
