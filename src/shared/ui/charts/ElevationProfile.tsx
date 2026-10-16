import { useId, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { CSSVars } from '@/shared/lib/css';
import { DrawOnView } from '@/shared/ui/draw';
import {
  PROFILE_BOX,
  plottedPoints,
  profileMapping,
  type ProfileBox,
  type ProfilePoint,
  type ProfileVariant,
} from './profile-mapping';

export interface ElevationProfileProps {
  points: readonly ProfilePoint[];
  title: string;
  desc: string;
  variant?: ProfileVariant;
  /** Stroke draw when 30% in view (motion-gated). */
  draw?: 'once' | 'none';
  /** 0..1: reveals the signal copy of the line with a clip (reader, preloader). Unset: inherited `--profile-progress`. */
  progress?: number;
  /** Waypoint name to mark with a signal ring. */
  highlight?: string;
  /** "Show data" disclosure with a <table> (default true for 'full'). */
  showData?: boolean;
  /** auto: distance if every plotted point has distanceKm, else even (with a caption). */
  spacing?: 'auto' | 'distance' | 'even';
  className?: string;
}

const EVEN_NOTE = 'Waypoints evenly spaced until the GPS track arrives.';
const nf = new Intl.NumberFormat('en');
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Text sizes (SVG user units) per variant. */
const TYPE: Record<ProfileVariant, { label: number; axis: number }> = {
  full: { label: 15, axis: 14 },
  compact: { label: 14, axis: 13 },
  strip: { label: 0, axis: 0 },
  cover: { label: 28, axis: 22 },
  preloader: { label: 0, axis: 0 },
};

const STROKE_ROUTE: CSSProperties = {
  stroke: 'rgb(var(--c-signal-line))',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};
const STROKE_TRACE: CSSProperties = { stroke: 'rgb(var(--c-line-strong))', strokeWidth: 1, fill: 'none' };
const STROKE_GRID: CSSProperties = { stroke: 'var(--ink-contour)', strokeWidth: 1, fill: 'none' };
const STROKE_LEADER: CSSProperties = { ...STROKE_TRACE, strokeDasharray: '2 3', opacity: 0.7 };
const PROGRESS_CLIP: CSSProperties = { clipPath: 'inset(0 calc((1 - var(--profile-progress, 1)) * 100%) 0 0)' };
/** Axis text: shared attributes sit on the group, so each tick only carries its position (§J.2 inline SVG budget). */
const AXIS_TEXT = 'fill-ink-muted font-data tabular';

function altitudeText(p: ProfilePoint): string {
  return `${p.approx ? '~' : ''}${nf.format(Math.round(p.altitudeM as number))} m`;
}

function isPeak(p: ProfilePoint): boolean {
  return p.kind === 'pass' || p.kind === 'summit';
}

/** Survey-triangle marker (spot height), apex up, centred on (cx, cy). */
function trianglePath(cx: number, cy: number, side: number): string {
  const h = (side * Math.sqrt(3)) / 2;
  return `M${r1(cx)} ${r1(cy - (2 * h) / 3)}L${r1(cx + side / 2)} ${r1(cy + h / 3)}L${r1(cx - side / 2)} ${r1(cy + h / 3)}Z`;
}

interface PlacedLabel {
  key: string;
  x: number;
  textX: number;
  anchor: 'start' | 'middle' | 'end';
  row: number;
  point: ProfilePoint;
  pointY: number;
}

/** Greedy two-row (full) or one-row (compact) placement; labels that do not fit are left to the table. */
function placeLabels(
  plotted: readonly ProfilePoint[],
  xs: readonly number[],
  ys: readonly number[],
  box: ProfileBox,
  size: number,
  rows: number,
): PlacedLabel[] {
  const n = plotted.length;
  const wanted = plotted
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => {
      if (p.label === false) return false;
      if (p.label === true) return true;
      if (rows === 1) return isPeak(p) || i === 0 || i === n - 1;
      return isPeak(p) || p.kind === 'lake' || p.kind === 'trailhead' || i === 0 || i === n - 1;
    })
    // Peaks first, so the pass always wins a contested slot.
    .sort((a, b) => Number(isPeak(b.p)) - Number(isPeak(a.p)) || a.i - b.i);

  const occupied: Array<Array<[number, number]>> = Array.from({ length: rows }, () => []);
  const placed: PlacedLabel[] = [];
  for (const { p, i } of wanted) {
    const text = isPeak(p) ? `${p.name} ${altitudeText(p)}` : p.name;
    const w = text.length * size * 0.56;
    const x = xs[i];
    let anchor: PlacedLabel['anchor'] = 'middle';
    let left = x - w / 2;
    let textX = x;
    if (left < 2) {
      anchor = 'start';
      textX = Math.max(2, x - 6);
      left = textX;
    } else if (x + w / 2 > box.width - 2) {
      anchor = 'end';
      textX = Math.min(box.width - 2, x + 6);
      left = textX - w;
    }
    const right = left + w;
    const row = occupied.findIndex((spans) => spans.every(([a, b]) => right + 10 < a || left > b + 10));
    if (row === -1) continue;
    occupied[row].push([left, right]);
    placed.push({ key: `${p.name}-${i}`, x, textX, anchor, row, point: p, pointY: ys[i] });
  }
  return placed;
}

