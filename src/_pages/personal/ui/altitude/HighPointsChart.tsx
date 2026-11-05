import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { getMedia } from '@/shared/config';
import { MediaSlot } from '@/shared/ui/media-slot';
import { HIGH_POINTS_COPY } from '../../config/content';
import { heightSpoken, heightText, type HighPoint } from '../../lib/high-points';
import { HighPointCard } from './HighPointCard';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/** Chart geometry in viewBox units (the prototype's): 0 to 6,000 m, ticks every 1,000 m, marks evenly spaced. */
const W = 700;
const H = 372;
const X0 = 64;
const BASE = 340;
const TOP = 40;
const CEILING_M = 6000;
const TICK_M = 1000;
const TICKS = Array.from({ length: CEILING_M / TICK_M + 1 }, (_, i) => i * TICK_M);
const TICK_FORMAT = new Intl.NumberFormat('en');

const round = (n: number) => Math.round(n * 10) / 10;
const yOf = (m: number) => round(BASE - (m * (BASE - TOP)) / CEILING_M);

/** Screen-reader tail of a mark: ", about 4,919 metres, lake, Annapurna Circuit, April–May 2026, highest". */
function spokenTail(point: HighPoint): string {
  const parts = [heightSpoken(point), point.kind];
  if (point.route !== point.name) parts.push(point.route);
  if (point.when) parts.push(point.when);
  if (point.highest) parts.push(HIGH_POINTS_COPY.highest.toLowerCase());
  return `, ${parts.join(', ')}`;
}

/** The mark itself; `data-hp-apex` is the shape the card's origin sits on. */
function Mark({ point, x }: { point: HighPoint; x: number }) {
  const y = yOf(point.heightM);
  if (point.kind === 'lake') {
    return (
      <>
        <line x1={x} x2={x} y1={y + 5} y2={BASE} className="stroke-line-strong forced-colors:stroke-[CanvasText]" strokeDasharray="1 3" />
        <ellipse
          data-hp-apex={point.id}
          cx={x}
          cy={y}
          rx={11}
          ry={5}
          strokeWidth={1.5}
          className="fill-aqua-soft stroke-water forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]"
        />
      </>
    );
  }
  const half = point.highest ? 12 : 9;
  const rise = point.highest ? 20 : 15;
  return (
    <>
      <line x1={x} x2={x} y1={y + rise} y2={BASE} className="stroke-line-strong forced-colors:stroke-[CanvasText]" strokeDasharray="1 3" />
      <path
        data-hp-apex={point.id}
        d={`M${x} ${y}L${round(x + half)} ${y + rise}H${round(x - half)}Z`}
        strokeWidth={1.5}
        strokeLinejoin="round"
        className={
          point.highest
            ? 'fill-oxblood-deep stroke-oxblood forced-colors:fill-[CanvasText] forced-colors:stroke-[CanvasText]'
            : 'fill-ground stroke-oxblood forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]'
        }
      />
      {point.highest ? (
        <g>
          <rect
            x={x - 32}
            y={y - 30}
            width={64}
            height={22}
            rx={5}
            className="fill-oxblood-deep stroke-oxblood forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]"
          />
          <text
            x={x}
            y={y - 15}
            textAnchor="middle"
            className="fill-on-oxblood font-display text-[12px] font-semibold forced-colors:fill-[CanvasText]"
          >
            {HIGH_POINTS_COPY.highest}
          </text>
        </g>
      ) : null}
    </>
  );
}

function ChartSvg({ points }: { points: readonly HighPoint[] }) {
  const step = (W - X0) / points.length;
  const xOf = (i: number) => round(X0 + step * (i + 0.5));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden="true" focusable="false">
      {TICKS.map((m) => (
        <g key={m}>
          <line
            x1={X0}
            x2={W}
            y1={yOf(m)}
            y2={yOf(m)}
            strokeWidth={1}
            className={m === 0 ? 'stroke-chart-axis' : 'stroke-chart-grid'}
          />
          <text x={X0 - 10} y={yOf(m) + 4} textAnchor="end" className="fill-chart-label font-data text-[13px]">
            {m === 0 ? '0' : TICK_FORMAT.format(m)}
          </text>
        </g>
      ))}
      <text x={X0 - 10} y={TOP - 18} textAnchor="end" className="fill-chart-label font-data text-[13px]">
        m
      </text>
      {/* Scenery, not a route: a soft ridge through the apexes, lowest to highest. */}
      <polyline
        points={points.map((p, i) => `${xOf(i)},${yOf(p.heightM)}`).join(' ')}
        fill="none"
        strokeWidth={1}
        strokeDasharray="2 4"
        className="stroke-line-strong"
      />
      {points.map((point, i) => (
        <g key={point.id} data-hp-mark="" className="[transform-box:fill-box] [transform-origin:50%_100%]">
          <Mark point={point} x={xOf(i)} />
        </g>
      ))}
    </svg>
  );
}

const LABEL_BOX =
  'group grid min-h-11 justify-items-center gap-0.5 rounded-control px-1 py-1.5 text-center no-underline ' +
  'transition-[background-color,transform] duration-micro hover:bg-ink/[var(--alpha-wash)]';
const LABEL_TARGET = `${LABEL_BOX} active:scale-[0.97]`;

