// node scripts/terrain/build-north-route.mjs  (next-trek NEXT-DESIGN §5.2 "Data")
//
// Writes public/data/routes/anbc-expected.json (lean, shipped): the planned road corridor from Muktinath (where the
// walked story ends) to Marpha (Jharkot > Khingar > Kagbeni > Ekle Bhatti > Jomsom > Syang, ROUTE-FACTS §7), the
// planned jeep ride (Marpha > Kalopani > Ghasa > Tatopani > Narchyang > Humkhola) and the expected trek on foot
// (Humkhola > Sadhi Kharka > Bhusket Mela > Panchakunda Lake > Annapurna I Base Camp North), and the cited places
// with their flags. The corridor starts on the walked line's last point (public/data/routes/annapurna-route.json),
// so the planned line continues the walked one with no gap.
//
// The lines are APPROXIMATE by construction. No road or path geometry is taken from any map (OpenStreetMap
// way geometry would need a visible credit): each leg between two consecutive cited places is the
// least-cost path on the `annapurna-north` heightfield (run `gen:terrain --only=annapurna-north` first).
//   - jeep: grade-penalised and drawn to the valley floor, so it follows the Kali Gandaki and the side valley;
//   - foot: Tobler's hiking time, so it climbs the way a walker would rather than straight up a face.
// Valley-floor towns (snapCells in north-places.mjs) are first moved to the lowest sample within a few
// samples of their rounded (0.01°) position. The grid path is simplified, smoothed (Chaikin, places held
// fixed) and draped on the heightfield.
//
// Two files. The shipped one (public/) carries only what the page reads: the lines' geometry and ids, and per place
// its id, kind, position, line index, flags and the altitude the page shows. The full derivation (sources, notes,
// cited and grid altitudes, the method) goes to docs/redesign/next-trek/data/anbc-expected.full.json and is never
// served: source citations stay in the docs and code comments only.
//
// Flags: --out=<file> (default public/data/routes/anbc-expected.json), --full=<file> (default the docs path).
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

import { ANNAPURNA_I, CORRIDOR_STOPS, JEEP_STOPS, MUKTINATH, NORTH_SOURCES, TREK_STOPS } from './north-places.mjs';
import { ROOT, TERRAIN_DIR, parseArgs, readHeightfield, sampleHeight } from './shared.mjs';

const REGION_ID = 'annapurna-north';
const args = parseArgs(process.argv.slice(2));
const outPath = args.out ? resolve(String(args.out)) : join(ROOT, 'public', 'data', 'routes', 'anbc-expected.json');
const fullPath = args.full
  ? resolve(String(args.full))
  : join(ROOT, 'docs', 'redesign', 'next-trek', 'data', 'anbc-expected.full.json');

/**
 * The routing grid: the tile's rows from ROUTE_NORTH south, a square 257 x 257 lattice. The tile reaches farther north
 * (to ~29.15 N, so the 3D view north over the corridor never meets its edge, shared.mjs) with the same row spacing, so
 * this crop is exactly the 28.95-28.40 N lattice the lines were derived on; the drainage carve floods from its edge.
 */
const ROUTE_NORTH = 28.95;
function cropNorth(f, northLat) {
  const { cols, rows, bbox: b } = f.meta;
  const dy = (b[3] - b[1]) / (rows - 1);
  const skip = Math.round((b[3] - northLat) / dy);
  if (skip <= 0) return f;
  if (rows - skip !== cols) throw new Error(`${REGION_ID}: the crop from ${northLat} N is not square (${cols} x ${rows - skip})`);
  // The tile's bbox is stored to 4 decimals: the crop's edge is the lattice's own (within 3 m), so name it exactly.
  if (Math.abs(b[3] - skip * dy - northLat) > dy * 0.05) throw new Error(`${REGION_ID}: rows do not fall on ${northLat} N`);
  return {
    meta: { ...f.meta, rows: rows - skip, bbox: [b[0], b[1], b[2], northLat] },
    heights: f.heights.subarray(skip * cols),
  };
}
const field = cropNorth(readHeightfield(TERRAIN_DIR, REGION_ID), ROUTE_NORTH);
const { cols: N, rows, bbox } = field.meta;
if (N !== rows) throw new Error('square grid expected');
const [west, south, east, north] = bbox;
const lat0 = (south + north) / 2;
const KM_PER_DEG = 111.32;
const dxKm = ((east - west) / (N - 1)) * KM_PER_DEG * Math.cos((lat0 * Math.PI) / 180);
const dyKm = ((north - south) / (N - 1)) * KM_PER_DEG;
const H = field.heights;

