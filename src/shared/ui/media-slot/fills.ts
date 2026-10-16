/**
 * Deterministic SVG geometry for pending fills (G-16). Pure functions of the slot id, so the server,
 * the client and a Node check script all draw the same plate. Every fill stays under 2 KB of SVG:
 * contours at most 7 closed paths of 10 smoothed points, stars at most 90 dots as three `h0` paths.
 */
import { hashSeed, mulberry32 } from '@/shared/lib/random';

/** 1-decimal coordinates without trailing ".0". */
function n(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

export interface ContourGeometry {
  minor: string[];
  index: string[];
}

/**
 * Seeded procedural contours around one summit in a 100 x 100 box. All rings share one radial shape
 * (scaled by radius) and drift slowly off-centre, so they never cross, like a real hill.
 */
export function contourGeometry(seed: string): ContourGeometry {
  const rand = mulberry32(hashSeed(`contour:${seed}`));
  const cx = 28 + rand() * 44;
  const cy = 28 + rand() * 44;
  const a1 = 0.06 + rand() * 0.08;
  const a2 = 0.04 + rand() * 0.07;
  const a3 = 0.02 + rand() * 0.04;
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;
  const driftAngle = rand() * Math.PI * 2;
  const drift = 1.2 + rand() * 1.3;
  const shape = (t: number) => a1 * Math.sin(t + p1) + a2 * Math.sin(2 * t + p2) + a3 * Math.sin(3 * t + p3);

  const POINTS = 10;
  const RINGS = 7;
  const minor: string[] = [];
  const index: string[] = [];
  for (let k = 0; k < RINGS; k += 1) {
    const radius = 8 + k * 11;
    const ox = cx + Math.cos(driftAngle) * drift * k;
    const oy = cy + Math.sin(driftAngle) * drift * k;
    const pts: [number, number][] = [];
    for (let i = 0; i < POINTS; i += 1) {
      const t = (i / POINTS) * Math.PI * 2;
      const r = radius * (1 + shape(t));
      pts.push([ox + Math.cos(t) * r, oy + Math.sin(t) * r]);
    }
    const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = mid(pts[POINTS - 1], pts[0]);
    let d = `M${n(start[0])} ${n(start[1])}`;
    for (let i = 0; i < POINTS; i += 1) {
      const p = pts[i];
      const m = mid(p, pts[(i + 1) % POINTS]);
      d += `Q${n(p[0])} ${n(p[1])} ${n(m[0])} ${n(m[1])}`;
    }
    d += 'Z';
    (k === 3 ? index : minor).push(d);
  }
  return { minor, index };
}

/** Seeded star field in a 100 x 100 box: three magnitude groups drawn as round-capped zero-length segments. */
export function starGeometry(seed: string): { faint: string; mid: string; bright: string } {
  const rand = mulberry32(hashSeed(`stars:${seed}`));
  let faint = '';
  let mid = '';
  let bright = '';
  const COUNT = 90;
  for (let i = 0; i < COUNT; i += 1) {
    const seg = `M${n(rand() * 100)} ${n(rand() * 100)}h0`;
    const m = rand();
    if (m < 0.62) faint += seg;
    else if (m < 0.9) mid += seg;
    else bright += seg;
  }
  return { faint, mid, bright };
}

/** Rule-of-thirds framing guide with a centre registration cross (portrait and social-card slots). */
export function gridGeometry(): { thirds: string; cross: string } {
  return {
    thirds: 'M33.3 0V100M66.7 0V100M0 33.3H100M0 66.7H100',
    cross: 'M50 44V56M44 50H56',
  };
}

/** Seeded surf lines: six gentle swells across a 100 x 100 box. */
export function waveGeometry(seed: string): string[] {
  const rand = mulberry32(hashSeed(`wave:${seed}`));
  const lines: string[] = [];
  const phase = rand() * 6;
  for (let k = 0; k < 6; k += 1) {
    const y = 34 + k * 8 + rand() * 2;
    const amp = 1.4 + k * 0.45 + rand() * 0.6;
    const step = 7 + rand() * 3;
    let d = `M${n(-phase)} ${n(y)}Q${n(-phase + step / 2)} ${n(y - amp)} ${n(-phase + step)} ${n(y)}`;
    for (let x = -phase + step * 2; x <= 100 + step; x += step) d += `T${n(x)} ${n(y)}`;
    lines.push(d);
  }
  return lines;
}

/** A 9:16 film frame (90 x 160 box) with sprocket holes down both edges and a play mark. */
export function filmGeometry(): { frame: string; sprockets: string; play: string } {
  let sprockets = '';
  for (let y = 8; y < 152; y += 12) sprockets += `M4 ${y}h6v6h-6zM80 ${y}h6v6h-6z`;
  return {
    frame: 'M16 6H74V154H16Z',
    sprockets,
    play: 'M39 70 54 80 39 90Z',
  };
}
