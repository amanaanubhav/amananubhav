// The plan sheet's static story layers (design §12.2): band fills under the contours, isotherms and the
// by-road stretch above them, markers above the routes, all inside ContourSheet's one SVG. Server-safe, no
// client JS, no hex literals: colours come from STORY_PALETTE (the shader's stops) and switch with
// html[data-theme] through --n / --d (story.module.css).
import type { CSSProperties, ReactElement } from 'react';
import type { CSSVars } from '@/shared/lib/css';
import { STORY_HYPSO_STOPS_M, STORY_PALETTE } from '@/shared/config';

import type { PlanSheetData } from '../../config/plan-sheet.generated';

type Ramp = readonly string[];

const rgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** The shader's hypsometric ramp sampled at `m` metres (linear between stops, clamped). */
function rampAt(colors: Ramp, m: number): string {
  const at = STORY_HYPSO_STOPS_M;
  let i = at.findIndex((_, k) => k < at.length - 1 && m < at[k + 1]);
  if (i < 0) i = at.length - 2;
  const t = Math.min(1, Math.max(0, (m - at[i]) / (at[i + 1] - at[i])));
  const [a, b] = [rgb(colors[i]), rgb(colors[i + 1])];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(' ')})`;
}

/** Both themes' colour on one element: CSS picks `--n` or `--d` from html[data-theme] (see plan-sheet.css). */
const both = (night: string, day: string): CSSVars => ({ '--n': night, '--d': day }) as CSSVars;
const N = STORY_PALETTE.night;
const D = STORY_PALETTE.day;

/** Band fills (centre colour of each 500 m band) under the contours. */
export function PlanSheetUnderlay({ data }: { data: PlanSheetData }): ReactElement {
  const { frame, bands, legend } = data;
  const half = legend.bandStepM / 2;
  return (
    <g aria-hidden="true" data-plan-bands="">
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.w}
        height={frame.h}
        className="plan-fill"
        style={both(rampAt(N.hypso, half + legend.bandStepM), rampAt(D.hypso, half + legend.bandStepM))}
      />
      {bands.map((b) => (
        <path
          key={b.m}
          d={b.d}
          fillRule="evenodd"
          className="plan-fill"
          style={both(rampAt(N.hypso, b.m + half), rampAt(D.hypso, b.m + half))}
        />
      ))}
    </g>
  );
}

const NON_SCALING = 'non-scaling-stroke' as const;

/** Isotherms and the by-road stretch above the contours, under the routes; markers go in the overlay. */
export function PlanSheetLines({ data }: { data: PlanSheetData }): ReactElement {
  return (
    <g aria-hidden="true" data-plan-lines="">
      {data.isotherms.map((t) => (
        <path
          key={t.c}
          d={t.d}
          fill="none"
          vectorEffect={NON_SCALING}
          className="plan-stroke"
          strokeWidth={t.c === 0 ? 1.6 : 0.9}
          strokeDasharray={t.c < 0 ? '3 3' : undefined}
          opacity={t.c === 0 ? 0.9 : 0.6}
          style={
            t.c === 0 ? both(N.isoZero, D.isoZero) : t.c < 0 ? both(N.isoCold, D.isoCold) : both(N.isoWarm, D.isoWarm)
          }
        />
      ))}
      {data.road.map((r) => (
        <path
          key={r.id}
          d={r.d}
          fill="none"
          vectorEffect={NON_SCALING}
          className="plan-stroke"
          strokeWidth={2}
          strokeDasharray="0.5 5"
          strokeLinecap="round"
          style={both(N.jeep, D.jeep)}
        />
      ))}
    </g>
  );
}

const MARK: Record<PlanSheetData['markers'][number]['kind'], number> = {
  'pass-through': 3.5,
  stay: 5,
  landmark: 5,
  pass: 7,
  lake: 6,
  peak: 6,
};

/** Markers above the routes (one group; peaks as ink triangles, lakes as water discs). */
export function PlanSheetOverlay({ data }: { data: PlanSheetData }): ReactElement {
  const ground = both(N.ground, D.ground);
  return (
    <g aria-hidden="true" data-plan-marks="">
      {data.markers.map((m) => {
        const r = MARK[m.kind];
        if (m.kind === 'peak') {
          return (
            <path
              key={m.name}
              d={`M${m.x} ${m.y - r}l${r} ${1.7 * r}h${-2 * r}z`}
              fill="none"
              className="plan-stroke"
              vectorEffect={NON_SCALING}
              strokeWidth={1.2}
              style={both(N.ink, D.ink)}
            />
          );
        }
        const fill: CSSProperties =
          m.kind === 'lake' ? both(N.branch, D.branch) : m.kind === 'pass-through' ? ground : both(N.route, D.route);
        return (
          <circle
            key={m.name}
            cx={m.x}
            cy={m.y}
            r={r}
            className="plan-fill plan-ring"
            strokeWidth={1.4}
            strokeDasharray={m.approx ? '2 2' : undefined}
            vectorEffect={NON_SCALING}
            style={
              {
                ...fill,
                ...(m.kind === 'pass-through'
                  ? { '--ring-n': N.route, '--ring-d': D.route }
                  : { '--ring-n': N.ground, '--ring-d': D.ground }),
              } as CSSVars
            }
          />
        );
      })}
    </g>
  );
}
