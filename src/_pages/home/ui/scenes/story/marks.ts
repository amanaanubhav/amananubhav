/*
 * The story map's curated marks (design §8.1, sign-off defaults of R39): the places he stopped at or
 * walked through, the four lakes, eight peaks and the altitude ticks. Ids are the
 * route dataset's waypoint ids. Altitudes and the temperature model are read from entities/expedition
 * (R44, one source of facts): commonly cited values, approximate (shown with "~"), never a DEM sample.
 * No coordinates and no dates live here.
 *
 * Pure data, no three.js: the page's label layer reads the same list (names, kinds) and the scene
 * emits each mark's screen position and priority per frame, in this order.
 */

import {
  ANNAPURNA_PEAKS,
  ANNAPURNA_ROUTE,
  ANNAPURNA_SIDE_TRIPS,
  TEMPERATURE_MODEL,
  modelledTempC as modelledTempExact,
} from '@/entities/expedition';

export type StoryMarkKind = 'pass' | 'stay' | 'landmark' | 'col' | 'lake' | 'peak' | 'tick' | 'note' | 'head';

export interface StoryMarkDef {
  readonly id: string;
  readonly kind: StoryMarkKind;
  /** Label text; empty = a mark without a label (the lake below Ice Lake). */
  readonly name: string;
  /** Second line (Ice Lake: "Kicho Tal"). */
  readonly sub?: string;
  /** Cited altitude in metres (null: none shown). */
  readonly altM: number | null;
  /** True when the altitude is a commonly cited, approximate value ("~"). */
  readonly approxAlt?: boolean;
  /** Position unconfirmed ("approx." label): Blue Lake and Green Lake. */
  readonly approxPlace?: boolean;
  /** Villages: the main segment that passes it (nearest point search). */
  readonly seg?: string;
  /** Lakes and the base camp: the side trip (0 Blue, 1 Green, 2 Ice, 3 Tilicho). */
  readonly trip?: 0 | 1 | 2 | 3;
  /** Peaks: the story windows (vh) in which they are labelled. */
  readonly windows?: readonly (readonly [number, number])[];
  /** Ticks: the altitude crossed (metres), or 'freeze' for the modelled 0 °C line. */
  readonly level?: number | 'freeze';
}

/** Every Annapurna place by name, main line and side trips. */
const PLACES = new Map([...ANNAPURNA_ROUTE, ...ANNAPURNA_SIDE_TRIPS.flat()].map((wp) => [wp.name, wp]));

/** The entity's altitude for a place: none while it has no figure or withholds one (`showAltitude: false`). */
function altOf(place: string): Pick<StoryMarkDef, 'altM' | 'approxAlt'> {
  const wp = PLACES.get(place);
  const altM = wp && wp.showAltitude !== false ? (wp.altitudeM ?? null) : null;
  return { altM, approxAlt: altM !== null && wp?.approx === true };
}

/** Pass-through villages carry no altitude; stays, landmarks and the col show the entity's. `place`: its entity name. */
const village = (
  id: string,
  name: string,
  kind: 'pass' | 'stay' | 'landmark' | 'col',
  seg: string,
  place = name,
): StoryMarkDef => ({ id, name, kind, seg, ...(kind === 'pass' ? { altM: null } : altOf(place)) });

const peak = (id: string, windows: StoryMarkDef['windows']): StoryMarkDef => {
  const entry = ANNAPURNA_PEAKS.find((p) => p.id === id);
  return { id, name: entry?.name ?? '', kind: 'peak', altM: entry?.altitudeM ?? null, approxAlt: true, windows };
};

const OPEN = 9999;

