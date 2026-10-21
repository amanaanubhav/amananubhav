// Shared definitions for the terrain and poster scripts (DESIGN-SPEC §C.5, §F G-01, G-03, G-09, G-19).
// Dev-only: never imported by src/. The poster script imports the region and projection helpers from here
// so the heightfields and the generated sheets always agree on bboxes and projections.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TERRAIN_DIR = join(ROOT, 'public', 'data', 'terrain');

export const GRID = 257;
export const TERRAIN_ATTRIBUTION = 'Terrain Tiles (Mapzen, AWS Open Data) from SRTM and other public sources';

/**
 * Loads a TypeScript source file from src/ through Node 24's built-in type stripping. The repo's
 * package.json has no "type" field, so Node re-parses those files as ES modules and prints a
 * MODULE_TYPELESS_PACKAGE_JSON warning; it is expected and silenced here (other warnings still print).
 */
let warningFilterInstalled = false;
export async function importSource(relativePath) {
  if (!warningFilterInstalled) {
    warningFilterInstalled = true;
    const listeners = process.listeners('warning');
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
      if (warning?.code === 'MODULE_TYPELESS_PACKAGE_JSON') return;
      for (const listener of listeners) listener(warning);
    });
  }
  return import(pathToFileURL(join(ROOT, relativePath)).href);
}

/* ------------------------------------------------------------------------------------------------
 * Sheet projections (§F): equirectangular with cos(lat0) x-scaling, fitted and centred in the viewBox.
 * The same formula is emitted into atlas.generated.ts (atlasPoint), so pins and paths share it.
 * --------------------------------------------------------------------------------------------- */

/** @typedef {{ bbox: readonly [number, number, number, number]; lat0: number; viewBox: readonly [number, number] }} SheetSpec */

/** @param {SheetSpec} sheet */
export function makeProjection(sheet) {
  const [west, south, east, north] = sheet.bbox;
  const [w, h] = sheet.viewBox;
  const k = Math.cos((sheet.lat0 * Math.PI) / 180);
  const scale = Math.min(w / ((east - west) * k), h / (north - south));
  const offsetX = (w - (east - west) * k * scale) / 2;
  const offsetY = (h - (north - south) * scale) / 2;
  return {
    k,
    scale,
    offsetX,
    offsetY,
    /** Pixels (viewBox units) per kilometre, measured north-south (true on the whole sheet). */
    pxPerKm: scale / 111.32,
    project(lon, lat) {
      return [offsetX + (lon - west) * k * scale, offsetY + (north - lat) * scale];
    },
    unproject(x, y) {
      return [west + (x - offsetX) / (k * scale), north - (y - offsetY) / scale];
    },
  };
}

/** The lon/lat box that covers a sheet's whole viewBox (wider than its fitted bbox on one axis). */
function coverBbox(sheet) {
  const p = makeProjection(sheet);
  const [w, h] = sheet.viewBox;
  const [west, north] = p.unproject(0, 0);
  const [east, south] = p.unproject(w, h);
  const out = (v, dir) => (dir < 0 ? Math.floor(v * 1000) / 1000 : Math.ceil(v * 1000) / 1000);
  return [out(west, -1), out(south, -1), out(east, 1), out(north, 1)];
}

/* ------------------------------------------------------------------------------------------------
 * Regions
 *
 * `annapurna` keeps the §F bbox exactly: the relief scene reads it, and the sheet's 4:5 viewBox is
 * already filled to within 15 px. `garhwal` and `himalaya` feed only the posters; their heightfields
 * cover the sheet's whole viewBox (the §F bbox widened north and south), so the contours run to the
 * sheet edge instead of leaving empty bands above and below the fitted box. The sheet projections
 * (and ATLAS_BBOX / atlasPoint) keep the §F boxes.
 * --------------------------------------------------------------------------------------------- */

export const SHEETS = {
  annapurna: { bbox: [83.75, 28.15, 84.45, 28.9], lat0: 28.5, viewBox: [1000, 1250] },
  garhwal: { bbox: [78.3, 30.3, 79.4, 31.1], lat0: 30.7, viewBox: [1000, 1000] },
  himalaya: { bbox: [74, 26, 90, 34], lat0: 30, viewBox: [1600, 1067] },
};

