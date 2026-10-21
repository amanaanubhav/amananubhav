import type { StoryMarkKind } from './marks';

/*
 * The contract between the relief scene and the home page (design §15.5). No three.js here.
 *
 * Page -> scene: `setSceneParam('relief-annapurna', key, value)` with the keys of STORY_PARAM.
 * Scene -> page: one `emitSceneFrame('relief-annapurna', frame)` per rendered frame (the same
 * object, mutated in place; read it synchronously, never keep references to its arrays).
 */

export const STORY_SCENE_ID = 'relief-annapurna' as const;

/** The story's data (about 37 KB): the route and the story heightfield (`/data/terrain/<id>.json|bin`). */
export const STORY_ROUTE_URL = '/data/routes/annapurna-route.json';
export const STORY_TERRAIN_ID = 'annapurna-story';
/** What the page prefetches in parallel with the renderer chunk (load-in-3d §4), with the body kind. */
export const STORY_DATA_PREFETCH: readonly (readonly [url: string, kind: 'json' | 'buffer'])[] = [
  [`/data/terrain/${STORY_TERRAIN_ID}.json`, 'json'],
  [`/data/terrain/${STORY_TERRAIN_ID}.bin`, 'buffer'],
  [STORY_ROUTE_URL, 'json'],
];

/** Param keys the scene reads every frame (all optional; defaults in brackets). */
export const STORY_PARAM = {
  /** s / S_END, 0..1 [0]. `setSceneProgress(id, p)` works too. */
  progress: 'progress',
  /**
   * Recede rectangles in CSS px, viewport coordinates, top-left origin: [left, top, right, bottom]
   * per rect, padded by the page (14 px text, 6 px chrome), largest first, up to 10. Pass a
   * Float32Array(40) (or number[]) plus `rectN`. While `rectN` was never set the scene collects
   * `[data-recede]` and `[data-recede-chrome]` itself.
   */
  rects: 'rects',
  rectN: 'rectN',
  /**
   * 'css' (default, as above) or 'device': device px at window.devicePixelRatio with a bottom-left
   * origin [x0, y0, x1, y1] (the design's wording); the scene converts either to its own canvas.
   */
  rectUnits: 'rectUnits',
  /** 'alt' | 'temp' ['alt']: the legend's fill emphasis (text param). */
  layer: 'layer',
  /** 1 = reduced motion: one static map (whole route, overview labels) [OS setting or html[data-motion=off]]. */
  reduced: 'reduced',
  /** 0 = skip label projection (e.g. tier 0 or labels hidden) [1]. */
  labels: 'labels',
  /** The ambient sway's clock origin (`performance.now()`) [window.__t0, else 0 = navigation start]. */
  t0: 't0',
} as const;

export interface StoryMarkState {
  readonly id: string;
  readonly kind: StoryMarkKind;
  /** Screen position of the mark (CSS px, viewport, top-left origin). */
  x: number;
  y: number;
  /** > 0: wants a label now (higher first, design §8.2); <= 0: no label. */
  pri: number;
  /** In front of the camera, inside the viewport and not hidden behind a ridge. */
  visible: boolean;
  /** The stop the head is at ("here": signal colour + the readout's °C). */
  here: boolean;
}

/**
 * The head readout (design §6.2): the cited altitude at a named stop, else the last 500 m contour
 * crossed ("above N m"), plus the modelled °C. Null on the Blue / Green / Ice branches, during the
 * arrival, at the overview and under reduced motion.
 */
export interface StoryReadout {
  /** The stop's id when at a named stop (its cited altitude), else null ("above N m"). */
  at: string | null;
  altM: number;
  tempC: number;
}

export interface StoryFrame {
  /** Damped story position (vh). */
  s: number;
  /** Viewport size used for the projection (CSS px) and the canvas pixel ratio. */
  width: number;
  height: number;
  dpr: number;
  /** Day of 14 and the act's place line (empty at the overview). */
  day: number;
  place: string;
  /** The scene has drawn its first frame (ground-identical): the canvas is shown from this frame on. */
  live: boolean;
  /** The entrance's reveal, 0 (the ground) -> 1 (the map) over REVEAL_SECONDS (load-in-3d §3). */
  light: number;
  /** The timed entrance is still running (no readouts). */
  intro: boolean;
  overview: boolean;
  reduced: boolean;
  /** 0..1 over the last 60 vh: labels fade at 0.5, the legend at 0.4, the stage hides at 1. */
  dissolve: number;
  /** The summit numeral (cited metres): 4,880 -> 5,416 with the head through the climb. */
  numeralM: number;
  /** The head's screen position; hidden at the overview and under reduced motion. */
  head: { x: number; y: number; visible: boolean };
  readout: StoryReadout | null;
  /** Every mark of STORY_MARKS, in that order. */
  marks: StoryMarkState[];
}
