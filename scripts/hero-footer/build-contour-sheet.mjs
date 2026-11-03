#!/usr/bin/env node
// npm run gen:footer — builds public/hero-footer/contour-sheet.svg (dev-only; the output is committed).
// The footer's contour sheet (HERO-FOOTER-SPEC §4, C-10): a static SVG used only as a CSS alpha mask
// (Footer.module.css `.sheet`: `mask-image` over `background-color: var(--ink-contour)`), so the drawing carries no
// colour (`stroke: currentColor`) and the palette colours it. A seeded marching-squares drawing of a long ridge with
// two summits, 1440 x 360, grid step 8, levels -0.1 .. 1.6 by 0.07, every fifth an index line; empty levels dropped.
// Deterministic: the same code always writes the same bytes (the approved prototype's drawing).
// Flags: --out=<file> (write elsewhere, e.g. to diff against the committed file).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_ARG = process.argv.find((a) => a.startsWith('--out='));
const OUT = OUT_ARG ? OUT_ARG.slice('--out='.length) : join(ROOT, 'public', 'hero-footer', 'contour-sheet.svg');

const W = 1440;
const H = 360;
const STEP = 8;

const hash = (x, y, s) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, y, s) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) {
  let t = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    t += amp * vnoise(x * f, y * f, s + o);
    amp *= 0.5;
    f *= 2;
  }
  return t;
}

/** A long ridge across the sheet with two summits (and a western shoulder), plus seeded fbm relief. */
function sheetField(x, y) {
  let f = 0.9 * Math.exp(-((y - 150 - 40 * Math.sin(x / 260)) ** 2) / (2 * 80 * 80));
  f +=
    0.6 * Math.exp(-((x - 700) ** 2 + (y - 120) ** 2) / (2 * 150 * 150)) +
    0.45 * Math.exp(-((x - 1180) ** 2 + (y - 170) ** 2) / (2 * 120 * 120)) +
    0.35 * Math.exp(-((x - 220) ** 2 + (y - 200) ** 2) / (2 * 130 * 130));
  f += 0.3 * (fbm(x / 120, y / 120, 9) - 0.5);
  return f;
}

/** Marching squares: one relative-moveto path per level, segments chained into polylines (more than 3 points). */
function contours(width, height, step, field, levels) {
  const nx = Math.ceil(width / step) + 1;
  const ny = Math.ceil(height / step) + 1;
  const F = [];
  for (let j = 0; j < ny; j++) {
    F[j] = [];
    for (let i = 0; i < nx; i++) F[j][i] = field(i * step, j * step);
  }
  const CASES = {
    1: [['L', 'B']], 2: [['B', 'R']], 3: [['L', 'R']], 4: [['T', 'R']], 5: [['L', 'T'], ['B', 'R']], 6: [['T', 'B']],
    7: [['L', 'T']], 8: [['L', 'T']], 9: [['T', 'B']], 10: [['L', 'B'], ['T', 'R']], 11: [['T', 'R']], 12: [['L', 'R']],
    13: [['B', 'R']], 14: [['L', 'B']],
  };
  const out = [];
  for (const lv of levels) {
    const segs = [];
    const P = (i, j, i2, j2) => {
      const a = F[j][i];
      const b = F[j2][i2];
      const t = (lv - a) / (b - a);
      return [(i + (i2 - i) * t) * step, (j + (j2 - j) * t) * step];
    };
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const c =
          (F[j][i] > lv ? 8 : 0) | (F[j][i + 1] > lv ? 4 : 0) | (F[j + 1][i + 1] > lv ? 2 : 0) | (F[j + 1][i] > lv ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const pts = { T: P(i, j, i + 1, j), R: P(i + 1, j, i + 1, j + 1), B: P(i, j + 1, i + 1, j + 1), L: P(i, j, i, j + 1) };
        for (const [p, q] of CASES[c]) segs.push([pts[p], pts[q]]);
      }
    }
    const key = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const ends = new Map();
    segs.forEach((s, idx) => {
      for (const p of s) {
        const k = key(p);
        if (!ends.has(k)) ends.set(k, []);
        ends.get(k).push(idx);
      }
    });
    const used = new Uint8Array(segs.length);
    const lines = [];
    for (let s = 0; s < segs.length; s++) {
      if (used[s]) continue;
      used[s] = 1;
      const line = [segs[s][0], segs[s][1]];
      for (const forward of [true, false]) {
        let grow = true;
        while (grow) {
          grow = false;
          const tip = forward ? line[line.length - 1] : line[0];
          for (const o of ends.get(key(tip)) || []) {
            if (used[o]) continue;
            used[o] = 1;
            const [a, b] = segs[o];
            const next = key(a) === key(tip) ? b : a;
            if (forward) line.push(next);
            else line.unshift(next);
            grow = true;
            break;
          }
        }
      }
      if (line.length > 3) lines.push(line);
    }
    const r = Math.round;
    const d = lines
      .map((l) => {
        let s = `M${r(l[0][0])} ${r(l[0][1])}`;
        let px = r(l[0][0]);
        let py = r(l[0][1]);
        for (let q = 1; q < l.length; q++) {
          const x = r(l[q][0]);
          const y = r(l[q][1]);
          if (x === px && y === py) continue;
          s += `l${x - px} ${y - py}`;
          px = x;
          py = y;
        }
        return s;
      })
      .join('');
    out.push({ lv, d });
  }
  return out;
}

const levels = [];
for (let v = -0.1; v < 1.6; v += 0.07) levels.push(+v.toFixed(2));

const paths = contours(W, H, STEP, sheetField, levels)
  .map((c, i) => ({ ...c, cls: i % 5 === 0 ? 'ci' : 'cm' }))
  .filter((c) => c.d)
  .map((c) => `<path class="${c.cls}" d="${c.d}"/>`)
  .join('');

const STYLE =
  'path{fill:none;stroke:currentColor;stroke-width:1;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.ci{stroke-width:1.6}';
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>${paths}</svg>\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`contour sheet: ${OUT} (${svg.length} bytes, ${(svg.match(/<path/g) || []).length} paths)`);
