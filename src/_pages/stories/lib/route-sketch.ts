import type { Expedition, Waypoint, WaypointKind } from '@/entities/expedition';
import type { TrekRoute } from '../config/trek-routes.generated';

/*
 * The notebook's route sketch (NOTEBOOK-DESIGN §2.4): which figure a page gets, and the geometry of the `track`, `plan`
 * and `locator` drawings in a 300x200 box. Pure: no runtime imports (the generated route file is `server-only`, so the
 * route comes in as an argument), so `node` can check it. Positions are for drawing only: nothing here returns text
 * with a coordinate, a distance or a height from the route file.
 */

export type FigureKind = 'track' | 'plan' | 'profile' | 'locator' | 'none';

export const SKETCH_W = 300;
export const SKETCH_H = 200;
/** Fit padding, as a share of each side. */
const PAD = 0.12;
/** A plan smaller than this in both directions is centred at a fixed scale, never blown up. */
const MIN_EXTENT_M = 300;
/** Marks closer than this (user units) are drawn as one, labelled "5, 6". */
const MERGE_UNITS = 10;
/** Past this share of the width a mark's number starts on its left. */
const FLIP_AT = 0.8;
/*
 * Label boxes for collision checks, in the mark's own units (RouteSketch draws a 12-unit triangle and 11 px data
 * numbers there) times the largest mark scale the sketch uses (--nb-ms at its narrowest container), so a placement that
 * is clear at the smallest width is clear at every width.
 */
const LABEL_SCALE = 0.9;
const LABEL_DX = 8;
const LABEL_UP = -5;
const LABEL_DOWN = 14;
const LABEL_H = 11;
const CHAR_W = 6.7;
const MARK_HALF = 6.5;
/** The north arrow's corner, kept clear of numbers. */
const NORTH_BOX: Box = { x0: SKETCH_W - 26, y0: 0, x1: SKETCH_W, y1: 40 };
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LON = 111_320;

/** How a trig mark is filled: summit and pass, lake, everything else. */
export type MarkTone = 'peak' | 'lake' | 'plain';

/** Where a mark's number sits: upper right (default), upper left, lower right, lower left. */
export type LabelSide = 'ne' | 'nw' | 'se' | 'sw';

export interface SketchMark {
  /** Stop numbers in walking order (1-based); two or more when stops share a point. */
  readonly numbers: readonly number[];
  readonly x: number;
  readonly y: number;
  readonly tone: MarkTone;
  /** Fraction along the drawn path, 0 to 1 (the order of the turn's mark stagger). */
  readonly t: number;
  /** The time fraction at which the pen-eased line reaches `t` (the mark's appearance delay). */
  readonly td: number;
  /** Upper right unless that runs off the sheet or onto another mark, number or the north arrow. */
  readonly side: LabelSide;
}

interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The label's box in user units for a side (see LABEL_*). */
function labelBox(x: number, y: number, chars: number, side: LabelSide): Box {
  const w = chars * CHAR_W * LABEL_SCALE;
  const dx = LABEL_DX * LABEL_SCALE;
  const base = (side === 'ne' || side === 'nw' ? LABEL_UP : LABEL_DOWN) * LABEL_SCALE;
  const x0 = side === 'ne' || side === 'se' ? x + dx : x - dx - w;
  return { x0, x1: x0 + w, y0: y + base - LABEL_H * LABEL_SCALE * 0.8, y1: y + base + 2 };
}

/** Local offset and anchor RouteSketch uses for a side. */
export function labelOffset(side: LabelSide): { x: number; y: number; anchor: 'start' | 'end' } {
  const left = side === 'nw' || side === 'sw';
  return { x: left ? -LABEL_DX : LABEL_DX, y: side === 'ne' || side === 'nw' ? LABEL_UP : LABEL_DOWN, anchor: left ? 'end' : 'start' };
}

/**
 * Number placement in walking order: the first side that stays on the sheet and clears every mark, every number
 * already placed and the north arrow; the default side when none does. Past FLIP_AT of the width the left sides are
 * tried first.
 */
