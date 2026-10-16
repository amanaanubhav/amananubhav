import { useId, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Shared drawing kit for the /personal diagram plates (G-06, G-10).
 * Theme-aware only: ink is `currentColor` (the root carries `text-ink`), everything else is a CSS
 * variable from tokens.css. No hex, no baked colors; strokes never scale with the plate.
 */

/** One decimal, the precision every generated coordinate is written at. */
export const r1 = (v: number): number => Math.round(v * 10) / 10;

/** Formats a coordinate pair for path data, one decimal, no trailing zeros. */
export const pt = (x: number, y: number): string => `${r1(x)} ${r1(y)}`;

/** A polyline as path data (`M x y L x y ...`). */
export function polyline(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${pt(x, y)}`).join('');
}

/** Strokes keep their on-screen width whatever the plate's rendered size. */
export const NS = 'non-scaling-stroke' as const;

/** Ink line (currentColor). */
export const INK: CSSProperties = { stroke: 'currentColor', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

/** Secondary ink: leaders, axes, furniture. */
export const MUTED: CSSProperties = { ...INK, stroke: 'var(--ink-muted)' };

/** Faint ink: hatching, gridlines, minor flow lines (the contour ink of §B.1). */
export const FAINT: CSSProperties = { ...INK, stroke: 'var(--ink-contour)' };

/** Index-contour ink: one step heavier than FAINT. */
export const FAINT_INDEX: CSSProperties = { ...INK, stroke: 'var(--ink-contour-index)' };

/** The route pact (§B.1 rule 2): the one highlighted path of a plate, 2 px, round caps. */
export const ROUTE: CSSProperties = {
  stroke: 'var(--signal-line)',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Water: rivers, the sea and their italic labels (a map convention, not an accent). */
export const WATER: CSSProperties = { ...INK, stroke: 'var(--water)' };

/** Label classes (§B.4.3): built things in Archivo, natural features in Literata italic, data in Plex Mono. */
export const LABEL = 'font-display fill-current';
export const LABEL_MUTED = 'font-display fill-ink-muted';
export const NATURAL = 'font-body italic fill-ink-muted';
export const DATA = 'font-data tabular fill-ink-muted';

export interface PlateSvgProps {
  width: number;
  height: number;
  title: string;
  desc: string;
  className?: string;
  children: ReactNode;
}

/**
 * The root of every plate: `<svg role="img">` labelled by its own `<title>` and `<desc>`, ink as
 * `currentColor`, 13-unit type that reads at 13 px when the plate renders near its viewBox width.
 */
export function PlateSvg({ width, height, title, desc, className, children }: PlateSvgProps) {
  const id = useId();
  const titleId = `${id}-t`;
  const descId = `${id}-d`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={cn('block h-auto w-full text-ink', className)}
      fontSize={13}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{desc}</desc>
      {children}
    </svg>
  );
}
