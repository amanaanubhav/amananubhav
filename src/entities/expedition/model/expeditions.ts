// Loaded directly by the build scripts (scripts/terrain, scripts/posters) through Node's built-in
// type stripping: keep this file to erasable TypeScript with `import type` statements only
// (no runtime imports, no enums, no namespaces, no parameter properties).
import type { Expedition, ExpeditionId, ExpeditionStats, Peak, SideTrip, TemperatureModel, Waypoint } from './types';

// ------------------------------------------------------------------ Annapurna
// April–May 2026, 14 days: 12 recorded days plus two rest days at Mungji (Days 6 and 8). The route is rebuilt
// from his recorded days along mapped trails (no GPX yet, Q-100); Syange to Tal was by road, not walked.
// Altitudes are the site's or commonly cited figures, approximate (~), never raw terrain samples; Mungji has
// none until Aman confirms one. Positions come from OpenStreetMap place nodes, for drawing only (never printed).

const BESISAHAR: Waypoint = { name: 'Besisahar', kind: 'trailhead', stop: 'landmark', day: 1, altitudeM: 760, approx: true, lat: 28.2313, lon: 84.3761, source: 'commonly-cited' };
const KHUDI: Waypoint = { name: 'Khudi', kind: 'village', stop: 'pass-through', day: 1, altitudeM: 790, approx: true, lat: 28.281, lon: 84.3576, source: 'commonly-cited' };
const BHULBHULE: Waypoint = { name: 'Bhulbhule', kind: 'village', stop: 'pass-through', day: 1, altitudeM: 840, approx: true, lat: 28.2903, lon: 84.3716, source: 'commonly-cited' };
const NGADI: Waypoint = { name: 'Ngadi', kind: 'camp', stop: 'stay', day: 1, nights: 1, altitudeM: 930, approx: true, lat: 28.3146, lon: 84.4019, source: 'commonly-cited' };
const BAHUNDANDA: Waypoint = { name: 'Bahundanda', kind: 'village', stop: 'pass-through', day: 2, altitudeM: 1310, approx: true, lat: 28.3431, lon: 84.4063, source: 'commonly-cited' };
const SYANGE: Waypoint = { name: 'Syange', kind: 'camp', stop: 'stay', day: 2, nights: 1, altitudeM: 1100, approx: true, lat: 28.3873, lon: 84.4021, source: 'commonly-cited' };
/** Reached by road from Syange (the route's jeep stretch, drawn as not walked). */
const TAL: Waypoint = { name: 'Tal', kind: 'village', stop: 'pass-through', day: 3, altitudeM: 1700, approx: true, lat: 28.4686, lon: 84.3737, source: 'commonly-cited' };
const DHARAPANI: Waypoint = { name: 'Dharapani', kind: 'village', stop: 'pass-through', day: 3, altitudeM: 1860, approx: true, lat: 28.519, lon: 84.3584, source: 'commonly-cited' };
const DANAGYU: Waypoint = { name: 'Danagyu', kind: 'village', stop: 'pass-through', day: 3, altitudeM: 2300, approx: true, lat: 28.5331, lon: 84.325, source: 'commonly-cited' };
const TIMANG: Waypoint = { name: 'Timang', kind: 'camp', stop: 'stay', day: 3, nights: 1, altitudeM: 2750, approx: true, lat: 28.5271, lon: 84.3049, source: 'commonly-cited' };
const KOTO: Waypoint = { name: 'Koto', kind: 'village', stop: 'pass-through', day: 4, altitudeM: 2600, approx: true, lat: 28.5522, lon: 84.2593, source: 'commonly-cited' };
const CHAME: Waypoint = { name: 'Chame', kind: 'village', stop: 'pass-through', day: 4, altitudeM: 2670, approx: true, lat: 28.5507, lon: 84.2424, source: 'commonly-cited' };
const BHRATANG: Waypoint = { name: 'Bhratang', kind: 'village', stop: 'pass-through', day: 4, altitudeM: 2850, approx: true, lat: 28.5728, lon: 84.1904, source: 'commonly-cited' };
const DHIKUR_POKHARI: Waypoint = { name: 'Dhikur Pokhari', kind: 'camp', stop: 'stay', day: 4, nights: 1, altitudeM: 3060, approx: true, lat: 28.6023, lon: 84.1794, source: 'commonly-cited' };
/** Lower Pisang: his line took the lower route, not Ghyaru and Ngawal. */
const PISANG: Waypoint = { name: 'Pisang', kind: 'village', stop: 'pass-through', day: 5, altitudeM: 3200, approx: true, lat: 28.6154, lon: 84.1475, source: 'commonly-cited' };
const HUMDE: Waypoint = { name: 'Humde', kind: 'village', stop: 'pass-through', day: 5, altitudeM: 3330, approx: true, lat: 28.6382, lon: 84.0905, source: 'commonly-cited' };
/** His base for four nights (Days 5 to 8): Blue, Green and Ice Lake start here. No altitude until confirmed. */
const MUNGJI: Waypoint = { name: 'Mungji', kind: 'camp', stop: 'stay', day: 5, nights: 4, lat: 28.6492, lon: 84.0535, source: 'estimate', confirm: 'Q-52' };
const BRAKA: Waypoint = { name: 'Braka', kind: 'village', stop: 'pass-through', day: 9, altitudeM: 3450, approx: true, lat: 28.6572, lon: 84.0399, source: 'commonly-cited' };
const MANANG: Waypoint = { name: 'Manang', kind: 'village', stop: 'landmark', day: 9, altitudeM: 3540, approx: true, lat: 28.6661, lon: 84.0231, source: 'commonly-cited' };
/** Passed on Day 9 on the way up; the Day 11 night on the way back down from Shri Kharka. */
const KHANGSAR: Waypoint = { name: 'Khangsar', kind: 'camp', stop: 'stay', day: 9, nights: 1, altitudeM: 3730, approx: true, lat: 28.6697, lon: 83.9734, source: 'commonly-cited' };
/** Two nights (Days 9 and 10): Tilicho Lake goes out and back from here. */
const SHRI_KHARKA: Waypoint = { name: 'Shri Kharka', kind: 'camp', stop: 'stay', day: 9, nights: 2, altitudeM: 4060, approx: true, lat: 28.6804, lon: 83.9532, source: 'commonly-cited' };
const YAK_KHARKA: Waypoint = { name: 'Yak Kharka', kind: 'village', stop: 'pass-through', day: 12, altitudeM: 4050, approx: true, lat: 28.7227, lon: 83.9738, source: 'commonly-cited' };
const CHURI_LEDAR: Waypoint = { name: 'Churi Ledar', kind: 'camp', stop: 'stay', day: 12, nights: 1, altitudeM: 4200, approx: true, lat: 28.739, lon: 83.9731, source: 'commonly-cited' };
const THORONG_PHEDI: Waypoint = { name: 'Thorong Phedi', kind: 'village', stop: 'pass-through', day: 13, altitudeM: 4450, approx: true, lat: 28.7768, lon: 83.9726, source: 'commonly-cited' };
const THORONG_HIGH_CAMP: Waypoint = { name: 'Thorong High Camp', kind: 'camp', stop: 'stay', day: 13, nights: 1, altitudeM: 4880, approx: true, lat: 28.7829, lon: 83.9675, source: 'commonly-cited' };
const THORONG_LA: Waypoint = { name: 'Thorong La', kind: 'pass', stop: 'landmark', day: 14, altitudeM: 5416, lat: 28.7935, lon: 83.9388, source: 'commonly-cited' };
/** Named in the day line and the route list only; never placed on a map (no position). */
const CHONGUR: Waypoint = { name: 'Chongur', kind: 'village', stop: 'named-only', day: 14, source: 'estimate' };
/** The day ended at Ranipauwa, the village by the Muktinath temple. */
const MUKTINATH: Waypoint = { name: 'Muktinath', kind: 'village', stop: 'stay', day: 14, nights: 1, altitudeM: 3760, approx: true, lat: 28.8162, lon: 83.8646, source: 'commonly-cited' };

