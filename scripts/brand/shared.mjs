// Shared helpers for the brand and photo scripts (dev-only; never imported by src/).
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { constants, crc32, deflateSync } from 'node:zlib';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PUBLIC_DIR = join(ROOT, 'public');

/** The one token source (§B.2): scripts read hexes from it so they cannot drift from the CSS. */
export const PALETTE = JSON.parse(readFileSync(join(ROOT, 'scripts', 'palette', 'palette.json'), 'utf8'));

let warningFilterInstalled = false;

/**
 * Imports an erasable-TypeScript source file from the repo through Node's built-in type stripping
 * (files that keep to `import type`, as `expeditions.ts` and `random.ts` promise).
 */
export async function importSource(relativePath) {
  if (!warningFilterInstalled) {
    warningFilterInstalled = true;
    const listeners = process.listeners('warning');
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
      if (warning?.code === 'MODULE_TYPELESS_PACKAGE_JSON' || warning?.name === 'ExperimentalWarning') return;
      for (const listener of listeners) listener(warning);
    });
  }
  return import(pathToFileURL(join(ROOT, relativePath)).href);
}

/** `#RRGGBB` → `[r, g, b]` (0-255). */
export function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rel(path) {
  return relative(ROOT, path).split('\\').join('/');
}

export function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Logs one output line with its size and budget, and returns whether the budget holds. */
export function report(path, budgetBytes, extra = '') {
  const bytes = statSync(path).size;
  const ok = budgetBytes === undefined || bytes <= budgetBytes;
  const budget = budgetBytes === undefined ? '' : ` (budget ${kb(budgetBytes)}${ok ? '' : ', OVER'})`;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${rel(path)}  ${kb(bytes)}${budget}${extra ? `  ${extra}` : ''}`);
  return ok;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

/**
 * Minimal PNG encoder for small generated textures, so bit depth, color type, filter and deflate strategy
 * are ours (sharp cannot write a 2-bit palette PNG with Huffman-only deflate, which is what keeps the
 * grain tiny). `indices` holds one palette index per pixel, row-major; `palette` is a list of
 * `[r, g, b, a]` entries (≤ 2^bitDepth). Rows use filter None.
 */
export function encodeIndexedPng({ width, height, bitDepth, palette, indices, huffmanOnly = true }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = bitDepth;
  header[9] = 3; // indexed color
  header[10] = 0; // compression
  header[11] = 0; // filter method
  header[12] = 0; // no interlace
  const perByte = 8 / bitDepth;
  const stride = Math.ceil(width / perByte);
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1);
    raw[row] = 0; // filter None: sparse noise compresses best unfiltered
    for (let x = 0; x < width; x += 1) {
      const shift = 8 - bitDepth * ((x % perByte) + 1);
      raw[row + 1 + Math.floor(x / perByte)] |= indices[y * width + x] << shift;
    }
  }
  const plte = Buffer.alloc(palette.length * 3);
  const trns = Buffer.alloc(palette.length);
  palette.forEach(([r, g, b, a], i) => {
    plte[i * 3] = r;
    plte[i * 3 + 1] = g;
    plte[i * 3 + 2] = b;
    trns[i] = a;
  });
  const idat = deflateSync(raw, { level: 9, memLevel: 9, strategy: huffmanOnly ? constants.Z_HUFFMAN_ONLY : constants.Z_DEFAULT_STRATEGY });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('PLTE', plte),
    chunk('tRNS', trns),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Packs PNG images into one ICO container (PNG-in-ICO, supported by every current browser and Windows Vista+). */
export function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // palette colors
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}
