// G-04a winter sky chart and G-04b sky poster, from d3-celestial's stars.6.json and
// constellations.lines.json (BSD-3-Clause), for the observer of SKY_OBSERVER (25° N 85° E) on
// Jan 15 at 21:00 IST. Positional maths comes from src/shared/lib/astro (loaded by type stripping).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, importSource } from '../terrain/shared.mjs';
import { polylinesToPath, r1 } from './geometry.mjs';
import { GENERATED_HEADER, toTs } from './ts-writer.mjs';

const DEG = Math.PI / 180;
/** Jan 15, 21:00 IST (15:30 UTC). The charts are "tonight-agnostic": one fixed winter evening. */
const CHART_TIME = new Date(Date.UTC(2026, 0, 15, 15, 30, 0));
const MAG_BRIGHTEST = -1.46;

const tintFromBv = (bv) => r1(Math.max(-1, Math.min(1, (bv - 0.6) / 0.9)));
/** Radius by magnitude, perceptually eased: rMax for Sirius, rMin at the chart's limit. */
const radiusFor = (mag, limit, rMin, rMax) => {
  const t = Math.max(0, Math.min(1, (limit - mag) / (limit - MAG_BRIGHTEST))) ** 1.25;
  return r1(rMin + (rMax - rMin) * t);
};

function loadCatalogue() {
  const dataDir = join(ROOT, 'node_modules', 'd3-celestial', 'data');
  const stars = JSON.parse(readFileSync(join(dataDir, 'stars.6.json'), 'utf8')).features.map((f) => ({
    ra: (((f.geometry.coordinates[0] % 360) + 360) % 360) * DEG,
    dec: f.geometry.coordinates[1] * DEG,
    mag: Number(f.properties.mag),
    bv: Number.isFinite(Number.parseFloat(f.properties.bv)) ? Number.parseFloat(f.properties.bv) : 0.6,
  }));
  const lines = JSON.parse(readFileSync(join(dataDir, 'constellations.lines.json'), 'utf8')).features.map((f) => ({
    id: f.id,
    strings: f.geometry.coordinates.map((ls) => ls.map(([lon, lat]) => [(((lon % 360) + 360) % 360) * DEG, lat * DEG])),
  }));
  return { stars: stars.sort((a, b) => a.mag - b.mag), lines };
}

/** Splits a projected string into visible runs; `visible(p)` decides per point. */
function visibleRuns(points, visible) {
  const runs = [];
  let run = [];
  for (const p of points) {
    if (p && visible(p)) run.push(p.xy);
    else {
      if (run.length >= 2) runs.push({ points: run, closed: false });
      run = [];
    }
  }
  if (run.length >= 2) runs.push({ points: run, closed: false });
  return runs;
}

/** Keeps label candidates at least `gap` apart, brightest first. */
function spacedLabels(candidates, gap, max) {
  const kept = [];
  for (const c of candidates) {
    if (kept.length >= max) break;
    if (kept.every((k) => Math.hypot(k.x - c.x, k.y - c.y) >= gap)) kept.push(c);
  }
  return kept;
}

