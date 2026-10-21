export type ExpeditionId = 'annapurna' | 'kun-tso' | 'chandrashila' | 'triund' | 'kheerganga' | 'yulla-kanda' | 'dodital';

export type WaypointKind = 'trailhead' | 'camp' | 'village' | 'pass' | 'summit' | 'lake';

/**
 * The part a place plays in the trek story (the home story map's label rules):
 * stay = an overnight stop (persists once passed, with its altitude); pass-through = walked through (name only,
 * fades to a dot); landmark = a named place on the line that is neither (Manang, Thorong La, a lake, the start);
 * named-only = named in text and the route list but never placed on a map (no coordinates).
 */
export type WaypointStop = 'stay' | 'pass-through' | 'landmark' | 'named-only';

export interface Waypoint {
  readonly name: string;
  /** Local or second name, shown beside the name ("Ice Lake (Kicho Tal)"); see `waypointLabel`. */
  readonly altName?: string;
  readonly kind: WaypointKind;
  /** Never invented; undefined = unknown. */
  readonly altitudeM?: number;
  /** Renders "~". */
  readonly approx?: boolean;
  /** false = known but not printed until Aman confirms it (Ice Lake). */
  readonly showAltitude?: boolean;
  /**
   * Positions from OpenStreetMap place nodes (the route geometry is reconstructed), for drawing and the atlas
   * only: never printed.
   */
  readonly lat?: number;
  readonly lon?: number;
  /** true = the position itself is a best guess (a lake he named that no track confirms). */
  readonly positionApprox?: boolean;
  /** From a GPX only. */
  readonly distanceKm?: number;
  readonly sideTrip?: boolean;
  /** Trek day on which he reached it (day numbers only, never dates). */
  readonly day?: number;
  /** Story role on the home map. */
  readonly stop?: WaypointStop;
  /** Nights spent there (stays only). */
  readonly nights?: number;
  readonly source: 'gpx' | 'commonly-cited' | 'bio' | 'estimate' | 'dem';
  /** Open question id. */
  readonly confirm?: string;
}

export interface ExpeditionHighPoint {
  readonly name: string;
  readonly altitudeM?: number;
  readonly approx?: boolean;
  readonly confirm?: string;
}

export interface Expedition {
  readonly id: ExpeditionId;
  readonly name: string;
  readonly shortName: string;
  readonly region: string;
  readonly country: 'India' | 'Nepal';
  /** Display only (month and year at most); never a future date, never a daily date. */
  readonly when?: string;
  readonly year?: number;
  readonly mode?: 'solo' | 'with friends';
  readonly selfSupported?: boolean;
  readonly days?: number;
  readonly distanceKm?: number;
  readonly packKg?: number;
  readonly highPoint: ExpeditionHighPoint;
  readonly status: 'done' | 'upcoming';
  readonly storyId?: string;
  readonly trailhead?: { readonly lat: number; readonly lon: number };
  readonly waypoints: readonly Waypoint[];
}

export interface ExpeditionStats {
  highestM: number;
  highestName: string;
  longestKm?: number;
  heaviestPackKg?: number;
  /** Counts status 'done' only (a planned trek is not logged). */
  treksLogged: number;
}

/** A prominent peak seen from the trek (home story map). Altitudes are commonly cited, so approximate. */
export interface Peak {
  readonly id: string;
  readonly name: string;
  readonly altitudeM: number;
  readonly approx: boolean;
  /** For drawing only; never printed. */
  readonly lat: number;
  readonly lon: number;
}

/** A side trip off the main line: out and back from `from`, in the order he walked them. */
export interface SideTrip {
  readonly id: 'blue-lake' | 'green-lake' | 'ice-lake' | 'tilicho-lake';
  readonly name: string;
  /** 1 = first. */
  readonly order: number;
  /** Trek day (rest-day walks share the rest day). */
  readonly day?: number;
  readonly from: 'mungji' | 'shri-kharka';
  /** Waypoints in walking order, branch point first. */
  readonly waypoints: readonly Waypoint[];
  /** His name for a lake no track confirms (position approximate, no altitude). */
  readonly confirm?: string;
}

/**
 * Temperature is modelled from altitude, never measured: refC at refM, changing perKm °C per 1,000 m
 * (the standard environmental lapse rate). The reference is an approximate April–May daytime value.
 */
export interface TemperatureModel {
  readonly refM: number;
  readonly refName: string;
  readonly refC: number;
  readonly perKm: number;
  readonly season: string;
  readonly approx: true;
}
