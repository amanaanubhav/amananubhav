export type ExpeditionId = 'annapurna' | 'kun-tso' | 'chandrashila' | 'triund' | 'kheerganga' | 'yulla-kanda' | 'dodital';

export type WaypointKind = 'trailhead' | 'camp' | 'village' | 'pass' | 'summit' | 'lake';

export interface Waypoint {
  readonly name: string;
  readonly kind: WaypointKind;
  /** Never invented; undefined = unknown. */
  readonly altitudeM?: number;
  /** Renders "~". */
  readonly approx?: boolean;
  /** false = drawn but not printed (Ice Lake until Q-52). */
  readonly showAltitude?: boolean;
  /** Two decimals, approximate until a GPX arrives; for drawing and the atlas only. */
  readonly lat?: number;
  readonly lon?: number;
  /** From a GPX only. */
  readonly distanceKm?: number;
  readonly sideTrip?: boolean;
  readonly source: 'gpx' | 'commonly-cited' | 'bio' | 'estimate';
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
  /** Display only; never a future date. */
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