// Side-trip places. Blue Lake and Green Lake carry his names at approximate positions and no altitude until he
// confirms which lakes they are (rest-day walks from Mungji, not recorded).
const BLUE_LAKE: Waypoint = {
  name: 'Blue Lake', kind: 'lake', stop: 'landmark', day: 6, lat: 28.6453, lon: 84.0654, positionApprox: true,
  sideTrip: true, source: 'estimate', confirm: 'Q-52',
};
const GREEN_LAKE: Waypoint = {
  name: 'Green Lake', kind: 'lake', stop: 'landmark', day: 6, lat: 28.6641, lon: 84.0184, positionApprox: true,
  sideTrip: true, source: 'estimate', confirm: 'Q-52',
};
/** The terrain agrees with the commonly cited ~4,600 m; not printed until Aman confirms it. */
const ICE_LAKE: Waypoint = {
  name: 'Ice Lake', altName: 'Kicho Tal', kind: 'lake', stop: 'landmark', day: 7, altitudeM: 4600, approx: true,
  showAltitude: false, lat: 28.6799, lon: 84.0613, sideTrip: true, source: 'commonly-cited', confirm: 'Q-52',
};
const TILICHO_BASE_CAMP: Waypoint = {
  name: 'Tilicho Base Camp', kind: 'village', stop: 'pass-through', day: 10, altitudeM: 4150, approx: true,
  lat: 28.6802, lon: 83.9069, sideTrip: true, source: 'commonly-cited',
};
const TILICHO_LAKE: Waypoint = {
  name: 'Tilicho Lake', kind: 'lake', stop: 'landmark', day: 10, altitudeM: 4919, approx: true, lat: 28.6901, lon: 83.853,
  sideTrip: true, source: 'bio',
};

