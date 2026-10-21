/*
 * The home story: one source for the page and the relief scene (design §15.1-§15.5).
 *
 * The story position `s` is in vh units of scroll (0 at load, S_END at the end of the dissolve). The page
 * maps scroll to `s` (piecewise linear between the text anchors, lib/story-scroll.ts) and sends
 * `progress = s / S_END` to the scene through `setSceneProgress('relief-annapurna', …)`. The scene damps it,
 * walks the route by the acts below, flies the camera by the keys below and emits one `StoryFrame` per
 * rendered frame (`emitSceneFrame('relief-annapurna', frame)`) with the projected mark positions; the page
 * places the DOM labels, the legend line, the readout and the summit numeral from it.
 *
 * Pure data and pure functions only: no three.js, no DOM.
 */

/* ------------------------------------------------------------------------------------------------
 * Route data (public/data/routes/annapurna-route.json: segments with `id`, waypoints with `id`).
 * ---------------------------------------------------------------------------------------------- */

/** The main circuit in walking order (segment ids of the route file). */
export const MAIN_SEGMENT_IDS = [
  'd1',
  'd2',
  'jeep',
  'd3',
  'd4',
  'd5',
  'd9-shri-kharka',
  'd11-khangsar',
  'd12-ledar',
  'gap-ledar',
  'd13-high-camp',
  'gap-pass',
  'd14-muktinath',
] as const;
export type MainSegmentId = (typeof MAIN_SEGMENT_IDS)[number];

/** The four side trips in his order (Blue, Green, Ice, Tilicho); strip index = position + 1. */
export const SIDE_TRIP_IDS = ['blue-lake', 'green-lake', 'ice-lake', 'tilicho'] as const;
export type SideTripId = (typeof SIDE_TRIP_IDS)[number];

/* ------------------------------------------------------------------------------------------------
 * Acts (§15.3). Each act is a day's walk along one main segment, a branch out or back, or a hold.
 * ---------------------------------------------------------------------------------------------- */

export interface StoryActSpec {
  /** Length in vh of scroll. */
  readonly len: number;
  /** Walks the whole main segment. */
  readonly main?: MainSegmentId;
  /** Walks the main line up to this waypoint (the climb to Thorong La). */
  readonly toWaypoint?: string;
  /** Side trip index (0 Blue, 1 Green, 2 Ice, 3 Tilicho); `out` true = going, false = coming back. */
  readonly trip?: 0 | 1 | 2 | 3;
  readonly out?: boolean;
  readonly hold?: boolean;
  readonly climb?: boolean;
  readonly summit?: boolean;
  readonly overview?: boolean;
  readonly dissolve?: boolean;
  /** Trek day (legend "Day N of 14"); undefined at the overview. */
  readonly day?: number;
  /** Legend place line. */
  readonly place?: string;
}

export interface StoryAct extends StoryActSpec {
  readonly index: number;
  readonly s0: number;
  readonly s1: number;
}

const ACT_SPECS: readonly StoryActSpec[] = [
  { len: 100, main: 'd1', day: 1, place: 'Besisahar to Ngadi' },
  { len: 85, main: 'd2', day: 2, place: 'Bahundanda, Syange' },
  { len: 35, main: 'jeep', day: 3, place: 'Syange to Tal, by jeep' },
  { len: 85, main: 'd3', day: 3, place: 'Dharapani, Timang' },
  { len: 90, main: 'd4', day: 4, place: 'Chame, Dhikur Pokhari' },
  { len: 85, main: 'd5', day: 5, place: 'Pisang, Humde, Mungji' },
  { len: 40, trip: 0, out: true, day: 6, place: 'Blue Lake' },
  { len: 20, trip: 0, out: false, day: 6, place: 'Back to Mungji' },
  { len: 40, trip: 1, out: true, day: 6, place: 'Green Lake' },
  { len: 20, trip: 1, out: false, day: 6, place: 'Back to Mungji' },
  { len: 15, hold: true, day: 6, place: 'Mungji' },
  { len: 80, trip: 2, out: true, day: 7, place: 'Ice Lake (Kicho Tal)' },
  { len: 45, trip: 2, out: false, day: 7, place: 'Back down to Mungji' },
  { len: 25, hold: true, day: 8, place: 'Rest day at Mungji' },
  { len: 90, main: 'd9-shri-kharka', day: 9, place: 'Manang, Khangsar, Shri Kharka' },
  { len: 80, trip: 3, out: true, day: 10, place: 'Tilicho Lake' },
  { len: 45, trip: 3, out: false, day: 10, place: 'Back to Shri Kharka' },
  { len: 35, main: 'd11-khangsar', day: 11, place: 'Back to Khangsar' },
  { len: 75, main: 'd12-ledar', day: 12, place: 'Yak Kharka, Churi Ledar' },
  { len: 75, main: 'd13-high-camp', day: 13, place: 'Thorong Phedi, High Camp' },
  { len: 120, toWaypoint: 'thorong-la', climb: true, day: 14, place: 'Thorong La' },
  { len: 70, hold: true, summit: true, day: 14, place: 'Thorong La' },
  { len: 90, main: 'd14-muktinath', day: 14, place: 'Down to Chongur and Muktinath' },
  { len: 70, hold: true, overview: true },
  { len: 90, hold: true, overview: true },
  { len: 60, hold: true, overview: true, dissolve: true },
];