const toCell = (lon, lat) => [
  Math.round(((lon - west) / (east - west)) * (N - 1)),
  Math.round(((north - lat) / (north - south)) * (N - 1)),
];
const cellLonLat = (i, j) => [west + ((east - west) * i) / (N - 1), north - ((north - south) * j) / (N - 1)];
const toKm = (lon, lat) => [(lon - west) * KM_PER_DEG * Math.cos((lat0 * Math.PI) / 180), (north - lat) * KM_PER_DEG];
const fromKm = (x, y) => [west + x / (KM_PER_DEG * Math.cos((lat0 * Math.PI) / 180)), north - y / KM_PER_DEG];

/** A binary min-heap of [priority, cell] pairs. */
function makeHeap() {
  const items = [];
  return {
    get size() {
      return items.length;
    },
    push(d, k) {
      items.push([d, k]);
      let c = items.length - 1;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (items[p][0] <= items[c][0]) break;
        [items[p], items[c]] = [items[c], items[p]];
        c = p;
      }
    },
    pop() {
      const top = items[0];
      const last = items.pop();
      if (items.length) {
        items[0] = last;
        let c = 0;
        for (;;) {
          const l = 2 * c + 1;
          const r = l + 1;
          let m = c;
          if (l < items.length && items[l][0] < items[m][0]) m = l;
          if (r < items.length && items[r][0] < items[m][0]) m = r;
          if (m === c) break;
          [items[m], items[c]] = [items[c], items[m]];
          c = m;
        }
      }
      return top;
    },
  };
}

function neighbours(k) {
  const i = k % N;
  const j = (k - i) / N;
  const out = [];
  for (let dj = -1; dj <= 1; dj += 1) {
    for (let di = -1; di <= 1; di += 1) {
      const ii = i + di;
      const jj = j + dj;
      if ((di || dj) && ii >= 0 && jj >= 0 && ii < N && jj < N) out.push(jj * N + ii);
    }
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Carved surface (routing only, never drawn). At about 210 m per sample a narrow gorge averages with
 * its walls and reads as a dam: the Hum Khola bowl (≈ 2,890 m) is closed by a ≈ 3,230 m sill on the tile.
 * Priority-Flood with carving (Barnes et al. 2014; Soille 2004) floods from the tile edge in rising order
 * and, whenever it steps down into a closed hollow, lowers the cells it came through to that level, so
 * every hollow drains along a channel and the jeep follows the drainage through such gorges. The line is
 * still draped on the real tile, so where the tile closes a gorge the line rides over its sill (the jeep's
 * highest point, ≈ 3,260 m just before Humkhola, is that sill, not a pass).
 * --------------------------------------------------------------------------------------------- */
const C = Float64Array.from(H);
{
  const closed = new Uint8Array(N * N);
  const parent = new Int32Array(N * N).fill(-1);
  const heap = makeHeap();
  for (let k = 0; k < N * N; k += 1) {
    const i = k % N;
    const j = (k - i) / N;
    if (i === 0 || j === 0 || i === N - 1 || j === N - 1) {
      closed[k] = 1;
      heap.push(C[k], k);
    }
  }
  while (heap.size) {
    const [, c] = heap.pop();
    for (const n of neighbours(c)) {
      if (closed[n]) continue;
      closed[n] = 1;
      parent[n] = c;
      if (C[n] < C[c]) for (let q = c; q >= 0 && C[q] > C[n]; q = parent[q]) C[q] = C[n];
      heap.push(C[n], n);
    }
  }
}

/* ------------------------------------------------------------------------------------------------
 * Valley floor: the lowest carved sample within FLOOR_R samples (≈ 1 km), used by the jeep cost.
 * --------------------------------------------------------------------------------------------- */
const FLOOR_R = 5;
const floor = new Float64Array(N * N);
{
  const rowMin = new Float64Array(N * N);
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      let m = Infinity;
      for (let d = -FLOOR_R; d <= FLOOR_R; d += 1) {
        const ii = i + d;
        if (ii >= 0 && ii < N) m = Math.min(m, C[j * N + ii]);
      }
      rowMin[j * N + i] = m;
    }
  }
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      let m = Infinity;
      for (let d = -FLOOR_R; d <= FLOOR_R; d += 1) {
        const jj = j + d;
        if (jj >= 0 && jj < N) m = Math.min(m, rowMin[jj * N + i]);
      }
      floor[j * N + i] = m;
    }
  }
}