export const REGIONS = {
  annapurna: { id: 'annapurna', bbox: SHEETS.annapurna.bbox, zoom: 11, repairPits: true },
  // The home story map (design §15.2): wider east and south than the plan sheet, so the relief runs past
  // the trek on every side and the scene's rim fade never lands on the route (R29).
  'annapurna-story': { id: 'annapurna-story', bbox: [83.75, 28.08, 84.57, 28.92], zoom: 11, repairPits: true },
  garhwal: { id: 'garhwal', bbox: coverBbox(SHEETS.garhwal), zoom: 10, repairPits: true },
  // At ~6 km per sample the atlas's hollows are real basins and gorges (voids average out): left as is.
  himalaya: { id: 'himalaya', bbox: coverBbox(SHEETS.himalaya), zoom: 7, repairPits: false },
};

/* ------------------------------------------------------------------------------------------------
 * Heightfield IO (§C.5): <id>.bin = little-endian Uint16 metres, 257 x 257, row-major north to south,
 * west to east; <id>.json = { cols, rows, bbox, minM, maxM, source, seed?, attribution? }.
 * --------------------------------------------------------------------------------------------- */

/**
 * @param {string} dir
 * @param {string} id
 * @param {{ heights: Float64Array | number[]; bbox: number[]; source: 'terrain-tiles' | 'procedural'; seed?: number; attribution?: string }} field
 */
export function writeHeightfield(dir, id, field) {
  mkdirSync(dir, { recursive: true });
  const n = GRID * GRID;
  if (field.heights.length !== n) throw new Error(`${id}: expected ${n} heights, got ${field.heights.length}`);
  const buf = Buffer.alloc(n * 2);
  let minM = Infinity;
  let maxM = -Infinity;
  for (let i = 0; i < n; i += 1) {
    const m = Math.max(0, Math.min(65535, Math.round(field.heights[i])));
    buf.writeUInt16LE(m, i * 2);
    if (m < minM) minM = m;
    if (m > maxM) maxM = m;
  }
  const meta = {
    cols: GRID,
    rows: GRID,
    bbox: field.bbox.map((v) => Math.round(v * 10000) / 10000),
    minM,
    maxM,
    source: field.source,
  };
  if (field.seed !== undefined) meta.seed = field.seed;
  if (field.attribution) meta.attribution = field.attribution;
  const binPath = join(dir, `${id}.bin`);
  const jsonPath = join(dir, `${id}.json`);
  writeFileSync(binPath, buf);
  const json = JSON.stringify(meta, null, 2).replace(/\[\s+([^\]]*?)\s+\]/, (_, inner) => `[${inner.split(/,\s+/).join(', ')}]`);
  writeFileSync(jsonPath, `${json}\n`);
  return { binPath, jsonPath, meta };
}

/** @returns {{ meta: { cols: number; rows: number; bbox: number[]; minM: number; maxM: number; source: string; seed?: number; attribution?: string }; heights: Float64Array }} */
export function readHeightfield(dir, id) {
  const meta = JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8'));
  const buf = readFileSync(join(dir, `${id}.bin`));
  const n = meta.cols * meta.rows;
  if (buf.length !== n * 2) throw new Error(`${id}.bin holds ${buf.length / 2} values, expected ${n}`);
  const heights = new Float64Array(n);
  for (let i = 0; i < n; i += 1) heights[i] = buf.readUInt16LE(i * 2);
  return { meta, heights };
}

/** Bilinear height at a lon/lat inside a heightfield (clamped to its edges). */
export function sampleHeight(field, lon, lat) {
  const { cols, rows, bbox } = field.meta;
  const [west, south, east, north] = bbox;
  const u = Math.max(0, Math.min(cols - 1, ((lon - west) / (east - west)) * (cols - 1)));
  const v = Math.max(0, Math.min(rows - 1, ((north - lat) / (north - south)) * (rows - 1)));
  const i0 = Math.min(cols - 2, Math.floor(u));
  const j0 = Math.min(rows - 2, Math.floor(v));
  const fu = u - i0;
  const fv = v - j0;
  const at = (i, j) => field.heights[j * cols + i];
  const top = at(i0, j0) * (1 - fu) + at(i0 + 1, j0) * fu;
  const bottom = at(i0, j0 + 1) * (1 - fu) + at(i0 + 1, j0 + 1) * fu;
  return top * (1 - fv) + bottom * fv;
}

/** Parses `--key=value` and `--flag` arguments. */
export function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const [key, ...rest] = raw.slice(2).split('=');
    args[key] = rest.length ? rest.join('=') : true;
  }
  return args;
}
