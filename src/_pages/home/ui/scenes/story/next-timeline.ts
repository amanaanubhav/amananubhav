import { NEXT_COPY } from '../../../config/copy';
import type { CameraKey } from './camera';
import { S_END } from './timeline';

/*
 * The home `#next` transition (docs/redesign/next-trek/NEXT-DESIGN.md §3, §5.2; fixes in BUILD-REPORT.md
 * "Transition fixes"): a second camera track that starts at S_END from the story's own final pose (both tracks
 * have zero slope there, so the join is C1). The map extends from Muktinath, the walked line resumes there as the
 * planned road (Jharkot, Kagbeni, Jomsom, Marpha), the road runs on down the Kali Gandaki to Tatopani and up to
 * Humkhola, and the camera comes to rest on a static view of the Herzog Trail side of Annapurna I. Only the
 * transition is scroll-driven; from S_NEXT_REST on the camera is fixed and the expected trek line is revealed once
 * by time. Pure data, no three.js: the page imports it for layout (anchors, S_NEXT_REST) without pulling in the
 * scene.
 *
 * Route facts: docs/redesign/next-trek/ROUTE-FACTS.md, Route A (the Herzog Trail) and §7 (Muktinath to Marpha).
 * Every place is a commonly cited, approximate position; the lines are derived from those points on the terrain
 * (public/data/routes/anbc-expected.json, built by scripts/terrain/build-north-route.mjs). Sources stay in those
 * files: nothing here is shown as a credit. No dates.
 */

/** The rest view (vh): the camera is fixed from here on and the #next content scrolls over the still map. */
export const S_NEXT_REST = 1985;

/** The transition's phases (vh), design §3.1. */
export const NEXT_SPANS = {
  /** Phones and tablets blend from the overview's framing into the #next framing (design §4). */
  handoff: [S_END, 1745],
  /**
   * The north tile grows out of Muktinath: behind a soft front its relief rises, its colour fills and its own
   * heights replace the story tile's (no dither, no pop). Scroll-driven, so scrolling up shrinks it back.
   */
  reveal: [S_END, 1765],
  /**
   * The head rides the road on arc length: the corridor Muktinath > Marpha, then the jeep leg to Humkhola, one
   * line (eased only on the first and last NEXT_RIDE_EASE of it).
   */
  ride: [1680, 1950],
  /** Ambient sway and sun jitter fade out into the still rest view. */
  settle: [1945, S_NEXT_REST],
} as const;

/**
 * The fastest the scene's `s` moves through the transition (vh per second): a key jump (End, Home, a rail link) flies
 * the 320 vh in about 1.3 s, near 1.5° of turn per frame, instead of a few frames (fix2 verify P2). A normal scroll
 * (wheel or touch, ~130 vh/s) never reaches it.
 */
export const NEXT_MAX_SPEED = 240;

/** The road's eased share at each end: it pulls away from Muktinath and brakes into Humkhola. */
export const NEXT_RIDE_EASE = 0.06;

/** The reveal front (world units, 3.42 km): its soft edge and its last radius around Muktinath (past the tile). */
export const NEXT_REVEAL = { band: 8, radius: 27 } as const;

/**
 * The turn (az, compass degrees looked toward): from the story's last 350° clockwise to the rest view's 88° (448),
 * at a steady rate (about 0.37°/vh) with smoothstep ramps over the first and last vh. The camera looks north to
 * east the whole way, so the corridor and the gorge read as one map below it; it never whips round.
 */
export const NEXT_TURN = { from: 350, to: 448, rampIn: 60, rampOut: 50 } as const;

/** The camera's bearing at story position `s` (S_END to S_NEXT_REST). */
export function nextAzAt(s: number): number {
  const T = S_NEXT_REST - S_END;
  const { from, to, rampIn: a, rampOut: b } = NEXT_TURN;
  const D = to - from;
  const v = D / (T - (a + b) / 2);
  const x = Math.min(T, Math.max(0, s - S_END));
  // ∫ smoothstep: the velocity eases in (out) over a ramp of r vh and covers v·r/2 of the turn.
  const ramp = (t: number, r: number) => v * r * (t * t * t - (t * t * t * t) / 2);
  if (x < a) return from + ramp(x / a, a);
  if (x > T - b) return to - ramp((T - x) / b, b);
  return from + ramp(1, a) + v * (x - a);
}

/**
 * The trek line (oxblood dots) is revealed ONCE by time when the story reaches `at`: a `ms` sweep from
 * Humkhola to the base camp on the emphasised ease-out. Back above `resetBelow` it fades out over `outMs`, so
 * the sweep runs again on return. Reduced motion: drawn at once.
 */