/** Cost of one step (km-equivalents for the jeep, hours for the walker). */
const COST = {
  // Roads keep to gentle grades and near the valley floor: a 14 % grade doubles the cost, and so does
  // running 1,500 m above the local floor (a light pull: villages on terraces stay on the line).
  jeep(a, b, dKm) {
    const g = Math.abs(C[b] - C[a]) / (dKm * 1000);
    const above = Math.max(0, C[b] - floor[b]) / 1500;
    return dKm * (1 + (g / 0.14) ** 2 + above);
  },
  // Tobler's hiking function: v = 6 exp(-3.5 |g + 0.05|) km/h.
  foot(a, b, dKm) {
    const g = (H[b] - H[a]) / (dKm * 1000);
    return dKm / (6 * Math.exp(-3.5 * Math.abs(g + 0.05)));
  },
};

const STEPS = [];
for (let dj = -1; dj <= 1; dj += 1) {
  for (let di = -1; di <= 1; di += 1) if (di || dj) STEPS.push([di, dj, Math.hypot(di * dxKm, dj * dyKm)]);
}

/** Dijkstra on the 8-connected grid; returns the cell indices from `from` to `to`. */
function leastCostPath(from, to, mode) {
  const cost = COST[mode];
  const dist = new Float64Array(N * N).fill(Infinity);
  const prev = new Int32Array(N * N).fill(-1);
  const heap = makeHeap();
  const start = from[1] * N + from[0];
  const goal = to[1] * N + to[0];
  dist[start] = 0;
  heap.push(0, start);
  while (heap.size) {
    const [d, k] = heap.pop();
    if (k === goal) break;
    if (d > dist[k]) continue;
    const i = k % N;
    const j = (k - i) / N;
    for (const [di, dj, dKm] of STEPS) {
      const ii = i + di;
      const jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
      const kk = jj * N + ii;
      const nd = d + cost(k, kk, dKm);
      if (nd < dist[kk]) {
        dist[kk] = nd;
        prev[kk] = k;
        heap.push(nd, kk);
      }
    }
  }
  if (prev[goal] < 0 && goal !== start) throw new Error(`no path ${from} > ${to}`);
  const path = [];
  for (let k = goal; k >= 0; k = prev[k]) {
    path.push(k);
    if (k === start) break;
  }
  return path.reverse();
}

/* ------------------------------------------------------------------------------------------------
 * Geometry helpers (plan km)
 * --------------------------------------------------------------------------------------------- */

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const len = Math.hypot(bx - ax, by - ay) || 1e-9;
    let worst = -1;
    let at = -1;
    for (let k = a + 1; k < b; k += 1) {
      const d = Math.abs((bx - ax) * (ay - pts[k][1]) - (ax - pts[k][0]) * (by - ay)) / len;
      if (d > worst) {
        worst = d;
        at = k;
      }
    }
    if (worst > tol) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return pts.filter((_, k) => keep[k]);
}

