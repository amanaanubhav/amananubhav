// npm run gen:terrain  (DESIGN-SPEC §C.5 data pipeline, §F G-19)
//
// Writes public/data/terrain/<id>.bin (257 x 257 little-endian Uint16 metres, row-major north to south,
// west to east) and <id>.json for `annapurna` (relief scene, plan sheet), `garhwal` (home #next sheet)
// `himalaya` (the /stories atlas) and `annapurna-story` (the home story map, a wider Annapurna box).
//
// Source: public Terrain Tiles (Terrarium PNG over HTTPS, decoded with sharp:
// h = R * 256 + G + B / 256 - 32768), area-averaged onto the grid. When a region's tiles cannot all be
// fetched, it falls back to a seeded procedural field (mulberry32, ridged fBm) whose valleys follow the
// routes at the waypoint altitudes, and the JSON says source 'procedural'.
//
// Flags: --procedural (skip the network), --only=annapurna,garhwal, --out=<dir> (default public/data/terrain).
// Tiles are cached under the OS temp folder (amananubhav-terrain-tiles) so reruns are fast and offline-safe.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';

import { HIMALAYA_CREST, crestField, valleyField } from './procedural.mjs';
import {
  GRID,
  REGIONS,
  ROOT,
  TERRAIN_ATTRIBUTION,
  TERRAIN_DIR,
  importSource,
  parseArgs,
  sampleHeight,
  writeHeightfield,
} from './shared.mjs';

const TILE_URL = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const TILE_SIZE = 256;
const CACHE_DIR = join(tmpdir(), 'amananubhav-terrain-tiles');
const CONCURRENCY = 6;

/**
 * Procedural fallback only: rough valley-floor heights for waypoints the entity data leaves blank, so
 * the illustrative relief has a plausible valley. Never shown as a figure anywhere.
 */
const PROCEDURAL_ALTITUDE_HINTS = { Trailhead: 1700, Dodital: 3000 };

const args = parseArgs(process.argv.slice(2));
const outDir = args.out ? resolve(String(args.out)) : TERRAIN_DIR;
const only = args.only ? String(args.only).split(',') : Object.keys(REGIONS);
const forceProcedural = Boolean(args.procedural);

const { ANNAPURNA_ROUTE, ANNAPURNA_SIDE_TRIPS, getExpedition } = await importSource(
  'src/entities/expedition/model/expeditions.ts',
);
const { mulberry32, hashSeed } = await importSource('src/shared/lib/random/random.ts');

/** The routes each region's procedural valleys follow, and the waypoints its report checks. */
function regionRoutes(id, { hints = false } = {}) {
  const withHints = (wps) =>
    wps.map((wp) =>
      !hints || typeof wp.altitudeM === 'number' || !(wp.name in PROCEDURAL_ALTITUDE_HINTS)
        ? wp
        : { ...wp, altitudeM: PROCEDURAL_ALTITUDE_HINTS[wp.name] },
    );
  if (id === 'annapurna' || id === 'annapurna-story') return [ANNAPURNA_ROUTE, ...ANNAPURNA_SIDE_TRIPS];
  if (id === 'garhwal') return [getExpedition('chandrashila').waypoints, withHints(getExpedition('dodital').waypoints)];
  return [];
}

/* ------------------------------------------------------------------------------------------------
 * Terrain Tiles
 * --------------------------------------------------------------------------------------------- */

