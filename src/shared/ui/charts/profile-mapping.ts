/**
 * The single mapping from waypoints to chart space, shared by the DOM `ElevationProfile` and the 3D
 * section curtain of the home relief (DESIGN-SPEC §D.2, §G.8). Pure and server-safe.
 */

export interface ProfilePoint {
  name: string;
  /** Points without `altitudeM` are skipped, never invented. */
  altitudeM?: number;
  distanceKm?: number;
  approx?: boolean;
  label?: boolean;
  kind?: 'trailhead' | 'camp' | 'village' | 'pass' | 'summit' | 'lake' | 'side-trip';
}

export type ProfileVariant = 'full' | 'compact' | 'strip' | 'cover' | 'preloader';

export interface ProfileBox {
  width: number;
  height: number;
  pad: { t: number; r: number; b: number; l: number };
}

/** The layout box of each variant, in SVG units. The 3D section curtain uses `PROFILE_BOX.full`. */
export const PROFILE_BOX: Readonly<Record<ProfileVariant, ProfileBox>> = {
  /**
   * 2:1, labelled axes, two label rows above the plot. Sized so its 14 to 15 px text renders at
   * 13 px or more from about 660 CSS px wide; narrower frames switch to a phone layout (DOM only).
   */
  full: { width: 720, height: 360, pad: { t: 72, r: 24, b: 44, l: 74 } },
  /** 2:1 at text-column width, one label row; 13 px text or more from about 500 CSS px wide. */
  compact: { width: 520, height: 260, pad: { t: 46, r: 16, b: 36, l: 70 } },
  /** 6:1 band, no text. */
  strip: { width: 960, height: 160, pad: { t: 14, r: 10, b: 12, l: 10 } },
  /** 3:2, fills a pending story-cover plate; the high point is named in the top band. */
  cover: { width: 600, height: 400, pad: { t: 112, r: 36, b: 44, l: 36 } },
  /** 4:1 line only, driven by `--profile-progress`. */
  preloader: { width: 480, height: 120, pad: { t: 10, r: 6, b: 10, l: 6 } },
};

/** Waypoints that carry an altitude, in route order. */
export function plottedPoints(points: readonly ProfilePoint[]): ProfilePoint[] {
  return points.filter((p) => typeof p.altitudeM === 'number' && Number.isFinite(p.altitudeM));
}

const ALT_STEP = 500;

/**
 * Maps plotted waypoints (those with `altitudeM`, in order) into `box`.
 *
 * - `x(i)`: `i` indexes the plotted waypoints; fractional `i` interpolates linearly between
 *   neighbours (the curtain samples between waypoints).
 * - `y(m)`: metres to SVG y (down is lower).
 * - `minM` / `maxM`: the plotted altitude range, rounded out to 500 m.
 * - `kx`: SVG units per km (`distance`) or per waypoint step (`even`); `ky`: SVG units per metre.
 * - `spacing`: `distance` when every plotted waypoint has `distanceKm` and the distances span a
 *   positive length, else `even`.
 */
export function profileMapping(
  points: readonly ProfilePoint[],
  box: { width: number; height: number; pad: { t: number; r: number; b: number; l: number } },
): {
  x: (i: number) => number;
  y: (m: number) => number;
  minM: number;
  maxM: number;
  kx: number;
  ky: number;
  spacing: 'distance' | 'even';
} {
  const plotted = plottedPoints(points);
  const innerW = Math.max(1, box.width - box.pad.l - box.pad.r);
  const innerH = Math.max(1, box.height - box.pad.t - box.pad.b);
  const n = plotted.length;

  const alts = plotted.map((p) => p.altitudeM as number);
  const lo = n > 0 ? Math.min(...alts) : 0;
  const hi = n > 0 ? Math.max(...alts) : ALT_STEP;
  let minM = Math.floor(lo / ALT_STEP) * ALT_STEP;
  let maxM = Math.ceil(hi / ALT_STEP) * ALT_STEP;
  // Keep a little ground under the lowest point and air over the highest one.
  if (lo - minM < ALT_STEP * 0.2) minM -= ALT_STEP;
  if (maxM - hi < ALT_STEP * 0.1) maxM += ALT_STEP;
  minM = Math.max(0, minM);
  if (maxM <= minM) maxM = minM + ALT_STEP;
  const ky = innerH / (maxM - minM);
  const y = (m: number) => box.pad.t + innerH - (m - minM) * ky;

  const distances = plotted.map((p) => p.distanceKm);
  const allDistances = n > 1 && distances.every((d) => typeof d === 'number' && Number.isFinite(d));
  const d0 = allDistances ? Math.min(...(distances as number[])) : 0;
  const d1 = allDistances ? Math.max(...(distances as number[])) : 0;
  const spacing: 'distance' | 'even' = allDistances && d1 > d0 ? 'distance' : 'even';

  let positions: number[];
  let kx: number;
  if (spacing === 'distance') {
    kx = innerW / (d1 - d0);
    positions = (distances as number[]).map((d) => box.pad.l + (d - d0) * kx);
  } else if (n > 1) {
    kx = innerW / (n - 1);
    positions = plotted.map((_, i) => box.pad.l + i * kx);
  } else {
    kx = innerW;
    positions = n === 1 ? [box.pad.l + innerW / 2] : [];
  }

  const x = (i: number) => {
    if (positions.length === 0) return box.pad.l;
    if (!Number.isFinite(i)) return positions[0];
    const c = Math.min(positions.length - 1, Math.max(0, i));
    const a = Math.floor(c);
    const b = Math.min(positions.length - 1, a + 1);
    return positions[a] + (positions[b] - positions[a]) * (c - a);
  };

  return { x, y, minM, maxM, kx, ky, spacing };
}
