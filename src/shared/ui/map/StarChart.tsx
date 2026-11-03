import { useId, type CSSProperties, type ReactElement } from 'react';
import { clsx } from 'clsx';
import { starTintFor, type StarTint } from '@/shared/lib/astro';
import { cn } from '@/shared/lib/cn';
import type { CSSVars } from '@/shared/lib/css';
import { LabelLayer, OverlayBox, type LayerLabel } from './SheetLabels';
import { StarReveal } from './StarReveal';
import type { StarChartData } from './types';

export interface StarChartProps {
  data: StarChartData;
  title: string;
  desc: string;
  /** Fade stars in by magnitude, three groups 200 ms apart (motion-gated, once in view). */
  reveal?: 'magnitude' | 'none';
  /** The ground the chart sits on, for the label halo. Default the sky ground (`bg-sky`). */
  halo?: string;
  className?: string;
}

/** The honesty note a star chart carries for its source (§A.4, §D.2). */
export function starChartSourceNote(data: Pick<StarChartData, 'source'>): string | undefined {
  if (data.source === 'procedural') return 'Illustrative sky';
  if (data.source === 'stub') return 'Star chart to come';
  return undefined;
}

const NON_SCALING = 'non-scaling-stroke' as const;
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Star colour by B-V (PALETTE-SPEC §4.12): hot stars `star-hot` (steel blue), sun-like `star-sun` (= ink),
 * K/M stars `star-cool` (warm parchment), with a half step between each. The tints sit close to ink in
 * lightness, so the chart reads as one ink with temperature in it, never as coloured confetti.
 */
const STEPS: readonly StarTint[] = [
  { role: 'star-hot', towardSun: 0 },
  { role: 'star-hot', towardSun: 0.5 },
  { role: 'star-sun', towardSun: 0 },
  { role: 'star-cool', towardSun: 0.5 },
  { role: 'star-cool', towardSun: 0 },
];
/** The bands come from `starTintFor` (@/shared/lib/astro), the one classification every star renderer shares. */
const TINTS: readonly { fill: string }[] = STEPS.map(({ role, towardSun }) => ({
  fill: towardSun ? `color-mix(in oklab, var(--${role}) 50%, var(--star-sun))` : `var(--${role})`,
}));
function tintBucket(t: number): number {
  const { role, towardSun } = starTintFor(t);
  return STEPS.findIndex((s) => s.role === role && s.towardSun === towardSun);
}
/** Brightest first: radius 2.0 and up, 1.2 to 2.0, below 1.2 (radius grows with brightness). */
function magGroup(r: number): 0 | 1 | 2 {
  return r >= 2 ? 0 : r >= 1.2 ? 1 : 2;
}
const CARDINAL = /^(N|NE|E|SE|S|SW|W|NW)$/;

/**
 * Star chart (G-04a inset, G-04b poster): real stars as ink circles sized by magnitude and tinted by
 * B-V, with optional constellation figures, horizon and graticule. Server-safe; the magnitude reveal
 * is a client island (`StarReveal`).
 */
export function StarChart({
  data,
  title,
  desc,
  reveal = 'none',
  halo = 'rgb(var(--c-ground-sky))',
  className,
}: StarChartProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [w, h] = data.viewBox;
  const titleId = `sc-${uid}-t`;
  const descId = `sc-${uid}-d`;
  const note = starChartSourceNote(data);
  const stub = data.source === 'stub';

  // Group stars by magnitude band and tint so a 500-star chart is 15 <g> elements, not 500 fills.
  const groups: Array<Array<Array<readonly [number, number, number, number]>>> = [0, 1, 2].map(() =>
    TINTS.map(() => []),
  );
  for (const s of data.stars) groups[magGroup(s[2])][tintBucket(s[3])].push(s);

  const labels: LayerLabel[] = data.labels.map((l) =>
    CARDINAL.test(l.text) ? { ...l, kind: 'note', display: true, anchor: l.anchor ?? 'middle' } : l,
  );

  const lineStyle: CSSProperties = { stroke: 'rgb(var(--c-ink))', strokeOpacity: 0.25, strokeWidth: 0.75, fill: 'none' };

  const svg = (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="absolute inset-0 size-full"
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>
        {desc} {data.caption}.{note ? ` ${note}.` : ''}
      </desc>
      <g aria-hidden="true">
        {data.graticule && data.graticule.length > 0 && (
          <path d={data.graticule.join(' ')} style={{ stroke: 'var(--ink-contour)', fill: 'none', strokeWidth: 1 }}
            vectorEffect={NON_SCALING} />
        )}
        {data.horizon ? (
          <path d={data.horizon} style={{ stroke: 'rgb(var(--c-line-strong))', fill: 'none', strokeWidth: 1 }}
            vectorEffect={NON_SCALING} />
        ) : (
          stub && (
            <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.46}
              style={{ stroke: 'rgb(var(--c-line-strong))', fill: 'none', strokeWidth: 1 }} vectorEffect={NON_SCALING} />
          )
        )}
        {data.lines && data.lines.length > 0 && (
          <path d={data.lines.join(' ')} style={lineStyle} vectorEffect={NON_SCALING} />
        )}
        {groups.map((tints, g) => (
          <g key={g} data-mag-group={g}>
            {tints.map((stars, t) =>
              stars.length === 0 ? null : (
                <g key={t} style={{ fill: TINTS[t].fill }}>
                  {stars.map((s, i) => (
                    <circle key={i} cx={r1(s[0])} cy={r1(s[1])} r={r1(s[2])} />
                  ))}
                </g>
              ),
            )}
          </g>
        ))}
      </g>
    </svg>
  );

  const content = (
    <>
      {svg}
      {labels.length > 0 && (
        <OverlayBox w={w} h={h} aspect="meet" ariaHidden>
          <LabelLayer labels={labels} w={w} h={h} halo={halo} />
        </OverlayBox>
      )}
      {note && (
        <p
          aria-hidden="true"
          // clsx, not cn: tailwind-merge (unconfigured) treats `text-caption` as a colour and drops it.
          className={clsx(
            'pointer-events-none absolute font-body text-caption italic text-ink-muted',
            stub ? 'inset-x-3 top-1/2 -translate-y-1/2 text-center' : 'bottom-2 left-3',
          )}
        >
          {note}
        </p>
      )}
    </>
  );

  const rootClass = cn('relative aspect-[var(--chart-ar)] w-full overflow-hidden', className);
  const rootStyle = { '--chart-ar': `${w} / ${h}`, containerType: 'size' } as CSSVars;

  if (reveal === 'magnitude' && data.stars.length > 0) {
    return (
      <StarReveal className={rootClass} style={rootStyle}>
        {content}
      </StarReveal>
    );
  }
  return (
    <div className={rootClass} style={rootStyle}>
      {content}
    </div>
  );
}
