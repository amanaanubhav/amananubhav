import { STORY_ACTS, STORY_MAIN_SEGMENTS, STORY_TRIP_SEGMENTS, type StoryActDef } from './timeline';

/*
 * Route geometry and the story function (design §5.1, §7). Pure: no three.js, no DOM. The scene
 * builds the strips once from `/data/routes/annapurna-route.json` (his recorded days rebuilt on
 * trails), draped on the heightfield; `storyAt(s)` then says where the head is, how much of the
 * main line and of each side trip is drawn, and which act (day, place) is running.
 */

export interface RouteSegment {
  readonly id: string;
  readonly kind: 'main' | 'side';
  readonly walked?: boolean;
  /** [lon, lat, altM] */
  readonly points: readonly (readonly number[])[];
}
export interface RouteWaypoint {
  readonly id: string;
  readonly lon: number;
  readonly lat: number;
}
export interface RouteData {
  readonly segments: readonly RouteSegment[];
  readonly waypoints: readonly RouteWaypoint[];
}

export interface Ground {
  toXZ(lon: number, lat: number): [number, number];
  /** Metres at a world position. */
  heightM(x: number, z: number): number;
  /** World y of a height in metres. */
  y(m: number): number;
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

/** A polyline along the route: points, length along it, terrain metres and a style (0 walked, 2 jeep). */
export interface Strip {
  readonly n: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly hm: Float32Array;
  readonly L: Float32Array;
  readonly style: Uint8Array;
  /** Main strip: each segment's [start, end] length. */
  readonly segs: Readonly<Record<string, readonly [number, number]>>;
  readonly total: number;
}

type P2 = readonly [number, number];
const chaikin = (pts: readonly P2[]): P2[] => {
  if (pts.length < 3) return pts.slice();
  const out: P2[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    out.push(
      [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25],
      [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75],
    );
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** Joins the segments `ids` (in order) into one strip, smoothed twice and draped on the ground. */
export function buildStrip(route: RouteData, ids: readonly string[], ground: Ground): Strip {
  const xs: number[] = [];
  const zs: number[] = [];
  const style: number[] = [];
  const L: number[] = [];
  const segs: Record<string, [number, number]> = {};
  let len = 0;
  for (const id of ids) {
    const seg = route.segments.find((s) => s.id === id);
    if (!seg) throw new Error(`route: segment ${id} missing`);
    const st = seg.walked === false ? 2 : 0;
    const pts = chaikin(chaikin(seg.points.map((p) => ground.toXZ(p[0], p[1]))));
    const l0 = len;
    pts.forEach(([px, pz], i) => {
      if (xs.length && i === 0) return; // the joint is shared with the previous segment
      if (xs.length) len += Math.hypot(px - xs[xs.length - 1], pz - zs[zs.length - 1]);
      xs.push(px);
      zs.push(pz);
      L.push(len);
      style.push(st);
    });
    segs[id] = [l0, len];
  }
  const n = xs.length;
  const hm = new Float32Array(n);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    hm[i] = ground.heightM(xs[i], zs[i]);
    y[i] = ground.y(hm[i]);
  }
  return {
    n,
    x: Float32Array.from(xs),
    y,
    z: Float32Array.from(zs),
    hm,
    L: Float32Array.from(L),
    style: Uint8Array.from(style),
    segs,
    total: len,
  };
}

/** [i0, i1, t] around length l (binary search). */
function locate(c: Strip, l: number): [number, number, number] {
  const v = Math.min(c.total, Math.max(0, l));
  let lo = 0;
  let hi = c.n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c.L[m] <= v) lo = m;
    else hi = m;
  }
  const span = c.L[hi] - c.L[lo];
  return [lo, hi, span > 0 ? (v - c.L[lo]) / span : 0];
}

export function stripPoint(c: Strip, l: number, out: XYZ): XYZ {
  const [a, b, t] = locate(c, l);
  out.x = c.x[a] + (c.x[b] - c.x[a]) * t;
  out.y = c.y[a] + (c.y[b] - c.y[a]) * t;
  out.z = c.z[a] + (c.z[b] - c.z[a]) * t;
  return out;
}

export function stripHeightM(c: Strip, l: number): number {
  const [a, b, t] = locate(c, l);
  return c.hm[a] + (c.hm[b] - c.hm[a]) * t;
}

/** Unit horizontal tangent (x, z) at l. */
export function stripTangent(c: Strip, l: number, out: XYZ): XYZ {
  const [a] = locate(c, l);
  const i0 = Math.max(0, a - 3);
  const i1 = Math.min(c.n - 1, a + 4);
  const dx = c.x[i1] - c.x[i0];
  const dz = c.z[i1] - c.z[i0];
  const d = Math.hypot(dx, dz);
  out.x = d ? dx / d : 0;
  out.y = 0;
  out.z = d ? dz / d : -1;
  return out;
}

/** The length along `c` (within [l0, l1]) nearest to (x, z), and the distance. */
export function stripNearest(c: Strip, x: number, z: number, l0 = 0, l1 = c.total): { l: number; d: number } {
  let best = Infinity;
  let bl = 0;
  for (let i = 0; i < c.n; i++) {
    if (c.L[i] < l0 || c.L[i] > l1) continue;
    const d = (c.x[i] - x) ** 2 + (c.z[i] - z) ** 2;
    if (d < best) {
      best = d;
      bl = c.L[i];
    }
  }
  return { l: bl, d: Math.sqrt(best) };
}

