import { CatmullRomCurve3, Vector3 } from 'three';

import type { TerrainFrame } from './heightfield';

/*
 * Routes on the relief (§G.8): a centripetal Catmull-Rom through the waypoints projected into the
 * terrain plane, sampled per segment so every waypoint is an exact sample, then draped on the
 * heightfield. Distances run 0..1 along the route by arc length.
 */

/** The fields a route needs from a waypoint (structurally an entities `Waypoint`). */
export interface RouteWaypoint {
  readonly name: string;
  readonly lat?: number;
  readonly lon?: number;
  readonly altitudeM?: number;
}

export interface RouteNode {
  readonly name: string;
  /** 0..1 along the route. */
  readonly dist: number;
  readonly sample: number;
}

export interface RouteCurve {
  readonly count: number;
  /** x, z per sample. */
  readonly xz: Float32Array;
  /** Normalised terrain height per sample (the relief uniforms scale it). */
  readonly hn: Float32Array;
  /** 0..1 by arc length. */
  readonly dist: Float32Array;
  /** Altitude interpolated between the waypoints' own altitudes (the profile's values), metres. */
  readonly altM: Float32Array;
  /** Fractional index among the waypoints that carry an altitude (profileMapping's `i`). */
  readonly plotIndex: Float32Array;
  /** Length in world units (flat). */
  readonly length: number;
  readonly nodes: readonly RouteNode[];
  /** 0..1 position of a named waypoint, or undefined. */
  nodeDist(name: string): number | undefined;
  /** World (x, normalised height, z) at `f` (0..1). */
  pointAt(f: number, out: Vector3): Vector3;
  /** Horizontal unit tangent at `f`. */
  tangentAt(f: number, out: Vector3): Vector3;
}

export interface BuildRouteOptions {
  /** Metres at a world position (the heightfield sampler). */
  heightAtXZ: (x: number, z: number) => number;
  /** Samples per world unit of segment chord (default 28; at least 6 per segment). */
  density?: number;
}

function lowerBound(values: Float32Array, f: number): number {
  let lo = 0;
  let hi = values.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] < f) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Builds a draped route from waypoints with coordinates (those without are skipped). Throws when
 * fewer than two remain.
 */
export function buildRouteCurve(
  waypoints: readonly RouteWaypoint[],
  frame: TerrainFrame,
  options: BuildRouteOptions,
): RouteCurve {
  // Plotted index: position among the waypoints that carry an altitude (profileMapping's order).
  let plotted = -1;
  const nodesIn: { name: string; x: number; z: number; alt?: number; plot: number }[] = [];
  for (const w of waypoints) {
    const hasAlt = typeof w.altitudeM === 'number' && Number.isFinite(w.altitudeM);
    if (hasAlt) plotted += 1;
    if (typeof w.lat !== 'number' || typeof w.lon !== 'number') continue;
    const [x, z] = frame.toXZ(w.lon, w.lat);
    nodesIn.push({ name: w.name, x, z, alt: hasAlt ? w.altitudeM : undefined, plot: hasAlt ? plotted : plotted + 0.5 });
  }
  if (nodesIn.length < 2) throw new Error('route: fewer than two waypoints with coordinates');

  // Fill unknown altitudes by interpolation between known neighbours (never shown as a value).
  const alts = nodesIn.map((n) => n.alt);
  for (let i = 0; i < alts.length; i++) {
    if (alts[i] !== undefined) continue;
    let a = i - 1;
    while (a >= 0 && alts[a] === undefined) a--;
    let b = i + 1;
    while (b < alts.length && alts[b] === undefined) b++;
    const va = a >= 0 ? (alts[a] as number) : undefined;
    const vb = b < alts.length ? (alts[b] as number) : undefined;
    alts[i] = va !== undefined && vb !== undefined ? va + ((vb - va) * (i - a)) / (b - a) : (va ?? vb ?? 0);
  }

  const curve = new CatmullRomCurve3(
    nodesIn.map((n) => new Vector3(n.x, 0, n.z)),
    false,
    'centripetal',
  );
  const segments = nodesIn.length - 1;
  const density = options.density ?? 28;
  const perSegment: number[] = [];
  for (let s = 0; s < segments; s++) {
    const chord = Math.hypot(nodesIn[s + 1].x - nodesIn[s].x, nodesIn[s + 1].z - nodesIn[s].z);
    perSegment.push(Math.max(6, Math.ceil(chord * density)));
  }
  const count = perSegment.reduce((sum, n) => sum + n, 0) + 1;

  const xz = new Float32Array(count * 2);
  const hn = new Float32Array(count);
  const dist = new Float32Array(count);
  const altM = new Float32Array(count);
  const plotIndex = new Float32Array(count);
  const nodeSamples: number[] = [0];
  const p = new Vector3();

  let k = 0;
  for (let s = 0; s < segments; s++) {
    const n = perSegment[s];
    for (let j = 0; j < n; j++) {
      const local = j / n;
      curve.getPoint((s + local) / segments, p);
      xz[k * 2] = p.x;
      xz[k * 2 + 1] = p.z;
      altM[k] = (alts[s] as number) + ((alts[s + 1] as number) - (alts[s] as number)) * local;
      plotIndex[k] = nodesIn[s].plot + (nodesIn[s + 1].plot - nodesIn[s].plot) * local;
      k++;
    }
    nodeSamples.push(k);
  }
  const last = nodesIn[segments];
  xz[k * 2] = last.x;
  xz[k * 2 + 1] = last.z;
  altM[k] = alts[segments] as number;
  plotIndex[k] = last.plot;

  let length = 0;
  for (let i = 0; i < count; i++) {
    if (i > 0) length += Math.hypot(xz[i * 2] - xz[i * 2 - 2], xz[i * 2 + 1] - xz[i * 2 - 1]);
    dist[i] = length;
    hn[i] = frame.normHeight(options.heightAtXZ(xz[i * 2], xz[i * 2 + 1]));
  }
  for (let i = 0; i < count; i++) dist[i] = length > 0 ? dist[i] / length : i / (count - 1);

  const nodes: RouteNode[] = nodesIn.map((n, i) => ({ name: n.name, sample: nodeSamples[i], dist: dist[nodeSamples[i]] }));

  const locate = (f: number): [number, number] => {
    const c = Math.min(1, Math.max(0, f));
    const b = Math.max(1, lowerBound(dist, c));
    const a = b - 1;
    const span = dist[b] - dist[a];
    return [a, span > 0 ? (c - dist[a]) / span : 0];
  };

  return {
    count,
    xz,
    hn,
    dist,
    altM,
    plotIndex,
    length,
    nodes,
    nodeDist: (name) => nodes.find((n) => n.name === name)?.dist,
    pointAt(f, out) {
      const [a, t] = locate(f);
      const b = a + 1;
      return out.set(
        xz[a * 2] + (xz[b * 2] - xz[a * 2]) * t,
        hn[a] + (hn[b] - hn[a]) * t,
        xz[a * 2 + 1] + (xz[b * 2 + 1] - xz[a * 2 + 1]) * t,
      );
    },
    tangentAt(f, out) {
      const [a] = locate(f);
      const i0 = Math.max(0, a - 2);
      const i1 = Math.min(count - 1, a + 3);
      out.set(xz[i1 * 2] - xz[i0 * 2], 0, xz[i1 * 2 + 1] - xz[i0 * 2 + 1]);
      return out.lengthSq() > 0 ? out.normalize() : out.set(1, 0, 0);
    },
  };
}
