// G-13: paper grain, a 256 × 256 seeded greyscale texture tiled by `.paper-grain` (§B.6) at
// `--grain-opacity` (4.5% Night, 6% Day) with no blend mode.
//
// The tile is transparent paper with sparse grey specks (white, black and a soft mid-grey), so it adds
// tooth without shifting the ground color: an opaque mid-grey noise tile would lift Night and darken Day.
// White specks read on Night, black specks on Day. Sparse specks in a 2-bit grey palette are also what
// keep it ≤ 6 KB (dense 8-bit noise cannot compress below about 40 KB). One grain in eight gets a soft
// neighbour so the texture has some tooth rather than pure pixel dust.
import { encodeIndexedPng } from './shared.mjs';

export const GRAIN_SIZE = 256;

/** Palette: 0 = clear paper, 1 = white speck, 2 = black speck, 3 = soft grey grain edge. All grey. */
const GRAIN_PALETTE = [
  [128, 128, 128, 0],
  [255, 255, 255, 255],
  [0, 0, 0, 255],
  [128, 128, 128, 170],
];

export function buildGrain(rand, { density = 0.08 } = {}) {
  const size = GRAIN_SIZE;
  const indices = new Uint8Array(size * size);
  for (let i = 0; i < indices.length; i += 1) {
    if (rand() >= density) continue;
    indices[i] = rand() < 0.5 ? 1 : 2;
    // The neighbour wraps across the tile edge, so the texture tiles seamlessly.
    if (rand() < 0.125) indices[i - (i % size) + (((i % size) + 1) % size)] = 3;
  }
  return encodeIndexedPng({ width: size, height: size, bitDepth: 2, palette: GRAIN_PALETTE, indices });
}