/* ------------------------------------------------------------------------------------------------
 * The story function
 * ---------------------------------------------------------------------------------------------- */

export interface StoryAct extends StoryActDef {
  readonly index: number;
  readonly s0: number;
  readonly s1: number;
  /** Main length at the start / end of the act, and drawn at its start. */
  readonly L0: number;
  readonly L1: number;
  readonly drawn0: number;
  readonly trips0: readonly number[];
}

export interface StoryModel {
  readonly main: Strip;
  readonly trips: readonly Strip[];
  readonly acts: readonly StoryAct[];
  /** Main length at Thorong La and at Bhulbhule (the arrival's draw). */
  readonly passL: number;
  readonly introL: number;
}

export interface StoryState {
  act: StoryAct;
  /** 0 = main line, 1..4 = side trip. */
  strip: number;
  /** The head's length along its strip. */
  l: number;
  /** Main length drawn, and each side trip's. */
  drawn: number;
  trips: [number, number, number, number];
}

/** Walk easing inside an act: the head eases out of camp and into the next (35% linear + 65% smooth). */
export const actEase = (u: number) => {
  const v = Math.min(1, Math.max(0, u));
  return v * 0.35 + v * v * (3 - 2 * v) * 0.65;
};

export function createStoryModel(route: RouteData, ground: Ground): StoryModel {
  const main = buildStrip(route, STORY_MAIN_SEGMENTS, ground);
  const trips = STORY_TRIP_SEGMENTS.map((id) => buildStrip(route, [id], ground));
  const wp = (id: string) => {
    const w = route.waypoints.find((p) => p.id === id);
    if (!w) throw new Error(`route: waypoint ${id} missing`);
    return ground.toXZ(w.lon, w.lat);
  };
  const [d14a, d14b] = main.segs['d14-muktinath'];
  const passL = stripNearest(main, ...wp('thorong-la'), d14a, d14b).l;
  const [d1a, d1b] = main.segs.d1;
  const introL = stripNearest(main, ...wp('bhulbhule'), d1a, d1b).l;

  const acts: StoryAct[] = [];
  let s = 0;
  let mainL = 0;
  let drawn = 0;
  const tripDrawn = [0, 0, 0, 0];
  STORY_ACTS.forEach((a, index) => {
    const L0 = mainL;
    const drawn0 = drawn;
    const trips0 = tripDrawn.slice();
    if (a.main) mainL = main.segs[a.main][1];
    if (a.toPass) mainL = passL;
    drawn = Math.max(drawn, mainL);
    if (a.trip !== undefined && a.out) tripDrawn[a.trip] = trips[a.trip].total;
    acts.push({ ...a, index, s0: s, s1: s + a.len, L0, L1: mainL, drawn0, trips0 });
    s += a.len;
  });
  return { main, trips, acts, passL, introL };
}

export function createStoryState(model: StoryModel): StoryState {
  return { act: model.acts[0], strip: 0, l: 0, drawn: 0, trips: [0, 0, 0, 0] };
}

/**
 * The story at s (vh). `introL` is the arrival's draw (0 -> Bhulbhule over the first seconds): Day 1
 * walks on from wherever the arrival has reached, so the head advances from the very first scroll
 * pixel (R8) and never waits for the arrival.
 */
export function storyAt(model: StoryModel, sIn: number, introL: number, out: StoryState): StoryState {
  const { acts, trips, main } = model;
  const s = Math.min(acts[acts.length - 1].s1, Math.max(0, sIn));
  const a = acts.find((k) => s < k.s1) ?? acts[acts.length - 1];
  const u = actEase((s - a.s0) / a.len);
  out.act = a;
  out.strip = 0;
  out.l = a.L0;
  out.drawn = a.drawn0;
  for (let i = 0; i < 4; i++) out.trips[i] = a.trips0[i];
  if (a.main || a.toPass) {
    const from = a.index === 0 ? Math.min(introL, a.L1) : a.L0;
    out.l = from + (a.L1 - from) * u;
    out.drawn = Math.max(a.drawn0, out.l);
  } else if (a.trip !== undefined) {
    const total = trips[a.trip].total;
    out.strip = a.trip + 1;
    out.l = a.out ? total * u : total * (1 - u);
    out.trips[a.trip] = a.out ? total * u : total;
  }
  if (a.overview) {
    out.drawn = main.total;
    out.l = main.total;
  }
  return out;
}

/** Inverse: the s at which the head first reaches main length l (bisection on the act's easing). */
export function sAtMain(model: StoryModel, l: number): number {
  for (const a of model.acts) {
    if (!(a.main || a.toPass)) continue;
    if (l >= a.L0 - 1e-6 && l <= a.L1 + 1e-6) {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        if (a.L0 + (a.L1 - a.L0) * actEase(m) < l) lo = m;
        else hi = m;
      }
      return a.s0 + a.len * lo;
    }
  }
  return model.acts[model.acts.length - 1].s1;
}
