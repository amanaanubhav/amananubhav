// Loaded directly by the build scripts (scripts/terrain, scripts/posters) through Node's built-in
// type stripping: keep this file to erasable TypeScript with `import type` statements only
// (no runtime imports, no enums, no namespaces, no parameter properties).
import type { Expedition, ExpeditionId, ExpeditionStats, Waypoint } from './types';

// ------------------------------------------------------------------ Annapurna
// Altitudes are commonly cited public figures, not GPS readings (Q-41); coordinates are
// approximate, for drawing only.

const BESISAHAR: Waypoint = { name: 'Besisahar', kind: 'trailhead', altitudeM: 760, approx: true, lat: 28.23, lon: 84.38, source: 'commonly-cited' };
const KHUDI: Waypoint = { name: 'Khudi', kind: 'camp', altitudeM: 790, approx: true, lat: 28.28, lon: 84.36, source: 'commonly-cited' };
const DHARAPANI: Waypoint = { name: 'Dharapani', kind: 'camp', altitudeM: 1860, approx: true, lat: 28.53, lon: 84.36, source: 'commonly-cited' };
const CHAME: Waypoint = { name: 'Chame', kind: 'camp', altitudeM: 2670, approx: true, lat: 28.55, lon: 84.24, source: 'commonly-cited' };
const PISANG: Waypoint = { name: 'Pisang', kind: 'village', altitudeM: 3200, approx: true, lat: 28.61, lon: 84.15, source: 'commonly-cited', confirm: 'Q-52' };
const MANANG: Waypoint = { name: 'Manang', kind: 'village', altitudeM: 3540, approx: true, lat: 28.67, lon: 84.02, source: 'commonly-cited' };
const ICE_LAKE: Waypoint = {
  name: 'Ice Lake', kind: 'lake', altitudeM: 4600, approx: true, showAltitude: false, lat: 28.69, lon: 84.03,
  sideTrip: true, source: 'commonly-cited', confirm: 'Q-52',
};
const TILICHO_LAKE: Waypoint = {
  name: 'Tilicho Lake', kind: 'lake', altitudeM: 4919, approx: true, lat: 28.68, lon: 83.85, sideTrip: true, source: 'bio',
};
const THORONG_PHEDI: Waypoint = { name: 'Thorong Phedi', kind: 'camp', altitudeM: 4450, approx: true, lat: 28.77, lon: 83.96, source: 'commonly-cited', confirm: 'Q-52' };
const THORONG_LA: Waypoint = { name: 'Thorong La', kind: 'pass', altitudeM: 5416, lat: 28.79, lon: 83.94, source: 'commonly-cited' };
const MUKTINATH: Waypoint = { name: 'Muktinath', kind: 'village', altitudeM: 3760, approx: true, lat: 28.82, lon: 83.87, source: 'commonly-cited' };

/** The main Annapurna Circuit waypoints, in walking order (no side trips). */
export const ANNAPURNA_ROUTE: readonly Waypoint[] = [
  BESISAHAR, KHUDI, DHARAPANI, CHAME, PISANG, MANANG, THORONG_PHEDI, THORONG_LA, MUKTINATH,
];

/** The two side trips from Manang, each starting at Manang: Ice Lake, then Tilicho Lake. */
export const ANNAPURNA_SIDE_TRIPS: readonly (readonly Waypoint[])[] = [
  [MANANG, ICE_LAKE],
  [MANANG, TILICHO_LAKE],
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
    when: '2026',
    year: 2026,
    mode: 'solo',
    selfSupported: true,
    days: 14,
    distanceKm: 250,
    packKg: 18,
    highPoint: { name: 'Thorong La', altitudeM: 5416 },
    status: 'done',
    storyId: 'annapurna-circuit-solo',
    trailhead: { lat: 28.23, lon: 84.38 },
    waypoints: [
      BESISAHAR, KHUDI, DHARAPANI, CHAME, PISANG, MANANG, ICE_LAKE, TILICHO_LAKE, THORONG_PHEDI, THORONG_LA, MUKTINATH,
    ],
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

/** Waypoint lookup by name (exact first, then case-insensitive). */
export function getWaypoint(exp: Expedition, name: string): Waypoint | undefined {
  const exact = exp.waypoints.find((wp) => wp.name === name);
  if (exact) return exact;
  const lower = name.toLowerCase();
  return exp.waypoints.find((wp) => wp.name.toLowerCase() === lower);
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
