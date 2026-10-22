// Real skylines for the preloader's far layer, ray-marched from a waypoint over the site's own heightfield
// (public/data/terrain/annapurna-story.bin: 257 x 257 little-endian Uint16 metres, rows north to south).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const meta = JSON.parse(readFileSync(join(ROOT, 'public/data/terrain/annapurna-story.json'), 'utf8'));
const buf = readFileSync(join(ROOT, 'public/data/terrain/annapurna-story.bin'));
const N = meta.cols;
const hAt = (i, j) => buf.readUInt16LE(2 * (Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))));
const [W, S, E, Nn] = meta.bbox;

function height(lat, lon) {
  const fx = ((lon - W) / (E - W)) * (N - 1), fy = ((Nn - lat) / (Nn - S)) * (N - 1);
  if (fx < 0 || fy < 0 || fx > N - 1 || fy > N - 1) return null;
  const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
  const a = hAt(i, j), b = hAt(i + 1, j), c = hAt(i, j + 1), d = hAt(i + 1, j + 1);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

/**
 * Skyline seen from `view` between azimuths (deg clockwise from north), for terrain between dMin and dMax km.
 * Returns per sample: sky (elevation angle of the skyline, deg), rock (the highest visible terrain below the
 * snowline, deg; equal to sky where the skyline itself is below it) and elev (metres at the skyline point).
 */
export function pano({ lat, lon, alt }, az0, az1, n, dMin, dMax, snowM = 5000) {
  const out = []; const R = 6371 / (1 - 0.13); const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
  for (let s = 0; s < n; s++) {
    const az = ((az0 + ((az1 - az0) * s) / (n - 1)) * Math.PI) / 180;
    let max = -90, sky = -90, rock = -90, elev = 0, allSky = -90, allElev = 0, allRock = -90;
    for (let d = 0.2; d <= dMax; d += d < 4 ? 0.08 : 0.16) {
      const h = height(lat + (d * Math.cos(az)) / 111.0, lon + (d * Math.sin(az)) / kx);
      if (h === null) break;
      const ang = (Math.atan2(h - alt - (d * d) / (2 * R) * 1000, d * 1000) * 180) / Math.PI;
      if (ang >= max) {
        max = ang; allSky = ang; allElev = h; if (h < snowM) allRock = ang;
        if (d >= dMin) { sky = ang; elev = h; if (h < snowM) rock = ang; }
      }
    }
    if (sky === -90) { sky = allSky; elev = allElev; rock = allRock; }
    if (rock === -90) rock = sky - 0.6;
    out.push({ sky, rock: Math.min(rock, sky), elev });
  }
  return out;
}

/** Maps a panorama to layer units: x across [0, Wd], skyline into [yTop, yLow] by the given percentile span. */
export function toLayer(p, Wd, yTop, yLow, exag = 1) {
  const sorted = p.map((q) => q.sky).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.04)], hi = sorted[sorted.length - 1];
  const k = ((yLow - yTop) / (hi - lo)) * exag;
  const y = (a) => yLow - (a - lo) * k;
  return p.map((q, i) => ({
    x: (Wd * i) / (p.length - 1),
    y: y(q.sky),
    yr: Math.max(y(q.sky), y(q.rock)),
    elev: q.elev,
  }));
}