/**
 * The main Annapurna Circuit waypoints, in walking order (no side trips). Shri Kharka is on the main line (Day 9
 * up from Khangsar, Day 11 back down to it, then the Yak Kharka trail that skips Manang). Chongur has no
 * position, so map code skips it (filter on lat/lon).
 */
export const ANNAPURNA_ROUTE: readonly Waypoint[] = [
  BESISAHAR, KHUDI, BHULBHULE, NGADI, BAHUNDANDA, SYANGE, TAL, DHARAPANI, DANAGYU, TIMANG, KOTO, CHAME, BHRATANG,
  DHIKUR_POKHARI, PISANG, HUMDE, MUNGJI, BRAKA, MANANG, KHANGSAR, SHRI_KHARKA, YAK_KHARKA, CHURI_LEDAR,
  THORONG_PHEDI, THORONG_HIGH_CAMP, THORONG_LA, CHONGUR, MUKTINATH,
];

/** The four side trips as named branches, in the order he walked them, each out and back from its branch point. */
export const ANNAPURNA_SIDE_TRIP_LIST: readonly SideTrip[] = [
  { id: 'blue-lake', name: 'Blue Lake', order: 1, day: 6, from: 'mungji', waypoints: [MUNGJI, BLUE_LAKE], confirm: 'Q-52' },
  { id: 'green-lake', name: 'Green Lake', order: 2, day: 6, from: 'mungji', waypoints: [MUNGJI, GREEN_LAKE], confirm: 'Q-52' },
  { id: 'ice-lake', name: 'Ice Lake', order: 3, day: 7, from: 'mungji', waypoints: [MUNGJI, BRAKA, ICE_LAKE] },
  { id: 'tilicho-lake', name: 'Tilicho Lake', order: 4, day: 10, from: 'shri-kharka', waypoints: [SHRI_KHARKA, TILICHO_BASE_CAMP, TILICHO_LAKE] },
];