export const ACTS: readonly StoryAct[] = (() => {
  let s = 0;
  return ACT_SPECS.map((spec, index) => {
    const act: StoryAct = { ...spec, index, s0: s, s1: s + spec.len };
    s = act.s1;
    return act;
  });
})();

/** The end of the dissolve (vh). */
export const S_END = ACTS[ACTS.length - 1].s1;
/** The pull-back to the whole circuit starts here (entry 6 sits beside it). */
export const S_OVERVIEW = (ACTS.find((a) => a.overview) as StoryAct).s0;
/** The map melts into the ground from here to S_END. */
export const S_DISSOLVE = (ACTS.find((a) => a.dissolve) as StoryAct).s0;
/** The climb to Thorong La (the numeral counts with the head) and the summit hold. */
export const CLIMB_ACT = ACTS.find((a) => a.climb) as StoryAct;
export const SUMMIT_ACT = ACTS.find((a) => a.summit) as StoryAct;
export const TREK_DAYS = 14;

/** The act at `s` (clamped). */
export function actAt(s: number): StoryAct {
  const v = Math.min(S_END, Math.max(0, s));
  return ACTS.find((a) => v < a.s1) ?? ACTS[ACTS.length - 1];
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** 0 before the dissolve, 1 at S_END: the map melts into the ground in place (§10). */
export function dissolveAt(s: number): number {
  return smoothstep(S_DISSOLVE, S_END, s);
}

/* ------------------------------------------------------------------------------------------------
 * Text anchors (§15.3): the s at which each block's centre sits at the viewport centre. The page puts
 * `data-story-at` on the blocks; the numeral uses a sticky span instead.
 * ---------------------------------------------------------------------------------------------- */

export const TEXT_ANCHORS = {
  origin: 148,
  work: 318,
  how: 462,
  day6: 575,
  day7: 700,
  days910: 905,
  pass: 1085,
  ask: 1420,
  write: 1568,
} as const;
export type TextAnchorId = keyof typeof TEXT_ANCHORS;

/** The summit numeral sticks (28 vh desktop, 50 svh mobile) from the start to the end of this span. */
export const NUMERAL_SPAN = [1215, 1365] as const;
export const NUMERAL_STICK_VH = { desktop: 28, mobile: 50 } as const;

/* ------------------------------------------------------------------------------------------------
 * Camera (§15.4, §11). az = compass bearing looked toward, pitch = down-angle (deg), dist in world units
 * (1 unit = 3.42 km), fov vertical (deg), follow = weight of the head versus the anchor, lead = look-ahead.
 * Every field is interpolated by a monotone cubic (Fritsch-Carlson).
 * ---------------------------------------------------------------------------------------------- */

export type CameraAnchorId = 'circuit' | 'basin' | 'ice' | 'tilicho' | 'overview';

export interface CameraKey {
  readonly s: number;
  readonly az: number;
  readonly pitch: number;
  readonly dist: number;
  readonly fov: number;
  readonly follow: number;
  readonly lead: number;
  readonly anchor: CameraAnchorId;
}

export const CAMERA_KEYS: readonly CameraKey[] = [
  { s: 0, az: 328, pitch: 56, dist: 66, fov: 26, follow: 0, lead: 0, anchor: 'circuit' },
  { s: 62, az: 336, pitch: 52, dist: 40, fov: 28, follow: 0.35, lead: 0.3, anchor: 'circuit' },
  { s: 125, az: 356, pitch: 46, dist: 15, fov: 32, follow: 0.8, lead: 0.6, anchor: 'circuit' },
  { s: 205, az: 358, pitch: 43, dist: 11.5, fov: 34, follow: 0.95, lead: 0.7, anchor: 'circuit' },
  { s: 300, az: 336, pitch: 43, dist: 11, fov: 34, follow: 0.95, lead: 0.7, anchor: 'circuit' },
  { s: 395, az: 300, pitch: 45, dist: 11.5, fov: 34, follow: 0.95, lead: 0.7, anchor: 'circuit' },
  { s: 470, az: 272, pitch: 46, dist: 11.5, fov: 34, follow: 0.9, lead: 0.5, anchor: 'basin' },
  { s: 545, az: 250, pitch: 46, dist: 7.2, fov: 34, follow: 0.5, lead: 0, anchor: 'basin' },
  { s: 660, az: 282, pitch: 29, dist: 6.4, fov: 40, follow: 0.55, lead: 0, anchor: 'ice' },
  { s: 750, az: 252, pitch: 42, dist: 7, fov: 36, follow: 0.5, lead: 0, anchor: 'ice' },
  { s: 820, az: 238, pitch: 47, dist: 11, fov: 34, follow: 0.75, lead: 0.4, anchor: 'tilicho' },
  { s: 900, az: 254, pitch: 45, dist: 10.5, fov: 34, follow: 0.5, lead: 0, anchor: 'tilicho' },
  { s: 985, az: 282, pitch: 46, dist: 10.5, fov: 34, follow: 0.85, lead: 0.4, anchor: 'tilicho' },
  { s: 1055, az: 330, pitch: 44, dist: 10, fov: 34, follow: 0.95, lead: 0.6, anchor: 'tilicho' },
  { s: 1150, az: 322, pitch: 40, dist: 8.5, fov: 36, follow: 0.95, lead: 0.4, anchor: 'tilicho' },
  { s: 1250, az: 296, pitch: 33, dist: 7, fov: 40, follow: 1, lead: 0.2, anchor: 'tilicho' },
  { s: 1320, az: 286, pitch: 31, dist: 6.6, fov: 40, follow: 1, lead: 0.1, anchor: 'tilicho' },
  { s: 1360, az: 280, pitch: 33, dist: 7.2, fov: 40, follow: 1, lead: 0.3, anchor: 'tilicho' },
  { s: 1430, az: 268, pitch: 42, dist: 10, fov: 34, follow: 0.9, lead: 0.3, anchor: 'overview' },
  { s: 1535, az: 346, pitch: 58, dist: 46, fov: 30, follow: 0, lead: 0, anchor: 'overview' },
  { s: S_END, az: 350, pitch: 60, dist: 48, fov: 30, follow: 0, lead: 0, anchor: 'overview' },
];

/**
 * Camera anchors: `bbox` = the centre of the whole route's bounding box (all strips) plus an offset in
 * world units (x east, z south); `mean` = the mean of these route-file waypoints.
 */
export const CAMERA_ANCHORS: Readonly<
  Record<CameraAnchorId, { readonly bbox: readonly [number, number] } | { readonly mean: readonly string[] }>
> = {
  circuit: { bbox: [-0.4, 1.2] },
  overview: { bbox: [-0.2, 0.5] },
  basin: { mean: ['mungji', 'blue-lake', 'green-lake', 'manang'] },
  ice: { mean: ['braka', 'ice-lake', 'mungji'] },
  tilicho: { mean: ['shri-kharka', 'tilicho-lake', 'tilicho-base-camp'] },
};

/** Desktop framing: the subject sits at 63.5% of the width (projection view offset), clear of the text column. */
export const DESKTOP_FRAME_X = 0.635;
/** Below this width the mobile framing applies (the page's mobile layout uses the same breakpoint). */
export const MOBILE_MAX_WIDTH = 760;

/**
 * Mobile framing (§11): distance factor k on the desktop keys, the subject's height fy (0 = top) and the
 * extra fov. Hero (s < 10, easing to the walk by s 110), walking, then the overview (from 1430, reached by
 * 1535). The overview sits high (fy .2) so entry 6, which is centred lower on mobile, keeps the free area.
 */
export function mobileFraming(s: number): { k: number; fy: number; fov: number } {
  const hero = 1 - smoothstep(10, 110, s);
  const over = smoothstep(1430, 1535, s);
  return { k: 1.5 + 0.3 * hero + 0.9 * over, fy: 0.34 - 0.09 * hero - 0.14 * over, fov: 8 };
}

/* ------------------------------------------------------------------------------------------------
 * Temperature model (§6.2): modelled from altitude, not measured. April-May daytime reference.
 * ---------------------------------------------------------------------------------------------- */

export const LAPSE = { refM: 760, refC: 22, perKm: -6.5 } as const;
export const HYPSO_AT_M = [800, 2000, 3500, 4500, 5500, 7000] as const;
export const TEMP_AT_C = [-25, -10, 0, 5, 12, 22] as const;

/**
 * The terrain fill ramps (§6.1, §6.3), one stop per HYPSO_AT_M / TEMP_AT_C entry. The scene feeds the
 * same stops to the shader and the legend draws its bar from them, so the key always matches the map.
 */
export const STORY_RAMPS = {
  night: {
    hypso: ['#112015', '#202618', '#332E22', '#3C362E', '#37434E', '#4E5661'],
    temp: ['#8C93A3', '#4D5263', '#343846', '#2B2740', '#2F2228', '#4A2528'],
  },
  day: {
    hypso: ['#D8ECDB', '#D7E0C7', '#D6CEB9', '#CBC0B5', '#A6B6C5', '#98A5B6'],
    temp: ['#F4F6F9', '#D8DFEA', '#C3CBD9', '#CCC3DD', '#DCC6CB', '#DDB1A6'],
  },
} as const;

export function modelledTempC(altitudeM: number): number {
  return Math.round(LAPSE.refC + (LAPSE.perKm * (altitudeM - LAPSE.refM)) / 1000);
}

/** The altitude where the model crosses 0 °C (about 4,145 m). */
export const FREEZE_M = LAPSE.refM - (LAPSE.refC / LAPSE.perKm) * 1000;

/* ------------------------------------------------------------------------------------------------
 * Marks (§7, §8): villages, lakes, peaks, altitude ticks and the jeep note. The scene draws a marker for
 * every mark with `marker >= 0` and reports every mark's screen position in the frame, in this order.
 * Display names and copy live here; altitudes are read from `entities/expedition` by the page.
 * ---------------------------------------------------------------------------------------------- */

/** Instanced marker sprite: 0 pass-through ring, 1 overnight dot, 2 pass, 3 lake, 4 peak, 6 tick, -1 none. */
export type MarkerKind = -1 | 0 | 1 | 2 | 3 | 4 | 6;

export type StoryMarkRole = 'pass-through' | 'stay' | 'landmark' | 'col' | 'lake' | 'peak' | 'tick' | 'note';

export interface StoryMark {
  readonly id: string;
  readonly role: StoryMarkRole;
  /** Label text ('' = marker only, no label). */
  readonly label: string;
  /** A second, quieter line ("Kicho Tal"). */
  readonly sub?: string;
  /** Approximate position (Blue and Green Lake): an "approx." tag, never an altitude. */
  readonly approx?: boolean;
  /** Names to look the cited altitude up by in the expedition entity (first hit wins). */
  readonly entity?: readonly string[];
  /** Never print an altitude for this mark (Ice Lake until Aman confirms, Mungji). */
  readonly noAltitude?: boolean;
  /** Route-file waypoint id the mark stands on. */
  readonly waypoint?: string;
  /** Villages: snap to the main line inside this segment. */
  readonly segment?: MainSegmentId;
  /** Lakes and the base camp: the side trip they belong to (0-3). */
  readonly trip?: 0 | 1 | 2 | 3;
  /** Peaks: the s windows they are labelled in. */
  readonly windows?: readonly (readonly [number, number])[];
  /** Ticks: the first crossing of this altitude on the main line. */
  readonly levelM?: number;
  /** The jeep note: shown from the jeep act's start to this many vh after its end. */
  readonly tail?: number;
  readonly marker: MarkerKind;
}

const village = (
  waypoint: string,
  label: string,
  role: 'pass-through' | 'stay' | 'landmark' | 'col',
  segment: MainSegmentId,
  entity: readonly string[] = [label],
  extra: Partial<StoryMark> = {},
): StoryMark => ({
  id: waypoint,
  role,
  label,
  waypoint,
  segment,
  entity,
  marker: role === 'pass-through' ? 0 : role === 'col' ? 2 : 1,
  ...extra,
});

const peak = (waypoint: string, label: string, windows: StoryMark['windows'], entity = [label]): StoryMark => ({
  id: waypoint,
  role: 'peak',
  label,
  waypoint,
  windows,
  entity,
  marker: 4,
});

const tick = (levelM: number, label: string): StoryMark => ({
  id: `tick-${Math.round(levelM)}`,
  role: 'tick',
  label,
  levelM,
  marker: 6,
});

export const STORY_MARKS: readonly StoryMark[] = [
  village('besisahar', 'Besisahar', 'stay', 'd1'),
  village('bhulbhule', 'Bhulbhule', 'pass-through', 'd1'),
  village('ngadi-khola', 'Ngadi', 'stay', 'd1'),
  village('bahundanda', 'Bahundanda', 'pass-through', 'd2'),
  village('syange', 'Syange', 'stay', 'd2'),
  village('tal', 'Tal', 'pass-through', 'd3'),
  village('dharapani', 'Dharapani', 'pass-through', 'd3'),
  village('danagyu', 'Danagyu', 'pass-through', 'd3'),
  village('timang', 'Timang', 'stay', 'd3'),
  village('koto', 'Koto', 'pass-through', 'd4'),
  village('chame', 'Chame', 'pass-through', 'd4'),
  village('bhratang', 'Bhratang', 'pass-through', 'd4'),
  village('dhikur-pokhari', 'Dhikur Pokhari', 'stay', 'd4'),
  village('lower-pisang', 'Pisang', 'pass-through', 'd5', ['Pisang', 'Lower Pisang']),
  village('humde', 'Humde', 'pass-through', 'd5'),
  village('mungji', 'Mungji', 'stay', 'd5', ['Mungji'], { noAltitude: true }),
  village('braka', 'Braka', 'pass-through', 'd9-shri-kharka'),
  village('manang', 'Manang', 'landmark', 'd9-shri-kharka'),
  village('khangsar', 'Khangsar', 'stay', 'd9-shri-kharka'),
  village('shri-kharka', 'Shri Kharka', 'stay', 'd9-shri-kharka'),
  village('yak-kharka', 'Yak Kharka', 'pass-through', 'd12-ledar'),
  village('churi-ledar', 'Churi Ledar', 'stay', 'd12-ledar'),
  village('thorong-phedi', 'Thorong Phedi', 'pass-through', 'gap-ledar'),
  village('thorong-high-camp', 'High Camp', 'stay', 'd13-high-camp', ['Thorong High Camp', 'High Camp']),
  village('thorong-la', 'Thorong La', 'col', 'd14-muktinath'),
  village('ranipauwa-muktinath', 'Muktinath', 'stay', 'd14-muktinath', ['Muktinath', 'Ranipauwa']),
  { id: 'blue-lake', role: 'lake', label: 'Blue Lake', approx: true, waypoint: 'blue-lake', trip: 0, marker: 3 },
  { id: 'green-lake', role: 'lake', label: 'Green Lake', approx: true, waypoint: 'green-lake', trip: 1, marker: 3 },
  {
    id: 'ice-lake',
    role: 'lake',
    label: 'Ice Lake',
    sub: 'Kicho Tal',
    noAltitude: true,
    waypoint: 'ice-lake',
    trip: 2,
    marker: 3,
  },
  { id: 'ice-lake-lower', role: 'lake', label: '', waypoint: 'ice-lake-lower', trip: 2, marker: 3 },
  {
    id: 'tilicho-lake',
    role: 'lake',
    label: 'Tilicho Lake',
    entity: ['Tilicho Lake'],
    waypoint: 'tilicho-lake',
    trip: 3,
    marker: 3,
  },
  {
    id: 'tilicho-base-camp',
    role: 'pass-through',
    label: 'Tilicho Base Camp',
    waypoint: 'tilicho-base-camp',
    trip: 3,
    marker: 0,
  },
  peak('annapurna-i', 'Annapurna I', [[0, 110], [1445, 99999]]),
  peak('annapurna-ii', 'Annapurna II', [[0, 110], [200, 420], [1445, 99999]]),
  peak('annapurna-iii', 'Annapurna III', [[0, 110], [470, 760], [1445, 99999]]),
  peak('annapurna-iv', 'Annapurna IV', [[0, 110], [300, 440]]),
  peak('gangapurna', 'Gangapurna', [[0, 110], [540, 860]]),
  peak('tilicho-peak', 'Tilicho Peak', [[840, 990], [1445, 99999]]),
  peak('pisang-peak', 'Pisang Peak', [[400, 500]]),
  peak('thorong-peak', 'Thorong Peak', [[1180, 1360]]),
  tick(1000, '1,000 m'),
  tick(2000, '2,000 m'),
  tick(3000, '3,000 m'),
  tick(4000, '4,000 m'),
  { ...tick(FREEZE_M, '0 °C, modelled'), id: 'tick-freeze' },
  tick(5000, '5,000 m'),
  { id: 'jeep', role: 'note', label: 'by jeep, not walked', segment: 'jeep', tail: 25, marker: -1 },
];

/**
 * Commonly cited peak altitudes (§8.1), shown with "~". Peaks are not in the expedition entity's
 * waypoints (they are landmarks, not places he walked), so the page reads these when the entity has no
 * peak list.
 */
export const PEAK_ALTITUDES_M: Readonly<Record<string, number>> = {
  'annapurna-i': 8091,
  'annapurna-ii': 7937,
  'annapurna-iii': 7555,
  'annapurna-iv': 7525,
  gangapurna: 7455,
  'tilicho-peak': 7134,
  'pisang-peak': 6091,
  'thorong-peak': 6144,
};

/* ------------------------------------------------------------------------------------------------
 * Scene -> page frame (§15.5). One object per rendered frame, mutated in place by the scene.
 * ---------------------------------------------------------------------------------------------- */

/** Floats per mark in `StoryFrame.marks`: x, y (CSS px from the viewport's top-left), visible, sAt, dHead. */
export const MARK_STRIDE = 5;

export interface StoryFrame {
  /** The damped story position the scene rendered (vh). */
  s: number;
  /** 0 = the poster's look (flat bands), 1 = lit; the canvas is on screen once the scene emits frames. */
  live: number;
  /** The arrival (0 -> 1 over about 3.4 s from first paint); 1 under reduced motion. */
  intro: number;
  /** 0 = the main line, 1-4 = the side trip (SIDE_TRIP_IDS[strip - 1]). */
  strip: number;
  /** The terrain altitude under the head, in metres (never printed: the page shows contours and cited values). */
  headAltM: number;
  /** The head: x, y (CSS px), visible (1 = shown and on screen). */
  head: Float32Array;
  /**
   * STORY_MARKS.length * MARK_STRIDE floats, in STORY_MARKS order: screen x, y (CSS px), visible (1 = in front
   * of the camera, inside the viewport and not hidden by a ridge), sAt (the s at which the head reaches the
   * mark; for lakes and the base camp, on their trip's out act; for ticks the first crossing; for the jeep note
   * the jeep act's start), dHead (world units from the head on the ground plane).
   */
  marks: Float32Array;
}

/** Scene params the page sets with `setSceneParam('relief-annapurna', key, value)`. */
export const STORY_PARAM = {
  /** Float32Array(40): up to 10 recede rectangles [x0, y0, x1, y1] in device px, bottom-left origin. */
  rects: 'rects',
  rectN: 'rectN',
  /** The feather and corner radius of the recede pools, in CSS px (112 / 64 and 26). */
  feather: 'feather',
  radius: 'radius',
  /** 'alt' | 'temp': the legend's emphasis. */
  layer: 'layer',
  /** 1 under reduced motion (the scene shows the final state statically). */
  reduced: 'reduced',
  /** 1 = the viewport uses the mobile framing (width <= MOBILE_MAX_WIDTH). */
  mobile: 'mobile',
} as const;