/** Chaikin corner cutting with both ends held. */
function chaikin(pts, iterations) {
  let out = pts;
  for (let n = 0; n < iterations; n += 1) {
    const next = [out[0]];
    for (let k = 0; k + 1 < out.length; k += 1) {
      const [ax, ay] = out[k];
      const [bx, by] = out[k + 1];
      next.push([0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by], [0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

/** Drops points closer than `minKm` to the last kept one (ends kept). */
function thin(pts, minKm) {
  const out = [pts[0]];
  for (let k = 1; k < pts.length - 1; k += 1) {
    const [lx, ly] = out[out.length - 1];
    if (Math.hypot(pts[k][0] - lx, pts[k][1] - ly) >= minKm) out.push(pts[k]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * Places on the grid
 * --------------------------------------------------------------------------------------------- */

const snapLog = [];
/** The position a place takes on the line: valley-floor towns move to the lowest nearby sample. */
function anchor(place) {
  const [ci, cj] = toCell(place.lon, place.lat);
  if (!place.snapCells) return { cell: [ci, cj], lonLat: [place.lon, place.lat], snapped: false };
  let best = [ci, cj];
  for (let dj = -place.snapCells; dj <= place.snapCells; dj += 1) {
    for (let di = -place.snapCells; di <= place.snapCells; di += 1) {
      const i = ci + di;
      const j = cj + dj;
      if (i < 0 || j < 0 || i >= N || j >= N || Math.hypot(di, dj) > place.snapCells) continue;
      if (H[j * N + i] < H[best[1] * N + best[0]]) best = [i, j];
    }
  }
  const lonLat = cellLonLat(best[0], best[1]);
  const [ax, ay] = toKm(place.lon, place.lat);
  const [bx, by] = toKm(...lonLat);
  if (!snapLog.some((s) => s.name === place.name)) snapLog.push({
    name: place.name,
    movedKm: Math.round(Math.hypot(bx - ax, by - ay) * 100) / 100,
    from: Math.round(sampleHeight(field, place.lon, place.lat)),
    to: Math.round(H[best[1] * N + best[0]]),
  });
  return { cell: best, lonLat, snapped: true };
}

const SIMPLIFY_KM = { jeep: 0.05, foot: 0.04 };
const THIN_KM = 0.12;

/**
 * One drawn line through consecutive places; returns points and each place's index. `start` (lon, lat) replaces
 * the first place's position as the line's first point (the corridor starts on the walked line's last point).
 */
function buildLine(places, mode, start) {
  const anchors = places.map(anchor);
  const pts = [];
  const indices = [];
  for (let s = 0; s + 1 < anchors.length; s += 1) {
    const cells = leastCostPath(anchors[s].cell, anchors[s + 1].cell, mode);
    let leg = cells.map((k) => toKm(...cellLonLat(k % N, Math.floor(k / N))));
    leg[0] = toKm(...(s === 0 && start ? start : anchors[s].lonLat));
    leg[leg.length - 1] = toKm(...anchors[s + 1].lonLat);
    leg = thin(chaikin(simplify(leg, SIMPLIFY_KM[mode]), 2), THIN_KM);
    if (s === 0) {
      indices.push(0);
      pts.push(...leg);
    } else pts.push(...leg.slice(1));
    indices.push(pts.length - 1);
  }
  const out = pts.map(([x, y]) => {
    const [lon, lat] = fromKm(x, y);
    return [round(lon, 5), round(lat, 5), Math.round(sampleHeight(field, lon, lat))];
  });
  return { points: out, indices, anchors };
}

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------------------------------------------
 * Main
 * --------------------------------------------------------------------------------------------- */

/** The walked circuit's last point (the story route's last main segment): where the corridor line starts. */
function walkedEnd() {
  const story = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'routes', 'annapurna-route.json'), 'utf8'));
  const main = story.segments.filter((s) => s.kind === 'main').sort((a, b) => a.order - b.order);
  const pts = main[main.length - 1]?.points ?? [];
  const last = pts[pts.length - 1];
  if (!last) throw new Error('annapurna-route.json: no main segment');
  const [ax, ay] = toKm(last[0], last[1]);
  const [bx, by] = toKm(MUKTINATH.lon, MUKTINATH.lat);
  if (Math.hypot(ax - bx, ay - by) > 0.5) throw new Error('the walked line does not end at Muktinath');
  return [last[0], last[1]];
}

const corridor = buildLine(CORRIDOR_STOPS, 'jeep', walkedEnd());
const jeep = buildLine(JEEP_STOPS, 'jeep');
const trek = buildLine(TREK_STOPS, 'foot');

const JEEP_FLAGS = { planned: true, approximate: true };
const TREK_FLAGS = { expected: true, approximate: true };

/** Place record: the line position, the rounded cited one when it moved, and the cited figures. */
function placeRecord(place, { flags, at, anchorInfo }) {
  const [lon, lat] = anchorInfo ? anchorInfo.lonLat : [place.lon, place.lat];
  const rec = {
    id: place.id,
    name: place.name,
    kind: place.kind,
    lon: round(lon, 5),
    lat: round(lat, 5),
    gridAltM: Math.round(sampleHeight(field, lon, lat)),
    flags,
  };
  if (anchorInfo?.snapped) rec.citedLonLat = [place.lon, place.lat];
  if (typeof place.altitudeM === 'number') rec.citedAltM = place.altitudeM;
  if (place.altRangeM) rec.citedAltRangeM = place.altRangeM;
  if (place.altNote) rec.altNote = place.altNote;
  rec.showAlt = Boolean(place.showAlt);
  if (place.located === false) rec.located = false;
  if (at) rec.at = at;
  rec.sourceIds = place.sourceIds;
  if (place.note) rec.note = place.note;
  return rec;
}

const last = CORRIDOR_STOPS.length - 1;
const places = [
  placeRecord(MUKTINATH, { flags: { walked: true }, at: { line: 'corridor', index: 0 } }),
  ...CORRIDOR_STOPS.slice(1, last).map((p, n) =>
    placeRecord(p, {
      flags: JEEP_FLAGS,
      at: { line: 'corridor', index: corridor.indices[n + 1] },
      anchorInfo: corridor.anchors[n + 1],
    }),
  ),
  ...JEEP_STOPS.map((p, n) => {
    const isEnd = n === JEEP_STOPS.length - 1;
    const onJeep = { line: 'jeep', index: jeep.indices[n] };
    return placeRecord(p, {
      flags: isEnd ? { planned: true, expected: true, approximate: true } : JEEP_FLAGS,
      // Marpha ends the corridor and starts the jeep line; Humkhola ends the jeep line and starts the trek.
      at: isEnd
        ? [onJeep, { line: 'trek', index: 0 }]
        : n === 0
          ? [{ line: 'corridor', index: corridor.indices[last] }, onJeep]
          : onJeep,
      anchorInfo: jeep.anchors[n],
    });
  }),
  ...TREK_STOPS.slice(1).map((p, n) =>
    placeRecord(p, { flags: TREK_FLAGS, at: { line: 'trek', index: trek.indices[n + 1] }, anchorInfo: trek.anchors[n + 1] }),
  ),
  placeRecord(ANNAPURNA_I, { flags: { landmark: true, approximate: true } }),
];

// The corridor's and the jeep line's Marpha are the same snapped point, so the two read as one road.
const [cm, jm] = [corridor.points[corridor.points.length - 1], jeep.points[0]];
if (cm[0] !== jm[0] || cm[1] !== jm[1]) throw new Error(`corridor ends at ${cm}, jeep starts at ${jm}`);

const all = [...corridor.points, ...jeep.points, ...trek.points];
const doc = {
  version: 1,
  id: 'anbc-expected',
  name: 'Annapurna I Base Camp (North), expected route',
  coords: '[lon, lat, altM] WGS84; altM sampled from the annapurna-north heightfield (Terrain Tiles, SRTM-based)',
  comment: [
    'Not for display: derivation and sources only.',
    'Route A (the Herzog Trail) per docs/redesign/next-trek/ROUTE-FACTS.md. No dates, no distances.',
    'Lines are approximate least-cost paths on the annapurna-north heightfield between the cited places ' +
      '(jeep: grade- and valley-floor-penalised; foot: Tobler hiking time), simplified and smoothed. ' +
      'No road or path geometry is taken from any map.',
    'Valley-floor towns are moved to the lowest sample within a few samples of their rounded position (citedLonLat keeps the cited one).',
    'citedAltM figures are commonly cited, approximate; gridAltM is the heightfield value at the line position.',
    'The corridor (Muktinath to Marpha, ROUTE-FACTS §7) follows the cited places on the road (F166 to the Kagbeni ' +
      'junction, then NH48), road topology from OSM Overpass only; it starts on the walked line\'s last point. ' +
      'Drawn as a planned road leg; how he travels it is not stated anywhere.',
  ],
  sources: NORTH_SOURCES,
  lines: [
    { id: 'corridor', mode: 'jeep', drawn: true, flags: JEEP_FLAGS, from: 'muktinath', to: 'marpha', points: corridor.points },
    { id: 'jeep', mode: 'jeep', drawn: true, flags: JEEP_FLAGS, from: 'marpha', to: 'humkhola', points: jeep.points },
    { id: 'trek', mode: 'foot', drawn: true, flags: TREK_FLAGS, from: 'humkhola', to: 'anbc', points: trek.points },
  ],
  places,
  bounds: {
    region: REGION_ID,
    lon: [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))],
    lat: [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))],
    altM: [Math.min(...all.map((p) => p[2])), Math.max(...all.map((p) => p[2]))],
  },
};

/** The shipped file: geometry, ids, flags and the shown altitude (a summit's, or a place marked showAlt). */
const lean = {
  version: 2,
  id: doc.id,
  lines: doc.lines.map(({ id, drawn, points }) => ({ id, drawn, points })),
  places: places.map((p) => {
    const rec = { id: p.id, kind: p.kind, lon: p.lon, lat: p.lat, flags: p.flags };
    if (p.at) rec.at = p.at;
    if ((p.showAlt || p.kind === 'summit') && typeof p.citedAltM === 'number') rec.altM = p.citedAltM;
    return rec;
  }),
};

mkdirSync(dirname(outPath), { recursive: true });
const text = `${JSON.stringify(lean)}\n`;
writeFileSync(outPath, text);
mkdirSync(dirname(fullPath), { recursive: true });
writeFileSync(fullPath, `${JSON.stringify(doc, null, 1)}\n`);
console.log(`${relative(ROOT, fullPath)}: full derivation (not served)`);

const pathKm = (pts) => {
  let s = 0;
  for (let k = 1; k < pts.length; k += 1) {
    const [ax, ay] = toKm(pts[k - 1][0], pts[k - 1][1]);
    const [bx, by] = toKm(pts[k][0], pts[k][1]);
    s += Math.hypot(bx - ax, by - ay);
  }
  return s.toFixed(1);
};
console.log(`${relative(ROOT, outPath)}: ${statSync(outPath).size} B, ${gzipSync(text, { level: 9 }).length} B gz`);
for (const [id, line] of [['corridor', corridor], ['jeep', jeep], ['trek', trek]]) {
  const alts = line.points.map((p) => p[2]);
  console.log(`  ${id.padEnd(8)} ${String(line.points.length).padStart(4)} pts, ~${pathKm(line.points)} km plan, ${Math.min(...alts)} to ${Math.max(...alts)} m`);
}
for (const s of snapLog) console.log(`  snap ${s.name.padEnd(16)} moved ${s.movedKm} km, grid ${s.from} > ${s.to} m`);
for (const p of places) {
  if (typeof p.citedAltM !== 'number') continue;
  const diff = p.gridAltM - p.citedAltM;
  console.log(`  ${p.name.padEnd(30)} cited ${String(p.citedAltM).padStart(5)} m, grid ${String(p.gridAltM).padStart(5)} m (${diff >= 0 ? '+' : ''}${diff})`);
}
