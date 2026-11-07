/** A camera keyframe over any anchor set (the story's keys, StoryCameraKey, and the #next track's). */
export interface CameraKey<A extends string = string> {
  readonly s: number;
  readonly az: number;
  readonly pitch: number;
  readonly dist: number;
  readonly fov: number;
  readonly follow: number;
  readonly lead: number;
  readonly anchor: A;
}

/*
 * The camera track (design §5.2): every keyframe field is interpolated on s by a monotone cubic
 * (Fritsch-Carlson), so the path is C1 with no roll. Pure, no three.js.
 */

/** Monotone cubic interpolant through (xs, ys); clamps outside the range. */
export function monotone(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  const d: number[] = [];
  const m = new Array<number>(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) {
    m[i] =
      d[i - 1] * d[i] <= 0
        ? 0
        : (3 * (xs[i + 1] - xs[i - 1])) /
          ((2 * xs[i + 1] - xs[i] - xs[i - 1]) / d[i - 1] + (xs[i + 1] - 2 * xs[i] + xs[i - 1]) / d[i]);
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

/**
 * Piecewise cubic Hermite (PCHIP, Fritsch-Butland three-point slopes) through (xs, ys) with zero slope at both
 * ends; clamps outside the range. Shape-preserving: monotone between keys, no overshoot. The #next track uses it.
 * (`monotone` above keeps the story's own track exactly as it always was: its second weight is h1 - h0 where
 * PCHIP has h1 + 2 h0, so it can overshoot; the story's keys were tuned on it and are left alone.)
 */
export function pchip(xs: readonly number[], ys: readonly number[]): (x: number) => number {
  const n = xs.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1] - xs[i]);
    d.push((ys[i + 1] - ys[i]) / h[i]);
  }
  const m = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) continue;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

export interface CameraSample {
  az: number;
  pitch: number;
  dist: number;
  fov: number;
  follow: number;
  lead: number;
  ax: number;
  az_: number;
}

export type CameraTrack = (s: number, out: CameraSample) => CameraSample;

export interface CameraTrackOptions {
  /**
   * The #next track: PCHIP instead of the story's `monotone`, `dist` interpolated in log space (a dolly at a
   * steady zoom rate) and `az` from `azAt` (a turn at a capped rate) instead of the keys. Without options the
   * track is the story's, exactly as before.
   */
  readonly next?: { readonly azAt: (s: number) => number };
}

/** Builds the track from the keys and the anchors' world (x, z). */
export function createCameraTrack<A extends string>(
  keys: readonly CameraKey<A>[],
  anchors: Readonly<Record<A, readonly [number, number]>>,
  options: CameraTrackOptions = {},
): CameraTrack {
  const xs = keys.map((k) => k.s);
  const next = options.next;
  const f = (pick: (k: CameraKey<A>) => number) => (next ? pchip : monotone)(xs, keys.map(pick));
  const az = next ? next.azAt : f((k) => k.az);
  const pitch = f((k) => k.pitch);
  const logDist = next ? pchip(xs, keys.map((k) => Math.log(k.dist))) : null;
  const dist = logDist ? (s: number) => Math.exp(logDist(s)) : f((k) => k.dist);
  const fov = f((k) => k.fov);
  const follow = f((k) => k.follow);
  const lead = f((k) => k.lead);
  const ax = f((k) => anchors[k.anchor][0]);
  const az_ = f((k) => anchors[k.anchor][1]);
  return (s, out) => {
    out.az = az(s);
    out.pitch = pitch(s);
    out.dist = dist(s);
    out.fov = fov(s);
    out.follow = follow(s);
    out.lead = lead(s);
    out.ax = ax(s);
    out.az_ = az_(s);
    return out;
  };
}

export const createCameraSample = (): CameraSample => ({
  az: 0,
  pitch: 0,
  dist: 1,
  fov: 30,
  follow: 0,
  lead: 0,
  ax: 0,
  az_: 0,
});
