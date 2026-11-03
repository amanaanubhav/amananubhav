// npm run check:palette [-- --verbose]
// Proves scripts/palette/palette.json (Narrowband Alpenglow) against docs/redesign/palette/PALETTE-SPEC.md, the spec
// this file implements (§3, §4, §7, §8.3):
// 1. WCAG 2.x ratios with lib.mjs contrast(): the core roles (§3), extended text and graphic roles, on-fill pairs,
//    the solid -soft washes, focus rings, surface-3 and the console colours on every terminal ground (§4).
// 2. Materials and the map: glass composites over the R18 backdrop set with saturate() applied (R18, R40), sheens (R15),
//    the hypsometric, temperature and chart ramps, lake separation, labels on their halo, the route on its casing
//    (R33, R34, R36), and CVD pairs (Machado 2009) for the map, the chart set with its highlight, status and accents.
// 3. Identity and harmony: neon distance (R8), chroma / hue / lightness bounds (R9-R24), the route pact (R25), status vs
//    accents (R32), the theme-tween chroma floor (R37), the Alpenglow and ridge-mark rules (R39-R41) and the judges'
//    harmony rules. APCA Lc is printed as advice only.
// 4. The generated files (tokens.css, palette.ts, tailwind-colors.json) are current with palette.json.
// 5. Source bans in src/ and app/ (bans.mjs): graphics-only roles as text colour (text-signal-line, text-accent-2-line,
//    text-aqua-line, text-bronze, and `color:` on those tokens) and gradient text (background-clip: text, bg-clip-text)
//    anywhere but the terminal Alpenglow label, and zero-offset glows in CSS (R12; a failure since the integration gate
//    removed the last two).
// Exits 1 on any failure. Values that drift from the numbers the spec prints are notes, never failures.
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import { scanBans } from './bans.mjs';
import { apca, cvdMin, dEok, hexToOklab, hexToOklch, hueGap, over, rgbToHex, saturate } from './color.mjs';
import {
  ROOT,
  THEMES,
  contrast,
  extendedEntries,
  extendedSolids,
  generatedFiles,
  hexToRgb255,
  loadPalette,
  luminance,
  resolveExtended,
  tokenHex,
} from './lib.mjs';
import { collectFiles } from './scan.mjs';

const VERBOSE = process.argv.includes('--verbose');
const failures = [];
const notes = [];
const advice = [];
const palette = loadPalette();
const R = Object.fromEntries(THEMES.map((theme) => [theme, resolveExtended(palette, theme)]));
const hex = (theme, name) => tokenHex(palette, theme, name);
const raw = (theme, name) => extendedEntries(palette, theme).find(([n]) => n === name)?.[1];
const r2 = (n) => Math.round(n * 100) / 100;
const f2 = (n) => Number(n).toFixed(2);
const f3 = (n) => Number(n).toFixed(3);
const L = (h) => hexToOklch(h)[0];
const C = (h) => hexToOklch(h)[1];
const H = (h) => hexToOklch(h)[2];
const drift = (label, computed, printed, digits = 2) => {
  if (printed === undefined || printed === null) return;
  const shown = Number(computed.toFixed(digits));
  if (Math.abs(shown - printed) > 0.6 * 10 ** -digits) notes.push(`${label} computes ${shown.toFixed(digits)}, the spec prints ${printed.toFixed(digits)}`);
};

// ---------------------------------------------------------------------------------------------------------------------
// 1. Contrast
const G4 = ['ground', 'surface', 'surface-2', 'ground-sky'];
const G3 = ['ground', 'surface', 'surface-2'];
const TERM = ['term-panel', 'term-field', 'term-code-bg', 'term-bg'];
const both = (night, day) => ({ night, day });

/**
 * fg on each of `on` must reach `min`. `spec` holds the ratios the spec prints per theme: an array (one per ground, in
 * order; null where it prints none) or a number (the minimum over the grounds). Core rows come from §3, the rest from §4.
 */
