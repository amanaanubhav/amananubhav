import { BufferAttribute, Group, type BufferGeometry, type Mesh } from 'three';

import { takePrefetched } from '@/shared/lib/stage-prefetch';
import {
  addSkirt,
  createNextLine,
  createNextLineUniforms,
  createNextMarkers,
  createNorthGrowUniform,
  createNorthTerrain,
  focusAt,
  loadHeightfield,
  type LoadedHeightfield,
  type NextLine,
  type NextLineUniforms,
  type NextMarkerKind,
  type NextMarkers,
  type NorthGrowUniform,
  type StoryUniforms,
  type TerrainFrame,
} from '@/shared/ui/stage-three';

import { createCameraTrack, type CameraTrack } from './camera';
import type { NextFrame, NextMarkState } from './frame';
import {
  NEXT_ANCHOR_LONLAT,
  NEXT_CAMERA_KEYS,
  NEXT_MARKS,
  NEXT_ROUTE_URL,
  NEXT_SPANS,
  NEXT_TERRAIN_ID,
  nextAzAt,
  rideShareAt,
  type NextAnchor,
  type NextMarkDef,
} from './next-timeline';

/*
 * The #next part of the relief scene (NEXT-DESIGN §5.2; BUILD-REPORT "Transition fixes"), three.js side: loads the
 * north tile and the expected route lazily, places them in the story's world frame and builds the north terrain
 * (an exact stand-in for the story tile until the reveal passes, then its own look), the road and trek line, the
 * marks and the camera track. Reached only from ReliefAnnapurnaScene (the lazy relief chunk); never from the page.
 */

/** The route file (scripts/terrain/build-north-route.mjs). Only geometry and ids are read; never its notes. */
interface NextRouteFile {
  readonly lines: readonly { id: string; points: readonly (readonly number[])[] }[];
  readonly places: readonly {
    id: string;
    lon: number;
    lat: number;
    at?: { line: string; index: number } | readonly { line: string; index: number }[];
  }[];
}

/** A draped line in story world units with its length and the terrain metres per point. */
export interface NextStrip {
  readonly n: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly L: Float32Array;
  readonly total: number;
}

export interface NextMark {
  readonly def: NextMarkDef;
  x: number;
  y: number;
  z: number;
  /** Share along its line (the road or the trek), 0..1; -1 off both lines. */
  readonly share: number;
  /** Road marks: the story position (vh) at which the ride head reaches it. */
  readonly sAt: number;
  /** Instance in the marker mesh, or -1 (Muktinath keeps the story's own disc). */
  readonly inst: number;
  readonly state: NextMarkState;
}

export interface NextData {
  readonly group: Group;
  readonly terrain: Mesh;
  /** The north tile's box in story world units [x0, z0, x1, z1] (the story tile hands it over). */
  readonly box: readonly [number, number, number, number];
  /** The planned road: the corridor Muktinath > Marpha, then the jeep leg to Humkhola (one length). */
  readonly ride: NextStrip;
  /** The road smoothed over about ±3.4 km of its length: the path the camera target follows (no jerk at a bend). */
  readonly rideCam: NextStrip;
  readonly trek: NextStrip;
  readonly track: CameraTrack;
  readonly marks: readonly NextMark[];
  /** Instance of the ride head in the marker mesh. */
  readonly headInst: number;
  readonly markers: NextMarkers;
  readonly line: NextLine;
  readonly lineU: NextLineUniforms;
  /** The north tile's reveal front (radius, band, centre at the walked line's end). */
  readonly grow: NorthGrowUniform;
  /** Metres at a world point as drawn once revealed: the north tile inside its box, else the story's. */
  heightM(x: number, z: number): number;
  /** World y at a world point as drawn once revealed (story normalisation x exaggeration x the tile's sink). */
  yOf(x: number, z: number): number;
  readonly frame: NextFrame;
  dispose(): void;
}

export interface StoryGround {
  readonly frame: TerrainFrame;
  heightM(x: number, z: number): number;
  /** The story terrain's geometry as drawn (tier 1 keeps every other sample): its surface is sampled exactly. */
  readonly geometry: BufferGeometry;
  /** That geometry's vertex grid (columns, rows). */
  readonly grid: readonly [number, number];
  /** The story island's focus points (x, z pairs): its route and peaks. */
  readonly focus: readonly number[];
  /** The walked lines' points (x, z pairs): the north tile keeps the story's heights under them. */
  readonly walked: readonly number[];
  readonly overview: readonly [number, number];
  readonly exaggeration: number;
}

