// Altitude <-> progress and every layer's motion as a function of progress p (0..1). Pure data and math, no I/O.
// docs/redesign/preloader/design.md v2.C (C.4): the scene places its zones with pOfAlt(); the runtime serialises
// `data` and drives every layer from it on one clock.
export const NEAR = { w: 3400, h: 240, summitX: 2800 };
export const HOLD = 0.84; // High Camp, 4,880 m

/** [p, metres] knots; the first and the last two altitudes come from ANNAPURNA_ROUTE through motion(). */
const ZONE_KNOTS = [[0.12, 1310], [0.24, 2000], [0.36, 2600], [0.48, 3200], [0.6, 3800], [0.72, 4400]];

/** Curve: [base, [a, b, delta], ...]  value(p) = base + sum(delta * S5(clamp((p - a) / (b - a)))),
 *  S5(t) = t^3 (t (6t - 15) + 10) (smootherstep: C2, so no acceleration jumps where pieces meet). */
export const LAYERS = [
  { s: '.ly-far', k: 0.06, ty: [0.2, [0.08, 0.92, -0.23]], sc: [1, [0, 1, 0.07]], drop: 0.26 },
  { s: '.ly-high', k: 0.18, ty: [0.42, [0.3, 0.86, -0.42]], drop: 0.32 },
  { s: '.ly-dry', k: 0.3, ty: [0.34, [0.3, 0.54, -0.34], [0.54, 0.93, 0.34]], drop: 0.38 },
  { s: '.ly-green', k: 0.45, ty: [0.16, [0.02, 0.24, -0.16], [0.34, 0.68, 0.52]], drop: 0.42 },
  { s: '.ly-gorge', k: 0.6, ty: [0, [0.08, 0.36, 0.64]], drop: 0.46 },
  { s: '.ly-near', sx: NEAR.summitX / NEAR.w, a: [0.6, 0.5], ty: [0], drop: 0.5 },
];
export const FADES = [
  { s: '.sky-sub', o: [1, [0.06, 0.34, -1]] },
  { s: '.sky-hi', o: [0, [0.4, 0.96, 1]] },
  { s: '.stars', o: [0, [0.62, 1, 1]] },
  { s: '.haze', o: [1, [0.22, 0.68, -1]] },
  { s: '.glow', o: [0, [0.95, 1, 1]] },
];

/** The smootherstep S5 on [0, 1]. */
export const s5 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (6 * t - 15) + 10));
/** Evaluates a curve [base, [a, b, delta], ...] at p (the runtime's cv()). */
export function cv(c, p) {
  let v = c[0];
  for (let i = 1; i < c.length; i++) v += c[i][2] * s5((p - c[i][0]) / (c[i][1] - c[i][0]));
  return v;
}

/**
 * Monotone piecewise cubic Hermite through [x, y] knots (Fritsch-Carlson, with Brodlie's weighted harmonic-mean
 * slopes inside and one-sided slopes at the ends), C1, never overshoots.
 */
function pchip(k) {
  const n = k.length, h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = k[i + 1][0] - k[i][0]; d[i] = (k[i + 1][1] - k[i][1]) / h[i]; }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= k[0][0]) return k[0][1];
    if (x >= k[n - 1][0]) return k[n - 1][1];
    let i = 0;
    while (x > k[i + 1][0]) i++;
    const t = (x - k[i][0]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * k[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * k[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

/** The p in [0, 1] where the increasing f reaches y (40 halvings). */
function bisect(f, y) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (f(mid) < y) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/** start = Besisahar, highCamp = Thorong High Camp, pass = Thorong La, all `altitudeM` from ANNAPURNA_ROUTE. */
export function motion({ start, highCamp, pass }) {
  const knots = [[0, start], ...ZONE_KNOTS, [HOLD, highCamp], [1, pass]];
  const altOfP = pchip(knots); // monotone cubic (Fritsch-Carlson), C1
  const pOfAlt = (a) => bisect(altOfP, a); // 40 iterations
  const alt = Array.from({ length: 51 }, (_, i) => Math.round(altOfP(i / 50)));
  return { altOfP, pOfAlt, data: { v: 2, hold: HOLD, alt, layers: LAYERS, fades: FADES } };
}
