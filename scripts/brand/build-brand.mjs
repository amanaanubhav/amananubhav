#!/usr/bin/env node
// npm run gen:brand — builds the brand files of DESIGN-SPEC §F G-11 to G-13 (dev-only; outputs are committed):
//   G-11  public/favicon.svg (≤ 2 KB), public/favicon.ico (16/32/48, ≤ 15 KB), public/favicon-96x96.png,
//         public/favicon-192x192.png, public/apple-touch-icon.png (180 px on solid Night ground)
//   G-12  public/og/aman-anubhav.png (1200 × 630, ≤ 150 KB) via next/og ImageResponse with the @fontsource
//         Archivo and Literata files; falls back to a sharp SVG render with a logged warning
//   G-13  public/textures/grain.png (256 × 256 greyscale, seeded, ≤ 6 KB)
// Deterministic: the same inputs always give the same files. Flags: --only=icons|og|grain (comma list),
// --og-fallback (skip next/og and exercise the sharp fallback), --out=<dir> (write the OG card elsewhere).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import sharp from 'sharp';

import { buildGrain } from './grain.mjs';
import { faviconSvg, iconSvg } from './mark.mjs';
import { OG_HEIGHT, OG_WIDTH, ogArtworkSvg, ogElement, ogFallbackSvg, ridgeLayout } from './og-card.mjs';
import { PALETTE, PUBLIC_DIR, ROOT, encodeIco, importSource, report } from './shared.mjs';

const require = createRequire(join(ROOT, 'package.json'));

const BUDGET = {
  faviconSvg: 2 * 1024,
  ico: 15 * 1024,
  og: 150 * 1024,
  grain: 6 * 1024,
};

const only = new Set(
  process.argv
    .filter((arg) => arg.startsWith('--only='))
    .flatMap((arg) => arg.slice('--only='.length).split(','))
    .filter(Boolean),
);
const wants = (part) => only.size === 0 || only.has(part);
const forceFallback = process.argv.includes('--og-fallback');
const ogOutDir = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);

const { mulberry32, hashSeed } = await importSource('src/shared/lib/random/random.ts');

function rasterise(svg, size, { opaque = false } = {}) {
  // density scales the SVG's own px size; render at the target size directly (the SVG declares it).
  // Full-bleed icons drop the alpha channel: iOS composites a transparent apple-touch-icon on black.
  let image = sharp(Buffer.from(svg)).resize(size, size);
  if (opaque) image = image.removeAlpha();
  return image.png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
}

async function buildIcons() {
  console.log('G-11 brand mark and icons');
  const n = PALETTE.night;
  const svgPath = join(PUBLIC_DIR, 'favicon.svg');
  writeFileSync(svgPath, `${faviconSvg(PALETTE)}\n`);
  let ok = report(svgPath, BUDGET.faviconSvg);

  // Tab-size frames get a slightly heavier stroke and dot so the mark survives pixel snapping.
  const tab = {
    16: { pad: 1.3, radius: 3, stroke: 2.3, dot: 2.1 },
    32: { pad: 1.6, radius: 3.5, stroke: 1.95, dot: 1.9 },
    48: { pad: 2, radius: 4, stroke: 1.75, dot: 1.8 },
  };
  const icoImages = [];
  for (const size of [16, 32, 48]) {
    const png = await rasterise(iconSvg({ size, ground: n.ground, signal: n.signal, ...tab[size] }), size);
    icoImages.push({ size, png });
  }
  const icoPath = join(PUBLIC_DIR, 'favicon.ico');
  writeFileSync(icoPath, encodeIco(icoImages));
  ok = report(icoPath, BUDGET.ico, '16, 32, 48 px') && ok;

  // Larger icons sit on solid Night ground. 96 px keeps the tile's rounded corners (desktop shortcuts and
  // tabs on high-density screens); 192 (Android) and 180 (iOS) are full-bleed: the platform masks them.
  const larger = [
    { file: 'favicon-96x96.png', size: 96, pad: 2.6, radius: 4 },
    { file: 'favicon-192x192.png', size: 192, pad: 5, radius: 0 },
    { file: 'apple-touch-icon.png', size: 180, pad: 5, radius: 0 },
  ];
  for (const icon of larger) {
    const png = await rasterise(iconSvg({ size: icon.size, ground: n.ground, signal: n.signal, pad: icon.pad, radius: icon.radius }), icon.size, {
      opaque: icon.radius === 0,
    });
    const path = join(PUBLIC_DIR, icon.file);
    writeFileSync(path, png);
    ok = report(path, undefined, `${icon.size} × ${icon.size}`) && ok;
  }
  return ok;
}