const worldSize = (z) => TILE_SIZE * 2 ** z;
const lonToPx = (lon, z) => ((lon + 180) / 360) * worldSize(z);
const latToPx = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * worldSize(z);
};

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function fetchTile(z, x, y) {
  const cachePath = join(CACHE_DIR, String(z), String(x), `${y}.png`);
  let png;
  if (existsSync(cachePath) && statSync(cachePath).size > 0) {
    png = readFileSync(cachePath);
  } else {
    let lastError;
    for (let attempt = 0; attempt < 3 && !png; attempt += 1) {
      try {
        const res = await fetch(TILE_URL(z, x, y), { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        png = Buffer.from(await res.arrayBuffer());
      } catch (error) {
        lastError = error;
        await sleep(400 * (attempt + 1));
      }
    }
    if (!png) throw new Error(`tile ${z}/${x}/${y}: ${lastError?.message ?? 'failed'}`);
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, png);
  }
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== TILE_SIZE || info.height !== TILE_SIZE || info.channels !== 3) {
    throw new Error(`tile ${z}/${x}/${y}: unexpected ${info.width}x${info.height}x${info.channels}`);
  }
  const heights = new Float32Array(TILE_SIZE * TILE_SIZE);
  for (let i = 0; i < heights.length; i += 1) {
    heights[i] = data[i * 3] * 256 + data[i * 3 + 1] + data[i * 3 + 2] / 256 - 32768;
  }
  return heights;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Area-averaged 257 x 257 grid from Terrarium tiles at the region's zoom. */
async function tileField(region) {
  const z = region.zoom;
  const [west, south, east, north] = region.bbox;
  const x0 = lonToPx(west, z);
  const x1 = lonToPx(east, z);
  const y0 = latToPx(north, z);
  const y1 = latToPx(south, z);
  const cellX = (x1 - x0) / (GRID - 1);
  const cellY = (y1 - y0) / (GRID - 1);
  const ss = Math.max(1, Math.min(6, Math.round(Math.max(cellX, cellY))));
  const margin = Math.max(cellX, cellY) + 2;
  const tx0 = Math.floor((x0 - margin) / TILE_SIZE);
  const tx1 = Math.floor((x1 + margin) / TILE_SIZE);
  const ty0 = Math.floor((y0 - margin) / TILE_SIZE);
  const ty1 = Math.floor((y1 + margin) / TILE_SIZE);
  const coords = [];
  for (let ty = ty0; ty <= ty1; ty += 1) for (let tx = tx0; tx <= tx1; tx += 1) coords.push([tx, ty]);
  console.log(`  ${region.id}: zoom ${z}, ${coords.length} tiles, ${ss}x${ss} samples per cell`);
  const tiles = new Map();
  await mapLimit(coords, CONCURRENCY, async ([tx, ty]) => {
    tiles.set(`${tx}/${ty}`, await fetchTile(z, tx, ty));
  });

  const pixel = (px, py) => {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    const tile = tiles.get(`${tx}/${ty}`);
    if (!tile) throw new Error(`pixel ${px},${py} outside the fetched tiles`);
    return tile[(py - ty * TILE_SIZE) * TILE_SIZE + (px - tx * TILE_SIZE)];
  };
  // Bilinear between pixel centres (a pixel's value sits at its centre, +0.5).
  const bilinear = (fx, fy) => {
    const gx = fx - 0.5;
    const gy = fy - 0.5;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const ax = gx - ix;
    const ay = gy - iy;
    const top = pixel(ix, iy) * (1 - ax) + pixel(ix + 1, iy) * ax;
    const bottom = pixel(ix, iy + 1) * (1 - ax) + pixel(ix + 1, iy + 1) * ax;
    return top * (1 - ay) + bottom * ay;
  };

  const heights = new Float64Array(GRID * GRID);
  for (let j = 0; j < GRID; j += 1) {
    const lat = north - ((north - south) * j) / (GRID - 1);
    const cy = latToPx(lat, z);
    for (let i = 0; i < GRID; i += 1) {
      const lon = west + ((east - west) * i) / (GRID - 1);
      const cx = lonToPx(lon, z);
      let sum = 0;
      for (let sy = 0; sy < ss; sy += 1) {
        for (let sx = 0; sx < ss; sx += 1) {
          sum += bilinear(cx + ((sx + 0.5) / ss - 0.5) * cellX, cy + ((sy + 0.5) / ss - 0.5) * cellY);
        }
      }
      heights[j * GRID + i] = Math.max(0, sum / (ss * ss));
    }
  }
  return heights;
}

/* ------------------------------------------------------------------------------------------------
 * Void-pit repair
 *
 * The Terrain Tiles mosaic carries badly filled SRTM voids (radar shadow) on a few summits, faces and
 * gorges: smooth pits that drop 1,000 to 4,800 m below everything around them (for example in the
 * Marsyangdi between Chame and Pisang, and on the Annapurna II and IV faces); every zoom level has them.
 * A sample is a pit when it lies more than PIT_DROP_M below every sample on a surrounding square ring
 * (radius 1 to PIT_MAX_RING samples, about 0.3 to 2 km). Real valleys never qualify: each ring crosses
 * the valley floor up- and downstream. Pits, grown by one sample to take in their averaged rims, are
 * then inpainted by Laplace relaxation from the samples around them (a smooth surface across the hole).
 * --------------------------------------------------------------------------------------------- */

const PIT_DROP_M = 250;
const PIT_MAX_RING = 8;

function repairPits(heights) {
  const n = GRID;
  const h = Float64Array.from(heights);
  const pit = new Uint8Array(n * n);
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      const v = h[j * n + i];
      for (let r = 1; r <= PIT_MAX_RING; r += 1) {
        let ringMin = Infinity;
        let count = 0;
        for (let d = -r; d <= r; d += 1) {
          for (const [ii, jj] of [[i + d, j - r], [i + d, j + r], [i - r, j + d], [i + r, j + d]]) {
            if (ii < 0 || jj < 0 || ii >= n || jj >= n) continue;
            const w = h[jj * n + ii];
            if (w < ringMin) ringMin = w;
            count += 1;
          }
        }
        if (count < 4 * r) break; // more than half the ring is off the grid: no verdict
        if (v < ringMin - PIT_DROP_M) {
          pit[j * n + i] = 1;
          break;
        }
      }
    }
  }
  // Grow by one sample: the rim of a void is partly averaged into it.
  const mask = Uint8Array.from(pit);
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      if (!pit[j * n + i]) continue;
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let di = -1; di <= 1; di += 1) {
          const ii = i + di;
          const jj = j + dj;
          if (ii >= 0 && jj >= 0 && ii < n && jj < n) mask[jj * n + ii] = 1;
        }
      }
    }
  }
  const cells = [];
  for (let k = 0; k < n * n; k += 1) if (mask[k]) cells.push(k);
  // Gauss-Seidel relaxation of the masked samples toward the mean of their 4 neighbours.
  for (let iter = 0; iter < 400; iter += 1) {
    let delta = 0;
    for (const k of cells) {
      const i = k % n;
      const j = (k - i) / n;
      let sum = 0;
      let m = 0;
      if (i > 0) { sum += h[k - 1]; m += 1; }
      if (i < n - 1) { sum += h[k + 1]; m += 1; }
      if (j > 0) { sum += h[k - n]; m += 1; }
      if (j < n - 1) { sum += h[k + n]; m += 1; }
      const v = sum / m;
      delta = Math.max(delta, Math.abs(v - h[k]));
      h[k] = v;
    }
    if (delta < 0.5) break;
  }
  return { heights: h, repaired: cells.length, pits: pit.reduce((a, b) => a + b, 0) };
}

