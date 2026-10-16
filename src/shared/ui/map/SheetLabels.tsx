import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { clsx } from 'clsx';
import { cn } from '@/shared/lib/cn';
import type { CSSVars } from '@/shared/lib/css';
import type { SheetLabel } from './types';

const nf = new Intl.NumberFormat('en');

/**
 * The overlay box: an absolutely positioned layer with the viewBox's aspect ratio, centred and
 * scaled exactly like the SVG's `preserveAspectRatio` (`xMidYMid meet` or `slice`), so anything
 * placed in percent of the viewBox stays on its spot in every crop (§D.2 "Overlay coordinates").
 * Needs `container-type: size` on the frame (the sheet root sets it).
 */
export function overlayBoxStyle(w: number, h: number, aspect: 'meet' | 'slice'): CSSProperties {
  const fn = aspect === 'slice' ? 'max' : 'min';
  return { width: `${fn}(100cqw, calc(100cqh * ${w} / ${h}))`, aspectRatio: `${w} / ${h}` };
}

export function OverlayBox({
  w,
  h,
  aspect,
  className,
  ariaHidden,
  children,
}: {
  w: number;
  h: number;
  aspect: 'meet' | 'slice';
  className?: string;
  ariaHidden?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={cn('pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2', className)}
      style={overlayBoxStyle(w, h, aspect)}
    >
      {children}
    </div>
  );
}

/** Internal label shape: SheetLabel plus a data style for scale bars and graticule values. */
export type LayerLabel = Omit<SheetLabel, 'priority'> & {
  priority: 1 | 2 | 3;
  /** Plex Mono, muted: graticule values and scale bars. */
  data?: boolean;
  /** Archivo, muted: compass letters. */
  display?: boolean;
  /** Unmarked labels only: sit 4 px above or below the point instead of centred on it. */
  place?: 'above' | 'below';
};

function Triangle(): ReactElement {
  return (
    <svg viewBox="0 0 10 10" className="size-2.5 shrink-0 overflow-visible" aria-hidden="true">
      <path
        d="M5 0.8 9.3 8.6H0.7Z"
        className="fill-ink"
        style={{ stroke: 'rgb(var(--c-ink))', strokeWidth: 1.2, strokeLinejoin: 'round' }}
      />
    </svg>
  );
}

function Dot(): ReactElement {
  return <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ink" />;
}

function altitude(l: LayerLabel): ReactNode {
  if (typeof l.altitudeM !== 'number') return null;
  return (
    <span className="font-display tabular text-ink" style={{ '--wdth': 75 } as CSSVars}>
      {l.approx ? '~' : ''}
      {nf.format(Math.round(l.altitudeM))}
      <span className="ml-0.5 text-[0.86em] text-ink-muted">m</span>
    </span>
  );
}

/** Eight 1.5 px offsets plus a soft blur: a cartographic halo that works for HTML text in every engine. */
function haloShadow(c: string): string {
  const d = 1.5;
  const offsets = [[d, 0], [-d, 0], [0, d], [0, -d], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  return [...offsets.map(([x, y]) => `${x}px ${y}px 0 ${c}`), `0 0 3px ${c}`].join(', ');
}

/**
 * Cartographic labels as HTML (crisp 14 px text at every sheet size), positioned in percent of the
 * viewBox. Water and natural areas: Literata italic; passes, peaks, villages and towns: Archivo;
 * spot heights: a survey triangle before the name, figures at wdth 75 (§B.4.3).
 */
export function LabelLayer({
  labels,
  w,
  h,
  halo,
  priorityBelowLg = false,
}: {
  labels: readonly LayerLabel[];
  w: number;
  h: number;
  /** Below 1024 px only priority-1 labels stay (ContourSheet `labels="responsive"`). */
  priorityBelowLg?: boolean;
  /** A CSS colour (the plate's ground): a 1.5 px halo keeps label text readable over drawn marks. */
  halo?: string;
}): ReactElement {
  const textShadow = halo ? haloShadow(halo) : undefined;
  return (
    <div className="absolute inset-0">
      {labels.map((l, i) => {
        const plain = l.data || l.display;
        const peak = !plain && (l.kind === 'pass' || l.kind === 'peak');
        const settlement = !plain && (l.kind === 'village' || l.kind === 'town');
        const marker = peak || settlement;
        const anchor = l.anchor ?? (marker ? 'start' : 'middle');
        // Markers sit exactly on the point: 5 px is half the triangle, 3 px half the dot.
        const half = peak ? 5 : 3;
        const transform =
          anchor === 'start'
            ? marker
              ? `translate(-${half}px, -50%)`
              : 'translate(4px, -50%)'
            : anchor === 'end'
              ? marker
                ? `translate(calc(-100% + ${half}px), -50%)`
                : 'translate(calc(-100% - 4px), -50%)'
              : marker
                ? `translate(-50%, -${half}px)`
                : 'translate(-50%, -50%)';
        const y = !marker && l.place === 'above' ? 'calc(-100% - 4px)' : !marker && l.place === 'below' ? '4px' : null;
        const placed = y ? transform.replace(/, [^,]+\)$/, `, ${y})`) : transform;
        return (
          <span
            key={`${l.text}-${i}`}
            // clsx, not cn: tailwind-merge (unconfigured) treats `text-caption` as a colour and drops it.
            className={clsx(
              'absolute flex items-center gap-1.5 whitespace-nowrap text-caption leading-none',
              anchor === 'end' && 'flex-row-reverse',
              anchor === 'middle' && marker && 'flex-col gap-1',
              l.priority === 3 && 'max-sm:hidden',
              priorityBelowLg && l.priority !== 1 && 'max-lg:hidden',
              l.data && 'font-data tabular text-ink-muted',
              l.display && 'font-display font-semibold text-ink-muted',
              !l.data && !l.display && l.kind === 'water' && 'font-body italic text-water',
              !l.data && !l.display && l.kind === 'area' && 'font-body italic text-ink/70',
              !l.data && !l.display && l.kind === 'note' && 'font-body italic text-ink-muted',
              !l.data && !l.display && peak && 'font-display font-semibold text-ink',
              !l.data && !l.display && l.kind === 'village' && 'font-display font-normal text-ink',
              !l.data && !l.display && l.kind === 'town' && 'font-display font-medium text-ink',
            )}
            style={{ left: `${(l.x / w) * 100}%`, top: `${(l.y / h) * 100}%`, transform: placed, textShadow }}
          >
            {peak && <Triangle />}
            {settlement && <Dot />}
            <span className="flex items-baseline gap-1">
              <span>{l.text}</span>
              {altitude(l)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
