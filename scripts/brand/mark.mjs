// G-11: the signature ridge mark. The geometry is read from `src/shared/ui/ridge-mark/geometry.ts`, the file
// RidgeMark and the AI terminal's Alpenglow cue draw from, so the brand files can never drift from the site.
// (The favicons are Aman's summit portrait, built in build-brand.mjs; they do not use the mark.)
import { importSource } from './shared.mjs';

const G = await importSource('src/shared/ui/ridge-mark/geometry.ts');

const fmt = (n) => Number(n.toFixed(3)).toString();

/** The trekker alone, in mark units (feet at the mark's summit), inside a group the caller places. */
function trekkerShapes(figure, color) {
  const { head, body, limbs } = figure;
  return [
    `<g transform="${G.TREKKER_TRANSFORM}" fill="${color}">`,
    `<circle cx="${head.cx}" cy="${head.cy}" r="${head.r}"/>`,
    `<path d="${body}"/>`,
    limbs ? `<path d="${limbs.d}" fill="none" stroke="${color}" stroke-width="${limbs.width}" stroke-linecap="round"/>` : '',
    '</g>',
  ].join('');
}

/**
 * The trekker standing on a summit of another drawing: his feet on (x, y), `height` px from crown to the
 * soles (the figure is drawn about 11.5 mark units tall, feet near the mark's summit at y = 11.25).
 */
export function trekkerOnSummit({ x, y, height, color }) {
  const figure = height < G.SMALL_BELOW ? G.TREKKER_SMALL : G.TREKKER;
  const s = height / 11.5;
  const summitY = G.RIDGE_SUMMIT.y + G.RIDGE_OFFSET_Y;
  return `<g transform="translate(${fmt(x - G.RIDGE_SUMMIT.x * s)} ${fmt(y - summitY * s)}) scale(${fmt(s)})">${trekkerShapes(figure, color)}</g>`;
}