export async function buildSkyModule() {
  const astro = await importSource('src/shared/lib/astro/astro.ts');
  const { SKY_OBSERVER, BRIGHT_STARS, localSiderealTime, equatorialToHorizontal } = astro;
  const lst = localSiderealTime(CHART_TIME, SKY_OBSERVER.lonDeg);
  const lat = SKY_OBSERVER.latDeg * DEG;
  const horizontal = (ra, dec) => {
    const { altRad, azRad } = equatorialToHorizontal(ra, dec, lst, lat);
    return { alt: altRad, az: azRad };
  };
  const catalogue = loadCatalogue();

  /* ---------------------------------------------------------------- G-04a winter sky (200 x 200) */
  const W = 200;
  const C = 100;
  const R = 92;
  // Stereographic, zenith-centred; seen from below, east is on the left.
  const zenithXY = ({ alt, az }) => {
    const r = R * Math.tan((Math.PI / 2 - alt) / 2);
    return [C - r * Math.sin(az), C - r * Math.cos(az)];
  };
  const winterStars = [];
  for (const s of catalogue.stars) {
    if (s.mag > 4.0) break;
    const h = horizontal(s.ra, s.dec);
    if (h.alt <= 0) continue;
    const [x, y] = zenithXY(h);
    winterStars.push([r1(x), r1(y), radiusFor(s.mag, 4.0, 0.6, 3.2), tintFromBv(s.bv)]);
  }
  const winterLines = [];
  for (const c of catalogue.lines) {
    const runs = c.strings.flatMap((ls) =>
      visibleRuns(ls.map(([ra, dec]) => {
        const h = horizontal(ra, dec);
        return { alt: h.alt, xy: zenithXY(h) };
      }), (p) => p.alt > 0),
    );
    const d = polylinesToPath(runs);
    if (d) winterLines.push(d);
  }
  const winterNames = spacedLabels(
    BRIGHT_STARS.map((s) => ({ s, h: horizontal(s.raDeg * DEG, s.decDeg * DEG) }))
      .filter(({ h }) => h.alt >= 20 * DEG)
      .map(({ s, h }) => {
        const [x, y] = zenithXY(h);
        return { x: r1(x + 5), y: r1(y), text: s.name, kind: 'area', anchor: 'start', priority: 2 };
      }),
    40,
    3,
  );
  const winter = {
    id: 'winter-sky',
    viewBox: [W, W],
    stars: winterStars,
    lines: winterLines,
    horizon: `M${C - R} ${C}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`,
    graticule: [],
    labels: [
      { x: 100, y: 7, text: 'N', kind: 'note', anchor: 'middle', priority: 1 },
      { x: 193, y: 100, text: 'W', kind: 'note', anchor: 'middle', priority: 1 },
      { x: 100, y: 193, text: 'S', kind: 'note', anchor: 'middle', priority: 1 },
      { x: 7, y: 100, text: 'E', kind: 'note', anchor: 'middle', priority: 1 },
      ...winterNames,
    ],
    source: 'catalogue',
    caption: '25° N, January, 21:00 IST',
  };

  /* ------------------------------------------------------- G-04b sky poster (960 x 600, 16:10) */
  // A stereographic window looking south (az 180°) centred 35° up, scaled so the southern horizon
  // sits at y 540 and the top edge reaches 80° altitude. West is on the right, as seen from the ground.
  const PW = 960;
  const PH = 600;
  const A0 = 35 * DEG;
  const TOP = 80 * DEG;
  const K = 540 / (2 * (Math.tan(A0 / 2) + Math.tan((TOP - A0) / 2)));
  const CY = 2 * K * Math.tan((TOP - A0) / 2);
  const center = [0, -Math.cos(A0), Math.sin(A0)]; // east, north, up
  const up = [0, Math.sin(A0), Math.cos(A0)];
  const right = [-1, 0, 0]; // facing south, west is on the right
  const windowXY = ({ alt, az }) => {
    const v = [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)];
    const dot = (a) => a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
    const denom = 1 + dot(center);
    if (denom < 1e-3) return null;
    return [PW / 2 + (2 * K * dot(right)) / denom, CY - (2 * K * dot(up)) / denom];
  };
  const inFrame = ([x, y], m = 0) => x >= -m && x <= PW + m && y >= -m && y <= PH + m;
  const posterStars = [];
  for (const s of catalogue.stars) {
    if (s.mag > 4.5) break;
    const h = horizontal(s.ra, s.dec);
    if (h.alt <= 0) continue;
    const xy = windowXY(h);
    if (!xy || !inFrame(xy, 4)) continue;
    posterStars.push([r1(xy[0]), r1(xy[1]), radiusFor(s.mag, 4.5, 0.7, 4), tintFromBv(s.bv)]);
  }
  const posterLines = [];
  for (const c of catalogue.lines) {
    const runs = c.strings.flatMap((ls) =>
      visibleRuns(ls.map(([ra, dec]) => {
        const h = horizontal(ra, dec);
        const xy = windowXY(h);
        return xy ? { alt: h.alt, xy } : null;
      }), (p) => p.alt > 0 && inFrame(p.xy, 40)),
    );
    const d = polylinesToPath(runs);
    if (d) posterLines.push(d);
  }
  const altitudeCircle = (altDeg) =>
    polylinesToPath(
      visibleRuns(
        Array.from({ length: 181 }, (_, i) => {
          const xy = windowXY({ alt: altDeg * DEG, az: i * 2 * DEG });
          return xy ? { xy } : null;
        }),
        (p) => inFrame(p.xy, 20),
      ),
    );
  const horizonD = altitudeCircle(0);
  const graticule = [15, 30, 45, 60, 75].map(altitudeCircle).filter(Boolean);
  const compass = [
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
  ]
    .map(([az, text]) => {
      const xy = windowXY({ alt: 0, az: az * DEG });
      return xy && inFrame(xy) && xy[1] + 26 < PH - 8
        ? { x: r1(xy[0]), y: r1(xy[1] + 26), text, kind: 'note', anchor: 'middle', priority: 1 }
        : null;
    })
    .filter(Boolean);
  const posterNames = spacedLabels(
    BRIGHT_STARS.map((s) => ({ s, h: horizontal(s.raDeg * DEG, s.decDeg * DEG) }))
      .filter(({ h }) => h.alt >= 3 * DEG)
      .map(({ s, h }) => ({ s, xy: windowXY(h) }))
      .filter(({ xy }) => xy && xy[0] >= 40 && xy[0] <= PW - 120 && xy[1] >= 30 && xy[1] <= PH - 70)
      .map(({ s, xy }) => ({ x: r1(xy[0] + 9), y: r1(xy[1]), text: s.name, kind: 'area', anchor: 'start', priority: 2 })),
    90,
    6,
  );
  const poster = {
    id: 'sky-poster',
    viewBox: [PW, PH],
    stars: posterStars,
    lines: posterLines,
    horizon: horizonD,
    graticule,
    labels: [...compass, ...posterNames],
    source: 'catalogue',
    caption: '25° N, looking south, January, 21:00 IST',
  };

  const text = [
    GENERATED_HEADER,
    "import type { StarChartData } from '@/shared/ui/map';",
    '',
    '/**',
    ' * G-04a: the winter sky at 25° N 85° E (Jan 15, 21:00 IST), stereographic, zenith-centred, 1:1.',
    ' * viewBox in CSS px of the 200 px inset, so star radii (0.6 to 3.2) read as pixels. Stars to',
    ' * magnitude 4.0 above the horizon, tinted by B-V; faint constellation lines. Seen from below, east is',
    ' * on the left of a sky chart. Data: d3-celestial (BSD-3-Clause), from the Hipparcos catalogue.',
    ' */',
    `export const WINTER_SKY: StarChartData = ${toTs(winter)};`,
    '',
    '/**',
    ' * G-04b: the `#sky` poster (pre-live and tier-0), a 16:10 window looking south at 21:00 IST',
    ' * (Jan 15): stereographic, centred 35° up, horizon at y 540, top edge at 80°. Stars to magnitude 4.5',
    ' * above the horizon only, the horizon line and altitude circles every 15°.',
    ' */',
    `export const SKY_POSTER: StarChartData = ${toTs(poster)};`,
    '',
  ].join('\n');
  return { text, winter, poster };
}
