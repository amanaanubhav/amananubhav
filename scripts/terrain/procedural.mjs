// Seeded procedural relief (DESIGN-SPEC §C.5 fallback): mulberry32 + ridged fBm, constrained so the
// heights along each route match its waypoint altitudes and the valleys follow the route. Used only
// when Terrain Tiles cannot be fetched; the heightfield is then written with source 'procedural' and
// every sheet built from it carries the caption "Illustrative relief".
import { GRID } from './shared.mjs';

const KM_PER_DEG = 111.32;

/* ------------------------------------------------------------------------------------------------
 * Noise
 * --------------------------------------------------------------------------------------------- */

/** 2D value noise on a seeded 256-cell lattice, smoothstep-interpolated, in [0, 1]. */
function makeValueNoise(rand) {
  const perm = new Uint8Array(512);
  const values = new Float64Array(256);
  const order = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < 512; i += 1) perm[i] = order[i & 255];
  for (let i = 0; i < 256; i += 1) values[i] = rand();
  const lattice = (ix, iy) => values[perm[(perm[ix & 255] + iy) & 511] & 255];
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = fade(x - ix);
    const fy = fade(y - iy);
    const a = lattice(ix, iy);
    const b = lattice(ix + 1, iy);
    const c = lattice(ix, iy + 1);
    const d = lattice(ix + 1, iy + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };
}

/** Ridged multifractal (Musgrave): sharp crests, each octave weighted by the one before. In [0, 1]. */
function makeRidged(rand, { octaves = 6, lacunarity = 2.03, gain = 0.5 } = {}) {
  const layers = Array.from({ length: octaves }, () => ({
    noise: makeValueNoise(rand),
    dx: rand() * 1000,
    dy: rand() * 1000,
    angle: rand() * Math.PI * 2,
  }));
  let norm = 0;
  for (let o = 0, amp = 1; o < octaves; o += 1, amp *= gain) norm += amp;
  return (x, y) => {
    let sum = 0;
    let amp = 1;
    let freq = 1;
    let weight = 1;
    for (const layer of layers) {
      // Rotate each octave so lattice axes do not line up into visible grid artefacts.
      const c = Math.cos(layer.angle);
      const s = Math.sin(layer.angle);
      const px = (x * c - y * s) * freq + layer.dx;
      const py = (x * s + y * c) * freq + layer.dy;
      let r = 1 - Math.abs(layer.noise(px, py) * 2 - 1);
      r *= r;
      r *= weight;
      weight = Math.min(1, Math.max(0, r * 2));
      sum += r * amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  };
}

/* ------------------------------------------------------------------------------------------------
 * Geometry helpers (local kilometres around the region centre)
 * --------------------------------------------------------------------------------------------- */

function toKm(lon, lat, lat0) {
  return [lon * KM_PER_DEG * Math.cos((lat0 * Math.PI) / 180), lat * KM_PER_DEG];
}

/** Nearest point on segment ab to p: { d2, t }. */
function nearestOnSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2)) : 0;
  const qx = ax + vx * t;
  const qy = ay + vy * t;
  return { d2: (px - qx) ** 2 + (py - qy) ** 2, t, cross: vx * (py - ay) - vy * (px - ax) };
}

/** Heights above the knee saturate smoothly toward knee + span (keeps summits plausible). */
function softCap(h, knee, span) {
  return h <= knee ? h : knee + span * Math.tanh((h - knee) / span);
}