/** Desktop: the text twin under the chart, one link or button per mark, centred under it. */
function LabelContent({ point }: { point: HighPoint }) {
  return (
    <>
      <span
        className={
          'font-display text-[0.9375rem] font-semibold leading-[1.25] text-ink underline decoration-action-line ' +
          'decoration-1 underline-offset-[0.2em] transition-[text-decoration-color] duration-hover group-hover:decoration-action ' +
          (point.storyHref ? '' : 'decoration-dotted')
        }
      >
        {point.name}
      </span>
      <span className="font-data text-[0.875rem] leading-[1.3] text-ink [font-variant-numeric:tabular-nums]">
        <span aria-hidden="true">{heightText(point)}</span>
        <span className="sr-only">{spokenTail(point)}</span>
      </span>
    </>
  );
}

/** Phone: the altimeter row's end mark (a trig triangle, or water for a lake). */
function BarMark({ point }: { point: HighPoint }) {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
      className="absolute left-[var(--w)] top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 overflow-visible"
    >
      {point.kind === 'lake' ? (
        <ellipse cx={7} cy={7} rx={6} ry={3} strokeWidth={1.5} className="fill-aqua-soft stroke-water forced-colors:stroke-[CanvasText]" />
      ) : (
        <path
          d="M7 1 13 12H1Z"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={
            point.highest
              ? 'fill-oxblood-deep stroke-oxblood forced-colors:fill-[CanvasText] forced-colors:stroke-[CanvasText]'
              : 'fill-ground stroke-oxblood forced-colors:stroke-[CanvasText]'
          }
        />
      )}
    </svg>
  );
}

function photoFor(point: HighPoint): ReactNode {
  if (!point.photoSlot) return null;
  const entry = getMedia(point.photoSlot);
  if (!entry || entry.kind !== 'photo' || entry.status !== 'existing') return null;
  return <MediaSlot id={point.photoSlot} layout="grid" ratio="4:3" caption="none" reveal="none" sizes="260px" />;
}

export interface HighPointsChartProps {
  points: readonly HighPoint[];
}

/**
 * High points, to scale (FINAL-DESIGN §4.5.1). The SVG is `aria-hidden`; the ordered list of the same marks is the
 * real content (on desktop the visible name labels are those links). Phones get a horizontal-bar altimeter sorted
 * highest first. `HighPointCard` adds the hover, focus and tap card and the one-time rise of the marks.
 */
export function HighPointsChart({ points }: HighPointsChartProps) {
  const byHeightDesc = [...points].sort((a, b) => b.heightM - a.heightM);
  const photos: Record<string, ReactNode> = {};
  for (const point of points) {
    const photo = photoFor(point);
    if (photo) photos[point.id] = photo;
  }
  const listStyle: CSSVars = { '--n': points.length, paddingLeft: `${round((X0 / W) * 100)}%` };

  return (
    <div
      id={HIGH_POINTS_COPY.anchorId}
      data-hp-block=""
      className="relative min-w-0 scroll-mt-[calc(var(--nav-clear)+16px)]"
    >
      <h3 id="hp-h" className="sr-only">
        {HIGH_POINTS_COPY.title}
      </h3>
      <div data-hp-chart="" className="hidden md:block">
        <ChartSvg points={points} />
      </div>
      <ol
        aria-labelledby="hp-h"
        style={listStyle}
        className="m-0 mt-1.5 hidden list-none grid-cols-[repeat(var(--n),minmax(0,1fr))] p-0 md:grid"
      >
        {points.map((point) => (
          <li key={point.id} className="flex justify-center">
            {point.storyHref ? (
              <Link href={point.storyHref} data-hp={point.id} className={LABEL_TARGET}>
                <LabelContent point={point} />
              </Link>
            ) : (
              // No journal: plain text, not a button whose press does nothing for assistive tech (the spoken label
              // already carries every fact). A mouse hover still opens the card (review P3-7).
              <span data-hp={point.id} className={LABEL_BOX}>
                <LabelContent point={point} />
              </span>
            )}
          </li>
        ))}
      </ol>
      <ol aria-label={HIGH_POINTS_COPY.barsLabel} className="m-0 grid list-none gap-1 p-0 md:hidden">
        {byHeightDesc.map((point) => {
          const barStyle: CSSVars = { '--w': `${round((point.heightM / CEILING_M) * 100)}%` };
          return (
            <li key={point.id}>
              <button
                type="button"
                data-hp={point.id}
                data-hp-sheet=""
                aria-haspopup="dialog"
                className={
                  'grid min-h-12 w-full grid-cols-[7.5rem_minmax(0,1fr)_4.6rem] items-center gap-2.5 rounded-control ' +
                  'px-2 py-1 text-left transition-[background-color,transform] duration-micro active:scale-[0.97] ' +
                  'active:bg-ink/[var(--alpha-wash)]'
                }
              >
                <span className="font-display text-[0.9375rem] font-semibold leading-[1.25] text-ink">{point.name}</span>
                <span aria-hidden="true" style={barStyle} className="relative h-1.5 rounded-full bg-steel forced-colors:bg-[GrayText]">
                  <span className="absolute inset-y-0 left-0 w-[var(--w)] rounded-full bg-ink forced-colors:bg-[CanvasText]" />
                  <BarMark point={point} />
                </span>
                <span className="text-right font-data text-[0.875rem] leading-none text-ink [font-variant-numeric:tabular-nums]">
                  <span aria-hidden="true">{heightText(point)}</span>
                  <span className="sr-only">{spokenTail(point)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="m-0 mt-3.5 max-w-[36em] font-body text-caption text-ink-muted [text-wrap:pretty]">
        {HIGH_POINTS_COPY.caption}
      </p>
      <HighPointCard
        points={points}
        photos={photos}
        readJournal={HIGH_POINTS_COPY.readJournal}
        solo={HIGH_POINTS_COPY.solo}
        close={HIGH_POINTS_COPY.close}
      />
    </div>
  );
}