/** The side trips as waypoint lines (branch point first), same order: Blue, Green, Ice, Tilicho. */
export const ANNAPURNA_SIDE_TRIPS: readonly (readonly Waypoint[])[] = ANNAPURNA_SIDE_TRIP_LIST.map((trip) => trip.waypoints);

/** Peaks named on the home story map (commonly cited altitudes, approximate; positions for drawing only). */
export const ANNAPURNA_PEAKS: readonly Peak[] = [
  { id: 'annapurna-i', name: 'Annapurna I', altitudeM: 8091, approx: true, lat: 28.5958, lon: 83.8199 },
  { id: 'annapurna-ii', name: 'Annapurna II', altitudeM: 7937, approx: true, lat: 28.535, lon: 84.1218 },
  { id: 'annapurna-iii', name: 'Annapurna III', altitudeM: 7555, approx: true, lat: 28.5854, lon: 83.9891 },
  { id: 'annapurna-iv', name: 'Annapurna IV', altitudeM: 7525, approx: true, lat: 28.5369, lon: 84.0836 },
  { id: 'gangapurna', name: 'Gangapurna', altitudeM: 7455, approx: true, lat: 28.6057, lon: 83.9635 },
  { id: 'tilicho-peak', name: 'Tilicho Peak', altitudeM: 7134, approx: true, lat: 28.6829, lon: 83.8115 },
  { id: 'pisang-peak', name: 'Pisang Peak', altitudeM: 6091, approx: true, lat: 28.6487, lon: 84.1881 },
  { id: 'thorong-peak', name: 'Thorong Peak', altitudeM: 6144, approx: true, lat: 28.782, lon: 83.9269 },
];

/** Modelled, not measured: about +22 °C at Besisahar on an April–May day, −6.5 °C per 1,000 m. */
export const TEMPERATURE_MODEL: TemperatureModel = {
  refM: 760, refName: 'Besisahar', refC: 22, perKm: -6.5, season: 'April–May', approx: true,
};

/** Modelled air temperature in °C (unrounded) at an altitude. */
export function modelledTempC(altitudeM: number, model: TemperatureModel = TEMPERATURE_MODEL): number {
  return model.refC + ((altitudeM - model.refM) / 1000) * model.perKm;
}

/** Every Annapurna place in walking order, side trips inserted where he walked them. */
const ANNAPURNA_WAYPOINTS: readonly Waypoint[] = [
  BESISAHAR, KHUDI, BHULBHULE, NGADI, BAHUNDANDA, SYANGE, TAL, DHARAPANI, DANAGYU, TIMANG, KOTO, CHAME, BHRATANG,
  DHIKUR_POKHARI, PISANG, HUMDE, MUNGJI, BLUE_LAKE, GREEN_LAKE, ICE_LAKE, BRAKA, MANANG, KHANGSAR, SHRI_KHARKA,
  TILICHO_BASE_CAMP, TILICHO_LAKE, YAK_KHARKA, CHURI_LEDAR, THORONG_PHEDI, THORONG_HIGH_CAMP, THORONG_LA, CHONGUR,
  MUKTINATH,
];

// ---------------------------------------------------------------- expeditions

