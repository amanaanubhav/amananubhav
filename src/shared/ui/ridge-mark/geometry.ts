/*
 * The signature mark's geometry: the Alpenglow ridge (an altitude profile) with a trekker standing on its
 * summit. One source for the site's mark (RidgeMark), the AI terminal's Alpenglow cue and the brand script
 * (scripts/brand reads this file with Node's type stripping, so it stays import-free and erasable-only TS).
 *
 * The mark is a 48 × 24 box (2:1). The ridge is drawn in its own 48 × 16 frame and sits RIDGE_OFFSET_Y lower;
 * the trekker is drawn on a half-unit grid (1 unit = 1 px when the mark is 48 px tall) with its origin at the
 * top centre, placed at (TREKKER_X, 0) at half scale, so its edges fall on whole pixels at 24, 48, 72, 96 px.
 */

/** The ridge alone, in a 48 × 16 frame. The summit is at (23, 2.5). */
export const RIDGE_PATH = 'M1.5 14.2 6.5 10.6l3 1.6 5-5.2 3.2 1.7 5.3-6.2 3.9 4.8 3.2-1.9 4.8 5.6 3.4-1.5 5.7 4.5';
export const RIDGE_SUMMIT = { x: 23, y: 2.5 } as const;
/** The ridge's first point (its left foot), in the 48 × 16 frame. */
export const RIDGE_START = { x: 1.5, y: 14.2 } as const;

export const MARK_WIDTH = 48;
export const MARK_HEIGHT = 24;
export const MARK_VIEWBOX = `0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`;
/** How far the ridge frame sits below the top of the mark (room for the trekker above the summit). */
export const RIDGE_OFFSET_Y = 8.75;
/** The trekker group's placement in the mark: `translate(TREKKER_X 0) scale(TREKKER_SCALE)`. */
export const TREKKER_X = RIDGE_SUMMIT.x;
export const TREKKER_SCALE = 0.5;
export const TREKKER_TRANSFORM = `translate(${TREKKER_X} 0) scale(${TREKKER_SCALE})`;

export interface TrekkerFigure {
  /** Head (a detached circle, pictogram style). */
  readonly head: { readonly cx: number; readonly cy: number; readonly r: number };
  /** Filled shapes: t-shirt with short sleeves, trekking shorts (or the merged body of the small figure). */
  readonly body: string;
  /** Arms and legs as round-capped strokes; absent on the small figure, whose legs are part of `body`. */
  readonly limbs?: { readonly d: string; readonly width: number };
}

/**
 * The trekker (from 28 px): broad shoulders tapering to the waist, a fitted t-shirt whose sleeves step out
 * from the arms, shorts with a short inseam, legs astride the summit (one foot on each slope).
 * 23 units tall: head 0-4, shirt 5-11, shorts 12-15, feet at about 23.
 */
export const TREKKER: TrekkerFigure = {
  head: { cx: 0, cy: 2, r: 2 },
  body:
    'M-1.5 5-4 5.5Q-6 6-6 8V9.5H-4.5L-2.5 11H2.5L4.5 9.5H6V8Q6 6 4 5.5L1.5 5Z' +
    'M-3 12H3L3.5 15H.5L0 13.5-.5 15H-3.5Z',
  limbs: { d: 'M-4.9 9.8-5.2 13.5M4.9 9.8 5.2 13.5M-1.75 14.5-2.75 22.5M1.75 14.5 2.75 22.5', width: 1.5 },
};

/** The simplified trekker (below 28 px): a larger head, one tapered torso block, a notched wedge for the legs. */
export const TREKKER_SMALL: TrekkerFigure = {
  head: { cx: 0, cy: 2.2, r: 2.4 },
  body: 'M-6.5 5.6H6.5L4.25 12H-4.25ZM-3.5 12.9H3.5L3.9 23H1.7L0 16.5-1.7 23H-3.9Z',
};

/** Below this rendered height (px) the simplified trekker is drawn. */
export const SMALL_BELOW = 28;

/** Ridge stroke (mark units) for a rendered height: heavier when small so it survives pixel snapping. */
export function ridgeStroke(height: number): number {
  if (height < SMALL_BELOW) return 1.8;
  return height <= 48 ? 1.5 : 1.2;
}

export function trekkerFor(height: number): TrekkerFigure {
  return height < SMALL_BELOW ? TREKKER_SMALL : TREKKER;
}

/** The ridge alone, black, in the mark's 48 × 24 box, as a CSS `url()` for masks (the Alpenglow sweep). */
export function ridgeMaskUrl(stroke = 1.6): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${MARK_VIEWBOX}'>` +
    `<path d='${RIDGE_PATH}' transform='translate(0 ${RIDGE_OFFSET_Y})' fill='none' stroke='black' ` +
    `stroke-width='${stroke}' stroke-linejoin='round' stroke-linecap='round'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