function niceGrid(minM: number, maxM: number): number[] {
  let step = 1000;
  const count = () => Math.floor(maxM / step) - Math.ceil(minM / step) + 1;
  if (count() < 2) step = 500;
  const out: number[] = [];
  for (let m = Math.ceil(minM / step) * step; m <= maxM; m += step) out.push(m);
  return out;
}

/**
 * The phone layout of the two labelled variants. `full` (720 units) and `compact` (520 units) keep
 * their 13 to 15 px text only at roughly their own width, so below that width (a container query, no
 * JS, no layout shift) the profile switches to this box: one label row, about 13 to 14 px text at
 * 340 to 520 px. PROFILE_BOX, the 3D curtain's contract, is unchanged by it.
 */
const NARROW_BOX: ProfileBox = { width: 340, height: 236, pad: { t: 44, r: 12, b: 34, l: 64 } };
const NARROW_TYPE = { label: 14, axis: 13 };
/** Container widths (CSS px) below which `full` / `compact` use NARROW_BOX. */
const NARROW_BELOW: Record<'full' | 'compact', number> = { full: 660, compact: 500 };

const PROFILE_CSS = `
.ep-frame{container-type:inline-size}
.ep-frame>.ep-narrow{display:none}
@container (max-width:${NARROW_BELOW.full - 0.02}px){.ep-frame[data-v='full']>.ep-wide{display:none}.ep-frame[data-v='full']>.ep-narrow{display:block}}
@container (max-width:${NARROW_BELOW.compact - 0.02}px){.ep-frame[data-v='compact']>.ep-wide{display:none}.ep-frame[data-v='compact']>.ep-narrow{display:block}}`;

/** Distance tick step (km): every 25 km where the labels fit, else 50, 100 or 250 km. */
function distanceStep(spanKm: number, innerW: number, axis: number): number {
  for (const step of [25, 50, 100, 250]) {
    const room = (innerW / Math.max(1, spanKm)) * step;
    if (room >= axis * 0.6 * 6 + 10) return step;
  }
  return 500;
}

interface SvgArgs {
  box: ProfileBox;
  type: { label: number; axis: number };
  rows: number;
  idPrefix: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Elevation profile (G-02): the route's altitude against distance (or evenly spaced waypoints until
 * GPS distances exist). Server-safe; the optional draw is a client island (`DrawOnView`).
 */
