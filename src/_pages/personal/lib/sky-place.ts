import { SKY_UI } from '../config/content';
import type { SkyPlace } from './sky-engine';

/** One of the sky's places: `SKY_UI.places` keys. */
export type SkyPlaceId = keyof typeof SKY_UI.places;

/** A place with its control labels; plain data (built on the server by `getSkyPlaces`, crosses to the client). */
export interface SkyPlaceOption extends SkyPlace {
  readonly id: SkyPlaceId;
  /** The segmented control's label ("Sikahar"); also the canvas name ("Interactive sky over Sikahar"). */
  readonly segment: string;
  /** The phone select's option ("Sikahar, 25° N"). */
  readonly option: string;
}

/**
 * "Where you are" (SKY-SPEC §2.2): asked for only on a press, rounded to 0.1° (about 10 km), kept in this page's
 * memory, the browser's own zone, no coordinates shown anywhere. Never stored, never sent.
 */
export function hereSkyPlace(lat: number, lon: number): SkyPlaceOption {
  return {
    id: 'you',
    lat: Math.round(lat * 10) / 10,
    lon: Math.round(lon * 10) / 10,
    label: SKY_UI.hereLabel,
    short: SKY_UI.hereLabel,
    timeZone: undefined,
    tzLabel: '',
    segment: SKY_UI.places.you.segment,
    option: SKY_UI.places.you.option,
  };
}