const CHECKS = [
  // §3 core roles
  { fg: 'ink', on: G4, min: 4.5, kind: 'text', spec: both([13.85, 12.96, 11.83, 14.55], [13.83, 15.14, 12.43, 13.04]) },
  { fg: 'ink-muted', on: G4, min: 4.5, kind: 'text', spec: both([7.71, 7.21, 6.59, 8.1], [6.09, 6.68, 5.48, 5.75]) },
  { fg: 'signal', on: G4, min: 4.5, kind: 'text', spec: both([6.28, 5.88, 5.37, 6.6], [5.93, 6.49, 5.33, 5.59]) },
  { fg: 'line-strong', on: G4, min: 3, kind: 'graphic', spec: both([4.02, 3.77, 3.44, 4.23], [4.02, 4.4, 3.62, 3.79]) },
  { fg: 'signal-line', on: G4, min: 3, kind: 'graphic', spec: both([3.98, 3.73, 3.4, 4.18], [7.1, 7.78, 6.39, 6.7]) },
  { fg: 'water', on: G3, min: 4.5, kind: 'text', spec: both([8.64, 8.08, 7.38], [5.44, 5.96, 4.89]) },
  { fg: 'success', on: G3, min: 4.5, kind: 'text', spec: both([10.57, 9.89, 9.03], [5.51, 6.04, 4.96]) },
  { fg: 'warning', on: G3, min: 4.5, kind: 'text', spec: both([9.22, 8.63, 7.88], [5.79, 6.35, 5.21]) },
  { fg: 'error', on: G3, min: 4.5, kind: 'text', spec: both([11.18, 10.46, 9.55], [7.23, 7.92, 6.5]) },
  { fg: 'on-signal', on: ['signal'], min: 4.5, kind: 'on-fill', spec: both([6.28], [6.49]) },
  // §4 extended text roles (minimum over ground, surface, surface-2)
  { fg: 'accent-2', on: G3, min: 4.5, kind: 'text', spec: both(5.1, 5.08) },
  { fg: 'aqua', on: G3, min: 4.5, kind: 'text', spec: both(7.38, 4.89) },
  { fg: 'map-branch-text', on: G3, min: 4.5, kind: 'text', spec: both(5.1, 5.08) },
  { fg: 'map-lake-text', on: G3, min: 4.5, kind: 'text', spec: both(7.38, 4.89) },
  { fg: 'chart-label', on: G3, min: 4.5, kind: 'text', spec: both(6.59, 5.48) },
  { fg: 'chart-value', on: G3, min: 4.5, kind: 'text', spec: both(11.83, 12.43) },
  ...['link-ink', 'link-muted', 'placeholder', 'disabled-ink', 'term-prompt', 'signal-hover'].map((fg) => ({ fg, on: G3, min: 4.5, kind: 'text' })),
  // text on the pressed surface
  { fg: 'ink', on: ['surface-3'], min: 4.5, kind: 'text', spec: both(11.1, 11.63) },
  { fg: 'signal', on: ['surface-3'], min: 4.5, kind: 'text', spec: both(5.03, 4.99) },
  ...['ink-muted', 'accent-2', 'aqua'].map((fg) => ({ fg, on: ['surface-3'], min: 4.5, kind: 'text' })),
  // §4 graphics (>= 3 on ground, surface, surface-2)
  { fg: 'accent-2-line', on: G3, min: 3, kind: 'graphic', spec: both(3.74, 3.92) },
  { fg: 'aqua-line', on: G3, min: 3, kind: 'graphic', spec: both(4.92, 3.5) },
  { fg: 'bronze', on: G3, min: 3, kind: 'graphic', spec: both([5.36, null, null], [4.56, null, null]) },
  { fg: 'focus-ring', on: G3, min: 3, kind: 'graphic', spec: both(5.37, 5.33) },
  { fg: 'scrollbar-thumb', on: G3, min: 3, kind: 'graphic', spec: both(3.44, 3.62) },
  { fg: 'chart-1', on: G3, min: 3, kind: 'graphic', spec: both(7.67, 5.62) },
  { fg: 'chart-2', on: G3, min: 3, kind: 'graphic', spec: both(6.69, 4.87) },
  { fg: 'chart-3', on: G3, min: 3, kind: 'graphic', spec: both(10.63, 5.21) },
  { fg: 'chart-4', on: G3, min: 3, kind: 'graphic', spec: both(6.61, 3.22) },
  { fg: 'chart-5', on: G3, min: 3, kind: 'graphic', spec: both(3.15, 9.15) },
  { fg: 'chart-6', on: G3, min: 3, kind: 'graphic', spec: both(4.35, 3.28) },
  { fg: 'chart-highlight', on: G3, min: 3, kind: 'graphic', spec: both(3.4, 6.39) },
  ...['map-branch', 'map-lake-edge', 'map-jeep', 'chart-axis', 'live'].map((fg) => ({ fg, on: G3, min: 3, kind: 'graphic' })),
  { fg: 'focus-ring', on: ['surface-3', 'ground-sky', 'signal-soft', 'aqua-soft'], min: 3, kind: 'graphic' },
  // FIX-PLAN K-04: the outline stroke of a decorative display word (the footer stamp), visible at rest on every ground
  { fg: 'stamp-outline', on: G4, min: 3, kind: 'graphic' },
  // on-fill pairs
  { fg: 'on-signal', on: ['signal-hover'], min: 4.5, kind: 'on-fill', spec: both(6.83, 7.3) },
  { fg: 'on-signal', on: ['signal-pressed'], min: 4.5, kind: 'on-fill', spec: both(5.78, 8.31) },
  { fg: 'on-signal-deep', on: ['signal-deep'], min: 4.5, kind: 'on-fill', spec: both(6.61, 10.98) },
  { fg: 'on-accent-2', on: ['accent-2'], min: 4.5, kind: 'on-fill', spec: both(5.97, 6.19) },
  { fg: 'on-aqua', on: ['aqua'], min: 4.5, kind: 'on-fill', spec: both(8.64, 5.96) },
  { fg: 'selection-ink', on: ['selection-bg'], min: 4.5, kind: 'on-fill', spec: both(6.7, 11.08) },
  // the inverse ring sits off a signal fill, on the ground (3 px offset): measured on the grounds
  { fg: 'focus-ring-inverse', on: G3, min: 3, kind: 'on-fill', spec: both(11.83, 12.43) },
  // text on the solid -soft washes
  { fg: 'ink', on: ['signal-soft'], min: 4.5, kind: 'soft', spec: both(10.94, 12.6) },
  { fg: 'signal', on: ['signal-soft'], min: 4.5, kind: 'soft', spec: both(4.97, 5.4) },
  { fg: 'ink', on: ['accent-2-soft'], min: 4.5, kind: 'soft', spec: both(10.97, 12.8) },
  { fg: 'accent-2', on: ['accent-2-soft'], min: 4.5, kind: 'soft', spec: both(4.73, 5.23) },
  { fg: 'ink', on: ['aqua-soft'], min: 4.5, kind: 'soft', spec: both(10.38, 12.75) },
  { fg: 'aqua', on: ['aqua-soft'], min: 4.5, kind: 'soft', spec: both(6.47, 5.02) },
  { fg: 'ink', on: ['success-soft'], min: 4.5, kind: 'soft', spec: both(10.56, 13.55) },
  { fg: 'success', on: ['success-soft'], min: 4.5, kind: 'soft', spec: both(8.06, 5.41) },
  { fg: 'ink', on: ['warning-soft'], min: 4.5, kind: 'soft', spec: both(10.63, 13.53) },
  { fg: 'warning', on: ['warning-soft'], min: 4.5, kind: 'soft', spec: both(7.08, 5.67) },
  { fg: 'ink', on: ['error-soft'], min: 4.5, kind: 'soft', spec: both(10.48, 13.32) },
  { fg: 'error', on: ['error-soft'], min: 4.5, kind: 'soft', spec: both(8.46, 6.96) },
  { fg: 'ink', on: ['you-solid'], min: 4.5, kind: 'soft', spec: both(10.38, 12.75) },
  // §11 Update 1.1 (2026-11-03): the aquamarine action tier, the oxblood marks and steel
  ...['action', 'action-hover'].map((fg) => ({ fg, on: [...G3, 'surface-3'], min: 4.5, kind: 'text' })),
  { fg: 'on-action', on: ['action', 'action-hover', 'action-pressed'], min: 4.5, kind: 'on-fill' },
  { fg: 'action-line', on: [...G3, 'surface-3', 'action-soft'], min: 3, kind: 'graphic' },
  { fg: 'focus-ring-action', on: [...G4, 'surface-3', 'action-soft', 'signal-soft', 'aqua-soft', 'accent-2-soft'], min: 3, kind: 'graphic' },
  { fg: 'ink', on: ['action-soft'], min: 4.5, kind: 'soft' },
  { fg: 'action', on: ['action-soft'], min: 4.5, kind: 'soft' },
  { fg: 'oxblood', on: G3, min: 3, kind: 'graphic' },
  { fg: 'on-oxblood', on: ['oxblood-deep'], min: 4.5, kind: 'on-fill' },
  { fg: 'steel', on: G3, min: 3, kind: 'graphic' },
];

/** §4.10: the lowest ratio of each console colour over the terminal grounds (Night ansi-black is background-only). */
const ANSI_SPEC = {
  'ansi-black': both(null, 12.43),
  'ansi-red': both(5.37, 5.33),
  'ansi-green': both(9.03, 4.96),
  'ansi-yellow': both(7.88, 5.21),
  'ansi-blue': both(6.42, 5.85),
  'ansi-magenta': both(5.1, 5.08),
  'ansi-cyan': both(7.38, 4.89),
  'ansi-white': both(6.59, 5.48),
  'ansi-bright-black': both(4.82, 5.48),
  'ansi-bright-red': both(5.84, 5.99),
  'ansi-bright-green': both(10.94, 6.38),
  'ansi-bright-yellow': both(10.69, 6.47),
  'ansi-bright-blue': both(8.81, 7.2),
  'ansi-bright-magenta': both(8.05, 6.58),
  'ansi-bright-cyan': both(10.28, 6.4),
  'ansi-bright-white': both(11.83, 8.22),
};
const ANSI_BACKGROUND_ONLY = { night: ['ansi-black'], day: [] };
for (const name of extendedSolids(palette, 'night').map(([n]) => n).filter((n) => n.startsWith('ansi-'))) {
  const spec = ANSI_SPEC[name] ?? both(undefined, undefined);
  CHECKS.push({ fg: name, on: TERM, min: 4.5, kind: 'ansi', spec, skip: ANSI_BACKGROUND_ONLY });
}