function placeLabels(marks: readonly { x: number; y: number; text: string }[], avoid: readonly Box[] = []): LabelSide[] {
  const markBoxes: Box[] = marks.map(({ x, y }) => ({
    x0: x - MARK_HALF,
    y0: y - MARK_HALF,
    x1: x + MARK_HALF,
    y1: y + MARK_HALF,
  }));
  const placed: Box[] = [];
  return marks.map(({ x, y, text }, i) => {
    const order: LabelSide[] = x > SKETCH_W * FLIP_AT ? ['nw', 'ne', 'sw', 'se'] : ['ne', 'nw', 'se', 'sw'];
    const fits = (side: LabelSide) => {
      const box = labelBox(x, y, text.length, side);
      if (box.x0 < 0 || box.x1 > SKETCH_W || box.y0 < 0 || box.y1 > SKETCH_H) return false;
      if (overlaps(box, NORTH_BOX) || avoid.some((other) => overlaps(box, other))) return false;
      if (markBoxes.some((other, j) => j !== i && overlaps(box, other))) return false;
      return !placed.some((other) => overlaps(box, other));
    };
    const side = order.find(fits) ?? order[0];
    placed.push(labelBox(x, y, text.length, side));
    return side;
  });
}

export interface ScaleBar {
  /** Bar length in user units. */
  readonly length: number;
  /** A round label ("1 km"), never the trek distance. */
  readonly label: string;
}

export interface SketchGeometry {
  readonly kind: 'track' | 'plan' | 'locator';
  /** The route's path data; empty for `locator` and for a plan with fewer than two placed stops. */
  readonly d: string;
  readonly marks: readonly SketchMark[];
  readonly scaleBar?: ScaleBar;
}

type LonLat = readonly [lon: number, lat: number];

const r1 = (v: number) => Math.round(v * 10) / 10;

function hasPosition(wp: Waypoint): wp is Waypoint & { lat: number; lon: number } {
  return typeof wp.lat === 'number' && typeof wp.lon === 'number' && Number.isFinite(wp.lat) && Number.isFinite(wp.lon);
}

/** An altitude the page may print (the registry withholds `showAltitude: false`). */
export function shownAltitude(wp: Waypoint): number | undefined {
  return wp.showAltitude === false || typeof wp.altitudeM !== 'number' ? undefined : wp.altitudeM;
}

function toneOf(kinds: readonly WaypointKind[]): MarkTone {
  if (kinds.some((kind) => kind === 'summit' || kind === 'pass')) return 'peak';
  if (kinds.includes('lake')) return 'lake';
  return 'plain';
}

/**
 * The figure a trek page gets (§2.4, CONTRACT rule 3), in this order: a GPX route with two or more points -> `track`;
 * two or more positioned stops -> `plan`; two or more shown altitudes -> `profile`; otherwise `none`. The Himachal
 * page is `locator` and does not come through here.
 */
export function figureKindFor(exp: Pick<Expedition, 'waypoints'>, route?: TrekRoute): Exclude<FigureKind, 'locator'> {
  if (route && route.points.length >= 2) return 'track';
  if (exp.waypoints.filter(hasPosition).length >= 2) return 'plan';
  if (exp.waypoints.filter((wp) => shownAltitude(wp) !== undefined).length >= 2) return 'profile';
  return 'none';
}

interface Projection {
  readonly project: (point: LonLat) => readonly [number, number];
  /** User units per metre. */
  readonly unitsPerM: number;
}

/**
 * Equirectangular with x scaled by cos(mean latitude), north up, fitted to the box with 12% padding, aspect kept. A
 * set under MIN_EXTENT_M in both directions (one point, coincident points) is centred at that fixed scale.
 */
export function fitProjection(points: readonly LonLat[]): Projection {
  if (points.length === 0) {
    return { project: () => [SKETCH_W / 2, SKETCH_H / 2], unitsPerM: 0 };
  }
  const meanLat = points.reduce((sum, [, lat]) => sum + lat, 0) / points.length;
  const kx = Math.cos((meanLat * Math.PI) / 180) * M_PER_DEG_LON;
  const ky = M_PER_DEG_LAT;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [lon, lat] of points) {
    const x = lon * kx;
    const y = lat * ky;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const innerW = SKETCH_W * (1 - 2 * PAD);
  const innerH = SKETCH_H * (1 - 2 * PAD);
  const scale = Math.min(innerW / Math.max(maxX - minX, MIN_EXTENT_M), innerH / Math.max(maxY - minY, MIN_EXTENT_M));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return {
    project: ([lon, lat]) => [SKETCH_W / 2 + (lon * kx - cx) * scale, SKETCH_H / 2 - (lat * ky - cy) * scale],
    unitsPerM: scale,
  };
}

/** Path data rounded to 0.1 unit; a vertex that rounds onto the previous one is dropped (stops sharing a point). */
function pathData(xy: readonly (readonly [number, number])[]): string {
  if (xy.length < 2) return '';
  const parts: string[] = [];
  let last = '';
  for (const [x, y] of xy) {
    const at = `${r1(x)} ${r1(y)}`;
    if (at === last) continue;
    parts.push(`${parts.length === 0 ? 'M' : 'L'}${at}`);
    last = at;
  }
  return parts.length > 1 ? parts.join('') : '';
}

