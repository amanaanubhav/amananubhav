import { BufferAttribute, BufferGeometry } from 'three';

/*
 * Heightfields (§C.5 "Heightfield format"): `public/data/terrain/<id>.bin` holds little-endian
 * Uint16 heights in whole metres, `cols x rows` samples, row-major north to south, west to east;
 * `<id>.json` holds the metadata. Both are fetched after the scene mounts (the raw data is cached
 * per id); the plane is displaced on the CPU once, into a Float32 position attribute (y = the
 * normalised height, scaled by the material's relief uniforms) plus `aHeightM` in metres.
 */

export interface HeightfieldMeta {
  readonly cols: number;
  readonly rows: number;
  /** [west, south, east, north] in degrees. */
  readonly bbox: readonly [number, number, number, number];
  readonly minM: number;
  readonly maxM: number;
  readonly source: 'terrain-tiles' | 'procedural';
  readonly seed?: number;
  readonly attribution?: string;
}

/** World placement of a heightfield: x = east, -z = north, y = up; the plane is centred on 0. */
export interface TerrainFrame {
  readonly width: number;
  readonly depth: number;
  /** World units of the full height range (uExaggeration, §C.5: 2.2). */
  readonly exaggeration: number;
  readonly minM: number;
  readonly maxM: number;
  /** Kilometres per world unit (east-west, at the mid latitude). */
  readonly kmPerUnit: number;
  /** Longitude/latitude to world [x, z]. */
  toXZ(lon: number, lat: number): [number, number];
  /** Metres to the normalised height (0 at minM, 1 at maxM; not clamped). */
  normHeight(m: number): number;
}

export interface LoadedHeightfield {
  readonly id: string;
  readonly meta: HeightfieldMeta;
  readonly frame: TerrainFrame;
  /**
   * The displaced plane: `position` (x, normalised height, z), `aHeightM` (metres) and `aGrad`
   * (height gradient, metres per world unit). Dispose it on unmount.
   */
  readonly geometry: BufferGeometry;
  /** Metres at a world position (bilinear over the full-resolution grid; clamped to the edges). */
  heightAtXZ(x: number, z: number): number;
}

export interface LoadHeightfieldOptions {
  /** Tier 1 samples every other row and column (129 x 129 from 257 x 257). */
  tier: 1 | 2;
  /** World width of the plane (§G.8: 20); the depth follows the bbox aspect. */
  width?: number;
  exaggeration?: number;
  signal?: AbortSignal;
}

interface RawHeightfield {
  meta: HeightfieldMeta;
  heights: Uint16Array;
}

const rawCache = new Map<string, Promise<RawHeightfield>>();
const KM_PER_DEG = 111.32;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseMeta(json: unknown): HeightfieldMeta {
  const m = json as Partial<HeightfieldMeta> | null;
  if (!m || typeof m !== 'object') throw new Error('heightfield: metadata is not an object');
  const { cols, rows, bbox, minM, maxM, source } = m;
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || (cols as number) < 2 || (rows as number) < 2) {
    throw new Error('heightfield: cols/rows missing or invalid');
  }
  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(isFiniteNumber)) {
    throw new Error('heightfield: bbox missing or invalid');
  }
  const [west, south, east, north] = bbox;
  if (!(east > west) || !(north > south)) throw new Error('heightfield: bbox is empty');
  if (!isFiniteNumber(minM) || !isFiniteNumber(maxM) || !(maxM > minM)) {
    throw new Error('heightfield: minM/maxM missing or invalid');
  }
  return {
    cols: cols as number,
    rows: rows as number,
    bbox: [west, south, east, north],
    minM,
    maxM,
    source: source === 'procedural' ? 'procedural' : 'terrain-tiles',
    seed: isFiniteNumber(m.seed) ? m.seed : undefined,
    attribution: typeof m.attribution === 'string' ? m.attribution : undefined,
  };
}

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`heightfield: ${url} answered ${response.status}`);
  return response;
}

function fetchRaw(id: string): Promise<RawHeightfield> {
  const cached = rawCache.get(id);
  if (cached) return cached;
  const base = `/data/terrain/${encodeURIComponent(id)}`;
  const promise = Promise.all([
    fetchOk(`${base}.json`).then((r) => r.json() as Promise<unknown>),
    fetchOk(`${base}.bin`).then((r) => r.arrayBuffer()),
  ]).then(([json, buffer]) => {
    const meta = parseMeta(json);
    const count = meta.cols * meta.rows;
    if (buffer.byteLength !== count * 2) {
      throw new Error(`heightfield: ${id}.bin holds ${buffer.byteLength} bytes, expected ${count * 2}`);
    }
    const view = new DataView(buffer);
    const heights = new Uint16Array(count);
    for (let i = 0; i < count; i++) heights[i] = view.getUint16(i * 2, true);
    return { meta, heights };
  });
  rawCache.set(id, promise);
  // A failed load may be retried by the next mount. The shared fetch is never aborted (callers
  // that unmount simply ignore the result through their own signal).
  promise.catch(() => rawCache.delete(id));
  return promise;
}