export async function loadNext(
  tier: 1 | 2,
  kmPerUnit: number,
  exaggeration: number,
  signal: AbortSignal,
): Promise<[LoadedHeightfield, NextRouteFile]> {
  const route = (takePrefetched<NextRouteFile>(NEXT_ROUTE_URL) ?? Promise.reject()).catch(() =>
    fetch(NEXT_ROUTE_URL, { signal }).then((r) => {
      if (!r.ok) throw new Error(`next route: ${NEXT_ROUTE_URL} answered ${r.status}`);
      return r.json() as Promise<NextRouteFile>;
    }),
  );
  const hf = loadHeightfield(NEXT_TERRAIN_ID, { tier, kmPerUnit, exaggeration, signal });
  // The route failing after the heightfield resolved leaves its geometry with no owner: dispose it here.
  return Promise.all([hf, route]).catch(async (error: unknown) => {
    const loaded = await hf.catch(() => null);
    loaded?.geometry.dispose();
    throw error;
  });
}

const MARKER_KIND: Readonly<Record<NextMarkDef['kind'], NextMarkerKind | -1>> = {
  'circuit-end': -1,
  'jeep-start': 1,
  road: 0,
  via: 0,
  trailhead: 2,
  camp: 3,
  goal: 4,
  summit: 5,
};

/** The story position (vh) at which the ride head reaches `share` of the road (bisection; the share is monotone). */
function sAtRideShare(share: number): number {
  let lo: number = NEXT_SPANS.ride[0];
  let hi: number = NEXT_SPANS.ride[1];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (rideShareAt(mid) < share) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The north tile's rim centre (latitude): the middle of the 28.40-28.95 N lattice the route was derived on. The tile
 * reaches on north (shared.mjs); its rim keeps this centre, so only its north half grows (NorthTerrainOptions.rim).
 */
const NORTH_RIM_CENTRE_LAT = 28.675;

/** The superellipse rim radius (degree 8) of the terrain shaders: 0 at the centre, 1 on the rounded rim. */
function rimR(x: number, z: number, hx: number, hz: number): number {
  let qx = (x / hx) * (x / hx);
  let qz = (z / hz) * (z / hz);
  qx *= qx;
  qz *= qz;
  return Math.sqrt(Math.sqrt(Math.sqrt(qx * qx + qz * qz)));
}

/**
 * Samples a heightfield plane exactly as drawn: its row-major vertex grid (`gx` x `gz`, triangles a-c-b and b-c-d
 * per cell, as `loadHeightfield` builds it), linear on each triangle. Writes `size` values of `attr` at (x, z).
 */
function drawnSampler(geometry: BufferGeometry, gx: number, gz: number) {
  const pos = geometry.getAttribute('position');
  const x0 = pos.getX(0);
  const x1 = pos.getX(gx - 1);
  const z0 = pos.getZ(0);
  const z1 = pos.getZ((gz - 1) * gx);
  return (attr: ArrayLike<number>, size: number, x: number, z: number, out: number[]) => {
    const u = Math.min(gx - 1.000001, Math.max(0, ((x - x0) / (x1 - x0)) * (gx - 1)));
    const v = Math.min(gz - 1.000001, Math.max(0, ((z - z0) / (z1 - z0)) * (gz - 1)));
    const i = Math.floor(u);
    const j = Math.floor(v);
    const tx = u - i;
    const tz = v - j;
    const a = (j * gx + i) * size;
    const b = a + size;
    const c = a + gx * size;
    const d = c + size;
    for (let k = 0; k < size; k++) {
      out[k] =
        tx + tz <= 1
          ? attr[a + k] + (attr[b + k] - attr[a + k]) * tx + (attr[c + k] - attr[a + k]) * tz
          : attr[d + k] + (attr[c + k] - attr[d + k]) * (1 - tx) + (attr[b + k] - attr[d + k]) * (1 - tz);
    }
  };
}

/** The x, z pairs of `points` within `margin` of the box [x0, z0, x1, z1] (keeps focus grids small). */
function near(points: readonly number[], box: readonly number[], margin: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const z = points[i + 1];
    if (x > box[0] - margin && x < box[2] + margin && z > box[1] - margin && z < box[3] + margin) out.push(x, z);
  }
  return out;
}

