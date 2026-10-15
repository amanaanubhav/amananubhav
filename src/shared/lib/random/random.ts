/**
 * Deterministic pseudo-random helpers for generated media (contours, star fields, pending fills).
 *
 * Pure and dependency-free: no runtime imports, no enums, so Node's built-in type stripping can load
 * this file directly from a build script (`import { mulberry32 } from '../../src/shared/lib/random/random.ts'`).
 */

/**
 * mulberry32: a tiny 32-bit seeded PRNG. Returns a function that yields floats in [0, 1).
 * The same seed always yields the same sequence, on the server, in the browser and in Node scripts.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * hashSeed: a stable unsigned 32-bit seed from any string (FNV-1a with a final avalanche mix),
 * e.g. `mulberry32(hashSeed('M-EXP-ANN-01'))`.
 */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
