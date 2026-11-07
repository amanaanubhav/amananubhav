// npm run gen:north-sheet  (next-trek NEXT-DESIGN §4: the #next static plan sheet)
//
// The calm static poster of the #next rest view, in the house's plan-sheet language: hypsometric band fills and
// index contours from the annapurna-north heightfield, the planned road (Muktinath, where the walked circuit ends, past
// Kagbeni, Jomsom and Marpha to Humkhola: the corridor and the jeep leg, one dashed line) and the expected
// foot route (Humkhola to Annapurna I Base Camp, North) from public/data/routes/anbc-expected.json, and the place
// points. It is what reduced motion, lite devices, no JavaScript and a failed 3D load see in #next.
//
// Writes src/_pages/home/ui/chapters/next/north-sheet.generated.ts (NORTH_SHEET, <= 32 KB). Coordinates are rounded
// to 1 decimal; the sheet climbs a coarsening ladder until it fits its cap. Nothing printed here is a credit, a
// source, a coordinate or a date: names, notes and label placement live in the section's own config (the shipped route
// file carries no sources or notes; the derivation lives in docs/redesign/next-trek/data/).
// Flags: --dry writes nothing (prints the size).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, TERRAIN_DIR, makeProjection, parseArgs, readHeightfield } from '../terrain/shared.mjs';
import { contourLayers, fitToCap } from './contour-sheet.mjs';
import { r1, simplify } from './geometry.mjs';
import { bandLayers } from './plan-sheet.mjs';
import { toTs, writeModule } from './ts-writer.mjs';

const args = parseArgs(process.argv.slice(2));
const dry = Boolean(args.dry);

/**
 * The sheet: Muktinath and Kagbeni in the north to Tatopani in the south, Kalopani in the west to Muktinath in the
 * east. The planned road from Muktinath (the owner, 2026-11-07: the route resumes there; fix2 verify P2) and the whole
 * foot route fit with a margin. About the old sheet's aspect (1000 x 1220), so the section's layout is unchanged.
 */
const SHEET = { bbox: [83.575, 28.475, 83.93, 28.865], lat0: 28.67, viewBox: [1000, 1252] };
/**
 * The corridor's places the sheet shows (kind `handoff` in the route file, 3D-only otherwise): Muktinath, where the
 * walked circuit ends and the planned road starts, and the two towns that name the corridor (names only).
 */
const SHEET_HANDOFF = { muktinath: 'circuit-end', kagbeni: 'road', jomsom: 'road' };
const CAP = 32 * 1000;
const OUT = join(ROOT, 'src/_pages/home/ui/chapters/next/north-sheet.generated.ts');
const ROUTE = join(ROOT, 'public/data/routes/anbc-expected.json');

/** Crops a heightfield to the samples that cover `bbox` (plus one sample), keeping the grid-centre convention. */
function crop(field, bbox) {
  const { cols, rows, bbox: fb } = field.meta;
  const [west, south, east, north] = fb;
  const dx = (east - west) / (cols - 1);
  const dy = (north - south) / (rows - 1);
  const i0 = Math.max(0, Math.floor((bbox[0] - west) / dx) - 1);
  const i1 = Math.min(cols - 1, Math.ceil((bbox[2] - west) / dx) + 1);
  const j0 = Math.max(0, Math.floor((north - bbox[3]) / dy) - 1);
  const j1 = Math.min(rows - 1, Math.ceil((north - bbox[1]) / dy) + 1);
  const c = i1 - i0 + 1;
  const r = j1 - j0 + 1;
  const heights = new Float64Array(c * r);
  for (let j = 0; j < r; j += 1) for (let i = 0; i < c; i += 1) heights[j * c + i] = field.heights[(j0 + j) * cols + i0 + i];
  return {
    meta: { ...field.meta, cols: c, rows: r, bbox: [west + i0 * dx, north - j1 * dy, west + i1 * dx, north - j0 * dy] },
    heights,
  };
}