/** A copy of `c` resampled every `step` and box-filtered over ±`half` of its length (ends held). */
function smoothStrip(c: NextStrip, step: number, half: number): NextStrip {
  const n = Math.floor(c.total / step) + 1;
  const px = new Float32Array(n);
  const pz = new Float32Array(n);
  const p = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < n; i++) {
    nextPoint(c, i * step, p);
    px[i] = p.x;
    pz[i] = p.z;
  }
  const r = Math.round(half / step);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const z = new Float32Array(n);
  const L = new Float32Array(n);
  // Running sums over the clamped window.
  let sx = 0;
  let sz = 0;
  for (let k = -r; k <= r; k++) {
    const j = Math.min(n - 1, Math.max(0, k));
    sx += px[j];
    sz += pz[j];
  }
  for (let i = 0; i < n; i++) {
    x[i] = sx / (2 * r + 1);
    z[i] = sz / (2 * r + 1);
    L[i] = i * step;
    const out = Math.min(n - 1, Math.max(0, i - r));
    const inn = Math.min(n - 1, Math.max(0, i + r + 1));
    sx += px[inn] - px[out];
    sz += pz[inn] - pz[out];
  }
  return { n, x, y, z, L, total: (n - 1) * step };
}

/**
 * Builds the #next part in steps (a generator: the caller runs one step per idle callback, so no step is a long task;
 * about 15-35 ms each on a slow laptop). The last step returns the data.
 */