/** Fills missing waypoint altitudes by linear interpolation along the route (ends copy their neighbour). */
function fillAltitudes(points) {
  const out = points.map((p) => ({ ...p }));
  const known = out.map((p, i) => (typeof p.altitudeM === 'number' ? i : -1)).filter((i) => i >= 0);
  if (known.length === 0) throw new Error('route has no altitudes');
  for (let i = 0; i < out.length; i += 1) {
    if (typeof out[i].altitudeM === 'number') continue;
    const before = known.filter((k) => k < i).pop();
    const after = known.find((k) => k > i);
    if (before === undefined) out[i].altitudeM = out[after].altitudeM;
    else if (after === undefined) out[i].altitudeM = out[before].altitudeM;
    else {
      const t = (i - before) / (after - before);
      out[i].altitudeM = out[before].altitudeM + (out[after].altitudeM - out[before].altitudeM) * t;
    }
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Generators
 * --------------------------------------------------------------------------------------------- */

/**
 * Valley mode: every route is a valley floor whose height is the waypoint altitude interpolated
 * along the route; the walls rise away from it with ridged texture. Heights on the route equal the
 * waypoint altitudes (rise(0) = 0).
 *
 * @param {{ bbox: number[]; seed: number; rand: () => number; routes: { lon: number; lat: number; altitudeM?: number }[][];
 *           wallM?: number; wallKm?: number; peaksM?: number; featureKm?: number; capKneeM?: number; capSpanM?: number }} opts
 */
export function valleyField(opts) {
  const { bbox, rand, wallM = 2600, wallKm = 2.5, peaksM = 1900, featureKm = 9, capKneeM = 6600, capSpanM = 1500 } = opts;
  const [west, south, east, north] = bbox;
  const lat0 = (south + north) / 2;
  const ridged = makeRidged(rand);
  const texture = makeRidged(rand, { octaves: 4 });
  const segments = [];
  for (const route of opts.routes) {
    const pts = fillAltitudes(route.filter((p) => typeof p.lon === 'number' && typeof p.lat === 'number'));
    for (let i = 0; i + 1 < pts.length; i += 1) {
      const [ax, ay] = toKm(pts[i].lon, pts[i].lat, lat0);
      const [bx, by] = toKm(pts[i + 1].lon, pts[i + 1].lat, lat0);
      segments.push({ ax, ay, bx, by, ha: pts[i].altitudeM, hb: pts[i + 1].altitudeM });
    }
    if (pts.length === 1) {
      const [ax, ay] = toKm(pts[0].lon, pts[0].lat, lat0);
      segments.push({ ax, ay, bx: ax, by: ay, ha: pts[0].altitudeM, hb: pts[0].altitudeM });
    }
  }
  // Far from every route the floor relaxes toward the routes' mean altitude, so distant ground does
  // not fan out from the nearest route end.
  const mean = segments.reduce((sum, sg) => sum + (sg.ha + sg.hb) / 2, 0) / Math.max(1, segments.length);
  const heights = new Float64Array(GRID * GRID);
  for (let j = 0; j < GRID; j += 1) {
    const lat = north - ((north - south) * j) / (GRID - 1);
    for (let i = 0; i < GRID; i += 1) {
      const lon = west + ((east - west) * i) / (GRID - 1);
      const [px, py] = toKm(lon, lat, lat0);
      let best = { d2: Infinity, h: 0 };
      for (const s of segments) {
        const q = nearestOnSegment(px, py, s.ax, s.ay, s.bx, s.by);
        if (q.d2 < best.d2) best = { d2: q.d2, h: s.ha + (s.hb - s.ha) * q.t };
      }
      const d = Math.sqrt(best.d2);
      const nx = px / featureKm;
      const ny = py / featureKm;
      // U-shaped valley: flat near the floor (so grid samples beside the route stay at its altitude),
      // steepening into the walls.
      const wall = wallM * (1 - Math.exp(-((d / wallKm) ** 1.8))) * (0.55 + 0.9 * texture(nx * 1.7, ny * 1.7));
      const ramp = Math.min(1, d / (wallKm * 3));
      const peaks = peaksM * ridged(nx, ny) * ramp * ramp * (3 - 2 * ramp);
      const floor = best.h + (mean - best.h) * (1 - Math.exp(-((d / 12) ** 2)));
      heights[j * GRID + i] = softCap(floor + wall + peaks, capKneeM, capSpanM);
    }
  }
  return heights;
}

/**
 * Crest mode (the atlas): a hand-set Great Himalaya crest polyline (west to east). South of it the
 * relief falls through the middle hills and the Siwaliks to the plains; north of it lies the
 * plateau. Ridged texture scales with the local height; peaks cluster on the crest.
 *
 * @param {{ bbox: number[]; rand: () => number; crest: readonly (readonly [number, number])[] }} opts
 */
export function crestField(opts) {
  const { bbox, rand, crest } = opts;
  const [west, south, east, north] = bbox;
  const lat0 = (south + north) / 2;
  const ridged = makeRidged(rand);
  const hills = makeRidged(rand, { octaves: 5 });
  const line = crest.map(([lon, lat]) => toKm(lon, lat, lat0));
  const heights = new Float64Array(GRID * GRID);
  for (let j = 0; j < GRID; j += 1) {
    const lat = north - ((north - south) * j) / (GRID - 1);
    for (let i = 0; i < GRID; i += 1) {
      const lon = west + ((east - west) * i) / (GRID - 1);
      const [px, py] = toKm(lon, lat, lat0);
      let best = { d2: Infinity, cross: 0 };
      for (let k = 0; k + 1 < line.length; k += 1) {
        const q = nearestOnSegment(px, py, line[k][0], line[k][1], line[k + 1][0], line[k + 1][1]);
        if (q.d2 < best.d2) best = q;
      }
      // West-to-east crest: positive cross product = left of travel = north.
      const s = Math.sqrt(best.d2) * (best.cross >= 0 ? 1 : -1);
      const nx = px / 60;
      const ny = py / 60;
      let h;
      if (s < 0) {
        const a = -s;
        h = 150 + 6200 * Math.exp(-a / 38);
        h += h * 0.45 * (hills(nx * 1.6, ny * 1.6) - 0.35);
      } else {
        h = 4700 + 1500 * Math.exp(-s / 25);
        h += 900 * (hills(nx * 1.3, ny * 1.3) - 0.4);
      }
      h += 2400 * ridged(nx * 2.2, ny * 2.2) * Math.exp(-((s / 22) ** 2));
      heights[j * GRID + i] = Math.max(0, softCap(h, 7000, 1700));
    }
  }
  return heights;
}

/** The Great Himalaya crest, west to east, hand-set from the main summits (lon, lat). */
export const HIMALAYA_CREST = [
  [73.5, 34.4],
  [75.0, 33.7],
  [76.4, 32.8],
  [77.4, 32.25],
  [78.5, 31.35],
  [79.4, 30.75],
  [80.5, 30.25],
  [81.6, 29.85],
  [82.7, 29.35],
  [83.6, 28.7],
  [84.6, 28.5],
  [85.6, 28.2],
  [86.9, 27.98],
  [88.15, 27.7],
  [89.2, 27.95],
  [90.6, 28.05],
];