export const STORY_MARKS: readonly StoryMarkDef[] = [
  village('besisahar', 'Besisahar', 'stay', 'd1'),
  village('bhulbhule', 'Bhulbhule', 'pass', 'd1'),
  village('ngadi-khola', 'Ngadi', 'stay', 'd1'),
  village('bahundanda', 'Bahundanda', 'pass', 'd2'),
  village('syange', 'Syange', 'stay', 'd2'),
  village('tal', 'Tal', 'pass', 'd3'),
  village('dharapani', 'Dharapani', 'pass', 'd3'),
  village('danagyu', 'Danagyu', 'pass', 'd3'),
  village('timang', 'Timang', 'stay', 'd3'),
  village('koto', 'Koto', 'pass', 'd4'),
  village('chame', 'Chame', 'pass', 'd4'),
  village('bhratang', 'Bhratang', 'pass', 'd4'),
  village('dhikur-pokhari', 'Dhikur Pokhari', 'stay', 'd4'),
  village('lower-pisang', 'Pisang', 'pass', 'd5'),
  village('humde', 'Humde', 'pass', 'd5'),
  village('mungji', 'Mungji', 'stay', 'd5'),
  village('braka', 'Braka', 'pass', 'd9-shri-kharka'),
  village('manang', 'Manang', 'landmark', 'd9-shri-kharka'),
  village('khangsar', 'Khangsar', 'stay', 'd9-shri-kharka'),
  village('shri-kharka', 'Shri Kharka', 'stay', 'd9-shri-kharka'),
  village('yak-kharka', 'Yak Kharka', 'pass', 'd12-ledar'),
  village('churi-ledar', 'Churi Ledar', 'stay', 'd12-ledar'),
  village('thorong-phedi', 'Thorong Phedi', 'pass', 'gap-ledar'),
  village('thorong-high-camp', 'High Camp', 'stay', 'd13-high-camp', 'Thorong High Camp'),
  village('thorong-la', 'Thorong La', 'col', 'd14-muktinath'),
  village('ranipauwa-muktinath', 'Muktinath', 'stay', 'd14-muktinath'),
  { id: 'blue-lake', name: 'Blue Lake', kind: 'lake', ...altOf('Blue Lake'), trip: 0, approxPlace: true },
  { id: 'green-lake', name: 'Green Lake', kind: 'lake', ...altOf('Green Lake'), trip: 1, approxPlace: true },
  { id: 'ice-lake', name: 'Ice Lake', sub: 'Kicho Tal', kind: 'lake', ...altOf('Ice Lake'), trip: 2 },
  { id: 'ice-lake-lower', name: '', kind: 'lake', altM: null, trip: 2 },
  { id: 'tilicho-lake', name: 'Tilicho Lake', kind: 'lake', ...altOf('Tilicho Lake'), trip: 3 },
  { id: 'tilicho-base-camp', name: 'Tilicho Base Camp', kind: 'pass', altM: null, trip: 3 },
  peak('annapurna-i', [
    [0, 110],
    [1445, OPEN],
  ]),
  peak('annapurna-ii', [
    [0, 110],
    [200, 420],
    [1445, OPEN],
  ]),
  peak('annapurna-iii', [
    [0, 110],
    [470, 760],
    [1445, OPEN],
  ]),
  peak('annapurna-iv', [
    [0, 110],
    [300, 440],
  ]),
  peak('gangapurna', [
    [0, 110],
    [540, 860],
  ]),
  peak('tilicho-peak', [
    [840, 990],
    [1445, OPEN],
  ]),
  peak('pisang-peak', [[400, 500]]),
  peak('thorong-peak', [[1180, 1360]]),
  { id: 'tick-1000', name: '1,000 m', kind: 'tick', altM: null, level: 1000 },
  { id: 'tick-2000', name: '2,000 m', kind: 'tick', altM: null, level: 2000 },
  { id: 'tick-3000', name: '3,000 m', kind: 'tick', altM: null, level: 3000 },
  { id: 'tick-4000', name: '4,000 m', kind: 'tick', altM: null, level: 4000 },
  { id: 'tick-freeze', name: '0 °C, modelled', kind: 'tick', altM: null, level: 'freeze' },
  { id: 'tick-5000', name: '5,000 m', kind: 'tick', altM: null, level: 5000 },
  { id: 'head', name: '', kind: 'head', altM: null },
];

/** Shown at the overview, under reduced motion and at tier 0 (design §8.2), with their priority. */
export const STORY_OVERVIEW_PRIORITY: Readonly<Record<string, number>> = {
  'thorong-la': 10,
  'tilicho-lake': 8,
  'ice-lake': 8,
  manang: 7,
  besisahar: 7,
  'ranipauwa-muktinath': 7,
};

/**
 * The temperature model (design §6.2), the entity's: about +22 °C at Besisahar (~760 m) on an April–May
 * day, -6.5 °C per 1,000 m (standard lapse rate). Modelled from altitude, not measured.
 */
export const STORY_TEMPERATURE = TEMPERATURE_MODEL;

/** Modelled °C at an altitude, rounded to whole degrees. */
export function modelledTempC(altM: number): number {
  return Math.round(modelledTempExact(altM));
}

/** The altitude (m) where the model crosses 0 °C (about 4,145 m). */
export const STORY_FREEZE_M = STORY_TEMPERATURE.refM - (STORY_TEMPERATURE.refC / STORY_TEMPERATURE.perKm) * 1000;