/** [S-EXP-INDEX]. Every expedition carries a trailhead; status 'upcoming' never has dates (Q-48). */
export const EXPEDITIONS: readonly Expedition[] = [
  {
    id: 'annapurna',
    name: 'Annapurna Circuit, with Ice Lake and Tilicho Lake',
    shortName: 'Annapurna Circuit',
    region: 'Manang and Mustang',
    country: 'Nepal',
    // Month and year only, never daily dates (Q-48); 12 recorded days plus two rest days.
    when: 'April–May 2026',
    year: 2026,
    mode: 'solo',
    selfSupported: true,
    days: 14,
    // The site's figure, kept until Aman says which total to show (the rebuilt walk measures about 143 km).
    distanceKm: 250,
    packKg: 18,
    highPoint: { name: 'Thorong La', altitudeM: 5416 },
    status: 'done',
    storyId: 'annapurna-circuit-solo',
    trailhead: { lat: 28.23, lon: 84.38 },
    waypoints: ANNAPURNA_WAYPOINTS,
  },
  {
    id: 'kun-tso',
    name: 'Kun Tso winter climb',
    shortName: 'Kun Tso',
    region: 'North Sikkim',
    country: 'India',
    // Q-51 interim; mode stays hidden until Q-51
    when: 'Nov 2025',
    year: 2025,
    highPoint: { name: 'Kun Tso', altitudeM: 5000 },
    status: 'done',
    storyId: 'kun-tso-winter-climb',
    trailhead: { lat: 27.92, lon: 88.74 },
    waypoints: [
      { name: 'Zero Point, Yumesamdong', kind: 'trailhead', altitudeM: 4600, lat: 27.92, lon: 88.74, source: 'bio' },
      // No coordinates until a GPX arrives (Q-100): drawn only in the profile.
      { name: 'Kun Tso', kind: 'lake', altitudeM: 5000, source: 'bio', confirm: 'Q-100' },
    ],
  },
  {
    id: 'chandrashila',
    name: 'Deoriatal, Rohini Bugyal, Chopta, Chandrashila',
    shortName: 'Chandrashila',
    region: 'Rudraprayag, Uttarakhand',
    country: 'India',
    when: '2026',
    year: 2026,
    mode: 'solo',
    // The deck's 3,690 m is Tungnath; the summit is commonly cited at about 4,000 m (Q-54, Q-103).
    highPoint: { name: 'Chandrashila', altitudeM: 4000, approx: true, confirm: 'Q-54' },
    status: 'done',
    // The story stays in DRAFT_STORIES until Q-54 is answered, so no storyId yet.
    trailhead: { lat: 30.52, lon: 79.13 },
    waypoints: [
      { name: 'Deoriatal', kind: 'lake', altitudeM: 2438, approx: true, lat: 30.52, lon: 79.13, source: 'commonly-cited' },
      { name: 'Rohini Bugyal', kind: 'camp', lat: 30.5, lon: 79.17, source: 'estimate' },
      { name: 'Chopta', kind: 'village', altitudeM: 2680, approx: true, lat: 30.49, lon: 79.21, source: 'commonly-cited' },
      { name: 'Tungnath', kind: 'village', altitudeM: 3680, approx: true, lat: 30.49, lon: 79.22, source: 'commonly-cited', confirm: 'Q-54' },
      { name: 'Chandrashila', kind: 'summit', altitudeM: 4000, approx: true, lat: 30.49, lon: 79.22, source: 'commonly-cited', confirm: 'Q-54' },
    ],
  },
  {
    id: 'triund',
    name: 'Triund',
    shortName: 'Triund',
    region: 'Kangra, Himachal Pradesh',
    country: 'India',
    highPoint: { name: 'Triund', altitudeM: 2850, approx: true, confirm: 'Q-55' },
    status: 'done',
    trailhead: { lat: 32.26, lon: 76.35 },
    waypoints: [
      { name: 'Triund', kind: 'summit', altitudeM: 2850, approx: true, source: 'commonly-cited', confirm: 'Q-55' },
    ],
  },
  {
    id: 'kheerganga',
    name: 'Kheerganga',
    shortName: 'Kheerganga',
    region: 'Parvati Valley, Himachal Pradesh',
    country: 'India',
    highPoint: { name: 'Kheerganga', altitudeM: 2950, approx: true, confirm: 'Q-55' },
    status: 'done',
    trailhead: { lat: 32.0, lon: 77.5 },
    waypoints: [
      { name: 'Kheerganga', kind: 'summit', altitudeM: 2950, approx: true, source: 'commonly-cited', confirm: 'Q-55' },
    ],
  },
  {
    id: 'yulla-kanda',
    name: 'Yulla Kanda',
    shortName: 'Yulla Kanda',
    region: 'Kinnaur, Himachal Pradesh',
    country: 'India',
    highPoint: { name: 'Yulla Kanda', altitudeM: 3900, approx: true, confirm: 'Q-55' },
    status: 'done',
    // Trailhead coordinates are an estimate.
    trailhead: { lat: 31.53, lon: 78.2 },
    waypoints: [
      { name: 'Yulla Kanda', kind: 'lake', altitudeM: 3900, approx: true, source: 'commonly-cited', confirm: 'Q-55' },
    ],
  },
  {
    id: 'dodital',
    name: 'Dodital and Darwa Top',
    shortName: 'Dodital',
    region: 'Uttarkashi, Uttarakhand',
    country: 'India',
    // No dates before the trip (Q-48).
    highPoint: { name: 'Darwa Top', altitudeM: 4100, approx: true, confirm: 'Q-46' },
    status: 'upcoming',
    trailhead: { lat: 30.8, lon: 78.48 },
    // All coordinates are estimates, for drawing only.
    waypoints: [
      { name: 'Trailhead', kind: 'trailhead', lat: 30.8, lon: 78.48, source: 'estimate' },
      { name: 'Dodital', kind: 'lake', lat: 30.87, lon: 78.53, source: 'estimate', confirm: 'Q-46' },
      { name: 'Darwa Top', kind: 'summit', altitudeM: 4100, approx: true, lat: 30.92, lon: 78.55, source: 'commonly-cited', confirm: 'Q-46' },
    ],
  },
];

