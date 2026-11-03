// Night colours for the QA previews (--preview=<dir>), resolved from the one token source,
// scripts/palette/palette.json, through the palette pipeline's own resolver. The previews paint with the story
// map's tokens (PALETTE-SPEC §4.11, §5.7), so they can never drift from what ContourSheet and the WebGL map draw.
import { loadPalette, resolveExtended, tokenHex } from '../palette/lib.mjs';
import { rgbToHex } from '../palette/color.mjs';

const palette = loadPalette();
const night = resolveExtended(palette, 'night');
const hex = (name) => tokenHex(palette, 'night', name);

/** The story map's Night tokens the previews draw with (hexes, alphas and the label halo width in px). */
export const PREVIEW = Object.freeze({
  ground: hex('map-ground'),
  ink: hex('map-ink'),
  route: hex('map-route'),
  head: hex('map-head'),
  branch: hex('map-branch'),
  branchText: hex('map-branch-text'),
  casing: night['map-route-casing'],
  lake: hex('map-lake'),
  lakeEdge: hex('map-lake-edge'),
  lakeText: hex('map-lake-text'),
  river: hex('aqua-line'),
  halo: hex('map-label-halo'),
  haloWidth: Number.parseFloat(night['map-label-halo-width']),
  jeep: hex('map-jeep'),
  isoWarm: hex('map-iso-warm'),
  isoZero: hex('map-iso-zero'),
  isoCold: hex('map-iso-cold'),
  hypso: night['map-hypso'],
  minor: night['map-minor'],
  index: night['map-index'],
  starHot: hex('star-hot'),
  starSun: hex('star-sun'),
  starCool: hex('star-cool'),
});

/** Linear sRGB-channel mix of two hexes, returned as a hex (the band fills between two ramp stops). */
export function mixHex(a, b, t) {
  const ch = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  const [ca, cb] = [ch(a), ch(b)];
  return rgbToHex(ca.map((v, k) => Math.round(v + (cb[k] - v) * t)));
}
