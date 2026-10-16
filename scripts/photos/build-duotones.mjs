#!/usr/bin/env node
// npm run gen:photos — DESIGN-SPEC §F G-14 and §C.7: pre-rendered duotones for the album files with a
// color cast or heavy noise (G2, G8, G13). Each original becomes two toned WebPs in public/media/album/:
//   <name>-duo-night.webp  maps shadows → highlights as Night ground #0E2231 → Night ink #EAF0F2
//   <name>-duo-day.webp    maps shadows → highlights as Day ink #1B1E1C → Day ground #EEF0EA
// MediaSlot renders both and CSS hides the other theme's (paths live in src/shared/config/media.ts).
// The originals are never modified. Same size as the original, metadata stripped (sharp's default).
// Dropped when Aman sends better originals (§C.7).
// It also cuts the Aman-only 4:5 derivative of G5 (§A.6, Q-60): public/media/album/g5-aman.webp. No 4:5 box over
// the full G5 frame hides the friend, so the original lives in the git-ignored media-inbox/ (never published) and
// only the crop ships. Without the original (a fresh clone) the crop step is skipped and the committed crop stays.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLIC_DIR = join(ROOT, 'public');
const INBOX_DIR = join(ROOT, 'media-inbox');
const OUT_DIR = join(PUBLIC_DIR, 'media', 'album');
const PALETTE = JSON.parse(readFileSync(join(ROOT, 'scripts', 'palette', 'palette.json'), 'utf8'));

/** The three album files the spec tones (§E.3 Album: "duotone"). */
const SOURCES = ['G2.webp', 'G8.webp', 'G13.webp'];

/** §C.7 mapping, read from the token source so it cannot drift from the palette. */
const RAMPS = {
  night: { shadow: PALETTE.night.ground, highlight: PALETTE.night.ink },
  day: { shadow: PALETTE.day.ink, highlight: PALETTE.day.ground },
};

const WEBP = { quality: 80, effort: 6, smartSubsample: true };

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** A 256-entry lookup from grey level to the ramp color (interpolated in sRGB, like a printed duotone). */
function rampTable({ shadow, highlight }) {
  const a = hexToRgb(shadow);
  const b = hexToRgb(highlight);
  const table = new Uint8Array(256 * 3);
  for (let level = 0; level < 256; level += 1) {
    const t = level / 255;
    for (let c = 0; c < 3; c += 1) table[level * 3 + c] = Math.round(a[c] + (b[c] - a[c]) * t);
  }
  return table;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const rel = (path) => relative(ROOT, path).split('\\').join('/');

async function toneOne(file) {
  const input = join(PUBLIC_DIR, file);
  const base = file.replace(/\.[^.]+$/, '').toLowerCase();
  // Luminance only, stretched between the 1st and 99th percentiles so a cast or haze cannot flatten the
  // ramp; a light 3 × 3 median takes the edge off sensor noise before toning.
  const { data, info } = await sharp(input)
    .rotate()
    .greyscale()
    .median(3)
    .normalise({ lower: 1, upper: 99 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 1) throw new Error(`${file}: expected 1 channel after greyscale, got ${info.channels}`);

  const results = [];
  for (const [theme, ramp] of Object.entries(RAMPS)) {
    const table = rampTable(ramp);
    const rgb = Buffer.alloc(info.width * info.height * 3);
    for (let i = 0; i < data.length; i += 1) {
      const level = data[i];
      rgb[i * 3] = table[level * 3];
      rgb[i * 3 + 1] = table[level * 3 + 1];
      rgb[i * 3 + 2] = table[level * 3 + 2];
    }
    const out = join(OUT_DIR, `${base}-duo-${theme}.webp`);
    const webp = await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } }).webp(WEBP).toBuffer();
    writeFileSync(out, webp);
    results.push({ out, width: info.width, height: info.height });
  }
  return results;
}

/**
 * Q-60 privacy crop: the right-hand region of G5 (4032 × 3024) that holds only Aman. left >= 2180 px clears the
 * friend's shoulder; 4:5 at that width, bottom-aligned so the head sits in the upper third. Metadata stripped.
 */
const CROPS = [{ file: 'G5.webp', out: 'g5-aman.webp', left: 2180, ratio: 4 / 5 }];

async function cropOne({ file, out, left, ratio }) {
  const input = join(INBOX_DIR, file);
  const { width: srcW, height: srcH } = await sharp(input).rotate().metadata();
  const width = srcW - left;
  const height = Math.round(width / ratio);
  if (height > srcH) throw new Error(`${file}: a ${width}-px-wide 4:5 crop needs ${height} px of height, source has ${srcH}`);
  const target = join(OUT_DIR, out);
  const webp = await sharp(input)
    .rotate()
    .extract({ left, top: srcH - height, width, height })
    .webp(WEBP)
    .toBuffer();
  writeFileSync(target, webp);
  return { out: target, width, height };
}

mkdirSync(OUT_DIR, { recursive: true });
console.log('Q-60 privacy crops');
for (const crop of CROPS) {
  if (!existsSync(join(INBOX_DIR, crop.file))) {
    console.log(`  skip ${crop.out}: media-inbox/${crop.file} not present (private original); the committed crop stays`);
    continue;
  }
  const { out, width, height } = await cropOne(crop);
  console.log(`  ok   ${rel(out)}  ${kb(statSync(out).size)}  ${width} × ${height}  (from ${crop.file})`);
}
console.log('G-14 duotones');
for (const file of SOURCES) {
  const results = await toneOne(file);
  for (const { out, width, height } of results) {
    console.log(`  ok   ${rel(out)}  ${kb(statSync(out).size)}  ${width} × ${height}  (from ${file}, ${kb(statSync(join(PUBLIC_DIR, file)).size)})`);
  }
}
console.log('gen:photos: done.');