export function* buildNextSteps(
  hf: LoadedHeightfield,
  route: NextRouteFile,
  story: StoryGround,
  u: StoryUniforms,
  tier: 1 | 2,
): Generator<undefined, NextData, undefined> {
  const sf = story.frame;
  const nf = hf.frame;
  const [w, s, e, n] = hf.meta.bbox;
  // Place the north plane in the story's world frame: same origin, km per unit and height normalisation.
  const [cx, cz] = sf.toXZ((w + e) / 2, (s + n) / 2);
  const [ax0, az0] = sf.toXZ(w, n);
  const [ax1, az1] = sf.toXZ(e, s);
  const sx = (ax1 - ax0) / nf.width;
  const sz = (az1 - az0) / nf.depth;
  const box: [number, number, number, number] = [ax0, az0, ax1, az1];
  const inBox = (x: number, z: number) => x > ax0 && x < ax1 && z > az0 && z < az1;
  const hxS = sf.width / 2;
  const hzS = sf.depth / 2;
  const hxN = nf.width / 2;
  const hzN = nf.depth / 2;
  // This tile's rim is measured from NORTH_RIM_CENTRE_LAT: its south, east and west fades are those of the 28.40-28.95 N
  // lattice; its north half runs on to the tile's north edge (~29.15 N), so looking north over the corridor the island
  // has faded into the ground long before the rim sinks: no hard horizon (fix2 verify P1). Local plane units.
  const rimZ = Math.min(hzN * 0.9, Math.max(-hzN * 0.9, ((n - NORTH_RIM_CENTRE_LAT) / (n - s) - 0.5) * nf.depth));
  const rimN = { x: hxN, north: hzN + rimZ, south: hzN - rimZ, z: rimZ };
  const rimOfN = (px: number, pz: number) => rimR(px, pz - rimN.z, hxN, pz < rimN.z ? rimN.north : rimN.south);

  // The plane as drawn (tier 1 keeps every other sample).
  const geo0 = hf.geometry;
  const pos = geo0.getAttribute('position');
  const P = pos.array as Float32Array;
  const hm = geo0.getAttribute('aHeightM').array as Float32Array;
  const grad = geo0.getAttribute('aGrad').array as Float32Array;
  const step = tier === 1 ? 2 : 1;
  const gx = Math.floor((hf.meta.cols - 1) / step) + 1;
  const gz = Math.floor((hf.meta.rows - 1) / step) + 1;
  const count = pos.count;

  // The story tile as drawn, at every north vertex: metres, gradient (its own drawn grid and triangles).
  const sg = story.geometry;
  const storyDrawn = drawnSampler(sg, story.grid[0], story.grid[1]);
  const storyHm = sg.getAttribute('aHeightM').array as ArrayLike<number>;
  const storyGrad = sg.getAttribute('aGrad').array as ArrayLike<number>;

  const xz = new Float32Array(count * 2);
  for (let v = 0; v < count; v++) {
    xz[v * 2] = cx + P[v * 3] * sx;
    xz[v * 2 + 1] = cz + P[v * 3 + 2] * sz;
  }
  // Keep the story's heights within ~2.7 km of the walked lines (their ribbon is draped on them), own heights from ~6.8 km.
  const walked = near(story.walked, box, 2);
  const keep = walked.length ? focusAt(xz, walked, 0.8, 2).map((f) => 1 - f) : new Float32Array(count).fill(1);
  yield;

  const aStory = new Float32Array(count * 4);
  const finalM = new Float32Array(count);
  const finalY = new Float32Array(count);
  const tmp = [0, 0];
  const mid = count >> 1;
  for (let v = 0; v < count; v++) {
    // Two idle steps: the tile grew north (fix2 verify), so this loop is split to stay under a long task.
    if (v === mid) yield;
    const x = xz[v * 2];
    const z = xz[v * 2 + 1];
    const own = hm[v];
    const rS = rimR(x, z, hxS, hzS);
    const rN = rimOfN(P[v * 3], P[v * 3 + 2]);
    // Off the story tile (its sunk, faded rim and beyond) the stand-in is this tile's own surface.
    const offS = sstep(0.92, 1, rS);
    storyDrawn(storyHm, 1, x, z, tmp);
    const m = tmp[0] + (own - tmp[0]) * offS;
    storyDrawn(storyGrad, 2, x, z, tmp);
    aStory[v * 4] = m;
    aStory[v * 4 + 1] = sf.normHeight(m);
    aStory[v * 4 + 2] = tmp[0] + (grad[v * 2] - tmp[0]) * offS;
    aStory[v * 4 + 3] = tmp[1] + (grad[v * 2 + 1] - tmp[1]) * offS;
    // Once revealed (the shader at k = 1): own heights except along the walked lines and in the rim over the story.
    const cover = 1 - sstep(0.97, 1, rS);
    const wN = 1 - sstep(0.7, 0.99, rN);
    const kH = keep[v] * (1 + (wN - 1) * cover);
    // Once the front has passed, the story tile's north rim no longer sinks (GLSL_NORTH_RIM_LIFT).
    const sinkS = 1 - sstep(0.8, 1, rS) * (1 - sstep(0, 0.25, -z / hzS));
    const sink = (1 - sstep(0.7, 1, rN)) * (1 - cover) + (sinkS + (1 - sinkS) * wN) * cover;
    finalM[v] = m + (own - m) * kH;
    finalY[v] = sf.normHeight(finalM[v]) * story.exaggeration * sink;
  }
  // Heights in the STORY tile's normalisation, so both tiles share one vertical scale.
  for (let v = 0; v < count; v++) P[v * 3 + 1] = sf.normHeight(hm[v]);
  pos.needsUpdate = true;
  yield;

  // The revealed surface as drawn: bilinear on the drawn grid, and the triangles' own value (the line takes the higher).
  const gridAt = (arr: Float32Array, x: number, z: number) => {
    const fx = Math.min(gx - 1.000001, Math.max(0, ((x - cx) / sx / nf.width + 0.5) * (gx - 1)));
    const fz = Math.min(gz - 1.000001, Math.max(0, ((z - cz) / sz / nf.depth + 0.5) * (gz - 1)));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const at = (c: number, r: number) => arr[r * gx + c];
    const bil = (at(i, j) * (1 - tx) + at(i + 1, j) * tx) * (1 - tz) + (at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx) * tz;
    const tri =
      tx + tz <= 1
        ? at(i, j) + (at(i + 1, j) - at(i, j)) * tx + (at(i, j + 1) - at(i, j)) * tz
        : at(i + 1, j + 1) + (at(i, j + 1) - at(i + 1, j + 1)) * (1 - tx) + (at(i + 1, j) - at(i + 1, j + 1)) * (1 - tz);
    return Math.max(bil, tri);
  };
  const heightM = (x: number, z: number) => (inBox(x, z) ? gridAt(finalM, x, z) : story.heightM(x, z));
  const yOf = (x: number, z: number) =>
    inBox(x, z) ? gridAt(finalY, x, z) : sf.normHeight(story.heightM(x, z)) * story.exaggeration;

  const strip = (pts: readonly (readonly number[])[]): NextStrip => {
    const m = pts.length;
    const x = new Float32Array(m);
    const y = new Float32Array(m);
    const z = new Float32Array(m);
    const L = new Float32Array(m);
    let len = 0;
    for (let i = 0; i < m; i++) {
      const [px, pz] = sf.toXZ(pts[i][0], pts[i][1]);
      if (i > 0) len += Math.hypot(px - x[i - 1], pz - z[i - 1]);
      x[i] = px;
      z[i] = pz;
      L[i] = len;
      y[i] = yOf(px, pz);
    }
    return { n: m, x, y, z, L, total: len };
  };
  const linePts = (id: string) => route.lines.find((l) => l.id === id)?.points ?? [];
  const corridorPts = linePts('corridor');
  const jeepPts = linePts('jeep');
  // One road: the corridor ends where the jeep line starts (Marpha, the same snapped point).
  const ride = strip([...corridorPts, ...jeepPts.slice(1)]);
  const trek = strip(linePts('trek'));
  if (corridorPts.length < 2 || jeepPts.length < 2 || trek.n < 2) throw new Error('next route: a line is missing');
  const rideCam = smoothStrip(ride, 0.05, 1);
  const lineIndex = (line: string, index: number) =>
    line === 'corridor' ? index : line === 'jeep' ? corridorPts.length - 1 + index : -1;

  // Marks: on their line where the route file places them, else at their coordinates.
  const placeOf = (id: string) => route.places.find((p) => p.id === id);
  const points: { x: number; y: number; z: number; kind: NextMarkerKind }[] = [];
  const focusExtra: number[] = [];
  const cell = (nf.width / (hf.meta.cols - 1)) * sx;
  const marks: NextMark[] = NEXT_MARKS.map((def) => {
    const pl = placeOf(def.id);
    let x = 0;
    let z = 0;
    let share = -1;
    let sAt = 0;
    const ats = (pl?.at ? (Array.isArray(pl.at) ? pl.at : [pl.at]) : []) as readonly { line: string; index: number }[];
    // Humkhola ends the road and starts the trek: it belongs to the trek's reveal.
    const at =
      def.kind === 'trailhead'
        ? ats.find((a) => a.line === 'trek')
        : (ats.find((a) => lineIndex(a.line, a.index) >= 0) ?? ats.find((a) => a.line === 'trek'));
    if (at && at.line === 'trek') {
      const i = Math.min(trek.n - 1, Math.max(0, at.index));
      x = trek.x[i];
      z = trek.z[i];
      share = trek.L[i] / trek.total;
    } else if (at) {
      const i = Math.min(ride.n - 1, Math.max(0, lineIndex(at.line, at.index)));
      x = ride.x[i];
      z = ride.z[i];
      share = ride.L[i] / ride.total;
      sAt = sAtRideShare(share);
    } else if (pl) {
      [x, z] = sf.toXZ(pl.lon, pl.lat);
    }
    if (def.kind === 'summit') {
      // Snap to the north tile's highest sample nearby (the summit, not the rounded coordinate).
      let best = -1;
      const x0 = x;
      const z0 = z;
      for (let j = -3; j <= 3; j++)
        for (let i = -3; i <= 3; i++) {
          const h = heightM(x0 + i * cell, z0 + j * cell);
          if (h > best) {
            best = h;
            x = x0 + i * cell;
            z = z0 + j * cell;
          }
        }
      focusExtra.push(x, z);
    }
    const y = yOf(x, z);
    const kind = MARKER_KIND[def.kind];
    const inst = kind === -1 || !pl ? -1 : points.length;
    if (inst >= 0) points.push({ x, y, z, kind: kind as NextMarkerKind });
    return {
      def,
      x,
      y,
      z,
      share,
      sAt,
      inst,
      state: { id: def.id, kind: def.kind, x: 0, y: 0, pri: -1, visible: false },
    };
  });
  const headInst = points.length;
  points.push({ x: ride.x[0], y: ride.y[0], z: ride.z[0], kind: 6 });

  // The north island: the story's own points near the tile, the road, the trek and Annapurna I (design §5.2: one island).
  const storyFocus = near(story.focus, box, 6.5);
  const focusN: number[] = [...storyFocus, ...focusExtra];
  for (const c of [ride, trek]) for (let i = 0; i < c.n; i += 2) focusN.push(c.x[i], c.z[i]);
  geo0.setAttribute('aFocus', new BufferAttribute(focusAt(xz, focusN, 2.5, 6.5), 1));
  yield;
  geo0.setAttribute('aFocusS', new BufferAttribute(focusAt(xz, storyFocus, 2.5, 6.5), 1));
  geo0.setAttribute('aStory', new BufferAttribute(aStory, 4));
  geo0.setAttribute('aKeep', new BufferAttribute(keep, 1));
  yield;
  const geo = addSkirt(geo0, gx, gz);
  geo0.dispose();

  const grow = createNorthGrowUniform();
  grow.value.set(0, 1, ride.x[0], ride.z[0]);
  const terrain = createNorthTerrain(geo, u, {
    hillshade: tier === 2,
    frost: tier === 2,
    rim: rimN,
    grow,
  });
  terrain.position.set(cx, 0, cz);
  terrain.scale.set(sx, 1, sz);
  terrain.visible = false;

  const lineU = createNextLineUniforms();
  const line = createNextLine(ride, trek, u, lineU);
  line.back.visible = false;
  line.front.visible = false;
  const markers = createNextMarkers(points, u);
  markers.mesh.visible = false;

  const group = new Group();
  group.add(terrain, line.back, line.front, markers.mesh);

  // The track: K1 is the story's own overview anchor, the rest are framing points on the road.
  const anchors = { overview: story.overview } as Record<NextAnchor, readonly [number, number]>;
  for (const [k, [lon, lat]] of Object.entries(NEXT_ANCHOR_LONLAT)) anchors[k as NextAnchor] = sf.toXZ(lon, lat);

  return {
    group,
    terrain,
    box,
    ride,
    rideCam,
    trek,
    track: createCameraTrack(NEXT_CAMERA_KEYS, anchors, { next: { azAt: nextAzAt } }),
    marks,
    headInst,
    markers,
    line,
    lineU,
    grow,
    heightM,
    yOf,
    frame: { handoff: 0, rest: false, trek: 0, marks: marks.map((m) => m.state) },
    dispose() {
      geo.dispose();
      (terrain.material as { dispose(): void }).dispose();
      line.dispose();
      markers.dispose();
    },
  };
}

