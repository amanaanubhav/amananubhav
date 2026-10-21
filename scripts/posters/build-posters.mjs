// npm run gen:posters  (DESIGN-SPEC §C.5 data pipeline, §F G-01, G-03, G-04a, G-04b, G-09)
//
// Runs d3-contour on the heightfields in public/data/terrain and projects stars from d3-celestial, then
// regenerates the four generated modules with the export names and types of the wave-0 stubs:
//   src/_pages/home/config/plan-sheet.generated.ts      PLAN_SHEET            (≤ 60 KB; reads public/data/routes/annapurna-route.json)
//   src/_pages/home/config/garhwal-sheet.generated.ts   GARHWAL_SHEET         (≤ 30 KB)
//   src/_pages/stories/config/atlas.generated.ts        ATLAS_SHEET, ATLAS_BBOX, atlasPoint (≤ 60 KB)
//   src/_pages/personal/config/sky-charts.generated.ts  WINTER_SKY, SKY_POSTER (≤ 30 KB for the module)
// Coordinates are rounded to 1 decimal. Each sheet climbs a coarsening ladder until it fits its cap.
// Flags: --preview=<dir> also writes standalone SVG previews (fixed preview colours) for visual QA;
// --route=<file> reads another public route file; --terrain=<dir> reads heightfields from another folder (e.g. a procedural test run); --dry writes no modules.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { SHEETS, TERRAIN_DIR, ROOT, importSource, makeProjection, parseArgs, readHeightfield } from '../terrain/shared.mjs';
import { contourLayers, fitToCap } from './contour-sheet.mjs';
import { r1, routePath } from './geometry.mjs';
import { buildSkyModule } from './sky-charts.mjs';
import { previewSheetSvg, previewStarSvg } from './preview.mjs';
import { reportClearance } from './label-clearance.mjs';
import { bandLayers, isothermLayers, legendCopy, markerLayer, overviewLabels, previewPlanSvg, readRoute, routeLayers } from './plan-sheet.mjs';
import { GENERATED_HEADER, toTs, writeModule } from './ts-writer.mjs';

const args = parseArgs(process.argv.slice(2));
const previewDir = args.preview ? resolve(String(args.preview)) : null;
const terrainDir = args.terrain ? resolve(String(args.terrain)) : TERRAIN_DIR;
const dry = Boolean(args.dry);
if (previewDir) mkdirSync(previewDir, { recursive: true });

const entity = await importSource('src/entities/expedition/model/expeditions.ts');
const { getExpedition } = entity;
// The publishable route (reconstructed day lines along mapped trails; no timestamps). --route=<file> overrides.
const routeFile = args.route ? resolve(String(args.route)) : join(ROOT, 'public/data/routes/annapurna-route.json');

const KB = 1000;
/** The plan sheet carries bands, isotherms and the real route on top of the contours. */
const PLAN_CAP = 60 * KB;
const OUT = {
  plan: join(ROOT, 'src/_pages/home/config/plan-sheet.generated.ts'),
  garhwal: join(ROOT, 'src/_pages/home/config/garhwal-sheet.generated.ts'),
  atlas: join(ROOT, 'src/_pages/stories/config/atlas.generated.ts'),
  sky: join(ROOT, 'src/_pages/personal/config/sky-charts.generated.ts'),
};

/**
 * Shared coarsening ladder, finest first: Gaussian sigma (grid cells), Douglas-Peucker tolerance and
 * minimum line length (viewBox units), and the contour spacing (viewBox units) below which minor contours
 * are interrupted on steep walls. Index contours stay whole on every rung except the last two, so the
 * massifs keep their shape; the minor ones fill the gentler ground (valley floors, passes, plateaus).
 */
