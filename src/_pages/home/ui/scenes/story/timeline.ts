/*
 * The home story timeline (design §4, §15.3, §15.4). Story position `s` is in vh of scroll from the
 * top of the page (0 .. S_END); the page writes `progress = s / S_END`. Pure data, no three.js: the
 * page may import it for layout (text anchors, S_END) without pulling in the scene.
 */

export type StoryAnchor = 'circuit' | 'overview' | 'basin' | 'ice' | 'tilicho';

/** One act: a day's walk along main segment(s), a side trip out or back, or a hold. */
export interface StoryActDef {
  /** Length in vh. */
  readonly len: number;
  /** Walk the main line to the end of this segment. */
  readonly main?: string;
  /** Walk the main line to Thorong La (the climb act). */
  readonly toPass?: true;
  /** Side trip index (0 Blue, 1 Green, 2 Ice, 3 Tilicho), out or back. */
  readonly trip?: 0 | 1 | 2 | 3;
  readonly out?: boolean;
  readonly hold?: true;
  readonly day: number;
  /** Legend place line (approved copy). Empty in the overview. */
  readonly place: string;
  readonly climb?: true;
  readonly summit?: true;
  readonly overview?: true;
  readonly dissolve?: true;
}

export const STORY_ACTS: readonly StoryActDef[] = [
  { len: 100, main: 'd1', day: 1, place: 'Besisahar to Ngadi' },
  { len: 85, main: 'd2', day: 2, place: 'Bahundanda, Syange' },
  { len: 35, main: 'syange-tal', day: 3, place: 'Syange to Tal' },
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
  { len: 120, toPass: true, day: 14, place: 'Thorong La', climb: true },
  { len: 70, hold: true, day: 14, place: 'Thorong La', summit: true },
  { len: 90, main: 'd14-muktinath', day: 14, place: 'Down to Chongur and Muktinath' },
  { len: 70, hold: true, day: 14, place: '', overview: true },
  { len: 90, hold: true, day: 14, place: '', overview: true },
  { len: 60, hold: true, day: 14, place: '', overview: true, dissolve: true },
];

/** Main-line segments in walking order (the unrecorded stretches included). */
export const STORY_MAIN_SEGMENTS = [
  'd1',
  'd2',
  'syange-tal',
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

/** Side trips in his order: Blue, Green, Ice, Tilicho. */
export const STORY_TRIP_SEGMENTS = ['blue-lake', 'green-lake', 'ice-lake', 'tilicho'] as const;

const sumLen = (until: (a: StoryActDef) => boolean) => {
  let s = 0;
  for (const a of STORY_ACTS) {
    if (until(a)) return s;
    s += a.len;
  }
  return s;
};

/** The end of the story (vh): 1665. */
export const S_END = sumLen(() => false);
/** The overview pull-back starts here (vh). */
export const S_OVERVIEW = sumLen((a) => a.overview === true);
/** The dissolve into the ground starts here (vh). */
export const S_DISSOLVE = sumLen((a) => a.dissolve === true);
/**
 * The entrance (load-in-3d §3), in seconds of the scene's own frame clock from its second drawn frame:
 * the relief rises out of the ground in REVEAL_SECONDS and everything has settled by ENTRANCE_SECONDS.
 * The walk runs from the first scroll pixel throughout.
 */
export const ENTRANCE_SECONDS = 1.0;
export const REVEAL_SECONDS = 0.9;

/** Camera keyframe (design §15.4): az = compass bearing looked toward, pitch = down-angle (deg). */
export interface StoryCameraKey {
  readonly s: number;
  readonly az: number;
  readonly pitch: number;
  readonly dist: number;
  readonly fov: number;
  readonly follow: number;
  readonly lead: number;
  readonly anchor: StoryAnchor;
}

export const STORY_CAMERA_KEYS: readonly StoryCameraKey[] = [
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
  { s: 1535, az: 346, pitch: 58, dist: 52, fov: 30, follow: 0, lead: 0, anchor: 'overview' },
  { s: S_END, az: 350, pitch: 60, dist: 54, fov: 30, follow: 0, lead: 0, anchor: 'overview' },
];

/** Desktop framing: the subject sits at this fraction of the width (outside the text column). */
export const STORY_FRAME_X_DESKTOP = 0.635;
/** Viewports at or below this width use the mobile framing (design §11). */
export const STORY_MOBILE_MAX_WIDTH = 760;

/** Text anchors (block centre at the viewport centre), vh. For the page's layout. */
export const STORY_TEXT_AT = {
  entry1: 148,
  entry2: 318,
  entry3: 462,
  day6: 575,
  day7: 700,
  days9and10: 905,
  entry4: 1085,
  numeralFrom: 1215,
  numeralTo: 1365,
  entry5: 1420,
  entry6: 1568,
} as const;

/** The summit numeral counts from High Camp to the pass during the climb act (metres, cited). */
export const STORY_NUMERAL = { fromM: 4880, toM: 5416 } as const;