/** Cumulative length at each vertex, as a fraction of the whole (0 when the path has no length). */
function vertexFractions(xy: readonly (readonly [number, number])[]): number[] {
  const acc = [0];
  for (let i = 1; i < xy.length; i += 1) {
    acc.push(acc[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  }
  const total = acc[acc.length - 1] ?? 0;
  return acc.map((len) => (total > 0 ? len / total : 0));
}

/*
 * The line draws on `--ease-pen` (cubic-bezier(0.45, 0.05, 0.25, 1)): a mark at path fraction t should appear when
 * the eased progress reaches t, so its delay uses the inverse of that curve.
 */
const PEN = { x1: 0.45, y1: 0.05, x2: 0.25, y2: 1 } as const;

function bezier(s: number, p1: number, p2: number): number {
  const u = 1 - s;
  return 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s;
}

/** Time fraction (0 to 1) at which the pen-eased draw reaches progress `t`. */
export function penTime(t: number): number {
  const target = Math.min(1, Math.max(0, t));
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (bezier(mid, PEN.y1, PEN.y2) < target) lo = mid;
    else hi = mid;
  }
  return Math.round(bezier((lo + hi) / 2, PEN.x1, PEN.x2) * 1000) / 1000;
}

interface Stop {
  readonly number: number;
  readonly x: number;
  readonly y: number;
  readonly kind: WaypointKind;
  readonly t: number;
}

/**
 * Stops closer than MERGE_UNITS become one mark at the first stop's point, numbered "5, 6". Numbers also keep clear of
 * the `avoid` boxes (the scale bar).
 */
function mergeMarks(stops: readonly Stop[], avoid: readonly Box[] = []): SketchMark[] {
  const groups: { first: Stop; numbers: number[]; kinds: WaypointKind[] }[] = [];
  for (const stop of stops) {
    const near = groups.find((g) => Math.hypot(g.first.x - stop.x, g.first.y - stop.y) < MERGE_UNITS);
    if (near) {
      near.numbers.push(stop.number);
      near.kinds.push(stop.kind);
    } else {
      groups.push({ first: stop, numbers: [stop.number], kinds: [stop.kind] });
    }
  }
  const sides = placeLabels(
    groups.map(({ first, numbers }) => ({ x: first.x, y: first.y, text: numbers.join(', ') })),
    avoid,
  );
  return groups.map(({ first, numbers, kinds }, i) => {
    const t = Math.round(first.t * 1000) / 1000;
    return {
      numbers,
      x: r1(first.x),
      y: r1(first.y),
      tone: toneOf(kinds),
      t,
      td: penTime(t),
      side: sides[i],
    };
  });
}

/** `plan`: the positioned stops joined in walking order (entity order); unplaced stops get no mark. */
export function planSketch(exp: Pick<Expedition, 'waypoints'>): SketchGeometry {
  const placed = exp.waypoints
    .map((wp, i) => ({ wp, number: i + 1 }))
    .filter((item): item is { wp: Waypoint & { lat: number; lon: number }; number: number } => hasPosition(item.wp));
  const { project } = fitProjection(placed.map(({ wp }) => [wp.lon, wp.lat] as const));
  const xy = placed.map(({ wp }) => project([wp.lon, wp.lat]));
  const fractions = vertexFractions(xy);
  const stops: Stop[] = placed.map(({ wp, number }, i) => ({
    number,
    x: xy[i][0],
    y: xy[i][1],
    kind: wp.kind,
    t: fractions[i] ?? 0,
  }));
  return { kind: 'plan', d: pathData(xy), marks: mergeMarks(stops) };
}

/** The point at `km` along a polyline with cumulative `km` per vertex (clamped to its ends). */
function pointAtKm(
  xy: readonly (readonly [number, number])[],
  km: readonly number[],
  at: number,
): readonly [number, number] {
  if (at <= km[0]) return xy[0];
  for (let i = 1; i < xy.length; i += 1) {
    if (at <= km[i]) {
      const span = km[i] - km[i - 1];
      const f = span > 0 ? (at - km[i - 1]) / span : 0;
      return [xy[i - 1][0] + (xy[i][0] - xy[i - 1][0]) * f, xy[i - 1][1] + (xy[i][1] - xy[i - 1][1]) * f];
    }
  }
  return xy[xy.length - 1];
}

const SCALE_STEPS_M = [100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000];

/** Where RouteSketch draws the scale bar and its label (bottom left, from x 12, the label above the bar). */
function scaleBarBox(bar: ScaleBar): Box {
  return { x0: 6, y0: SKETCH_H - 30, x1: 12 + Math.max(bar.length, bar.label.length * CHAR_W * LABEL_SCALE) + 4, y1: SKETCH_H - 6 };
}

/** The longest round bar that fits a quarter of the width; its label is the bar's own length, never the trek's. */
function scaleBarFor(unitsPerM: number): ScaleBar | undefined {
  if (!(unitsPerM > 0)) return undefined;
  const fits = SCALE_STEPS_M.filter((m) => m * unitsPerM <= SKETCH_W / 4);
  const metres = fits[fits.length - 1];
  if (!metres) return undefined;
  return { length: r1(metres * unitsPerM), label: metres >= 1000 ? `${metres / 1000} km` : `${metres} m` };
}

/** `stopKm` is measured along `km`; without a `km` parallel to `points` (the generator always writes one) no stop
 *  can be placed. */
function hasParallelKm(route: TrekRoute): boolean {
  return route.km.length === route.points.length;
}

/**
 * `track`: the simplified GPS line, solid, with each stop snapped by `stopKm` (CONTRACT rule 3). A stop missing from
 * `stopKm` has no mark, and so has every stop when `km` is not parallel to `points`. `t` is `stopKm / km[last]`
 * (rule 4).
 */
export function trackSketch(exp: Pick<Expedition, 'waypoints'>, route: TrekRoute): SketchGeometry {
  const { project, unitsPerM } = fitProjection(route.points);
  const xy = route.points.map((p) => project(p));
  const scaleBar = scaleBarFor(unitsPerM);
  const stops: Stop[] = [];
  if (hasParallelKm(route)) {
    const km = route.km;
    const total = km[km.length - 1] ?? 0;
    exp.waypoints.forEach((wp, i) => {
      const at = route.stopKm[wp.name];
      if (typeof at !== 'number' || !Number.isFinite(at)) return;
      const [x, y] = pointAtKm(xy, km, at);
      stops.push({ number: i + 1, x, y, kind: wp.kind, t: total > 0 ? Math.min(1, Math.max(0, at / total)) : 0 });
    });
  }
  return { kind: 'track', d: pathData(xy), marks: mergeMarks(stops, scaleBar ? [scaleBarBox(scaleBar)] : []), scaleBar };
}

/** `locator`: each expedition's trailhead as marks 1 to n (no line; the stagger runs in list order). */
export function locatorSketch(exps: readonly Pick<Expedition, 'trailhead'>[]): SketchGeometry {
  const placed = exps
    .map((exp, i) => ({ trailhead: exp.trailhead, number: i + 1 }))
    .filter((item): item is { trailhead: { lat: number; lon: number }; number: number } => item.trailhead !== undefined);
  const { project } = fitProjection(placed.map(({ trailhead }) => [trailhead.lon, trailhead.lat] as const));
  const last = Math.max(1, placed.length - 1);
  const stops: Stop[] = placed.map(({ trailhead, number }, i) => {
    const [x, y] = project([trailhead.lon, trailhead.lat]);
    return { number, x, y, kind: 'trailhead', t: i / last };
  });
  return { kind: 'locator', d: '', marks: mergeMarks(stops) };
}

/** Whether a stop has a mark on this figure (the stop list adds "(not placed)" for the others on a map figure). */
export function isStopPlaced(wp: Waypoint, kind: FigureKind, route?: TrekRoute): boolean {
  if (kind === 'track') return route !== undefined && hasParallelKm(route) && typeof route.stopKm[wp.name] === 'number';
  if (kind === 'plan') return hasPosition(wp);
  return true;
}

function label(wp: Pick<Waypoint, 'name' | 'altName'>): string {
  return wp.altName ? `${wp.name} (${wp.altName})` : wp.name;
}

/** The sketch's `<title>` and `<desc>` (§2.4): counts and names from the entity only, never a figure from a route. */
export function sketchText(
  kind: 'track' | 'plan',
  exp: Pick<Expedition, 'shortName' | 'waypoints'>,
  route?: TrekRoute,
): { title: string; desc: string } {
  const stops = exp.waypoints;
  const n = stops.length;
  const first = stops[0];
  const last = stops[n - 1];
  const span = first && last && first !== last ? `${n} stops from ${label(first)} to ${label(last)}` : `${n} stop`;
  const placed = stops.filter((wp) => isStopPlaced(wp, kind, route)).length;
  const how =
    kind === 'track'
      ? placed === n
        ? ', drawn from a GPS track.'
        : `, drawn from a GPS track; ${placed} placed on it.`
      : placed === n
        ? ', placed from estimated positions.'
        : `; ${placed} placed from estimated positions.`;
  return { title: `Route sketch of ${exp.shortName}`, desc: `${span}${how}` };
}