export function ElevationProfile({
  points,
  title,
  desc,
  variant = 'full',
  draw = 'none',
  progress,
  highlight,
  showData,
  spacing = 'auto',
  className,
}: ElevationProfileProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const withData = showData ?? variant === 'full';
  const labelled = variant === 'full' || variant === 'compact';
  // The strip (reader progress) and the preloader line span whatever box the caller gives them:
  // stretched, with non-scaling strokes and no shape markers (they would distort).
  const stretch = variant === 'strip' || variant === 'preloader';

  // Spacing: forcing `even` drops distances; forcing `distance` without full data falls back to even.
  const source = spacing === 'even' ? points.map((p) => ({ ...p, distanceKm: undefined })) : points;
  const plotted = plottedPoints(source);
  const n = plotted.length;
  const drawn = draw === 'once' && n > 1;
  const spacingUsed = profileMapping(source, PROFILE_BOX[variant]).spacing;
  const evenNote = n > 1 && spacingUsed === 'even';
  const wrapped = labelled && (withData || evenNote);
  const progressStyle =
    progress !== undefined ? ({ '--profile-progress': Math.min(1, Math.max(0, progress)) } as CSSVars) : undefined;

  const renderSvg = ({ box, type, rows, idPrefix, className: svgClass, style }: SvgArgs): ReactElement => {
    const map = profileMapping(source, box);
    const xs = plotted.map((_, i) => map.x(i));
    const ys = plotted.map((p) => map.y(p.altitudeM as number));
    const baseY = box.height - box.pad.b;
    const line = n > 1 ? xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(ys[i])}`).join('') : '';
    const area = n > 1 ? `M${r1(xs[0])} ${r1(baseY)}${line.replace(/^M/, 'L')}L${r1(xs[n - 1])} ${r1(baseY)}Z` : '';
    const titleId = `${idPrefix}-t`;
    const descId = `${idPrefix}-d`;
    const maskId = `${idPrefix}-m`;

    const grid = labelled ? niceGrid(map.minM, map.maxM) : [];
    const distTicks: { d: number; x: number }[] = [];
    if (labelled && map.spacing === 'distance') {
      const ds = plotted.map((p) => p.distanceKm as number);
      const d0 = Math.min(...ds);
      const d1 = Math.max(...ds);
      const step = distanceStep(d1 - d0, box.width - box.pad.l - box.pad.r, type.axis);
      for (let d = Math.ceil(d0 / step) * step; d <= d1; d += step) {
        distTicks.push({ d, x: box.pad.l + (d - d0) * map.kx });
      }
    }
    const labels = labelled && n > 0 ? placeLabels(plotted, xs, ys, box, type.label, rows) : [];
    const rowY = (row: number) => box.pad.t - 14 - (rows - 1 - row) * (type.label + 9);
    // Same-styled strokes are merged into one path each (gridlines, axis and ticks, label leaders): the drawing is
    // unchanged and every profile ships far fewer attribute bytes.
    const gridPath = grid.map((m) => `M${box.pad.l} ${r1(map.y(m))}H${box.width - box.pad.r}`).join('');
    const axisPath =
      `M${box.pad.l} ${baseY}H${box.width - box.pad.r}` +
      xs.map((x) => `M${r1(x)} ${baseY}v4`).join('') +
      distTicks.map(({ x }) => `M${r1(x)} ${baseY}v8`).join('');
    const leaderPath = labels
      .map((l) => `M${r1(l.x)} ${rowY(l.row) + 6}V${r1(l.pointY - (isPeak(l.point) ? 16 : 6))}`)
      .join('');

    const highIndex = n > 0 ? ys.indexOf(Math.min(...ys)) : -1;
    const highPoint = highIndex >= 0 ? plotted[highIndex] : undefined;
    const highlightIndex = highlight ? plotted.findIndex((p) => p.name === highlight) : -1;

    const markers: ReactNode[] = [];
    if (!stretch) {
      plotted.forEach((p, i) => {
        if (isPeak(p) || (variant === 'cover' && i === highIndex)) {
          markers.push(
            <path key={`pk-${i}`} d={trianglePath(xs[i], ys[i] - 7, variant === 'cover' ? 14 : 10)} className="fill-ink" />,
          );
        } else if (p.kind === 'lake' && labelled) {
          markers.push(
            <circle key={`lk-${i}`} cx={r1(xs[i])} cy={r1(ys[i])} r={3.5} className="fill-ground"
              style={{ stroke: 'rgb(var(--c-water))', strokeWidth: 1.5 }} vectorEffect="non-scaling-stroke" />,
          );
        } else if (variant === 'full') {
          markers.push(<circle key={`pt-${i}`} cx={r1(xs[i])} cy={r1(ys[i])} r={2.5} className="fill-ink-muted" />);
        }
      });
    }

    return (
      <svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        preserveAspectRatio={stretch ? 'none' : undefined}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className={cn('block h-auto w-full overflow-visible', svgClass)}
        style={style}
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>
          {desc}
          {evenNote && !labelled ? ` ${EVEN_NOTE}` : ''}
          {n < 2 ? ' Altitude data to come.' : ''}
        </desc>

        {drawn && (
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={box.width} height={box.height}>
              <path d={line} data-draw fill="none" stroke="white" strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
            </mask>
          </defs>
        )}

        {grid.length > 0 && (
          <g aria-hidden="true">
            <path d={gridPath} style={STROKE_GRID} vectorEffect="non-scaling-stroke" />
            <g textAnchor="end" fontSize={type.axis} className={AXIS_TEXT}>
              {grid.map((m) => (
                <text key={m} x={box.pad.l - 10} y={r1(map.y(m))} dy="0.35em">
                  {nf.format(m)} m
                </text>
              ))}
            </g>
          </g>
        )}

        {labelled && n > 1 && (
          <g aria-hidden="true">
            <path d={axisPath} style={STROKE_TRACE} vectorEffect="non-scaling-stroke" />
            {distTicks.length > 0 && (
              <g textAnchor="middle" fontSize={type.axis} className={AXIS_TEXT}>
                {distTicks.map(({ d, x }) => (
                  <text key={d} x={r1(x)} y={baseY + 12 + type.axis}>
                    {nf.format(d)} km
                  </text>
                ))}
              </g>
            )}
          </g>
        )}

        {n > 1 && (
          <path d={area} aria-hidden="true" style={{ fill: 'rgb(var(--c-ink) / 0.08)', stroke: 'none' }} />
        )}

        {n > 1 && (
          <g aria-hidden="true" mask={drawn ? `url(#${maskId})` : undefined}>
            <path d={line} style={STROKE_TRACE} vectorEffect="non-scaling-stroke" />
            <g style={PROGRESS_CLIP}>
              <path d={line} className="route-line" style={STROKE_ROUTE} vectorEffect="non-scaling-stroke" />
            </g>
          </g>
        )}

        <g aria-hidden="true" data-draw-label={drawn ? '' : undefined}>
          {markers}
          {highlightIndex >= 0 && !stretch && (
            <circle cx={r1(xs[highlightIndex])} cy={r1(ys[highlightIndex])} r={9} fill="none"
              className="signal-mark" style={{ stroke: 'rgb(var(--c-signal-line))', strokeWidth: 2 }}
              vectorEffect="non-scaling-stroke" />
          )}
          {leaderPath && <path d={leaderPath} style={STROKE_LEADER} vectorEffect="non-scaling-stroke" />}
          {labels.map((l) => (
            <text key={l.key} x={r1(l.textX)} y={rowY(l.row)} textAnchor={l.anchor} fontSize={type.label}
              className={l.point.kind === 'lake' ? 'fill-water font-body italic' : 'fill-ink font-display font-semibold'}>
              {l.point.name}
              {isPeak(l.point) && (
                <tspan className="fill-ink-muted font-data font-normal tabular" fontSize={type.axis}>
                  {' '}
                  {altitudeText(l.point)}
                </tspan>
              )}
            </text>
          ))}
          {variant === 'cover' && highPoint && (
            <g>
              <text x={box.pad.l} y={52} fontSize={type.label} className="fill-ink font-display font-semibold">
                {highPoint.name}
              </text>
              <text x={box.pad.l} y={86} fontSize={type.axis} className="fill-ink-muted font-data tabular">
                {altitudeText(highPoint)}
              </text>
            </g>
          )}
          {labelled && n < 2 && (
            <text x={box.width / 2} y={box.height / 2} textAnchor="middle" fontSize={type.label}
              className="fill-ink-muted font-body italic">
              Altitude data to come
            </text>
          )}
        </g>
      </svg>
    );
  };

  // Unlabelled variants: one SVG. Labelled ones: the wide layout plus the phone layout, switched by a
  // container query on the frame (only one is ever displayed, so only one is in the a11y tree).
  const visual = labelled ? (
    <div
      className={cn('ep-frame w-full min-w-0', !wrapped && className)}
      data-v={variant}
      style={wrapped ? undefined : progressStyle}
    >
      <style href="aa-elevation-profile" precedence="default">
        {PROFILE_CSS}
      </style>
      {renderSvg({
        box: PROFILE_BOX[variant],
        type: TYPE[variant],
        rows: variant === 'full' ? 2 : 1,
        idPrefix: `ep-${uid}`,
        className: 'ep-wide',
      })}
      {renderSvg({ box: NARROW_BOX, type: NARROW_TYPE, rows: 1, idPrefix: `ep-${uid}-n`, className: 'ep-narrow' })}
    </div>
  ) : (
    renderSvg({ box: PROFILE_BOX[variant], type: TYPE[variant], rows: 1, idPrefix: `ep-${uid}`, className, style: progressStyle })
  );

  const content = drawn ? <DrawOnView threshold={0.3}>{visual}</DrawOnView> : visual;

  if (!wrapped) return content;

  return (
    <figure className={cn('min-w-0', className)} style={progressStyle}>
      {content}
      {evenNote && <figcaption className="mt-2 font-body text-caption italic text-ink-muted">{EVEN_NOTE}</figcaption>}
      {withData && <ProfileTable points={source} title={title} distance={spacingUsed === 'distance'} />}
    </figure>
  );
}