const rows = [];
for (const theme of THEMES) {
  for (const check of CHECKS) {
    if (check.skip?.[theme]?.includes(check.fg)) continue;
    const fg = hex(theme, check.fg);
    const ratios = check.on.map((ground) => contrast(fg, hex(theme, ground)));
    const low = Math.min(...ratios);
    const lowAt = check.on[ratios.indexOf(low)];
    const pass = low >= check.min;
    const label = `${theme} ${check.fg} on ${check.on.join(' / ')}`;
    if (!pass) failures.push(`${theme}: ${check.fg} on ${lowAt} is ${f2(low)} (min ${check.min})`);
    const spec = check.spec?.[theme];
    if (Array.isArray(spec)) spec.forEach((printed, i) => drift(`${theme} ${check.fg} on ${check.on[i]}`, ratios[i], printed ?? undefined));
    else if (typeof spec === 'number') drift(`${label} (lowest)`, low, spec);
    rows.push({ theme, kind: check.kind, fg: check.fg, on: check.on.join(' / '), ratios: ratios.map(f2).join(' / '), lowest: f2(low), min: check.min, result: pass ? 'pass' : 'FAIL', lowAt });
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 2a. Glass over busy backdrops (R18, R40): fill composited over each backdrop after the backdrop-filter's saturate();
//     blur is ignored (worst case). "Solved" is the lowest tint (step 0.02) that keeps ink-muted >= 4.6 everywhere.
const BACKDROPS = { white: '#FFFFFF', black: '#000000', grey: '#808080', 'snow photo': '#E8ECF0', sunset: '#E07A4A', sky: '#6FA8DC', foliage: '#2E5A2E' };
const GLASS_SPEC = {
  night: { chrome: [4.71, 8.47, 4.71, 3.84], legend: [4.71, 8.47, 4.71, 3.84], sheet: [6.11, 10.98, 6.11, 4.98], bead: [4.74, 8.52, 4.74, 3.86] },
  day: { chrome: [4.84, 10.98, 3.19, 4.71], legend: [4.84, 10.98, 3.19, 4.71], sheet: [5.58, 12.66, 3.68, 5.43], bead: [4.6, 10.44, 3.04, 4.48] },
};
const glass = { night: [], day: [] };
for (const theme of THEMES) {
  const x = R[theme];
  const set = {
    ...BACKDROPS,
    ...Object.fromEntries(x['map-hypso'].map((h, i) => [`hypso ${i + 1}`, h])),
    ...Object.fromEntries(x['map-temp'].map((h, i) => [`temp ${i + 1}`, h])),
    route: x['map-route'], head: x['map-head'], branch: x['map-branch'], lake: x['map-lake'], 'cold line': x['map-iso-cold'],
    'cold tint': x['map-cold-tint'], 'label ink': x['map-ink'], ground: palette[theme].ground,
  };
  const markStops = x['sheen-mark'].map((stop) => stop.hex);
  const materials = [
    ['chrome', 'chrome (navbar), tile', 'glass-fill', x['glass-saturate']],
    ['legend', 'legend', 'glass-fill', x['glass-saturate-soft']],
    ['sheet', 'sheet (chat window, panels)', 'glass-fill-strong', x['glass-saturate']],
    ['bead', 'bead (chat launcher)', 'glass-bead-fill', x['glass-saturate']],
  ];
  for (const [key, label, token, sat] of materials) {
    const { hex: fill, alpha } = x[token];
    const worst = { inkMuted: [Infinity], ink: [Infinity], mark: [Infinity], signal: [Infinity] };
    for (const [name, backdrop] of Object.entries(set)) {
      const comp = over(fill, alpha, saturate(backdrop, Number(sat)));
      const take = (k, ratio) => {
        if (ratio < worst[k][0]) worst[k] = [ratio, name];
      };
      take('inkMuted', contrast(palette[theme]['ink-muted'], comp));
      take('ink', contrast(palette[theme].ink, comp));
      take('signal', contrast(palette[theme].signal, comp));
      take('mark', Math.min(...markStops.map((stop) => contrast(stop, comp))));
    }
    let solved = null;
    for (let a = 0.5; a <= 1.0001 && solved === null; a += 0.02) {
      if (Object.values(set).every((b) => contrast(palette[theme]['ink-muted'], over(fill, a, saturate(b, Number(sat)))) >= 4.6)) solved = r2(a);
    }
    glass[theme].push({ label, token, alpha, sat, solved, ...worst });
    if (worst.inkMuted[0] < 4.5) failures.push(`R18 ${theme} ${label}: ink-muted ${f2(worst.inkMuted[0])} over ${worst.inkMuted[1]}`);
    if (worst.ink[0] < 4.5) failures.push(`R18 ${theme} ${label}: ink ${f2(worst.ink[0])} over ${worst.ink[1]}`);
    if (worst.signal[0] < 3) failures.push(`R18 ${theme} ${label}: the signal marker ${f2(worst.signal[0])} over ${worst.signal[1]}`);
    if (worst.mark[0] < 3 && token !== 'glass-bead-fill') failures.push(`R40 ${theme} ${label}: ridge mark ${f2(worst.mark[0])} over ${worst.mark[1]}`);
    const [inkMuted, ink, mark, signal] = GLASS_SPEC[theme][key];
    drift(`R18 ${theme} ${label} ink-muted`, worst.inkMuted[0], inkMuted);
    drift(`R18 ${theme} ${label} ink`, worst.ink[0], ink);
    drift(`R40 ${theme} ${label} ridge mark`, worst.mark[0], mark);
    drift(`R18 ${theme} ${label} signal marker`, worst.signal[0], signal);
  }
}

// 2b. The map (R33, R34, R36) and the ramps
const MAP_SPEC = {
  night: { routeRaw: 1.93, routeOnCasing: 3.2, branchOnCasing: 3.52, headOnCasing: 5.05, inkOnHypso: 6.72, inkOnTemp: 4.96, labelsOnHalo: 5.97, lakeEdge: 4.19, lakeSep: 0.208, lakeColdSep: 0.285, cvd: 13.8 },
  day: { routeRaw: 3.23, routeOnCasing: 6.65, branchOnCasing: 4.09, headOnCasing: 5.55, inkOnHypso: 6.29, inkOnTemp: 8.31, labelsOnHalo: 5.44, lakeEdge: 3.24, lakeSep: 0.087, lakeColdSep: 0.263, cvd: 19.4 },
};
/** The worst pair of a set under CVD: { de, kind, pair }. `skip` names pairs ('a/b', sorted) that are not compared. */
const worstPair = (named, skip = []) => {
  let worst = { de: Infinity };
  for (let i = 0; i < named.length; i++) {
    for (let j = i + 1; j < named.length; j++) {
      if (skip.includes([named[i][0], named[j][0]].sort().join('/'))) continue;
      const r = cvdMin(named[i][1], named[j][1]);
      if (r.de < worst.de) worst = { de: r.de, kind: r.kind, pair: `${named[i][0]}/${named[j][0]}` };
    }
  }
  return worst;
};
const map = {};
for (const theme of THEMES) {
  const x = R[theme];
  const hy = x['map-hypso'];
  const tp = x['map-temp'];
  const casing = x['map-route-casing'];
  const cased = (bg) => over(casing.hex, casing.alpha, bg);
  const minOver = (fg, grounds) => Math.min(...grounds.map((g) => contrast(fg, g)));
  const m = {
    routeRaw: minOver(x['map-route'], hy),
    routeOnCasing: minOver(x['map-route'], [...hy, ...tp].map(cased)),
    branchOnCasing: minOver(x['map-branch'], [...hy, ...tp].map(cased)),
    headOnCasing: minOver(x['map-head'], [...hy, ...tp].map(cased)),
    inkOnHypso: minOver(x['map-ink'], hy),
    inkOnTemp: minOver(x['map-ink'], tp),
    labelsOnHalo: Math.min(...['map-ink', 'map-lake-text', 'map-branch-text'].map((n) => contrast(x[n], x['map-label-halo']))),
    lakeEdge: minOver(x['map-lake-edge'], hy),
    lakeTextRaw: minOver(x['map-lake-text'], hy),
    lakeSep: Math.min(...hy.map((h) => dEok(x['map-lake'], h))),
    lakeColdSep: dEok(x['map-lake'], x['map-cold-tint']),
  };
  // the eye separates water (fill) from cold (line) by channel and lightness, so lake/iso-zero is not a CVD pair (§5.7)
  m.cvd = worstPair(
    ['route', 'branch', 'lake', 'iso-zero', 'ink'].map((n) => [n, x[`map-${n}`]]),
    ['iso-zero/lake'],
  );
  const dir = theme === 'night' ? 1 : -1;
  m.hypsoL = hy.map(L);
  m.hypsoMonotonic = hy.every((h, i) => i === 0 || dir * (L(h) - L(hy[i - 1])) > 0);
  const alt = [800, 2000, 3500, 4500, 5500, 7000];
  m.perBand = hy.slice(1).map((h, i) => {
    const ratio = Math.max(luminance(h), luminance(hy[i])) / Math.min(luminance(h), luminance(hy[i]));
    return ratio ** (500 / (alt[i + 1] - alt[i]));
  });
  // map-temp diverges about +5 °C (stop 4): luminance-monotonic on each side (Night darkest there, Day lightest)
  const Y = tp.map(luminance);
  const pivot = 3;
  const sideA = Y.slice(0, pivot + 1);
  const sideB = Y.slice(pivot);
  m.tempDiverging = sideA.every((y, i) => i === 0 || dir * (sideA[i - 1] - y) > 0) && sideB.every((y, i) => i === 0 || dir * (y - sideB[i - 1]) > 0);
  map[theme] = m;
  const spec = MAP_SPEC[theme];
  for (const k of ['routeRaw', 'routeOnCasing', 'branchOnCasing', 'headOnCasing', 'inkOnHypso', 'inkOnTemp', 'labelsOnHalo', 'lakeEdge']) drift(`map ${theme} ${k}`, m[k], spec[k]);
  drift(`map ${theme} lakeSep (dE_OK)`, m.lakeSep, spec.lakeSep, 3);
  drift(`map ${theme} lakeColdSep (dE_OK)`, m.lakeColdSep, spec.lakeColdSep, 3);
  drift(`map ${theme} worst CVD pair`, m.cvd.de, spec.cvd, 1);
  if (m.routeOnCasing < 3) failures.push(`R34 ${theme}: route on its casing ${f2(m.routeOnCasing)}`);
  if (m.branchOnCasing < 3) failures.push(`R34 ${theme}: branch on the casing ${f2(m.branchOnCasing)}`);
  if (m.headOnCasing < 3) failures.push(`R34 ${theme}: head on the casing ${f2(m.headOnCasing)}`);
  if (m.inkOnHypso < 4.5 || m.inkOnTemp < 4.5) failures.push(`R34 ${theme}: ink labels on the ramps ${f2(m.inkOnHypso)} / ${f2(m.inkOnTemp)}`);
  if (m.labelsOnHalo < 4.5) failures.push(`R34 ${theme}: map labels on the halo ${f2(m.labelsOnHalo)}`);
  if (m.lakeEdge < 3) failures.push(`R36 ${theme}: lake shoreline on the ramp ${f2(m.lakeEdge)}`);
  if (!m.hypsoMonotonic) failures.push(`R36 ${theme}: map-hypso lightness is not monotonic (${m.hypsoL.map(f3).join(', ')})`);
  if (m.lakeSep < 0.08) failures.push(`R36 ${theme}: lake vs nearest hypso stop dE_OK ${f3(m.lakeSep)} (min 0.080)`);
  if (!m.tempDiverging) failures.push(`R36 ${theme}: map-temp is not luminance-monotonic on each side of +5 °C`);
  if (m.cvd.de < 11.9) failures.push(`R33 ${theme}: map pair ${m.cvd.pair} dE76 ${m.cvd.de.toFixed(1)} (${m.cvd.kind}) < 11.9`);
}

// 2c. Chart ramps and CVD sets (charts with the highlight, status, accents); status vs accents is advice
const CVD_SPEC = { charts: both(16.3, 13.0) };
const cvd = { night: {}, day: {} };
for (const theme of THEMES) {
  const x = R[theme];
  const p = palette[theme];
  const seq = x['chart-sequential'];
  const dir = theme === 'night' ? 1 : -1;
  const seqOk = seq.every((h, i) => i === 0 || dir * (L(h) - L(seq[i - 1])) > 0);
  if (!seqOk) failures.push(`charts ${theme}: chart-sequential lightness is not monotonic`);
  const Y = x['chart-diverging'].map(luminance);
  const mid = 3;
  const divOk =
    Y.slice(0, mid + 1).every((y, i, a) => i === 0 || dir * (a[i - 1] - y) > 0) && Y.slice(mid).every((y, i, a) => i === 0 || dir * (y - a[i - 1]) > 0);
  if (!divOk) failures.push(`charts ${theme}: chart-diverging is not monotonic toward its centre on both sides`);
  const sets = {
    charts: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-highlight'].map((n) => [n, x[n]]),
    status: ['success', 'warning', 'error'].map((n) => [n, p[n]]),
    accents: [
      ['signal', p.signal],
      ['accent-2', x['accent-2']],
      ['aqua', x.aqua],
    ],
  };
  for (const [name, set] of Object.entries(sets)) {
    const worst = worstPair(set);
    cvd[theme][name] = worst;
    if (worst.de < 11.9) failures.push(`CVD ${theme} ${name}: ${worst.pair} dE76 ${worst.de.toFixed(1)} (${worst.kind}) < 11.9`);
  }
  drift(`CVD ${theme} charts worst pair`, cvd[theme].charts.de, CVD_SPEC.charts[theme], 1);
  cvd[theme].seqOk = seqOk;
  cvd[theme].divOk = divOk;
  for (const s of ['success', 'warning', 'error']) {
    for (const [a, ah] of sets.accents) {
      const r = cvdMin(p[s], ah);
      if (r.de < 6) advice.push(`CVD ${theme} ${s} vs ${a}: dE76 ${r.de.toFixed(1)} (${r.kind}); status always carries an icon and text`);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 3. Requirements and harmony (§7)
const req = [];
const setReq = (id, ok, evidence) => {
  req.push({ id, ok, evidence });
  if (!ok) failures.push(`${id}: ${evidence}`);
};
const NEON = { 'cyan-500': '#06B6D4', 'cyan-400': '#22D3EE', 'violet-500': '#8B5CF6', 'pink-500': '#EC4899', 'blue-500': '#3B82F6' };
/** Chromatic colours of a theme (C > 0.03): the core accent and status roles plus every extended colour and ramp member. */
const chromatic = (theme) => {
  const out = {};
  for (const role of ['signal', 'signal-line', 'water', 'success', 'warning', 'error']) out[role] = palette[theme][role];
  for (const [name, h] of extendedSolids(palette, theme)) if (C(h) > 0.03) out[name] = h;
  return out;
};

setReq('R4', true, `core 15 roles and ${extendedEntries(palette, 'night').length} extended tokens per theme, identical keys, kinds, lengths and stop offsets (loadPalette)`);
{
  const literal = THEMES.flatMap((t) =>
    extendedEntries(palette, t).flatMap(([name, value, kind]) => {
      const values = kind === 'composite' ? [value] : kind === 'stops' ? value.map((s) => s.color) : [];
      return values.filter((v) => v.startsWith('rgb(') && !/var\(--alpha-/.test(v)).map(() => `${t}.${name}`);
    }),
  );
  setReq('R6', literal.length === 0, literal.length ? `literal alphas: ${literal.join(', ')}` : 'every composite takes its alpha from the 12-step ladder');
}
{
  let worst = { de: Infinity };
  for (const theme of THEMES) {
    for (const [name, h] of Object.entries(chromatic(theme))) {
      for (const [neon, nh] of Object.entries(NEON)) {
        const de = dEok(h, nh);
        if (de < worst.de) worst = { de, token: `${theme}.${name} ${h}`, neon };
      }
    }
  }
  const banned = ['#000000', '#0B0B0B', '#111111', '#030014'].includes(palette.night.ground);
  drift('R8 closest token to the old neon (dE_OK)', worst.de, 0.082, 3);
  setReq('R8', worst.de >= 0.08 && !banned, `closest to the old neon: ${worst.token} vs ${worst.neon} dE_OK ${f3(worst.de)} (min 0.080); Night ground ${palette.night.ground}`);
}
{
  const grounds = ['ground', 'surface', 'surface-2', 'ground-sky'].map((r) => palette.night[r]);
  const okGrounds = grounds.every((h) => C(h) <= 0.015 && !(C(h) > 0.012 && hueGap(H(h), 245) < 20));
  const orange = Object.entries(chromatic('night')).filter(([, h]) => H(h) >= 40 && H(h) <= 60 && C(h) > 0.14);
  setReq('R9', okGrounds && orange.length === 0, `Night grounds C ${grounds.map((h) => f3(C(h))).join('/')} at h ${grounds.map((h) => H(h).toFixed(0)).join('/')}; ${orange.length ? `orange: ${orange.map(([n]) => n).join(', ')}` : 'no Night token at h 40-60 with C > 0.14'}`);
}
{
  const acc = (t) => ['signal', 'signal-line', 'accent-2', 'accent-2-line', 'aqua', 'aqua-line'].map((n) => hex(t, n));
  const nA = acc('night');
  const dA = acc('day');
  const dS = ['success', 'warning', 'error'].map((r) => palette.day[r]);
  const ok = nA.every((h) => C(h) >= 0.05 && C(h) <= 0.13) && dA.every((h) => C(h) >= 0.06 && C(h) <= 0.15) && dS.every((h) => C(h) <= 0.16);
  const range = (hs) => `${f3(Math.min(...hs.map(C)))}-${f3(Math.max(...hs.map(C)))}`;
  setReq('R10', ok, `Night accents C ${range(nA)} (0.05-0.13); Day accents ${range(dA)} (0.06-0.15); Day status max ${f3(Math.max(...dS.map(C)))} (<= 0.16)`);
}
{
  const n = contrast(palette.night.ink, palette.night.ground);
  const d = contrast(palette.day.ink, palette.day.ground);
  setReq('R11', n >= 11 && n <= 16 && d >= 12 && d <= 17 && palette.night.ink !== '#FFFFFF' && palette.day.ink !== '#000000', `ink on ground Night ${f2(n)} (11-16), Day ${f2(d)} (12-17); no pure white or black ink`);
}
{
  const steps = extendedSolids(palette, 'night')
    .map(([n]) => n)
    .filter((n) => /^metal-\d+$/.test(n))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
  const night = steps.map((s) => hex('night', s));
  const day = steps.map((s) => hex('day', s));
  const same = JSON.stringify(night) === JSON.stringify(day);
  const mono = night.every((h, i) => i === 0 || L(h) < L(night[i - 1]));
  const band = night.every((h) => C(h) <= 0.02 && (C(h) < 0.006 || (H(h) >= 255 && H(h) <= 290)));
  const anchors =
    ['ground', 'surface', 'surface-2', 'ground-sky', 'line', 'line-strong', 'ink', 'ink-muted'].every((r) => night.includes(palette.night[r])) &&
    ['line', 'line-strong', 'ink', 'ink-muted'].every((r) => night.includes(palette.day[r]));
  const paper = ['paper-0', 'paper-50', 'paper-100', 'paper-150'].map((p) => hex('day', p));
  const paperOk = ['ground', 'surface', 'surface-2'].every((r) => paper.includes(palette.day[r])) && hex('day', 'paper-sky') === palette.day['ground-sky'];
  const tinted = night.filter((h) => C(h) >= 0.006);
  setReq('R14', steps.length >= 9 && same && mono && band && anchors && paperOk, `${steps.length} metal steps, identical in both themes: ${same}; L strictly falling: ${mono}; hue ${Math.min(...tinted.map(H)).toFixed(0)}-${Math.max(...tinted.map(H)).toFixed(0)}, C <= ${f3(Math.max(...night.map(C)))}; every neutral role is a metal step and every Day ground a paper step: ${anchors && paperOk}`);
}
{
  const parts = [];
  let ok = true;
  for (const theme of THEMES) {
    for (const name of ['sheen-steel', 'sheen-mark', 'sheen-titanium', 'sheen-bronze', 'sheen-lacquer']) {
      const Ls = R[theme][name].map((s) => L(s.hex));
      const dL = Math.max(...Ls) - Math.min(...Ls);
      if (dL < (theme === 'night' ? 0.18 : 0.12)) ok = false;
      parts.push(`${theme} ${name.slice(6)} ${f3(dL)}`);
    }
  }
  setReq('R15', ok, `sheen highlight-to-shadow dL (>= 0.18 Night, 0.12 Day): ${parts.join(', ')}`);
}
{
  const parts = [];
  let ok = true;
  for (const theme of THEMES) {
    const sh = H(palette[theme].signal);
    for (const n of ['bronze-200', 'bronze-400', 'bronze-600', 'bronze-800']) {
      const h = hex(theme, n);
      if (hueGap(H(h), sh) > 15 || C(h) > 0.09 || (theme === 'night' && L(h) > 0.85)) ok = false;
    }
    const body = hex(theme, 'bronze');
    const sep = dEok(body, palette[theme].signal);
    if (sep < 0.05) ok = false;
    parts.push(`${theme} bronze ${body} h ${H(body).toFixed(0)} C ${f3(C(body))} L ${f3(L(body))}, dE to signal ${f3(sep)}`);
  }
  setReq('R16', ok, parts.join('; '));
}
{
  const parts = [];
  let ok = true;
  for (const theme of THEMES) {
    for (const [name, from] of [
      ['glass-caustic', 'aqua'],
      ['glass-refract', 'accent-2'],
    ]) {
      const m = /^rgb\(var\(--c-([a-z0-9-]+)\)/.exec(raw(theme, name));
      const a = R[theme][name].alpha;
      if (m?.[1] !== from || a > 0.15) ok = false;
      parts.push(`${theme} ${name} = ${m?.[1]} @ ${a}`);
    }
  }
  const dg = over(R.day['glass-fill'].hex, R.day['glass-fill'].alpha, palette.day.ground);
  const dgc = over(R.day['glass-caustic'].hex, R.day['glass-caustic'].alpha, dg);
  ok &&= C(dg) <= 0.02 && C(dgc) <= 0.02;
  setReq('R19', ok, `${parts.join('; ')}; Day glass over ground ${dg} C ${f3(C(dg))}, with caustic ${dgc} C ${f3(C(dgc))}`);
}
{
  const n = palette.night.water;
  const d = palette.day.water;
  setReq('R20', [n, d].every((h) => H(h) >= 175 && H(h) <= 200 && C(h) >= 0.05), `aqua Night ${n} h ${H(n).toFixed(1)} C ${f3(C(n))}; Day ${d} h ${H(d).toFixed(1)} C ${f3(C(d))} (h 175-200, C >= 0.05)`);
  setReq('R21', C(n) <= 0.11 && L(n) >= 0.7 && L(n) <= 0.82 && C(d) <= 0.1 && L(d) >= 0.42 && L(d) <= 0.52, `Night L ${f3(L(n))} C ${f3(C(n))}; Day L ${f3(L(d))} C ${f3(C(d))}`);
}
{
  const parts = [];
  let ok = true;
  for (const theme of THEMES) {
    const s = palette[theme].signal;
    const a = hex(theme, 'accent-2');
    ok &&= H(s) >= 15 && H(s) <= 32 && C(s) >= 0.08 && C(s) <= 0.13 && H(a) >= 285 && H(a) <= 310 && C(a) >= 0.05 && C(a) <= 0.1;
    const cs = contrast(s, palette[theme].ground);
    const ca = contrast(a, palette[theme].ground);
    ok &&= cs >= ca;
    parts.push(`${theme} signal h ${H(s).toFixed(0)} C ${f3(C(s))} (${f2(cs)}:1) >= accent-2 h ${H(a).toFixed(0)} C ${f3(C(a))} (${f2(ca)}:1)`);
  }
  setReq('R23', ok, parts.join('; '));
}
{
  const gaps = ['signal', 'signal-line', 'accent-2', 'accent-2-line', 'aqua', 'aqua-line', 'success', 'warning', 'error'].map((n) => [n, hueGap(H(hex('night', n)), H(hex('day', n)))]);
  const paper = ['ground', 'surface', 'surface-2'].map((r) => palette.day[r]);
  const paperOk = paper.every((h) => H(h) >= 100 && H(h) <= 140 && C(h) <= 0.015);
  setReq('R24', gaps.every(([, g]) => g <= 12) && paperOk, `Night/Day hue gaps (<= 12): ${gaps.map(([n, g]) => `${n} ${g.toFixed(1)}`).join(', ')}; Day paper h ${paper.map((h) => H(h).toFixed(0)).join('/')} C <= ${f3(Math.max(...paper.map(C)))}`);
}
setReq(
  'R25',
  THEMES.every((t) => raw(t, 'map-route') === 'var(--signal-line)' && raw(t, 'map-head') === 'var(--signal)' && raw(t, 'map-branch') === 'var(--accent-2-line)' && raw(t, 'oxblood') === 'var(--signal-line)'),
  'map-route = var(--signal-line), map-head = var(--signal), map-branch = var(--accent-2-line), oxblood = var(--signal-line) in both themes (by reference)',
);
{
  const parts = [];
  let ok = true;
  for (const theme of THEMES) {
    const accents = { signal: palette[theme].signal, 'accent-2': hex(theme, 'accent-2'), aqua: hex(theme, 'aqua') };
    for (const s of ['success', 'warning', 'error']) {
      for (const [a, ah] of Object.entries(accents)) {
        const d = dEok(palette[theme][s], ah);
        const g = hueGap(H(palette[theme][s]), H(ah));
        if (!(d >= 0.1 || g >= 30)) {
          ok = false;
          parts.push(`${theme} ${s}/${a} dE ${f3(d)} hue ${g.toFixed(1)}`);
        }
      }
    }
    const e = palette[theme].error;
    parts.push(`${theme} error/signal dE ${f3(dEok(e, accents.signal))} hue ${hueGap(H(e), H(accents.signal)).toFixed(1)}`);
  }
  setReq('R32', ok, parts.join('; '));
}
setReq('R33', THEMES.every((t) => map[t].cvd.de >= 11.9), THEMES.map((t) => `${t} worst ${map[t].cvd.pair} ${map[t].cvd.de.toFixed(1)} (${map[t].cvd.kind})`).join('; '));
setReq('R34', THEMES.every((t) => map[t].routeOnCasing >= 3 && map[t].inkOnHypso >= 4.5 && map[t].inkOnTemp >= 4.5 && map[t].labelsOnHalo >= 4.5), THEMES.map((t) => `${t} ink on hypso ${f2(map[t].inkOnHypso)}, on temp ${f2(map[t].inkOnTemp)}; labels on halo ${f2(map[t].labelsOnHalo)}; route on casing ${f2(map[t].routeOnCasing)}`).join('; '));
setReq('R36', THEMES.every((t) => map[t].hypsoMonotonic && map[t].lakeSep >= 0.08 && map[t].tempDiverging && map[t].lakeEdge >= 3), THEMES.map((t) => `${t} hypso L ${map[t].hypsoL.map(f3).join(' > ')}; per 500 m ${map[t].perBand.map(f3).join(', ')}; lake dE >= ${f3(map[t].lakeSep)}; temp diverges about +5 °C: ${map[t].tempDiverging}`).join(' | '));
{
  const pairs = ['signal', 'signal-line', 'water', 'accent-2', 'accent-2-line', 'aqua-line', 'map-lake', 'bronze'].map((n) => [n, hex('night', n), hex('day', n)]);
  let floor = { c: Infinity };
  for (const [n, a, b] of pairs) {
    const A = hexToOklab(a);
    const B = hexToOklab(b);
    const ra = hexToRgb255(a);
    const rb = hexToRgb255(b);
    for (let i = 1; i < 10; i++) {
      const u = i / 10;
      const lab = A.map((v, k) => v + (B[k] - v) * u);
      const c = Math.min(Math.hypot(lab[1], lab[2]), C(rgbToHex(ra.map((v, k) => v + (rb[k] - v) * u))));
      if (c < floor.c) floor = { c, n, u };
    }
  }
  drift('R37 lowest mid-tween chroma', floor.c, 0.06, 3);
  setReq('R37', floor.c >= 0.03, `lowest mid-tween chroma ${f3(floor.c)} (${floor.n} at ${floor.u}), OKLab and sRGB lerp (min 0.030)`);
}
{
  const terminalOk = THEMES.every((t) => ['ink', 'ink-muted'].every((r) => contrast(palette[t][r], hex(t, 'term-bg')) >= 4.5 && contrast(palette[t][r], hex(t, 'term-panel')) >= 4.5));
  const refs = THEMES.every((t) => ['var(--accent-2)', 'var(--signal)'].every((ref) => R[t]['gradient-alpenglow'].some((s) => s.ref === ref)));
  const shimmer = Math.min(...THEMES.flatMap((t) => ['term-bg', 'term-panel'].map((g) => contrast(palette[t]['ink-muted'], hex(t, g)))));
  setReq('R39', terminalOk && refs, `gradient-alpenglow stops reference signal and accent-2; the label shimmer's ends stay >= ${f2(shimmer)}:1 on the terminal grounds`);
}
{
  const parts = THEMES.map((t) => {
    const onGround = Math.min(...R[t]['sheen-mark'].map((s) => contrast(s.hex, palette[t].ground)));
    const onGlass = glass[t].find((g) => g.token === 'glass-fill').mark;
    return { ok: onGround >= 3 && onGlass[0] >= 3, text: `${t} mark stops >= ${f2(onGround)} on ground, >= ${f2(onGlass[0])} on navbar glass (over ${onGlass[1]})` };
  });
  setReq('R40', parts.every((p) => p.ok), parts.map((p) => p.text).join('; '));
}
setReq(
  'R41',
  THEMES.every((t) => raw(t, 'theme-color') === 'var(--ground)' && contrast(hex(t, 'selection-ink'), hex(t, 'selection-bg')) >= 4.5),
  `${THEMES.map((t) => `${t} selection ink on ${hex(t, 'selection-bg')} ${f2(contrast(hex(t, 'selection-ink'), hex(t, 'selection-bg')))}`).join('; ')}; theme-color = var(--ground)`,
);
{
  const failing = rows.filter((r) => r.result !== 'pass').length;
  const low = (theme, kind) => {
    const list = rows.filter((r) => r.theme === theme && r.kind === kind);
    return list.length ? f2(Math.min(...list.map((r) => Number(r.lowest)))) : '-';
  };
  setReq('R31', failing === 0, THEMES.map((t) => `${t}: lowest text ${low(t, 'text')}, graphic ${low(t, 'graphic')}, on-fill ${low(t, 'on-fill')}, soft ${low(t, 'soft')}, ANSI ${low(t, 'ansi')}`).join('; '));
}

const harmony = [];
const setHarmony = (name, ok, evidence) => {
  harmony.push({ name, ok, evidence });
  if (!ok) failures.push(`harmony ${name}: ${evidence}`);
};
{
  const s = palette.night.signal;
  const a = hex('night', 'accent-2');
  setHarmony('signal leads violet', L(s) >= L(a), `Night signal L ${f3(L(s))} >= accent-2 L ${f3(L(a))}`);
  const ratio = contrast(palette.night.water, palette.night.ground) / contrast(s, palette.night.ground);
  setHarmony('aqua stays under the signal', ratio <= 1.4, `Night aqua:signal contrast ratio ${f3(ratio)} (limit 1.40)`);
  for (const theme of THEMES) {
    const route = palette[theme]['signal-line'];
    const others = Object.entries(chromatic(theme)).filter(([n]) => !['signal-line', 'map-route', 'chart-highlight', 'oxblood'].includes(n));
    const top = others.reduce((m, x) => (C(x[1]) > C(m[1]) ? x : m));
    const ground = palette[theme].ground;
    const routeWeight = C(route) * Math.abs(L(ground) - L(route));
    const statusWeight = Math.max(...['success', 'warning', 'error'].map((r) => C(palette[theme][r]) * Math.abs(L(ground) - L(palette[theme][r]))));
    const weightOk = theme === 'day' ? statusWeight < routeWeight : true;
    setHarmony(`the route is the most chromatic mark (${theme})`, C(route) > C(top[1]) && weightOk, `${theme} signal-line C ${f3(C(route))} > next ${top[0]} ${top[1]} C ${f3(C(top[1]))}; status C x dL ${f3(statusWeight)} vs route ${f3(routeWeight)}${theme === 'day' ? '' : ' (the weight rule is Day-only)'}`);
  }
  const ds = palette.day.signal;
  const dr = palette.day['signal-line'];
  const hover = hex('day', 'signal-hover');
  setHarmony('the Day route is the deepest oxblood', L(dr) < L(ds) && L(dr) < L(hover) && H(dr) <= H(ds), `Day route L ${f3(L(dr))} < signal ${f3(L(ds))} and hover ${f3(L(hover))}; route h ${H(dr).toFixed(1)} <= signal h ${H(ds).toFixed(1)}`);
  // §11 Update 1.1: aquamarine leads the action; it stays one calm family out of the cyan band (R8 measures the distance)
  {
    const parts = [];
    let ok = true;
    for (const theme of THEMES) {
      const g = palette[theme].ground;
      const act = hex(theme, 'action');
      const tier = ['action', 'action-hover', 'action-pressed', 'action-line', 'action-soft'].map((n) => hex(theme, n));
      const ca = contrast(act, g);
      const cs = contrast(palette[theme].signal, g);
      const calm = tier.every((h) => H(h) >= 165 && H(h) <= 185) && tier.slice(0, 4).every((h) => C(h) >= 0.06 && C(h) <= 0.1);
      ok &&= ca >= cs && calm;
      parts.push(`${theme} action ${act} h ${H(act).toFixed(0)} C ${f3(C(act))} (${f2(ca)}:1) >= signal (${f2(cs)}:1); tier h ${Math.min(...tier.map(H)).toFixed(0)}-${Math.max(...tier.map(H)).toFixed(0)}`);
    }
    const gap = hueGap(H(hex('night', 'action')), H(hex('day', 'action')));
    setHarmony('aquamarine leads the action (Update 1.1)', ok && gap <= 12, `${parts.join('; ')}; Night/Day hue gap ${gap.toFixed(1)} (<= 12); h 165-185, C 0.06-0.10`);
    const deep = THEMES.map((t) => [t, hex(t, 'oxblood-deep'), hex(t, 'signal-deep')]);
    const dull = deep.every(([, o, s]) => C(o) < C(s) && L(o) <= L(s) + 0.005 && H(o) >= 12 && H(o) <= 28);
    setHarmony('oxblood is deep and dull (Update 1.1)', dull, deep.map(([t, o, s]) => `${t} oxblood-deep ${o} L ${f3(L(o))} C ${f3(C(o))} < signal-deep C ${f3(C(s))}`).join('; '));
  }
  const textGradients = extendedEntries(palette, 'night').filter(([n, , k]) => k === 'stops' && /label/.test(n)).map(([n]) => n);
  const neutral = THEMES.every((t) => R[t]['sheen-label']?.every((s) => ['var(--ink)', 'var(--ink-muted)'].includes(s.ref)));
  setHarmony('no gradient text but the Alpenglow label', textGradients.length === 1 && textGradients[0] === 'sheen-label' && neutral, 'only sheen-label (ink-muted <-> ink) may clip to text; no coloured or display-text gradient token exists');
}

// APCA (advice; WCAG 2.x decides)
const apcaRows = THEMES.map((theme) => {
  const parts = ['ink', 'ink-muted', 'signal', 'accent-2', 'water', 'success', 'warning', 'error'].map((n) => {
    const fg = hex(theme, n);
    const lc = Math.min(...G3.map((g) => apca(fg, palette[theme][g])));
    const use = lc >= 75 ? 'body' : lc >= 52 ? 'labels 16px+' : lc >= 40 ? '18px bold / 24px+' : 'non-text';
    return `${n} ${lc.toFixed(0)} (${use})`;
  });
  return `${theme}: ${parts.join(', ')}`;
});

// ---------------------------------------------------------------------------------------------------------------------
// 4. Generated files in sync
const normalize = (text) => text.replace(/\r\n/g, '\n');
const stale = [];
for (const [path, expected] of generatedFiles(palette)) {
  const name = relative(ROOT, path).replaceAll('\\', '/');
  let actual = null;
  try {
    actual = readFileSync(path, 'utf8');
  } catch {
    failures.push(`${name} is missing; run npm run palette:emit`);
    stale.push(name);
    continue;
  }
  if (normalize(actual) !== normalize(expected)) {
    failures.push(`${name} is out of date with palette.json; run npm run palette:emit`);
    stale.push(name);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. Source bans in src/ and app/ (bans.mjs), zero-offset glows included (R12)
const { bans, allowed: allowedBans, pending, glows } = scanBans(collectFiles([`${ROOT}/src`, `${ROOT}/app`]));
for (const b of bans) failures.push(`ban: ${b}`);
for (const g of glows) failures.push(`R12 zero-offset glow (use an offset shadow or none): ${g}`);

// ---------------------------------------------------------------------------------------------------------------------
// Report
const pass = (ok) => (ok ? 'pass' : 'FAIL');
console.log(`check:palette  ${palette.name ?? 'palette'} ${palette.version ?? ''}  (spec ${palette.spec ?? 'docs/redesign/palette/PALETTE-SPEC.md'})`);
if (VERBOSE) console.table(rows.map(({ lowAt: _lowAt, ...row }) => row));
const byKind = (kind) => rows.filter((r) => r.kind === kind);
const lowestOf = (list) => list.reduce((m, r) => (Number(r.lowest) < Number(m.lowest) ? r : m));
console.log(`\nContrast (WCAG 2.x): ${rows.length} checks over ${rows.reduce((n, r) => n + r.ratios.split(' / ').length, 0)} pairs, ${rows.filter((r) => r.result !== 'pass').length} below the minimum.`);
for (const theme of THEMES) {
  const parts = ['text', 'graphic', 'on-fill', 'soft', 'ansi'].map((kind) => {
    const list = byKind(kind).filter((r) => r.theme === theme);
    if (!list.length) return null;
    const low = lowestOf(list);
    return `${kind} ${low.lowest} (${low.fg} on ${low.lowAt})`;
  });
  console.log(`  ${theme.padEnd(5)} lowest  ${parts.filter(Boolean).join(' | ')}`);
}
console.log('\nGlass over the R18 backdrop set (saturate() applied; worst backdrop in brackets):');
for (const theme of THEMES) {
  for (const g of glass[theme]) {
    console.log(`  ${theme.padEnd(5)} ${g.label.padEnd(28)} ${g.token} @${g.alpha} sat ${g.sat}: ink-muted ${f2(g.inkMuted[0])} (${g.inkMuted[1]}), ink ${f2(g.ink[0])}, ridge mark ${f2(g.mark[0])}, signal marker ${f2(g.signal[0])}; solved tint ${g.solved}`);
  }
}
console.log('\nMap:');
for (const theme of THEMES) {
  const m = map[theme];
  console.log(`  ${theme.padEnd(5)} route raw ${f2(m.routeRaw)}, on casing ${f2(m.routeOnCasing)}; branch ${f2(m.branchOnCasing)}; head ${f2(m.headOnCasing)}; ink on hypso ${f2(m.inkOnHypso)} / temp ${f2(m.inkOnTemp)}; labels on halo ${f2(m.labelsOnHalo)}; lake edge ${f2(m.lakeEdge)} (lake text raw ${f2(m.lakeTextRaw)}, needs the halo); lake dE ${f3(m.lakeSep)} / cold ${f3(m.lakeColdSep)}; CVD ${m.cvd.pair} ${m.cvd.de.toFixed(1)} ${m.cvd.kind}`);
}
console.log('\nCVD sets (Machado 2009 severity 1, worst dE76 over normal, protan, deutan, tritan; min 11.9):');
for (const theme of THEMES) {
  const c = cvd[theme];
  console.log(`  ${theme.padEnd(5)} charts + highlight ${c.charts.pair} ${c.charts.de.toFixed(1)} ${c.charts.kind}; status ${c.status.pair} ${c.status.de.toFixed(1)} ${c.status.kind}; accents ${c.accents.pair} ${c.accents.de.toFixed(1)} ${c.accents.kind}; ramps: sequential ${pass(c.seqOk)}, diverging ${pass(c.divOk)}`);
}
console.log('\nRequirements (PALETTE-SPEC §7):');
for (const r of req.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)))) console.log(`  ${r.id.padEnd(4)} ${pass(r.ok)}  ${r.evidence}`);
console.log('\nHarmony:');
for (const h of harmony) console.log(`  ${pass(h.ok)}  ${h.name}: ${h.evidence}`);
console.log('\nAPCA Lc, lowest over ground / surface / surface-2 (advice; WCAG 2.x decides):');
for (const line of apcaRows) console.log(`  ${line}`);
console.log(`\nGenerated files: ${stale.length ? `STALE ${stale.join(', ')}` : 'tokens.css, palette.ts and tailwind-colors.json match palette.json'}.`);
console.log(`Bans (src/, app/): ${bans.length ? `${bans.length} found` : 'none'}${allowedBans.length ? `; ${allowedBans.length} allowed by palette-allow` : ''}.`);
for (const a of allowedBans) console.log(`  allowed: ${a}`);
for (const p of pending) console.log(`  pending wave 2 (tolerated until the gate): ${p}`);
if (advice.length) {
  console.log('\nAdvice (not failures):');
  for (const a of advice) console.log(`  - ${a}`);
}
if (notes.length) {
  console.log('\nNotes (drift from the numbers the spec prints; not failures):');
  for (const n of notes) console.log(`  - ${n}`);
}
if (failures.length) {
  console.error(`\ncheck:palette FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\ncheck:palette passed: ${rows.length} contrast checks, ${glass.night.length + glass.day.length} glass materials, the map, ${req.length} requirements, ${harmony.length} harmony rules; generated files in sync; no bans.`);
