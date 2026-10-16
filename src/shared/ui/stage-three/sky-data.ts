import { BRIGHT_STARS } from '@/shared/lib/astro';
import { mulberry32 } from '@/shared/lib/random';

/*
 * Star catalogue for the sky scene (§C.5, §G.8). `public/data/sky/stars.bin` is a Float32Array of
 * (RA rad, Dec rad, mag, B-V) per star, brightest first; `constellations.bin` holds segments as
 * (RA1, Dec1, RA2, Dec2) in radians. Fetched once per page load and cached in this module. When the
 * stars are missing the catalogue falls back to `BRIGHT_STARS` plus a seeded procedural field and is
 * flagged `illustrative` (the legend then reads "Illustrative sky").
 */

export interface StarCatalogue {
  /** (RA rad, Dec rad, mag, B-V) per star, brightest first. */
  readonly stars: Float32Array;
  readonly starCount: number;
  /** (RA1, Dec1, RA2, Dec2) per segment, or null when no lines are available. */
  readonly segments: Float32Array | null;
  readonly illustrative: boolean;
}

/** Tier 1 keeps this many of the brightest stars (§C.4). */
export const TIER1_STAR_LIMIT = 1200;
const ILLUSTRATIVE_FIELD = 1500;
const ILLUSTRATIVE_SEED = 25_085;

let catalogue: Promise<{ stars: Float32Array | null; segments: Float32Array | null }> | null = null;

async function fetchFloats(url: string, stride: number): Promise<Float32Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`sky: ${url} answered ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength % (stride * 4) !== 0) {
    throw new Error(`sky: ${url} is not a whole number of ${stride}-float records`);
  }
  const view = new DataView(buffer);
  const out = new Float32Array(buffer.byteLength / 4);
  for (let i = 0; i < out.length; i++) out[i] = view.getFloat32(i * 4, true);
  return out;
}

function sanitizeStars(raw: Float32Array): Float32Array | null {
  const out: number[] = [];
  for (let i = 0; i < raw.length; i += 4) {
    const [ra, dec, mag, bv] = [raw[i], raw[i + 1], raw[i + 2], raw[i + 3]];
    if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(mag)) continue;
    out.push(ra, dec, mag, Number.isFinite(bv) ? bv : 0.6);
  }
  return out.length > 0 ? Float32Array.from(out) : null;
}

function sanitizeSegments(raw: Float32Array): Float32Array | null {
  return raw.every(Number.isFinite) ? raw : null;
}

function fetchCatalogue() {
  if (!catalogue) {
    catalogue = Promise.all([
      fetchFloats('/data/sky/stars.bin', 4).then(sanitizeStars, () => null),
      fetchFloats('/data/sky/constellations.bin', 4).then(sanitizeSegments, () => null),
    ]).then(([stars, segments]) => ({ stars, segments }));
  }
  return catalogue;
}

/** BRIGHT_STARS plus a seeded field (mulberry32), sorted brightest first. */
function illustrativeStars(): Float32Array {
  const rand = mulberry32(ILLUSTRATIVE_SEED);
  const rows: [number, number, number, number][] = BRIGHT_STARS.map((s) => [
    (s.raDeg * Math.PI) / 180,
    (s.decDeg * Math.PI) / 180,
    s.mag,
    s.bv ?? 0.6,
  ]);
  for (let i = 0; i < ILLUSTRATIVE_FIELD; i++) {
    const ra = rand() * Math.PI * 2;
    const dec = Math.asin(rand() * 2 - 1);
    const mag = 5.5 - 3.6 * Math.pow(rand(), 4);
    const bv = -0.2 + 1.8 * rand() * rand();
    rows.push([ra, dec, mag, bv]);
  }
  rows.sort((a, b) => a[2] - b[2]);
  return Float32Array.from(rows.flat());
}

/** Loads (once) and returns the catalogue for a tier; never rejects. */
export async function loadStarCatalogue(tier: 1 | 2): Promise<StarCatalogue> {
  const { stars, segments } = await fetchCatalogue();
  const illustrative = stars === null;
  const all = stars ?? illustrativeStars();
  const limit = tier === 1 ? TIER1_STAR_LIMIT : 3000;
  const starCount = Math.min(all.length / 4, limit);
  return {
    stars: all.subarray(0, starCount * 4),
    starCount,
    segments: illustrative ? null : segments,
    illustrative,
  };
}
