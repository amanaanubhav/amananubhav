// Colour maths for check.mjs. Dev-only; never imported by src/.
// OKLab / OKLCH (Ottosson), CIELAB D65, Machado 2009 CVD simulation (severity 1, linear RGB), browser-style sRGB alpha
// compositing, the CSS saturate() filter matrix and APCA-W3 0.0.98G-4g. Ported from the palette design scratch
// (nb-color.mjs, final-check.mjs) so check:palette reproduces the numbers printed in docs/redesign/palette/PALETTE-SPEC.md.
import { hexToRgb255 } from './lib.mjs';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** [r, g, b] in 0..255 (any real) -> uppercase '#RRGGBB', rounded and clamped. */
export function rgbToHex(rgb) {
  return `#${rgb
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

const hexToLin = (hex) => hexToRgb255(hex).map((v) => toLin(v / 255));

function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** '#RRGGBB' -> OKLab [L, a, b]. */
export const hexToOklab = (hex) => linToOklab(hexToLin(hex));

/** '#RRGGBB' -> OKLCH [L, C, h] with h in degrees 0..360. */
export function hexToOklch(hex) {
  const [L, a, b] = hexToOklab(hex);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, Math.hypot(a, b), h];
}

/** OKLab Euclidean distance (dE_OK). */
export function dEok(hexA, hexB) {
  const a = hexToOklab(hexA);
  const b = hexToOklab(hexB);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Smallest angle between two hues, in degrees. */
export function hueGap(h1, h2) {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

/** Browser-style alpha compositing in gamma-encoded sRGB: fg at `alpha` over an opaque bg. */
export function over(fgHex, alpha, bgHex) {
  const f = hexToRgb255(fgHex);
  const b = hexToRgb255(bgHex);
  return rgbToHex(f.map((v, i) => alpha * v + (1 - alpha) * b[i]));
}

/** The CSS saturate(s) filter matrix applied to an sRGB hex (what backdrop-filter does to the backdrop). */
export function saturate(hex, s) {
  const [r, g, b] = hexToRgb255(hex);
  const m = [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ];
  return rgbToHex(m.map((row) => row[0] * r + row[1] * g + row[2] * b));
}

// CIELAB (D65) from linear sRGB
function linToLab([r, g, b]) {
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const d = 6 / 29;
  const f = (t) => (t > d ** 3 ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

/** Machado, Oliveira & Fernandes 2009, severity 1.0, applied to linear sRGB. */
const CVD = {
  none: null,
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** 'none' (normal vision), 'protan', 'deutan', 'tritan'. */
export const CVD_KINDS = Object.keys(CVD);

function simLab(hex, kind) {
  const lin = hexToLin(hex);
  const M = CVD[kind];
  const out = M ? M.map((row) => clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])) : lin;
  return linToLab(out);
}

/** CIE76 dE between two hexes as seen with the given vision ('none' = normal). */
export function dE76(hexA, hexB, kind = 'none') {
  const a = simLab(hexA, kind);
  const b = simLab(hexB, kind);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** The smallest dE76 of a pair over normal vision and the three simulated dichromacies: { de, kind }. */
export function cvdMin(hexA, hexB) {
  let best = { de: Number.POSITIVE_INFINITY, kind: '' };
  for (const kind of CVD_KINDS) {
    const de = dE76(hexA, hexB, kind);
    if (de < best.de) best = { de, kind };
  }
  return best;
}

/** APCA-W3 0.0.98G-4g lightness contrast |Lc| of text on a background (advisory; WCAG 2.x stays the rule). */
export function apca(textHex, bgHex) {
  const Y = (hex) => {
    const [r, g, b] = hexToRgb255(hex).map((x) => (x / 255) ** 2.4);
    let y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    if (y < 0.022) y += (0.022 - y) ** 1.414;
    return y;
  };
  const yt = Y(textHex);
  const yb = Y(bgHex);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  let out;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    out = s < 0.1 ? 0 : s - 0.027;
  } else {
    const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
    out = s > -0.1 ? 0 : s + 0.027;
  }
  return Math.abs(out * 100);
}
