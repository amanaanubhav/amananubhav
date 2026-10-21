import type { StoryAnchor, StoryCameraKey } from './timeline';

/*
 * The camera track (design §5.2): every keyframe field is interpolated on s by a monotone cubic
 * (Fritsch-Carlson), so the path is C1 with no overshoot and no roll. Pure, no three.js.
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

/** Builds the track from the keys and the anchors' world (x, z). */
export function createCameraTrack(
  keys: readonly StoryCameraKey[],
  anchors: Readonly<Record<StoryAnchor, readonly [number, number]>>,
): CameraTrack {
  const xs = keys.map((k) => k.s);
  const f = (pick: (k: StoryCameraKey) => number) => monotone(xs, keys.map(pick));
  const az = f((k) => k.az);
  const pitch = f((k) => k.pitch);
  const dist = f((k) => k.dist);
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