/** Absolute M/L path (1 decimal) and its length, from [lon, lat, ...] points. */
function linePath(projection, points, tolerance) {
  const pts = simplify(points.map(([lon, lat]) => projection.project(lon, lat)), tolerance);
  let d = '';
  let length = 0;
  pts.forEach(([x, y], i) => {
    d += `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
    if (i) length += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
  });
  return { d, lengthPx: Math.round(length) };
}

const field = crop(readHeightfield(TERRAIN_DIR, 'annapurna-north'), SHEET.bbox);
const projection = makeProjection(SHEET);
const route = JSON.parse(readFileSync(ROUTE, 'utf8'));
const line = (id) => {
  const l = route.lines.find((x) => x.id === id);
  if (!l) throw new Error(`${ROUTE}: no line ${id}`);
  return l;
};

const [fx0, fy0] = projection.project(SHEET.bbox[0], SHEET.bbox[3]);
const [fx1, fy1] = projection.project(SHEET.bbox[2], SHEET.bbox[1]);
// The planned road: the corridor (from the walked line's last point) and the jeep leg, one line (they share Marpha).
const jeep = linePath(projection, [...line('corridor').points, ...line('jeep').points.slice(1)], 0.8);
const trek = linePath(projection, line('trek').points, 0.6);

// Places: position, kind and the commonly cited altitude (shown only where the route file says so, plus the summit).
const places = route.places
  .filter((p) => p.kind !== 'handoff' || SHEET_HANDOFF[p.id])
  .map((p) => {
    const [x, y] = projection.project(p.lon, p.lat);
    const alt = p.altM; // the route file ships only the shown altitudes (a summit's, or a place marked showAlt)
    const kind = SHEET_HANDOFF[p.id] ?? p.kind;
    return { id: p.id, kind, x: r1(x), y: r1(y), ...(typeof alt === 'number' ? { altitudeM: alt } : {}) };
  });
for (const p of places) {
  if (p.x < 0 || p.y < 0 || p.x > SHEET.viewBox[0] || p.y > SHEET.viewBox[1]) throw new Error(`${p.id} is off the sheet`);
}

const base = {
  id: 'annapurna-north',
  viewBox: SHEET.viewBox,
  frame: { x: r1(fx0), y: r1(fy0), w: r1(fx1 - fx0), h: r1(fy1 - fy0) },
  jeep,
  trek,
  places,
  scale: { x: 48, y: SHEET.viewBox[1] - 44, lengthPx: r1(5 * projection.pxPerKm), km: 5 },
  routes: [],
  labels: [],
  minor: [],
  water: [],
  source: field.meta.source === 'terrain-tiles' ? 'terrain-tiles' : 'procedural',
};

const head = [
  '/* GENERATED by scripts/posters/build-north-sheet.mjs (npm run gen:north-sheet) from public/data/. Do not edit. */',
  "import type { ContourSheetData } from '@/shared/ui/map';",
  '',
  '/** A place on the north sheet (viewBox units): kind from the route file, `altitudeM` only where it is shown. */',
  'export interface NorthSheetPlace {',
  '  readonly id: string;',
  "  readonly kind: 'circuit-end' | 'jeep-start' | 'road' | 'trailhead' | 'camp' | 'goal' | 'summit';",
  '  readonly x: number;',
  '  readonly y: number;',
  '  readonly altitudeM?: number;',
  '}',
  '',
  '/** The north plan sheet: a ContourSheetData (contours only) plus its band fills, the two lines and the places. */',
  'export interface NorthSheetData extends ContourSheetData {',
  '  readonly frame: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };',
  '  /** Areas at or above `m` metres, lowest first (paint in order, fill-rule evenodd); below the first: the frame. */',
  '  readonly bands: readonly { readonly m: number; readonly d: string }[];',
  '  /** The planned road, Muktinath past Marpha to Humkhola (approximate line). */',
  '  readonly jeep: { readonly d: string; readonly lengthPx: number };',
  '  /** The expected foot route, Humkhola to the base camp (approximate line). */',
  '  readonly trek: { readonly d: string; readonly lengthPx: number };',
  '  readonly places: readonly NorthSheetPlace[];',
  '  readonly scale: { readonly x: number; readonly y: number; readonly lengthPx: number; readonly km: number };',
  '}',
  '',
  '/**',
  ' * The #next static plan sheet (next-trek NEXT-DESIGN §4). Relief: heightfield annapurna-north.bin cropped to',
  ' * west 83.575, south 28.475, east 83.93, north 28.865; altitude bands and index contours every 500 m; equirectangular',
  ' * with cos(28.67°) x-scaling, fitted in a 1000 × 1252 viewBox. Lines: public/data/routes/anbc-expected.json, derived',
  ' * from the cited places and the terrain (least-cost paths), approximate. No credits, coordinates or dates.',
  ' */',
].join('\n');

const LADDER = [
  [1.2, 1.0, 16],
  [1.4, 1.3, 20],
  [1.6, 1.6, 26],
  [1.9, 2.0, 32],
  [2.2, 2.4, 40],
  [2.6, 2.8, 50],
].map(([sigma, tolerance, minLength]) => ({ sigma, tolerance, minLength }));

const keys = ['id', 'viewBox', 'frame', 'bands', 'minor', 'index', 'water', 'routes', 'labels', 'jeep', 'trek', 'places', 'scale', 'source'];
const result = fitToCap(
  (rung) => {
    const layers = contourLayers(field, projection, SHEET.viewBox, {
      minorStep: 500,
      indexStep: 500,
      sigma: rung.sigma,
      tolerance: rung.tolerance,
      minLength: rung.minLength,
      minSpacing: 0,
      indexMinSpacing: 3,
    });
    const bands = bandLayers(field, projection, { sigma: rung.sigma, tolerance: rung.tolerance * 1.4, minArea: rung.minLength * 4 });
    const data = { ...base, bands, index: layers.index };
    const ordered = Object.fromEntries(keys.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
    const text = `${head}\nexport const NORTH_SHEET: NorthSheetData = ${toTs(ordered)};\n`;
    return { text, bytes: Buffer.byteLength(text) };
  },
  LADDER,
  CAP,
);

console.log(`north-sheet: ${result.bytes} B (cap ${CAP}), rung sigma ${result.rung.sigma}, tolerance ${result.rung.tolerance}`);
if (!dry) writeModule(OUT, result.text);