export const NEXT_TREK_REVEAL = { at: 1970, resetBelow: 1945, ms: 700, outMs: 200 } as const;

/** Story positions of the page's anchors (vh): caption C1's centre at the viewport centre. */
export const NEXT_TEXT_AT = { caption: 1817 } as const;

/**
 * Where the rest anchor's top stands when s = S_NEXT_REST (fraction of the viewport height; design §3.2 K6 and
 * §4): the page's `--rest-line` on #next wins, these are the fallbacks.
 */
export const NEXT_REST_TOP = { desktop: 0.22, mobile: 0.52 } as const;

/**
 * #next takes the phone framing (and its 52 % rest line, `--rest-line` on #next) up to this viewport width (CSS px):
 * below 1024 px the section is one column, so the copy runs under the subject, not beside it. The story before
 * S_END keeps its own breakpoint (STORY_MOBILE_MAX_WIDTH); tablets blend into this framing over the handoff only.
 */
export const NEXT_MOBILE_MAX_WIDTH = 1023;

/** Phones and tablets: the subject at x 0.5, y 0.36, `dist` x 1.2 (design §4). */
export const NEXT_MOBILE_FRAME = { x: 0.5, y: 0.36, zoom: 1.2 } as const;

/** Camera anchors of the next track (lon, lat); 'overview' is the story's own overview anchor. */
export type NextAnchor = 'overview' | 'upper' | 'jomsom' | 'gorge' | 'tatopani' | 'herzog';

export const NEXT_ANCHOR_LONLAT: Readonly<Record<Exclude<NextAnchor, 'overview'>, readonly [number, number]>> = {
  /** The upper corridor, between Muktinath and the Kagbeni junction. */
  upper: [83.8, 28.81],
  /** Jomsom, with Kagbeni above it and Marpha below. */
  jomsom: [83.72, 28.76],
  /** The Kali Gandaki gorge between Kalopani and Ghasa. */
  gorge: [83.64, 28.64],
  /** The Tatopani hairpin and the side valley up to Narchyang. */
  tatopani: [83.66, 28.53],
  /** The Herzog Trail's midpoint: Humkhola left, the base camp right, Annapurna I's north face behind. */
  herzog: [83.765, 28.615],
};

/**
 * K1-K6 (design §3.2, re-keyed in fix2): pitch = down-angle (deg), dist in world units (3.42 km, interpolated in
 * log space: a steady zoom), fov vertical. `az` is the turn's value at the key (NEXT_TURN drives it, not the keys).
 * `follow` blends the anchor toward the ride head on a smoothed copy of the road (lead 0: no swing at a bend).
 * Interpolated by a true PCHIP with zero end slopes. K1 repeats the story's last key exactly (STORY_CAMERA_KEYS at
 * S_END). Checked offline with docs/redesign/next-trek/fix2/tools/next-track.mjs: turn <= 0.37°/vh, zoom <= 1.7
 * %/vh, the camera >= 4 world units over the ground, the head on screen throughout.
 */
const key = (s: number, k: Omit<CameraKey<NextAnchor>, 's' | 'az'>): CameraKey<NextAnchor> => ({ s, az: nextAzAt(s), ...k });
export const NEXT_CAMERA_KEYS: readonly CameraKey<NextAnchor>[] = [
  key(S_END, { pitch: 60, dist: 54, fov: 30, follow: 0, lead: 0, anchor: 'overview' }),
  key(1730, { pitch: 52, dist: 24, fov: 32, follow: 0.35, lead: 0, anchor: 'upper' }),
  key(1785, { pitch: 48, dist: 16, fov: 33, follow: 0.5, lead: 0, anchor: 'jomsom' }),
  key(1850, { pitch: 46, dist: 14, fov: 34, follow: 0.45, lead: 0, anchor: 'gorge' }),
  key(1915, { pitch: 42, dist: 11.5, fov: 34, follow: 0.4, lead: 0, anchor: 'tatopani' }),
  key(S_NEXT_REST, { pitch: 32, dist: 8.5, fov: 34, follow: 0, lead: 0, anchor: 'herzog' }),
];

/*
 * The next map's marks (labels and glyphs). Ids are the route file's place ids. Names (and the notes they share)
 * come from the section's copy, NEXT_COPY.places, the one source the static sheet prints too; the map adds its own
 * "via" notes. Altitudes are commonly cited figures (ROUTE-FACTS §3: Humkhola ~2,883 m, the base camp ~4,190 m,
 * both approximate, shown with "~"; Annapurna I 8,091 m from entities/expedition, a surveyed height, shown without).
 * Positions come from the route file at run time.
 */
export type NextMarkKind = 'circuit-end' | 'jeep-start' | 'road' | 'via' | 'trailhead' | 'camp' | 'goal' | 'summit';

