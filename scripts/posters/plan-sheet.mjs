// G-01 Annapurna plan sheet: the single static map of the home page at tier 0 and with reduced motion (the
// WebGL story map's calm stand-in), and the plate /stories can reuse.
//
// One sheet, everything on it at once: hypsometric band fills (500 m, the story map's elevation colour),
// index and minor contours, modelled isotherms (the temperature overlay as lines), the whole walked route from
// the reconstructed public route file, any stretch he did not walk, the four side-trip branches in walking order,
// markers, the overview labels and the legend copy. Nothing here is a credit or a coordinate: no graticule
// values, no attribution line, no dates (month and year only).
import { readFileSync } from 'node:fs';
import { contours } from 'd3-contour';

import { contourLines, gaussianBlur, polylinesToPath, r1, simplify, simplifyClosed } from './geometry.mjs';

/** Band and index step (m): the shader's band step and the legend ticks. */
export const BAND_STEP_M = 500;
/** Isotherms drawn on the sheet (°C), as on the story map: 0 °C bold, ±10 °C fine. */
const ISOTHERMS_C = [10, 0, -10];

/** Reads the publishable route file (segments of [lon, lat, altM] points, no timestamps). */
export function readRoute(path) {
  const route = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(route.segments)) throw new Error(`${path}: no segments`);
  return route;
}

const ringArea = (pts) => {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
};

function gridToSheet(field, projection) {
  const { cols, rows, bbox } = field.meta;
  const [west, south, east, north] = bbox;
  const [x0, y0] = projection.project(west, north);
  const [x1, y1] = projection.project(east, south);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // d3-contour's convention: sample i sits at i + 0.5; rings along the border run on 0 and cols. Clamp to the
  // data rectangle so the fills stop exactly at the relief's edge.
  return ([u, v]) => {
    const lon = west + ((u - 0.5) / (cols - 1)) * (east - west);
    const lat = north - ((v - 0.5) / (rows - 1)) * (north - south);
    const [x, y] = projection.project(lon, lat);
    return [clamp(x, x0, x1), clamp(y, y0, y1)];
  };
}

/** Filled areas at or above each band level (painter's order, lowest first), one evenodd path per level. */
export function bandLayers(field, projection, { sigma, tolerance, minArea }) {
  const { cols, rows } = field.meta;
  const values = gaussianBlur(field.heights, cols, rows, sigma);
  let hi = -Infinity;
  for (const v of values) if (v > hi) hi = v;
  const toSheet = gridToSheet(field, projection);
  const bands = [];
  for (let m = 2 * BAND_STEP_M; m <= hi; m += BAND_STEP_M) {
    const geometry = contours().size([cols, rows]).smooth(true).contour(values, m);
    const rings = [];
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        const pts = simplifyClosed(ring.slice(0, -1).map(toSheet), tolerance);
        if (pts.length < 3 || ringArea(pts) < minArea) continue;
        rings.push({ points: pts, closed: true });
      }
    }
    if (rings.length) bands.push({ m, d: polylinesToPath(rings) });
  }
  return bands;
}

/** Isotherm lines: contours at the altitude where the modelled temperature reaches each value. */
export function isothermLayers(field, projection, model, { sigma, tolerance, minLength }) {
  const { cols, rows } = field.meta;
  const values = gaussianBlur(field.heights, cols, rows, sigma);
  const toSheet = gridToSheet(field, projection);
  return ISOTHERMS_C.map((c) => {
    const m = Math.round(model.refM + ((c - model.refC) / model.perKm) * 1000);
    const lines = [];
    for (const line of contourLines(values, cols, rows, m)) {
      const pts = line.points.map(toSheet);
      let len = 0;
      for (let i = 1; i < pts.length; i += 1) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (len < minLength) continue;
      lines.push({ points: line.closed ? simplifyClosed(pts, tolerance) : simplify(pts, tolerance), closed: line.closed });
    }
    return { c, m, d: polylinesToPath(lines) };
  });
}

