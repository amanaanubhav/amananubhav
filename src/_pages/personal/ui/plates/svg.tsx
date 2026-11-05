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

/**
 * Light-table roles (FINAL §4.3.5, Palette 1.1): flows (an air path, a trajectory, a fish's line) in `accent-2`, the
 * live step (the ignition point, the nucleus, the found asteroid) in `action`, hatching in ink at `alpha-edge`. No
 * oxblood or red inside the Early builds plates; `ROUTE` stays for the road sheet.
 */
export const FLOW: CSSProperties = {
  stroke: 'var(--accent-2)',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** The live step: aquamarine `action`, 2 px. */
export const LIVE: CSSProperties = { ...FLOW, stroke: 'var(--action)' };

/** Heat hatching: ink at `alpha-edge`. */
export const HATCH: CSSProperties = { ...INK, stroke: 'rgb(var(--c-ink) / var(--alpha-edge))' };

/**
 * Water: rivers, the sea and their italic labels (a map convention, not an accent). Strokes take the map's
 * shoreline token (`map-lake-edge`: aqua, >= 3:1 on every ground in both themes; the lake fill `map-lake` is too
 * light for a 1 px line on Day paper); labels take `map-lake-text` (`WATER_LABEL`).
 */
export const WATER: CSSProperties = { ...INK, stroke: 'var(--map-lake-edge)' };

/** The italic label of a river or the sea (Literata, `map-lake-text`). */
export const WATER_LABEL = 'font-body italic fill-map-lake-text';

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
  /**
   * What `currentColor` (the INK line) is: `'accent'` (default, the road sheet) or `'ink'` (the Early builds plates,
   * where structure is ink and only the flows are violet).
   */
  tone?: 'accent' | 'ink';
  children: ReactNode;
}

/**
 * The root of every plate: `<svg role="img">` labelled by its own `<title>` and `<desc>`, ink as
 * `currentColor`, 13-unit type that reads at 13 px when the plate renders near its viewBox width.
 */
export function PlateSvg({ width, height, title, desc, className, tone = 'accent', children }: PlateSvgProps) {
  const id = useId();
  const titleId = `${id}-t`;
  const descId = `${id}-d`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={cn('block h-auto w-full', tone === 'ink' ? 'text-ink' : 'text-accent-2', className)}
      // 13 units by default; the light table sets --plate-fs per plate so labels read near 14 px at any width.
      style={{ fontSize: 'var(--plate-fs, 13px)' }}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{desc}</desc>
      {children}
    </svg>
  );
}