const LADDER = [
  [1.0, 0.8, 12, 4, 0],
  [1.2, 1.0, 14, 5, 0],
  [1.4, 1.3, 18, 5, 0],
  [1.6, 1.5, 22, 6, 0],
  [1.8, 1.8, 26, 6, 0],
  [2.0, 2.0, 30, 6, 0],
  [2.2, 2.2, 34, 7, 0],
  [2.4, 2.5, 40, 7, 0],
  [2.6, 2.8, 46, 8, 0],
  [2.8, 3.0, 50, 8, 1.5],
  [3.2, 3.5, 60, 10, 2],
].map(([sigma, tolerance, minLength, minSpacing, indexMinSpacing]) => ({ sigma, tolerance, minLength, minSpacing, indexMinSpacing }));

const fmtDeg = (deg, pos, neg) => {
  const a = Math.abs(deg);
  const d = Math.floor(a + 1e-9);
  const m = Math.round((a - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′ ${deg >= 0 ? pos : neg}`;
};

const node = (projection, wp) => {
  const [x, y] = projection.project(wp.lon, wp.lat);
  return { x: r1(x), y: r1(y), name: wp.name };
};

function route(projection, id, waypoints, kind) {
  const nodes = waypoints.filter((wp) => typeof wp.lon === 'number' && typeof wp.lat === 'number').map((wp) => node(projection, wp));
  const { d, length } = routePath(nodes.map((n) => [n.x, n.y]));
  return { id, d, lengthPx: Math.round(length), nodes, kind };
}

function sourceFields(field) {
  return field.meta.source === 'terrain-tiles'
    ? { source: 'terrain-tiles', attribution: field.meta.attribution }
    : { source: 'procedural' };
}

const sizes = [];

/* ------------------------------------------------------------------------------------------------
 * G-01 Annapurna plan sheet (the home page's static map at tier 0 and with reduced motion)
 * --------------------------------------------------------------------------------------------- */
{
  const sheet = SHEETS.annapurna;
  const projection = makeProjection(sheet);
  const field = readHeightfield(terrainDir, 'annapurna');
  const route = readRoute(routeFile);
  const [fx0, fy0] = projection.project(sheet.bbox[0], sheet.bbox[3]);
  const [fx1, fy1] = projection.project(sheet.bbox[2], sheet.bbox[1]);
  const { routes, road } = routeLayers(projection, route, entity, 0.7);
  const base = {
    id: 'annapurna',
    viewBox: sheet.viewBox,
    frame: { x: r1(fx0), y: r1(fy0), w: r1(fx1 - fx0), h: r1(fy1 - fy0) },
    routes,
    road,
    markers: markerLayer(projection, entity),
    labels: overviewLabels(projection, entity),
    scaleBar: { x: 60, y: 1180, lengthPx: r1(10 * projection.pxPerKm), text: '10 km' },
    northArrow: { x: 930, y: 80 },
    legend: legendCopy(entity),
    source: field.meta.source === 'terrain-tiles' ? 'terrain-tiles' : 'procedural',
  };
  const head = [
    GENERATED_HEADER,
    "import type { ContourSheetData, SheetLabel } from '@/shared/ui/map';",
    '',
    '/** A marker on the plan sheet (viewBox units). `approx`: the position itself is a best guess. */',
    'export interface PlanSheetMarker {',
    '  readonly x: number;',
    '  readonly y: number;',
    '  readonly name: string;',
    "  readonly kind: 'stay' | 'pass-through' | 'landmark' | 'pass' | 'lake' | 'peak';",
    '  readonly approx?: boolean;',
    '}',
    '',
    '/** The plan sheet: a ContourSheetData (ContourSheet renders it as is) plus the static story-map layers. */',
    'export interface PlanSheetData extends ContourSheetData {',
    '  /** The relief rectangle inside the viewBox (feather or vignette its rim; nothing is drawn outside it). */',
    '  readonly frame: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };',
    '  /** Areas at or above `m` metres, lowest first (paint in order, fill-rule evenodd); below the first: the frame. */',
    '  readonly bands: readonly { readonly m: number; readonly d: string }[];',
    '  /** Modelled isotherms: `c` °C sits at `m` metres (TEMPERATURE_MODEL). 0 °C bold, ±10 °C fine. */',
    '  readonly isotherms: readonly { readonly c: number; readonly m: number; readonly d: string }[];',
    '  /** The stretch done by road (Syange to Tal): thin, dotted, muted, never styled as walked. */',
    '  readonly road: readonly { readonly id: string; readonly d: string; readonly lengthPx: number; readonly text: string }[];',
    '  readonly markers: readonly PlanSheetMarker[];',
    '  readonly labels: readonly SheetLabel[];',
    '  readonly legend: {',
    '    readonly title: string;',
    '    readonly meta: string;',
    '    readonly rampTicksM: readonly number[];',
    '    readonly bandStepM: number;',
    '    readonly isotherms: readonly { readonly c: number; readonly text: string }[];',
    '    readonly altitudeNote: string;',
    '    readonly temperatureNote: string;',
    '    readonly keys: readonly { readonly id: string; readonly text: string }[];',
    '  };',
    '}',
    '',
    '/**',
    ' * G-01: Annapurna Circuit plan sheet, the home page\'s one static map at tier 0 and with reduced motion.',
    ` * Relief: ${field.meta.source === 'terrain-tiles' ? 'heightfield annapurna.bin' : 'illustrative (procedural, seeded)'}; altitude bands and index contours every 500 m,`,
    ' * no minor contours (a calm sheet), isotherms modelled from altitude (entities/expedition TEMPERATURE_MODEL).',
    ' * Projection: bbox west 83.75, south 28.15, east 84.45, north 28.90; equirectangular with cos(28.5°)',
    ' * x-scaling, fitted and centred in a 1000 × 1250 viewBox. Routes: the reconstructed public route file',
    ' * (public/data/routes/annapurna-route.json), walked main line, the by-road stretch and the four side trips',
    ' * (Blue, Green, Ice, Tilicho) in walking order; markers and labels from entities/expedition.',
    ' * No coordinates, credits, totals or dates are printed by this data.',
    ' */',
  ].join('\n');
  const keys = ['id', 'viewBox', 'frame', 'bands', 'minor', 'index', 'water', 'isotherms', 'road', 'routes', 'markers', 'labels', 'scaleBar', 'northArrow', 'legend', 'source'];
  const result = fitToCap(
    (rung) => {
      const layers = contourLayers(field, projection, sheet.viewBox, { minorStep: 100, indexStep: 500, ...rung });
      const bands = bandLayers(field, projection, { sigma: rung.sigma, tolerance: rung.tolerance * 1.4, minArea: rung.minLength * 4 });
      const isotherms = isothermLayers(field, projection, entity.TEMPERATURE_MODEL, { sigma: rung.sigma + 0.6, tolerance: rung.tolerance, minLength: rung.minLength * 1.5 });
      // No minor contours: the static map stays calm (bands, index contours, isotherms, the route).
      const data = { ...base, bands, minor: [], index: layers.index, water: [], isotherms };
      const ordered = Object.fromEntries(keys.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
      const text = `${head}\nexport const PLAN_SHEET: PlanSheetData = ${toTs(ordered)};\n`;
      return { text, data, bytes: Buffer.byteLength(text), layers };
    },
    LADDER,
    PLAN_CAP,
  );
  sizes.push(report('plan-sheet', OUT.plan, result, PLAN_CAP));
  reportClearance('plan-sheet', result.data);
  if (previewDir) writeFileSync(join(previewDir, 'plan-sheet.svg'), previewPlanSvg(result.data));
}

/* ------------------------------------------------------------------------------------------------
 * G-09 Garhwal sheet
 * --------------------------------------------------------------------------------------------- */
{
  const sheet = SHEETS.garhwal;
  const projection = makeProjection(sheet);
  const field = readHeightfield(terrainDir, 'garhwal');
  const chandrashila = getExpedition('chandrashila');
  const dodital = getExpedition('dodital');
  const cw = (name) => chandrashila.waypoints.find((wp) => wp.name === name);
  const dw = (name) => dodital.waypoints.find((wp) => wp.name === name);
  const p = (wp) => node(projection, wp);
  // Chopta is the last camp of the Chandrashila route until Q-54 names it. Chopta sits about 1 km from
  // the summit in the entity data (9 viewBox units), while ContourSheet draws the tent about 40 units wide
  // and the Chandrashila label runs left from the summit; so the tent is displaced (standard cartographic
  // symbol displacement) to sit just above the trail by Chopta, clear of the summit mark and its label.
  const campNode = p(cw('Chopta'));
  const camp = { x: r1(campNode.x - 12), y: r1(campNode.y - 34) };
  const uttarkashi = projection.project(78.443, 30.729);
  const ticks = [
    { x: r1(projection.project(78.5, 30.7)[0]), text: fmtDeg(78.5, 'E', 'W') },
    { x: r1(projection.project(79, 30.7)[0]), text: fmtDeg(79, 'E', 'W') },
    { y: r1(projection.project(79, 30.5)[1]), text: fmtDeg(30.5, 'N', 'S') },
    { y: r1(projection.project(79, 31)[1]), text: fmtDeg(31, 'N', 'S') },
  ];
  const summit = cw('Chandrashila');
  const darwa = dw('Darwa Top');

  const makeBase = (minorStep) => ({
    id: 'garhwal',
    viewBox: sheet.viewBox,
    routes: [
      route(projection, 'chandrashila', chandrashila.waypoints, 'done'),
      route(projection, 'dodital', dodital.waypoints, 'planned'),
    ],
    labels: [
      { ...pick(p(summit)), text: 'Chandrashila', kind: 'peak', altitudeM: summit.altitudeM, approx: summit.approx, anchor: 'end', priority: 1 },
      { ...pick(p(darwa)), text: 'Darwa Top', kind: 'peak', altitudeM: darwa.altitudeM, approx: darwa.approx, anchor: 'start', priority: 1 },
      { x: p(cw('Deoriatal')).x, y: r1(p(cw('Deoriatal')).y - 46), text: 'Deoriatal', kind: 'water', anchor: 'middle', priority: 2 },
      { ...pick(p(dw('Dodital'))), text: 'Dodital', kind: 'water', anchor: 'end', priority: 1 },
      { x: r1(uttarkashi[0]), y: r1(uttarkashi[1]), text: 'Uttarkashi', kind: 'town', anchor: 'start', priority: 2 },
    ],
    graticule: ticks,
    scaleBar: { x: 60, y: 830, lengthPx: r1(10 * projection.pxPerKm), text: '10 km' },
    northArrow: { x: 940, y: 110 },
    tent: { x: camp.x, y: camp.y },
    sheetTitle: `Garhwal: Chandrashila, then Dodital. Contours ${minorStep} m.`,
    ...sourceFields(field),
  });
  const doc = (minorStep) =>
    [
      '/**',
      ' * G-09: Garhwal sheet with the alpine start (home `#next`).',
      ` * Relief: ${field.meta.source === 'terrain-tiles' ? 'Terrain Tiles (SRTM)' : 'illustrative (procedural, seeded)'}; minor contours every ${minorStep} m, index every 500 m (ascending, so`,
      ' * the last index path is the highest contour: the alpenglow ridge of the alpine start).',
      ' * Projection: bbox 78.30 to 79.40 E, 30.30 to 31.10 N; equirectangular with cos(30.7°) x-scaling,',
      ' * fitted and centred in a 1000 × 1000 viewBox. Chandrashila route done (solid), Dodital route planned',
      ' * (dashed), tent beside Chopta until Q-54 names the camp. Waypoints from entities/expedition (estimates).',
      ' */',
    ].join('\n');
  // 100 m contours first; 250 m only if the 100 m sheet cannot fit the cap.
  const ladder = [100, 250].flatMap((minorStep) => LADDER.map((rung) => ({ ...rung, minorStep })));
  const result = fitToCap(
    (rung) => {
      const layers = contourLayers(field, projection, sheet.viewBox, { indexStep: 500, ...rung });
      const data = { ...makeBase(rung.minorStep), minor: layers.minor, index: layers.index, water: [] };
      const text = `${GENERATED_HEADER}\nimport type { ContourSheetData } from '@/shared/ui/map';\n\n${doc(rung.minorStep)}\nexport const GARHWAL_SHEET: ContourSheetData = ${toTs(order(data))};\n`;
      return { text, data, bytes: Buffer.byteLength(text), layers };
    },
    ladder,
    30 * KB,
  );
  sizes.push(report('garhwal-sheet', OUT.garhwal, result, 30 * KB));
  reportClearance('garhwal-sheet', result.data);
  if (previewDir) writeFileSync(join(previewDir, 'garhwal-sheet.svg'), previewSheetSvg(result.data));
}

/* ------------------------------------------------------------------------------------------------
 * G-03 Expedition atlas
 * --------------------------------------------------------------------------------------------- */
{
  const sheet = SHEETS.himalaya;
  const projection = makeProjection(sheet);
  const field = readHeightfield(terrainDir, 'himalaya');
  const at = (lon, lat) => projection.project(lon, lat).map(r1);
  // Region names sit clear of the trek pins (placed by the page at each trailhead). No borders.
  const region = (text, lon, lat) => {
    const [x, y] = at(lon, lat);
    return { x, y, text, kind: 'area', anchor: 'middle', priority: 1 };
  };
  const base = {
    id: 'himalaya',
    viewBox: sheet.viewBox,
    routes: [],
    labels: [
      region('Himachal Pradesh', 77.1, 31.0),
      region('Uttarakhand', 79.6, 29.75),
      region('Nepal', 82.9, 28.85),
      region('Sikkim', 88.45, 27.25),
    ],
    graticule: [
      ...[76, 80, 84, 88].map((lon) => ({ x: r1(projection.project(lon, 30)[0]), text: `${lon}° E` })),
      ...[28, 32].map((lat) => ({ y: r1(projection.project(82, lat)[1]), text: `${lat}° N` })),
    ],
    scaleBar: { x: 90, y: 917, lengthPx: r1(200 * projection.pxPerKm), text: '200 km' },
    northArrow: { x: 1540, y: 170 },
    sheetTitle: 'Every trek I have done, Himachal to Sikkim.',
    ...sourceFields(field),
  };
  const head = [
    GENERATED_HEADER,
    "import type { ContourSheetData } from '@/shared/ui/map';",
    '',
    '/** [west, south, east, north] in degrees. */',
    'export const ATLAS_BBOX: readonly [west: number, south: number, east: number, north: number] = [74, 26, 90, 34];',
    '',
    '/*',
    ' * The atlas projection (G-03): equirectangular with cos(30°) x-scaling, fitted and centred in the',
    ' * 1600 × 1067 viewBox, so the sheet centre is 30° N 82° E. The sheet\'s paths and atlasPoint() share it.',
    ' */',
    'const VIEW_W = 1600;',
    'const VIEW_H = 1067;',
    'const K = Math.cos((30 * Math.PI) / 180);',
    'const SCALE = Math.min(VIEW_W / ((ATLAS_BBOX[2] - ATLAS_BBOX[0]) * K), VIEW_H / (ATLAS_BBOX[3] - ATLAS_BBOX[1]));',
    'const OFFSET_X = (VIEW_W - (ATLAS_BBOX[2] - ATLAS_BBOX[0]) * K * SCALE) / 2;',
    'const OFFSET_Y = (VIEW_H - (ATLAS_BBOX[3] - ATLAS_BBOX[1]) * SCALE) / 2;',
    '',
    '/** A longitude/latitude as percent of the atlas viewBox (for `TrigPin` xPct / yPct). */',
    'export function atlasPoint(lon: number, lat: number): { xPct: number; yPct: number } {',
    '  const x = OFFSET_X + (lon - ATLAS_BBOX[0]) * K * SCALE;',
    '  const y = OFFSET_Y + (ATLAS_BBOX[3] - lat) * SCALE;',
    '  return { xPct: (x / VIEW_W) * 100, yPct: (y / VIEW_H) * 100 };',
    '}',
    '',
    '/**',
    ' * G-03: atlas of every trek (`/stories#atlas`). Contours every 1,000 m (index every 2,000 m), simplified;',
    ` * relief ${field.meta.source === 'terrain-tiles' ? 'from Terrain Tiles (SRTM), sampled over the whole viewBox' : 'illustrative (procedural, along a hand-set crest)'}.`,
    ' * Region names only: no political borders, and no rivers (no public river dataset offline). The page',
    ' * places a TrigPin per expedition with atlasPoint().',
    ' */',
  ].join('\n');
  const result = fitToCap(
    (rung) => {
      const layers = contourLayers(field, projection, sheet.viewBox, { minorStep: 1000, indexStep: 2000, ...rung });
      const data = { ...base, minor: layers.minor, index: layers.index, water: [] };
      const text = `${head}\nexport const ATLAS_SHEET: ContourSheetData = ${toTs(order(data))};\n`;
      return { text, data, bytes: Buffer.byteLength(text), layers };
    },
    LADDER,
    60 * KB,
  );
  sizes.push(report('atlas', OUT.atlas, result, 60 * KB));
  reportClearance('atlas', result.data);
  if (previewDir) writeFileSync(join(previewDir, 'atlas.svg'), previewSheetSvg(result.data));
}

/* ------------------------------------------------------------------------------------------------
 * G-04a / G-04b sky charts
 * --------------------------------------------------------------------------------------------- */
{
  const { text, winter, poster } = await buildSkyModule();
  const bytes = Buffer.byteLength(text);
  if (bytes > 30 * KB) throw new Error(`sky-charts module is ${bytes} B, over ${30 * KB} B`);
  if (!dry) writeModule(OUT.sky, text);
  sizes.push({ name: 'sky-charts', path: relative(ROOT, OUT.sky), bytes, cap: 30 * KB, detail: `${winter.stars.length} + ${poster.stars.length} stars` });
  if (previewDir) {
    writeFileSync(join(previewDir, 'winter-sky.svg'), previewStarSvg(winter));
    writeFileSync(join(previewDir, 'sky-poster.svg'), previewStarSvg(poster));
  }
}

for (const s of sizes) {
  console.log(`${s.name.padEnd(14)} ${String(s.bytes).padStart(6)} B of ${s.cap} B  ${s.detail}  ${s.path}`);
}

/* ------------------------------------------------------------------------------------------------ */

function pick(n) {
  return { x: n.x, y: n.y };
}

/** Key order of the stub modules, so diffs against them stay readable. */
function order(data) {
  const keys = ['id', 'viewBox', 'minor', 'index', 'water', 'routes', 'labels', 'graticule', 'scaleBar', 'northArrow', 'tent', 'sheetTitle', 'source', 'attribution'];
  return Object.fromEntries(keys.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
}

function report(name, path, result, cap) {
  if (!dry) writeModule(path, result.text);
  const { sigma, tolerance, minLength, minSpacing, minorStep } = result.rung;
  return {
    name,
    path: relative(ROOT, path),
    bytes: result.bytes,
    cap,
    detail: `${result.layers.levels} levels, ${result.layers.lineCount} lines (blur ${sigma}, DP ${tolerance}, min ${minLength}, spacing ${minSpacing}${minorStep ? `, minor ${minorStep} m` : ''})`,
  };
}
