// G-11: the trig-point mark. The geometry is the one `@/shared/ui/trig-mark` draws: an equilateral
// survey triangle of side 16 (apex at y 1.07, base at y 14.93) with a dot on its centroid (8, 10.31).
// Keep the two in step if either changes.

export const MARK = {
  path: 'M8 1.07 16 14.93H0Z',
  dot: { cx: 8, cy: 10.31, r: 1.7 },
  stroke: 1.6,
  /** Centre of the triangle's bounding box: what the icon frames are centred on. */
  centre: { x: 8, y: 8 },
};

const fmt = (n) => Number(n.toFixed(2)).toString();

/**
 * The SVG favicon (≤ 2 KB): signal mark on a ground tile, with a `prefers-color-scheme` style so the
 * tile follows the visitor's system theme (Night colors by default, Day colors under `light`).
 */
export function faviconSvg(palette) {
  const n = palette.night;
  const d = palette.day;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 20 20">',
    '<title>Aman Anubhav</title>',
    `<style>.g{fill:${n.ground}}.s{stroke:${n.signal}}.d{fill:${n.signal}}`,
    `@media (prefers-color-scheme:light){.g{fill:${d.ground}}.s{stroke:${d.signal}}.d{fill:${d.signal}}}</style>`,
    '<rect class="g" x="-2" y="-2" width="20" height="20" rx="4"/>',
    `<path class="s" d="${MARK.path}" fill="none" stroke-width="${MARK.stroke}" stroke-linejoin="round"/>`,
    `<circle class="d" cx="${MARK.dot.cx}" cy="${MARK.dot.cy}" r="${MARK.dot.r}"/>`,
    '</svg>',
  ].join('');
}

/**
 * A raster-ready icon SVG at `size` px. `pad` is the frame around the 16-unit mark (in mark units);
 * `stroke`/`dot` thicken the mark slightly at 16 and 32 px so it survives pixel snapping (optical
 * hinting only: the geometry is unchanged). `radius` rounds the tile; 0 gives a full-bleed square.
 */
export function iconSvg({ size, ground, signal, pad = 2, radius = 4, stroke = MARK.stroke, dot = MARK.dot.r }) {
  const span = 16 + pad * 2;
  const x0 = MARK.centre.x - span / 2;
  const y0 = MARK.centre.y - span / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${fmt(x0)} ${fmt(y0)} ${fmt(span)} ${fmt(span)}">`,
    `<rect x="${fmt(x0)}" y="${fmt(y0)}" width="${fmt(span)}" height="${fmt(span)}" rx="${fmt(radius)}" fill="${ground}"/>`,
    `<path d="${MARK.path}" fill="none" stroke="${signal}" stroke-width="${fmt(stroke)}" stroke-linejoin="round"/>`,
    `<circle cx="${MARK.dot.cx}" cy="${MARK.dot.cy}" r="${fmt(dot)}" fill="${signal}"/>`,
    '</svg>',
  ].join('');
}

/** The mark alone, in one color, as an SVG fragment placed at (x, y) with the given side length. */
export function markFragment({ x, y, side, color }) {
  const s = side / 16;
  return [
    `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})">`,
    `<path d="${MARK.path}" fill="none" stroke="${color}" stroke-width="${MARK.stroke}" stroke-linejoin="round"/>`,
    `<circle cx="${MARK.dot.cx}" cy="${MARK.dot.cy}" r="${MARK.dot.r}" fill="${color}"/>`,
    '</g>',
  ].join('');
}