/** Absolute M/L polyline (1 decimal) and its length, from [lon, lat, ...] points. */
function linePath(projection, points, tolerance) {
  const pts = simplify(points.map(([lon, lat]) => projection.project(lon, lat)), tolerance);
  let d = '';
  let length = 0;
  pts.forEach(([x, y], i) => {
    d += `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
    if (i) length += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
  });
  return { d, length, start: pts[0], end: pts[pts.length - 1] };
}

/** Joins consecutive segment paths into one path (subpaths stay separate where the line breaks). */
function joinPaths(parts) {
  let d = '';
  let length = 0;
  let last = null;
  for (const p of parts) {
    const touches = last && Math.hypot(p.start[0] - last[0], p.start[1] - last[1]) < 0.6;
    d += touches ? p.d.replace(/^M[^L]*/, '') : p.d;
    length += p.length;
    last = p.end;
  }
  return { d, length };
}

const node = (projection, wp) => {
  const [x, y] = projection.project(wp.lon, wp.lat);
  return { x: r1(x), y: r1(y), name: wp.name };
};

/**
 * The route layers: `main` (every walked main segment, in walking order), `road` (main stretches marked
 * `walked: false` in the route file; none at present),
 * and one `side-trip` route per branch (Blue, Green, Ice, Tilicho), each from its branch point.
 */
export function routeLayers(projection, route, entity, tolerance) {
  const { ANNAPURNA_ROUTE, ANNAPURNA_SIDE_TRIP_LIST } = entity;
  const byId = new Map(route.segments.map((s) => [s.id, s]));
  const main = route.segments.filter((s) => s.kind === 'main').sort((a, b) => a.order - b.order);
  const walked = joinPaths(main.filter((s) => s.walked !== false).map((s) => linePath(projection, s.points, tolerance)));
  const road = main.filter((s) => s.walked === false).map((s) => ({ ...linePath(projection, s.points, tolerance), s }));
  const placed = (list) => list.filter((wp) => typeof wp.lat === 'number' && typeof wp.lon === 'number');
  const routes = [
    { id: 'main', d: walked.d, lengthPx: Math.round(walked.length), nodes: placed(ANNAPURNA_ROUTE).map((wp) => node(projection, wp)), kind: 'main' },
    ...ANNAPURNA_SIDE_TRIP_LIST.map((trip) => {
      const seg = byId.get(trip.id) ?? byId.get(trip.id.replace(/-lake$/, ''));
      if (!seg) throw new Error(`route file has no segment for side trip ${trip.id}`);
      const p = linePath(projection, seg.points, tolerance);
      return { id: trip.id, d: p.d, lengthPx: Math.round(p.length), nodes: placed(trip.waypoints).map((wp) => node(projection, wp)), kind: 'side-trip' };
    }),
  ];
  return {
    routes,
    road: road.map(({ d, length }) => ({ id: 'by-road', d, lengthPx: Math.round(length), text: 'not walked' })),
  };
}

const MARKER_KIND = { stay: 'stay', 'pass-through': 'pass-through', landmark: 'landmark' };

/** One marker per placed place: overnight stops filled, pass-through rings, the pass, lakes, peaks. */
export function markerLayer(projection, entity) {
  const { ANNAPURNA_ROUTE, ANNAPURNA_SIDE_TRIP_LIST, ANNAPURNA_PEAKS } = entity;
  const seen = new Set();
  const out = [];
  const add = (wp, kind) => {
    if (typeof wp.lat !== 'number' || typeof wp.lon !== 'number' || seen.has(wp.name)) return;
    seen.add(wp.name);
    const n = node(projection, wp);
    out.push({ ...n, kind, ...(wp.positionApprox ? { approx: true } : {}) });
  };
  for (const wp of [...ANNAPURNA_ROUTE, ...ANNAPURNA_SIDE_TRIP_LIST.flatMap((t) => t.waypoints)]) {
    add(wp, wp.kind === 'pass' ? 'pass' : wp.kind === 'lake' ? 'lake' : (MARKER_KIND[wp.stop] ?? 'pass-through'));
  }
  for (const pk of ANNAPURNA_PEAKS) add(pk, 'peak');
  return out;
}

/**
 * The overview label set (design §8.2: Thorong La, Tilicho Lake, Ice Lake, Manang, Besisahar, Muktinath, the
 * peaks of the establishing view) plus his Blue and Green Lake. Positions are tuned against the route with
 * label-clearance.mjs at every plate scale. Priority 1 = kept on phones (5 names).
 */
export function overviewLabels(projection, entity) {
  const { getExpedition, ANNAPURNA_PEAKS, waypointLabel } = entity;
  const exp = getExpedition('annapurna');
  const wp = (name) => exp.waypoints.find((w) => w.name === name);
  const at = (name) => node(projection, wp(name));
  const peak = (id) => {
    const p = ANNAPURNA_PEAKS.find((x) => x.id === id);
    return { ...node(projection, p), text: p.name, altitudeM: p.altitudeM, approx: p.approx };
  };
  const shown = (w) => (w.showAltitude === false ? {} : { altitudeM: w.altitudeM, approx: w.approx });
  const thorong = at('Thorong La');
  const tilicho = at('Tilicho Lake');
  const ice = at('Ice Lake');
  const blue = at('Blue Lake');
  const green = at('Green Lake');
  const manang = at('Manang');
  const besisahar = at('Besisahar');
  const muktinath = at('Muktinath');
  const pk = (id, anchor, dx = 0, dy = 0) => {
    const p = peak(id);
    return { x: r1(p.x + dx), y: r1(p.y + dy), text: p.text, kind: 'peak', altitudeM: p.altitudeM, approx: p.approx, anchor, priority: 2 };
  };
  return [
    // The pass mark rises off the line so the name clears the climb from High Camp.
    { x: thorong.x, y: r1(thorong.y - 9), text: 'Thorong La', kind: 'pass', ...shown(wp('Thorong La')), anchor: 'start', priority: 1 },
    { x: r1(tilicho.x - 4), y: r1(tilicho.y - 22), text: 'Tilicho Lake', kind: 'water', ...shown(wp('Tilicho Lake')), anchor: 'middle', priority: 1 },
    { x: r1(ice.x + 8), y: r1(ice.y - 14), text: waypointLabel(wp('Ice Lake')), kind: 'water', ...shown(wp('Ice Lake')), anchor: 'start', priority: 1 },
    { x: r1(blue.x + 12), y: r1(blue.y + 16), text: 'Blue Lake (approx.)', kind: 'water', anchor: 'start', priority: 2 },
    { x: r1(green.x - 4), y: r1(green.y + 42), text: 'Green Lake (approx.)', kind: 'water', anchor: 'end', priority: 2 },
    // Manang's dot drops below the Khangsar line (symbol displacement); the name runs west, under it.
    { x: r1(manang.x - 3), y: r1(manang.y + 15), text: 'Manang', kind: 'village', anchor: 'end', priority: 2 },
    { ...besisahar, text: 'Besisahar', kind: 'village', ...shown(wp('Besisahar')), anchor: 'end', priority: 1 },
    { x: muktinath.x, y: r1(muktinath.y - 20), text: 'Muktinath', kind: 'village', ...shown(wp('Muktinath')), anchor: 'start', priority: 1 },
    pk('annapurna-i', 'start'),
    pk('annapurna-ii', 'start'),
    pk('annapurna-iii', 'start'),
  ].map(({ name: _name, ...l }) => l);
}

/** Legend copy for the static map (no credits, no totals; honesty notes stay). `road`: the not-walked layer. */
export function legendCopy(entity, road = []) {
  const { getExpedition, TEMPERATURE_MODEL: t } = entity;
  const exp = getExpedition('annapurna');
  const sign = (c) => (c > 0 ? `+${c}` : c < 0 ? `−${-c}` : '0');
  return {
    title: exp.shortName,
    meta: `${exp.days} days, ${exp.when}`,
    rampTicksM: [1000, 3000, 5000, 7000],
    bandStepM: BAND_STEP_M,
    isotherms: ISOTHERMS_C.map((c) => ({ c, text: `${sign(c)} °C` })),
    altitudeNote: `Colour: altitude, ${BAND_STEP_M} m bands. Altitudes approximate (~).`,
    temperatureNote: `Lines: temperature on an ${t.season} day, modelled from altitude, not measured.`,
    keys: [
      { id: 'walked', text: 'Walked' },
      ...(road.length ? [{ id: 'road', text: 'Not walked' }] : []),
      { id: 'side-trip', text: 'Side trip' },
      { id: 'stay', text: 'Overnight stop' },
      { id: 'lake', text: 'Lake (Blue and Green: approximate)' },
      { id: 'peak', text: 'Peak' },
    ],
  };
}

/* ------------------------------------------------------------------------------------------------
 * QA preview (--preview): the sheet with the Night ramp of the story map, never written into src/.
 * --------------------------------------------------------------------------------------------- */

const HYPSO_AT = [800, 2000, 3500, 4500, 5500, 7000];
const HYPSO_NIGHT = ['#112015', '#202618', '#332E22', '#3C362E', '#37434E', '#4E5661'];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function ramp(m) {
  let i = HYPSO_AT.findIndex((_, k) => k < HYPSO_AT.length - 1 && m < HYPSO_AT[k + 1]);
  if (i < 0) i = HYPSO_AT.length - 2;
  const t = Math.max(0, Math.min(1, (m - HYPSO_AT[i]) / (HYPSO_AT[i + 1] - HYPSO_AT[i])));
  const [a, b] = [hex(HYPSO_NIGHT[i]), hex(HYPSO_NIGHT[i + 1])];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(',')})`;
}

export function previewPlanSvg(data) {
  const [w, h] = data.viewBox;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lbl = (l) => {
    const alt = typeof l.altitudeM === 'number' ? ` ${l.approx ? '~' : ''}${l.altitudeM.toLocaleString('en')} m` : '';
    const italic = l.kind === 'water';
    const anchor = l.anchor === 'end' ? 'end' : l.anchor === 'middle' ? 'middle' : 'start';
    const dx = anchor === 'start' ? 10 : anchor === 'end' ? -10 : 0;
    return `<text x="${l.x + dx}" y="${l.y}" font-size="19" font-family="Arial" ${italic ? 'font-style="italic"' : ''} fill="${l.kind === 'water' ? '#C2B8DD' : '#DEDEE2'}" text-anchor="${anchor}" dominant-baseline="middle" stroke="#121316" stroke-width="4" paint-order="stroke">${esc(l.text + alt)}</text>`;
  };
  const mk = (m) => {
    if (m.kind === 'peak') return `<path d="M${m.x} ${m.y - 7}l6 11h-12z" fill="none" stroke="#DEDEE2" stroke-width="1.5"/>`;
    if (m.kind === 'lake') return `<circle cx="${m.x}" cy="${m.y}" r="6" fill="#9D8FBE" stroke="#121316" stroke-width="1.5"/>`;
    if (m.kind === 'pass') return `<circle cx="${m.x}" cy="${m.y}" r="8" fill="none" stroke="#DEDEE2" stroke-width="1.5"/><circle cx="${m.x}" cy="${m.y}" r="4" fill="#B3595C"/>`;
    if (m.kind === 'stay' || m.kind === 'landmark') return `<circle cx="${m.x}" cy="${m.y}" r="5" fill="#B3595C" stroke="#121316" stroke-width="1.5"/>`;
    return `<circle cx="${m.x}" cy="${m.y}" r="3.5" fill="#121316" stroke="#B3595C" stroke-width="1.5"/>`;
  };
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<rect width="${w}" height="${h}" fill="#121316"/>`,
    `<rect x="${data.frame.x}" y="${data.frame.y}" width="${data.frame.w}" height="${data.frame.h}" fill="${ramp(BAND_STEP_M)}"/>`,
    ...data.bands.map((b) => `<path d="${b.d}" fill="${ramp(b.m + BAND_STEP_M / 2)}" fill-rule="evenodd"/>`),
    `<path d="${data.minor.join(' ')}" fill="none" stroke="#DEDEE2" stroke-opacity="0.075"/>`,
    `<path d="${data.index.join(' ')}" fill="none" stroke="#DEDEE2" stroke-opacity="0.2"/>`,
    ...data.isotherms.map((t) => `<path d="${t.d}" fill="none" stroke="${t.c === 0 ? '#5FC0C2' : t.c < 0 ? '#9AD6D0' : '#9A948C'}" stroke-width="${t.c === 0 ? 1.8 : 1}" stroke-opacity="0.8"/>`),
    ...data.road.map((r) => `<path d="${r.d}" fill="none" stroke="#8E929B" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>`),
    ...data.routes.map((r) => `<path d="${r.d}" fill="none" stroke="#121316" stroke-width="${r.kind === 'main' ? 6.5 : 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${r.d}" fill="none" stroke="${r.kind === 'main' ? '#B3595C' : '#9D8FBE'}" stroke-width="${r.kind === 'main' ? 4 : 2.6}" stroke-linecap="round" stroke-linejoin="round"/>`),
    ...data.markers.map(mk),
    ...data.labels.map(lbl),
    '</svg>',
  ].join('\n');
}