function ProfileTable({
  points,
  title,
  distance,
}: {
  points: readonly ProfilePoint[];
  title: string;
  distance: boolean;
}): ReactElement {
  return (
    <details className="group mt-3">
      <summary
        // clsx, not cn: tailwind-merge (unconfigured) treats `text-ui` as a colour and drops it.
        className={clsx(
          'inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded-control font-body text-ui text-ink',
          'underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover',
          'hover:decoration-2 [&::-webkit-details-marker]:hidden',
        )}
      >
        <span className="group-open:hidden">Show data</span>
        <span className="hidden group-open:inline">Hide data</span>
        <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-ui group-open:rotate-180" />
      </summary>
      {/* No data-lenis-prevent: Lenis already ignores horizontal-only wheel input, and a prevented pane
          whose overflow-y computes to auto would trap vertical wheel scrolling once the table is open. */}
      <div className="scroll-pane mt-3 overflow-x-auto overflow-y-hidden overscroll-y-auto">
        <table className="w-full border-collapse text-left text-caption">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-line-strong">
              <th scope="col" className="py-2 pr-4 font-body font-medium italic text-ink-muted">Waypoint</th>
              <th scope="col" className="py-2 pr-4 text-right font-body font-medium italic text-ink-muted">Altitude</th>
              {distance && (
                <th scope="col" className="py-2 text-right font-body font-medium italic text-ink-muted">Distance</th>
              )}
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={`${p.name}-${i}`} className="border-b border-line">
                <th scope="row" className="py-2 pr-4 font-body font-normal text-ink">{p.name}</th>
                <td className="tabular py-2 pr-4 text-right font-data text-ink">
                  {typeof p.altitudeM === 'number' ? altitudeText(p) : <span className="font-body italic text-ink-muted">Not recorded</span>}
                </td>
                {distance && (
                  <td className="tabular py-2 text-right font-data text-ink">
                    {typeof p.distanceKm === 'number' ? `${nf.format(p.distanceKm)} km` : ''}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