/* ------------------------------------------------------------------------------------------------
 * Main
 * --------------------------------------------------------------------------------------------- */

function proceduralField(region) {
  const seed = hashSeed(`terrain:${region.id}`);
  const rand = mulberry32(seed);
  const heights =
    region.id === 'himalaya'
      ? crestField({ bbox: region.bbox, rand, crest: HIMALAYA_CREST })
      : valleyField({
          bbox: region.bbox,
          rand,
          routes: regionRoutes(region.id, { hints: true }),
          ...(region.id === 'garhwal' ? { wallM: 2100, peaksM: 1700, featureKm: 8, capKneeM: 6000, capSpanM: 1200 } : {}),
        });
  return { heights, seed };
}

const report = [];
for (const id of only) {
  const region = REGIONS[id];
  if (!region) throw new Error(`unknown region ${id}`);
  let field;
  if (!forceProcedural) {
    try {
      const raw = await tileField(region);
      const { heights, repaired, pits } = region.repairPits ? repairPits(raw) : { heights: raw, repaired: 0, pits: 0 };
      if (repaired) console.log(`  ${id}: inpainted ${repaired} samples around ${pits} void-pit samples`);
      field = { heights, source: 'terrain-tiles', attribution: TERRAIN_ATTRIBUTION };
    } catch (error) {
      console.warn(`  ${id}: Terrain Tiles unavailable (${error.message}); writing the procedural fallback.`);
    }
  }
  if (!field) {
    const { heights, seed } = proceduralField(region);
    field = { heights, source: 'procedural', seed };
  }
  const { binPath, jsonPath, meta } = writeHeightfield(outDir, id, { ...field, bbox: region.bbox });

  // Waypoint check: the grid height at each waypoint against its listed altitude.
  const check = [];
  const read = { meta, heights: field.heights };
  for (const route of regionRoutes(id)) {
    for (const wp of route) {
      if (typeof wp.lon !== 'number' || typeof wp.lat !== 'number' || typeof wp.altitudeM !== 'number') continue;
      if (check.some((c) => c.name === wp.name)) continue;
      check.push({ name: wp.name, listed: wp.altitudeM, grid: Math.round(sampleHeight(read, wp.lon, wp.lat)) });
    }
  }
  report.push({
    id,
    source: meta.source,
    minM: meta.minM,
    maxM: meta.maxM,
    bin: `${relative(ROOT, binPath)} (${statSync(binPath).size} B)`,
    json: `${relative(ROOT, jsonPath)} (${statSync(jsonPath).size} B)`,
    check,
  });
}

for (const r of report) {
  console.log(`\n${r.id}: source ${r.source}, ${r.minM} to ${r.maxM} m`);
  console.log(`  ${r.bin}\n  ${r.json}`);
  for (const c of r.check) console.log(`  ${c.name.padEnd(16)} listed ${String(c.listed).padStart(5)} m, grid ${String(c.grid).padStart(5)} m`);
}