export interface NextMarkDef {
  readonly id: string;
  readonly kind: NextMarkKind;
  readonly name: string;
  /** Italic note after the name ("planned", "expected"). */
  readonly note?: string;
  /** Commonly cited altitude (m), printed with "~" unless `approx` is false. */
  readonly altM?: number;
  /** False for a surveyed height (Annapurna I): printed without "~". Default true. */
  readonly approx?: boolean;
  /** Dropped from the label set on phones (the dots still show the place). */
  readonly desktopOnly?: boolean;
  /** Label priority while wanted (higher first). */
  readonly pri: number;
}

/** Name and note of a place, from the section's copy (`name` when the copy has none: the corridor's road towns). */
const copyOf = (id: string, name = id): { name: string; note?: string } => NEXT_COPY.places[id] ?? { name };

export const NEXT_MARKS: readonly NextMarkDef[] = [
  { id: 'muktinath', kind: 'circuit-end', ...copyOf('muktinath'), pri: 7 },
  // The corridor (ROUTE-FACTS §7): road towns, small and steel like Kalopani and Ghasa; names only (no altitude,
  // no transport). Kagbeni is the junction, Jomsom the valley's town; Jharkot only where there is room.
  { id: 'jharkot', kind: 'road', ...copyOf('jharkot', 'Jharkot'), desktopOnly: true, pri: 3.5 },
  { id: 'kagbeni', kind: 'road', ...copyOf('kagbeni', 'Kagbeni'), pri: 5 },
  { id: 'jomsom', kind: 'road', ...copyOf('jomsom', 'Jomsom'), pri: 5 },
  { id: 'marpha', kind: 'jeep-start', ...copyOf('marpha'), pri: 8 },
  { id: 'kalopani', kind: 'road', ...copyOf('kalopani'), pri: 4.5 },
  { id: 'ghasa', kind: 'road', ...copyOf('ghasa'), pri: 4.5 },
  { id: 'tatopani', kind: 'via', ...copyOf('tatopani'), note: 'via', pri: 6 },
  { id: 'narchyang', kind: 'via', ...copyOf('narchyang'), note: 'via', pri: 5.5 },
  { id: 'humkhola', kind: 'trailhead', ...copyOf('humkhola'), altM: 2883, pri: 9 },
  { id: 'sadhi-kharka', kind: 'camp', ...copyOf('sadhi-kharka'), desktopOnly: true, pri: 4 },
  { id: 'bhusket-mela', kind: 'camp', ...copyOf('bhusket-mela'), desktopOnly: true, pri: 4.2 },
  { id: 'panchakunda', kind: 'camp', ...copyOf('panchakunda'), pri: 5 },
  { id: 'anbc', kind: 'goal', ...copyOf('anbc'), altM: 4190, pri: 10 },
  { id: 'annapurna-i', kind: 'summit', ...copyOf('annapurna-i'), altM: 8091, approx: false, pri: 6.5 },
];

/** The route and the north heightfield (prefetched at idle once the story passes the numeral, design §5.3). */
export const NEXT_ROUTE_URL = '/data/routes/anbc-expected.json';
export const NEXT_TERRAIN_ID = 'annapurna-north';
export const NEXT_DATA_PREFETCH: readonly (readonly [url: string, kind: 'json' | 'buffer'])[] = [
  [`/data/terrain/${NEXT_TERRAIN_ID}.json`, 'json'],
  [`/data/terrain/${NEXT_TERRAIN_ID}.bin`, 'buffer'],
  [NEXT_ROUTE_URL, 'json'],
];
/** The story position (vh) from which the next data is fetched at idle: the summit numeral. */
export const NEXT_PREFETCH_FROM = 1215;

/**
 * The ride head's share of the road at story position `s` (0 at Muktinath, 1 at Humkhola; the corridor, then the
 * jeep leg): constant speed in the middle, a smoothstep velocity ramp over the first and last NEXT_RIDE_EASE of
 * the road's length.
 */
export function rideShareAt(s: number): number {
  const [s0, s1] = NEXT_SPANS.ride;
  const p = Math.min(1, Math.max(0, (s - s0) / (s1 - s0)));
  const a = NEXT_RIDE_EASE;
  const v = 1 + 2 * a; // cruise speed (road shares per unit time)
  const ta = (2 * a) / v; // ramp time
  const ramp = (t: number) => v * ta * (t * t * t - (t * t * t * t) / 2); // ∫ smoothstep, distance a at t = 1
  if (p < ta) return ramp(p / ta);
  if (p > 1 - ta) return 1 - ramp((1 - p) / ta);
  return a + v * (p - ta);
}
