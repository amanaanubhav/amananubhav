import { RIDGE_POINTS, RIDGE_SUMMIT_T, ridgeElevationAt } from '@/shared/ui/ridge-mark';

/*
 * The ridge under a Survey Ridge name, in the name's own units. Shared by the server's rest frame (RidgeName) and
 * the motion engine (ridge-field), so the frame the engine draws at rest is the frame the server drew.
 *
 * Vertical: em below the name's last baseline. The ridge band is RIDGE_BAND_EM tall; the summit sits SUMMIT_DROP_EM
 * under the baseline, so the trekker (TREKKER_EM tall) stands clear of the letters; the feet fall `amplitude` lower.
 * Horizontal: 0..1 across the band (the server draws in a stretched viewBox; the engine in px).
 */

/** Height of the ridge band under the last baseline (em). */
export const RIDGE_BAND_EM = 0.6;
/** Depth of the summit under the last baseline (em). */
export const SUMMIT_DROP_EM = 0.26;
/** The trekker's height (em). */
export const TREKKER_EM = 0.2;
/** The trekker's box, from the figure's viewBox (`-7 0 14 23.2`). */
export const TREKKER_VIEWBOX = '-7 0 14 23.2';
export const TREKKER_ASPECT = 14 / 23.2;

/** Ridge height from the feet to the summit (em) and the ground's lift under the pointer (em), per surface. */
export const RIDGE_AMPLITUDE_EM = { name: 0.28, sheet: 0.24 } as const;
export const RIDGE_LIFT_EM = { name: 0.12, sheet: 0.14 } as const;

/**
 * Half the width of the bronze cue around the summit, as a share of the band: half an em over the name's measured
 * em-width ("Anubhav" on two lines, "Aman Anubhav" on one line; Archivo 760, wdth 112, tracking -0.035 em).
 */
export const CUE_HALF_T = { stack: 0.5 / 4.62, line: 0.5 / 7.91 } as const;

const X0 = RIDGE_POINTS[0][0];
const SPAN = RIDGE_POINTS[RIDGE_POINTS.length - 1][0] - X0;

/** Where the ridge is sampled (0..1): 41 even steps and every vertex, so the stretched ridge keeps its corners. */
export const RIDGE_SAMPLES: readonly number[] = Array.from(
  new Set([...Array.from({ length: 41 }, (_, i) => i / 40), ...RIDGE_POINTS.map(([x]) => (x - X0) / SPAN)]),
).sort((a, b) => a - b);

const round = (v: number) => Number(v.toFixed(4));

/** The ridge's depth under the baseline at `t`, in em, at rest. */
export function restDepthEm(t: number, amplitude: number): number {
  return SUMMIT_DROP_EM + amplitude * (1 - ridgeElevationAt(t));
}

/** The sample positions inside (t0, t1), with both ends. */
export function samplesBetween(t0: number, t1: number): number[] {
  return [t0, ...RIDGE_SAMPLES.filter((t) => t > t0 && t < t1), t1];
}

/** The ridge at rest in the band's stretched viewBox (`0 0 1 RIDGE_BAND_EM`). */
export function restRidgePath(amplitude: number): string {
  return RIDGE_SAMPLES.map((t, i) => `${i ? 'L' : 'M'}${round(t)} ${round(restDepthEm(t, amplitude))}`).join('');
}

/** The bronze cue at rest: the stretch of ridge within `half` (a share of the band) of the summit. */
export function restCuePath(amplitude: number, half: number): string {
  return samplesBetween(RIDGE_SUMMIT_T - half, RIDGE_SUMMIT_T + half)
    .map((t, i) => `${i ? 'L' : 'M'}${round(t)} ${round(restDepthEm(t, amplitude))}`)
    .join('');
}