export function createTerrainFrame(meta: HeightfieldMeta, width = 20, exaggeration = 2.2): TerrainFrame {
  const [west, south, east, north] = meta.bbox;
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  const lonKm = (east - west) * KM_PER_DEG * Math.cos(midLat);
  const latKm = (north - south) * KM_PER_DEG;
  const depth = width * (latKm / lonKm);
  const range = meta.maxM - meta.minM;
  return {
    width,
    depth,
    exaggeration,
    minM: meta.minM,
    maxM: meta.maxM,
    kmPerUnit: lonKm / width,
    toXZ: (lon, lat) => [
      ((lon - west) / (east - west) - 0.5) * width,
      ((north - lat) / (north - south) - 0.5) * depth,
    ],
    normHeight: (m) => (m - meta.minM) / range,
  };
}

function buildGeometry(raw: RawHeightfield, frame: TerrainFrame, step: 1 | 2): BufferGeometry {
  const { cols, rows } = raw.meta;
  const gx = Math.floor((cols - 1) / step) + 1;
  const gz = Math.floor((rows - 1) / step) + 1;
  const count = gx * gz;
  const positions = new Float32Array(count * 3);
  const heightsM = new Float32Array(count);
  const spanX = ((gx - 1) * step) / (cols - 1);
  const spanZ = ((gz - 1) * step) / (rows - 1);

  let v = 0;
  for (let j = 0; j < gz; j++) {
    const row = j * step;
    const z = ((j / (gz - 1)) * spanZ - 0.5) * frame.depth;
    for (let i = 0; i < gx; i++) {
      const h = raw.heights[row * cols + i * step];
      positions[v * 3] = ((i / (gx - 1)) * spanX - 0.5) * frame.width;
      positions[v * 3 + 1] = frame.normHeight(h);
      positions[v * 3 + 2] = z;
      heightsM[v] = h;
      v++;
    }
  }

  // Height gradient (metres per world unit, central differences two samples apart): the contour
  // material turns it into a smooth on-screen line density, so dense slopes read as a tone, never
  // as sparkle.
  const grad = new Float32Array(count * 2);
  const reach = 2 * step;
  const unitX = frame.width / (cols - 1);
  const unitZ = frame.depth / (rows - 1);
  const at = (c: number, r: number) =>
    raw.heights[Math.min(rows - 1, Math.max(0, r)) * cols + Math.min(cols - 1, Math.max(0, c))];
  v = 0;
  for (let j = 0; j < gz; j++) {
    for (let i = 0; i < gx; i++) {
      const c = i * step;
      const r = j * step;
      grad[v * 2] = (at(c + reach, r) - at(c - reach, r)) / (2 * reach * unitX);
      grad[v * 2 + 1] = (at(c, r + reach) - at(c, r - reach)) / (2 * reach * unitZ);
      v++;
    }
  }

  const index = new Uint32Array((gx - 1) * (gz - 1) * 6);
  let k = 0;
  for (let j = 0; j < gz - 1; j++) {
    for (let i = 0; i < gx - 1; i++) {
      const a = j * gx + i;
      const b = a + 1;
      const c = a + gx;
      const d = c + 1;
      index[k++] = a;
      index[k++] = c;
      index[k++] = b;
      index[k++] = b;
      index[k++] = c;
      index[k++] = d;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aHeightM', new BufferAttribute(heightsM, 1));
  geometry.setAttribute('aGrad', new BufferAttribute(grad, 2));
  geometry.setIndex(new BufferAttribute(index, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function heightSampler(raw: RawHeightfield, frame: TerrainFrame): (x: number, z: number) => number {
  const { cols, rows } = raw.meta;
  const { heights } = raw;
  return (x, z) => {
    const fx = Math.min(cols - 1, Math.max(0, (x / frame.width + 0.5) * (cols - 1)));
    const fz = Math.min(rows - 1, Math.max(0, (z / frame.depth + 0.5) * (rows - 1)));
    const x0 = Math.floor(fx);
    const z0 = Math.floor(fz);
    const x1 = Math.min(cols - 1, x0 + 1);
    const z1 = Math.min(rows - 1, z0 + 1);
    const tx = fx - x0;
    const tz = fz - z0;
    const top = heights[z0 * cols + x0] * (1 - tx) + heights[z0 * cols + x1] * tx;
    const bottom = heights[z1 * cols + x0] * (1 - tx) + heights[z1 * cols + x1] * tx;
    return top * (1 - tz) + bottom * tz;
  };
}

/**
 * Fetches `<id>.json` and `<id>.bin` and builds the displaced plane once (257² at tier 2, 129² at
 * tier 1). Rejects when either file is missing, fails to fetch, or does not hold `cols x rows`
 * values; the caller then keeps its poster (§C.5 "Missing data").
 */
export async function loadHeightfield(
  id: string,
  options: LoadHeightfieldOptions = { tier: 2 },
): Promise<LoadedHeightfield> {
  const raw = await fetchRaw(id);
  options.signal?.throwIfAborted();
  const frame = createTerrainFrame(raw.meta, options.width, options.exaggeration);
  return {
    id,
    meta: raw.meta,
    frame,
    geometry: buildGeometry(raw, frame, options.tier === 1 ? 2 : 1),
    heightAtXZ: heightSampler(raw, frame),
  };
}