/** The point at length `l` along a next strip (clamped). */
export function nextPoint(c: NextStrip, l: number, out: { x: number; y: number; z: number }): void {
  const v = Math.min(c.total, Math.max(0, l));
  let lo = 0;
  let hi = c.n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c.L[m] <= v) lo = m;
    else hi = m;
  }
  const span = c.L[hi] - c.L[lo];
  const t = span > 0 ? (v - c.L[lo]) / span : 0;
  out.x = c.x[lo] + (c.x[hi] - c.x[lo]) * t;
  out.y = c.y[lo] + (c.y[hi] - c.y[lo]) * t;
  out.z = c.z[lo] + (c.z[hi] - c.z[lo]) * t;
}

const tanA = { x: 0, y: 0, z: 0 };
/** Unit horizontal tangent (x, z) at length `l`, over ±0.3 world units of the strip (a smooth turn at a bend). */
export function nextTangent(c: NextStrip, l: number, out: { x: number; y: number; z: number }): void {
  const a = tanA;
  nextPoint(c, l - 0.3, a);
  nextPoint(c, l + 0.3, out);
  const dx = out.x - a.x;
  const dz = out.z - a.z;
  const d = Math.hypot(dx, dz);
  out.x = d ? dx / d : 0;
  out.y = 0;
  out.z = d ? dz / d : -1;
}
