import { getExpedition, getWaypoint, type ExpeditionId } from '@/entities/expedition';
import { SKY_OBSERVER } from '@/shared/lib/astro';
import { SKY_UI } from '../config/content';
import type { SkyPlaceOption } from './sky-place';

/*
 * The places the live sky can stand at (SKY-SPEC §2.2, FINAL-DESIGN §4.2.1 "Where"). Server only: `SkySection`
 * builds the list and hands it to the client island as plain data, so the expedition entity never ships to the
 * browser.
 *
 * - Sikahar: `SKY_OBSERVER` (25° N 85° E), never more precise than that.
 * - Thorong La and Chandrashila: the finished treks' own waypoints in `entities/expedition` (positions used for the
 *   maths only, never printed). Q-SKY-2: whether to offer them at all.
 * - Where you are: the browser's position, only on a press (`hereSkyPlace` in `sky-place.ts`, built in the client).
 * Upcoming treks are never offered ("never a future date" applies to places too).
 */

/** Zones of the places (geography, not a fact about Aman). */
const ZONES = {
  india: { timeZone: 'Asia/Kolkata', tzLabel: 'IST' },
  nepal: { timeZone: 'Asia/Kathmandu', tzLabel: 'NPT' },
} as const;

function trekPlace(
  id: 'thorong' | 'chandrashila',
  expedition: ExpeditionId,
  waypoint: string,
  zone: keyof typeof ZONES,
): SkyPlaceOption | null {
  const exp = getExpedition(expedition);
  if (!exp || exp.status !== 'done') return null;
  const wp = getWaypoint(exp, waypoint);
  if (!wp || wp.lat === undefined || wp.lon === undefined) return null;
  const labels = SKY_UI.places[id];
  return {
    id,
    lat: wp.lat,
    lon: wp.lon,
    label: labels.option,
    short: labels.segment,
    ...ZONES[zone],
    segment: labels.segment,
    option: labels.option,
  };
}

/** Sikahar first (the default), then the finished treks that carry a position. "Where you are" is added on press. */
export function getSkyPlaces(): SkyPlaceOption[] {
  const sikahar: SkyPlaceOption = {
    id: 'sikahar',
    lat: SKY_OBSERVER.latDeg,
    lon: SKY_OBSERVER.lonDeg,
    label: SKY_UI.places.sikahar.option,
    // "Up now from 25° N, …": the sheet edge's latitude.
    short: SKY_UI.sheetEdge[1],
    ...ZONES.india,
    segment: SKY_UI.places.sikahar.segment,
    option: SKY_UI.places.sikahar.option,
  };
  const treks = [
    trekPlace('thorong', 'annapurna', 'Thorong La', 'nepal'),
    trekPlace('chandrashila', 'chandrashila', 'Chandrashila', 'india'),
  ];
  return [sikahar, ...treks.filter((p): p is SkyPlaceOption => p !== null)];
}