// -------------------------------------------------------------------- helpers

/** Literal ids always resolve; arbitrary strings (e.g. `story.expeditionId`) may not. */
export function getExpedition(id: ExpeditionId): Expedition;
export function getExpedition(id: string): Expedition | undefined;
export function getExpedition(id: string): Expedition | undefined {
  return EXPEDITIONS.find((exp) => exp.id === id);
}

/** Waypoint lookup by name (exact first, then case-insensitive, also by the full label "Ice Lake (Kicho Tal)"). */
export function getWaypoint(exp: Expedition, name: string): Waypoint | undefined {
  const exact = exp.waypoints.find((wp) => wp.name === name);
  if (exact) return exact;
  const lower = name.toLowerCase();
  return exp.waypoints.find((wp) => wp.name.toLowerCase() === lower || waypointLabel(wp).toLowerCase() === lower);
}

/** "Ice Lake (Kicho Tal)" when the place has a second name, else the name. */
export function waypointLabel(wp: Pick<Waypoint, 'name' | 'altName'>): string {
  return wp.altName ? `${wp.name} (${wp.altName})` : wp.name;
}

/** Counters computed from finished treks only (§A.4 honesty rule). */
export function getExpeditionStats(list: readonly Expedition[]): ExpeditionStats {
  const done = list.filter((exp) => exp.status === 'done');
  let highestM = 0;
  let highestName = '';
  let longestKm: number | undefined;
  let heaviestPackKg: number | undefined;
  for (const exp of done) {
    const alt = exp.highPoint.altitudeM;
    if (alt !== undefined && alt > highestM) {
      highestM = alt;
      highestName = exp.highPoint.name;
    }
    if (exp.distanceKm !== undefined && (longestKm === undefined || exp.distanceKm > longestKm)) {
      longestKm = exp.distanceKm;
    }
    if (exp.packKg !== undefined && (heaviestPackKg === undefined || exp.packKg > heaviestPackKg)) {
      heaviestPackKg = exp.packKg;
    }
  }
  return { highestM, highestName, longestKm, heaviestPackKg, treksLogged: done.length };
}

const ALTITUDE_FORMAT = new Intl.NumberFormat('en');

/** '5,416 m', or '~4,919 m' when approximate. */
export function formatAltitude(m: number, approx?: boolean): string {
  return `${approx ? '~' : ''}${ALTITUDE_FORMAT.format(m)} m`;
}