function loadFont(pkg, file) {
  return readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));
}

async function renderWithNextOg({ artworkSvg, layout }) {
  const { ImageResponse } = require('next/og');
  const React = require('react');
  const fonts = [
    { name: 'Archivo', data: loadFont('archivo', 'archivo-latin-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Archivo', data: loadFont('archivo', 'archivo-latin-600-normal.woff'), weight: 600, style: 'normal' },
    { name: 'Literata', data: loadFont('literata', 'literata-latin-400-normal.woff'), weight: 400, style: 'normal' },
  ];
  const artworkDataUri = `data:image/svg+xml;base64,${Buffer.from(artworkSvg).toString('base64')}`;
  const element = ogElement({ h: React.createElement, artworkDataUri, layout, palette: PALETTE });
  const response = new ImageResponse(element, { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  return Buffer.from(await response.arrayBuffer());
}

async function buildOg() {
  console.log('G-12 OG card');
  const { ANNAPURNA_ROUTE } = await importSource('src/entities/expedition/model/expeditions.ts');
  const layout = ridgeLayout(ANNAPURNA_ROUTE);
  const rand = mulberry32(hashSeed('G-12 og card'));
  const artworkSvg = ogArtworkSvg({ layout, palette: PALETTE, rand, contourRgba: PALETTE.contour.night });

  let png;
  let renderer = 'next/og';
  try {
    if (forceFallback) throw new Error('--og-fallback given');
    png = await renderWithNextOg({ artworkSvg, layout });
  } catch (error) {
    renderer = 'sharp fallback';
    console.warn(`  WARN next/og ImageResponse failed (${error instanceof Error ? error.message : String(error)});`);
    console.warn('       rendering the sharp SVG fallback. Its type uses whatever Archivo/Literata or system fonts librsvg finds.');
    png = await sharp(Buffer.from(ogFallbackSvg({ artworkSvg, layout, palette: PALETTE }))).png().toBuffer();
  }

  // Quantise to a 256-color palette: the card is flat color and antialiased lines, so this is visually
  // lossless and keeps it well under budget.
  const out = await sharp(png).png({ palette: true, colours: 256, quality: 100, effort: 10, compressionLevel: 9, dither: 0 }).toBuffer();
  const dir = ogOutDir ?? join(PUBLIC_DIR, 'og');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'aman-anubhav.png');
  writeFileSync(path, out);
  const meta = await sharp(out).metadata();
  return report(path, BUDGET.og, `${meta.width} × ${meta.height}, ${renderer}`) && meta.width === OG_WIDTH && meta.height === OG_HEIGHT;
}

function buildGrainFile() {
  console.log('G-13 paper grain');
  const dir = join(PUBLIC_DIR, 'textures');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'grain.png');
  writeFileSync(path, buildGrain(mulberry32(hashSeed('G-13 paper grain'))));
  return report(path, BUDGET.grain, '256 × 256, 2-bit grey palette');
}

let ok = true;
if (wants('icons')) ok = (await buildIcons()) && ok;
if (wants('og')) ok = (await buildOg()) && ok;
if (wants('grain')) ok = buildGrainFile() && ok;

if (!ok) {
  console.error('gen:brand: a budget or size check failed (see FAIL above).');
  process.exit(1);
}
console.log('gen:brand: done.');
