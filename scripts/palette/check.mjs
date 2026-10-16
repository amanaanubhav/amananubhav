// npm run check:palette
// 1. Recomputes every contrast ratio of DESIGN-SPEC §B.1 from palette.json and fails below the minimums:
//    text roles >= 4.5 on their grounds, line-strong and signal-line >= 3, on-signal >= 4.5 on signal.
// 2. Fails when the generated tokens.css / palette.ts are out of date with palette.json.
// 3. Fails when any file under src/ uses the `text-signal-line` utility (signal-line is graphics only).
// Exits 1 on any failure. Values that drift from the ratios printed in the spec are reported as notes.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import {
  PALETTE_TS_PATH,
  ROOT,
  TOKENS_CSS_PATH,
  contrast,
  loadPalette,
  renderPaletteTs,
  renderTokensCss,
} from './lib.mjs';

const GROUNDS = ['ground', 'surface', 'surface-2', 'ground-sky'];
const STATUS_GROUNDS = ['ground', 'surface', 'surface-2'];

/**
 * The §B.1 table: foreground role, grounds it is checked on, minimum ratio, and the ratios the spec prints
 * (same order as the grounds) for each theme. Night follows the owner's graphite / oxblood / dusty-violet brief,
 * which supersedes the Cyanotype Night column of the DESIGN-SPEC §B.1 table; its ratios live here until the spec is updated.
 */
const CHECKS = [
  { role: 'ink', on: GROUNDS, min: 4.5, spec: { night: [13.85, 12.96, 11.83, 14.62], day: [14.64, 16.04, 13.16, 13.81] } },
  { role: 'ink-muted', on: GROUNDS, min: 4.5, spec: { night: [7.71, 7.21, 6.59, 8.13], day: [6.57, 7.19, 5.9, 6.2] } },
  { role: 'signal', on: GROUNDS, min: 4.5, spec: { night: [5.91, 5.53, 5.05, 6.24], day: [5.63, 6.16, 5.06, 5.31] } },
  { role: 'line-strong', on: GROUNDS, min: 3, spec: { night: [4.02, 3.77, 3.44, 4.25], day: [3.57, 3.91, 3.21, 3.36] } },
  { role: 'signal-line', on: GROUNDS, min: 3, spec: { night: [3.98, 3.73, 3.4, 4.2], day: [3.87, 4.24, 3.48, 3.66] } },
  { role: 'water', on: STATUS_GROUNDS, min: 4.5, spec: { night: [6.29, 5.88, 5.37], day: [5.92, 6.49, 5.32] } },
  { role: 'success', on: STATUS_GROUNDS, min: 4.5, spec: { night: [8.4, 7.86, 7.18], day: [5.6, 6.13, 5.03] } },
  { role: 'warning', on: STATUS_GROUNDS, min: 4.5, spec: { night: [9.14, 8.56, 7.81], day: [5.79, 6.34, 5.21] } },
  { role: 'error', on: STATUS_GROUNDS, min: 4.5, spec: { night: [8.55, 8.01, 7.31], day: [6.21, 6.81, 5.59] } },
  { role: 'on-signal', on: ['signal'], min: 4.5, spec: { night: [5.91], day: [6.46] } },
];

const failures = [];
const notes = [];
const palette = loadPalette();

// 1. Contrast table
const rows = [];
for (const theme of ['night', 'day']) {
  const tokens = palette[theme];
  for (const check of CHECKS) {
    check.on.forEach((groundRole, i) => {
      const ratio = contrast(tokens[check.role], tokens[groundRole]);
      const shown = Math.round(ratio * 100) / 100;
      const pass = ratio >= check.min;
      const expected = check.spec[theme][i];
      if (!pass) failures.push(`${theme}: ${check.role} on ${groundRole} is ${shown.toFixed(2)} (min ${check.min})`);
      if (expected !== undefined && Math.abs(shown - expected) > 0.015) {
        notes.push(`${theme}: ${check.role} on ${groundRole} computes ${shown.toFixed(2)}, spec prints ${expected.toFixed(2)}`);
      }
      rows.push({
        theme,
        role: check.role,
        on: groundRole,
        ratio: shown.toFixed(2),
        min: check.min.toFixed(1),
        result: pass ? 'pass' : 'FAIL',
      });
    });
  }
}
console.table(rows);

// 2. Generated files in sync
const normalize = (text) => text.replace(/\r\n/g, '\n');
for (const [path, expected] of [
  [TOKENS_CSS_PATH, renderTokensCss(palette)],
  [PALETTE_TS_PATH, renderPaletteTs(palette)],
]) {
  const rel = relative(ROOT, path).replaceAll('\\', '/');
  let actual = null;
  try {
    actual = readFileSync(path, 'utf8');
  } catch {
    failures.push(`${rel} is missing; run npm run palette:emit`);
    continue;
  }
  if (normalize(actual) !== normalize(expected)) {
    failures.push(`${rel} is out of date with palette.json; run npm run palette:emit`);
  }
}

// 3. `text-signal-line` is never allowed in src/ (equivalent of: grep -rn "text-signal-line" src)
const NEEDLE = 'text-signal-line';
function walk(dir, hits) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, hits);
    } else if (stat.isFile() && stat.size < 4 * 1024 * 1024) {
      const lines = readFileSync(full, 'utf8').split(/\r?\n/);
      lines.forEach((line, i) => {
        if (line.includes(NEEDLE)) hits.push(`${relative(ROOT, full).replaceAll('\\', '/')}:${i + 1}: ${line.trim()}`);
      });
    }
  }
  return hits;
}
const hits = walk(resolve(ROOT, 'src'), []);
for (const hit of hits) failures.push(`${NEEDLE} is graphics-only and must not be used as text: ${hit}`);

if (notes.length) {
  console.log('\nNotes (rounding differences against the spec table, not failures):');
  for (const note of notes) console.log(`  - ${note}`);
}

if (failures.length) {
  console.error(`\ncheck:palette FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`\ncheck:palette passed: ${rows.length} ratios, generated files in sync, no ${NEEDLE} in src/.`);
