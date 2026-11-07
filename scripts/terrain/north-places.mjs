// The cited places of the expected Annapurna North Base Camp route (Route A, the Herzog Trail).
// Dev-only: read by build-heightfield.mjs (the altitude check for `annapurna-north`) and by
// build-north-route.mjs (public/data/routes/anbc-expected.json). Never imported by src/.
//
// Facts come from docs/redesign/next-trek/ROUTE-FACTS.md (research of 2026-11-06). Coordinates are the
// rounded (0.01°) positions given there; altitudes are "commonly cited" figures, never measured ones.
// Sources stay in comments and in the JSON's `comment` field: nothing here is ever rendered as a credit.
//
//   travelnepaltoday        https://travelnepaltoday.com/?p=2508
//   everesttrekkingroutes   https://www.everesttrekkingroutes.com/?p=3025
//   nepaltraveller          https://nepaltraveller.com/news/tourists-throng-to-northern-annapurna-base-camp
//   nepaltrekkingroutes     https://nepaltrekkingroutes.com/blog/trekking-off-the-beaten-path
//   kathmandupost           https://kathmandupost.com/national/2025/06/14/historic-annapurna-i-trail-finds-new-footsteps
//   excellenttrek           (operator page, cited for 4,190 m in ROUTE-FACTS)
//   osm-nominatim           place positions, queried 2026-11-06 (point positions only, no way geometry)
//
// Muktinath to Marpha (ROUTE-FACTS §7, research of 2026-11-07): the Jomsom-Muktinath road (F166) west through
// Jharkot and Khingar down to the Kali Gandaki, where it meets the Kali Gandaki road (NH48) at the south edge of
// Kagbeni; then NH48 south-west through Ekle Bhatti, Jomsom and Syang to Marpha. OSM Overpass was read for that
// topology only (which road joins which, names and refs); no way geometry is used.
//   holymountaintreks       https://www.holymountaintreks.com/jomsom-muktinath-trek/
//   magicalnepal            https://www.magicalnepal.com/blog/marpha-village/
//   wiki-jharkot            https://en.wikipedia.org/wiki/Jharkot
//   wiki-kagbeni            https://en.wikipedia.org/wiki/Kagbeni
//   wiki-jomsom             https://en.wikipedia.org/wiki/Jomsom
//   wikivoyage-jomsom       https://de.wikivoyage.org/wiki/Jomsom
//   wiki-kaligandaki-corridor https://en.wikipedia.org/wiki/Kaligandaki_Corridor

export const NORTH_SOURCES = {
  travelnepaltoday: 'https://travelnepaltoday.com/?p=2508',
  everesttrekkingroutes: 'https://www.everesttrekkingroutes.com/?p=3025',
  nepaltraveller: 'https://nepaltraveller.com/news/tourists-throng-to-northern-annapurna-base-camp',
  nepaltrekkingroutes: 'https://nepaltrekkingroutes.com/blog/trekking-off-the-beaten-path',
  kathmandupost: 'https://kathmandupost.com/national/2025/06/14/historic-annapurna-i-trail-finds-new-footsteps',
  excellenttrek: 'operator page (via ROUTE-FACTS.md)',
  'osm-nominatim': 'OpenStreetMap Nominatim place positions, queried 2026-11-06 and 2026-11-07, rounded to 0.01 deg',
  story: 'src/entities/expedition/model/expeditions.ts (the walked circuit)',
  holymountaintreks: 'https://www.holymountaintreks.com/jomsom-muktinath-trek/',
  magicalnepal: 'https://www.magicalnepal.com/blog/marpha-village/',
  'wiki-jharkot': 'https://en.wikipedia.org/wiki/Jharkot',
  'wiki-kagbeni': 'https://en.wikipedia.org/wiki/Kagbeni',
  'wiki-jomsom': 'https://en.wikipedia.org/wiki/Jomsom',
  'wikivoyage-jomsom': 'https://de.wikivoyage.org/wiki/Jomsom',
  'wiki-kaligandaki-corridor': 'https://en.wikipedia.org/wiki/Kaligandaki_Corridor',
  'osm-overpass':
    'OpenStreetMap Overpass, queried 2026-11-07: road names/refs and the F166-NH48 junction only (topology, no geometry used)',
  'search-summary': 'web search summaries 2026-11-07, sources not opened (used only to flag disagreement)',
};

/**
 * @typedef {{
 *   id: string; name: string;
 *   kind: 'handoff' | 'jeep-start' | 'road' | 'trailhead' | 'camp' | 'goal' | 'summit';
 *   lon: number; lat: number;
 *   altitudeM?: number; altRangeM?: [number, number]; altNote?: string; showAlt?: boolean;
 *   snapCells?: number; located?: boolean; sourceIds: string[]; note?: string;
 * }} NorthPlace
 *
 * `altitudeM` is the commonly cited figure (always approximate). `showAlt` marks the two the owner
 * chose to show (Humkhola and base camp). `snapCells` lets the route builder move a valley-floor town's
 * rounded position to the lowest heightfield sample within that many samples (≈210 m each), so the
 * planned road runs on the valley floor instead of climbing to a rounding error.
 *
 * Kind 'handoff' marks a place on the Muktinath > Marpha leg: the 3D transition draws that leg (it resumes
 * the walked line at Muktinath), the static #next sheet starts at Marpha and leaves these places out.
 */

/** @type {NorthPlace} The circuit's last stop: where the walked story ends and the transition begins. */
export const MUKTINATH = {
  id: 'muktinath', name: 'Muktinath', kind: 'handoff', lon: 83.8646, lat: 28.8162,
  sourceIds: ['story'], note: 'the walked circuit ends here; not part of the planned route',
};

/** @type {NorthPlace[]} The planned jeep ride, one continuous leg (owner decision). */
export const JEEP_STOPS = [
  {
    id: 'marpha', name: 'Marpha', kind: 'jeep-start', lon: 83.69, lat: 28.75,
    altitudeM: 2670, altRangeM: [2650, 2670], snapCells: 3, sourceIds: ['osm-nominatim', 'magicalnepal', 'holymountaintreks'],
    note: 'magicalnepal 2,650-2,670, holymountaintreks 2,660; Wikipedia gives 2,566 (climate station) and 28.79, 83.68 (both outliers, not used)',
  },
  { id: 'kalopani', name: 'Kalopani', kind: 'road', lon: 83.6, lat: 28.64, snapCells: 3, sourceIds: ['osm-nominatim'] },
  { id: 'ghasa', name: 'Ghasa', kind: 'road', lon: 83.64, lat: 28.6, snapCells: 3, sourceIds: ['osm-nominatim'] },
  {
    id: 'tatopani', name: 'Tatopani', kind: 'road', lon: 83.65, lat: 28.5,
    altitudeM: 1190, snapCells: 3, sourceIds: ['osm-nominatim', 'travelnepaltoday', 'nepaltrekkingroutes'],
  },
  {
    id: 'narchyang', name: 'Narchyang', kind: 'road', lon: 83.68, lat: 28.52,
    altitudeM: 2140, altNote: 'one source, "Upper Narchyang"', sourceIds: ['osm-nominatim', 'kathmandupost'],
    note: 'Wikipedia places it at 28.58, 83.74 (probably the ward area); the OSM village node is used',
  },
  {
    id: 'humkhola', name: 'Humkhola', kind: 'trailhead', lon: 83.71, lat: 28.6,
    altitudeM: 2883, altRangeM: [2883, 2890], showAlt: true, snapCells: 3, sourceIds: ['osm-nominatim', 'travelnepaltoday', 'everesttrekkingroutes', 'nepaltraveller'],
    note: 'jeep end and trail start; the OSM feature "Hum khola" may be the stream, not the dam',
  },
];

/** @type {NorthPlace[]} The expected trek on foot (owner decision: camps Sadhi Kharka, Bhusket Mela, Panchakunda Lake). */
export const TREK_STOPS = [
  JEEP_STOPS[JEEP_STOPS.length - 1],
  {
    id: 'sadhi-kharka', name: 'Sadhi Kharka', kind: 'camp', lon: 83.73, lat: 28.6,
    altitudeM: 3160, altRangeM: [3160, 3164], located: false, sourceIds: ['travelnepaltoday'],
    note: 'position interpolated between Humkhola and Bhusket Mela, not located',
  },
  {
    id: 'bhusket-mela', name: 'Bhusket Mela', kind: 'camp', lon: 83.76, lat: 28.62,
    altitudeM: 3651, sourceIds: ['osm-nominatim', 'travelnepaltoday', 'everesttrekkingroutes'],
  },
  {
    id: 'panchakunda', name: 'Panchakunda Lake', kind: 'camp', lon: 83.78, lat: 28.64,
    altitudeM: 4050, sourceIds: ['osm-nominatim', 'travelnepaltoday', 'everesttrekkingroutes'],
  },
  {
    id: 'anbc', name: 'Annapurna I Base Camp (North)', kind: 'goal', lon: 83.79, lat: 28.64,
    altitudeM: 4190, altRangeM: [4050, 4190], showAlt: true,
    sourceIds: ['osm-nominatim', 'travelnepaltoday', 'everesttrekkingroutes', 'excellenttrek', 'nepaltrekkingroutes'],
    note: '4,190 most cited; 4,100 and 4,050 also cited; 4,990 is an outlier and left out',
  },
];

/** @type {NorthPlace} A framing landmark, not a stop. */
export const ANNAPURNA_I = {
  id: 'annapurna-i', name: 'Annapurna I', kind: 'summit', lon: 83.82, lat: 28.6,
  altitudeM: 8091, sourceIds: ['nepaltraveller'], note: 'widely cited 8,091 (nepaltraveller prints 8,071, a typo); position not re-queried',
};

/**
 * @type {NorthPlace[]} Muktinath (the handoff) to Marpha (ROUTE-FACTS §7.2): F166 west and down to the Kagbeni
 * junction, then NH48 south-west along the Kali Gandaki floor. A dog-leg, not a straight hop: a straight line would
 * cut the 4,000-4,500 m ridge between the Jhong Khola and Jomsom. Valley-floor towns snap to the floor; Jharkot and
 * Khingar sit on the road above the Jhong Khola and keep their positions. No distances are printed anywhere (the
 * sources' 13 km Jomsom-Kagbeni and 18 km "Jomsom via Kagbeni and Jharkot" do not reconcile).
 */
export const CORRIDOR_STOPS = [
  MUKTINATH,
  {
    id: 'jharkot', name: 'Jharkot', kind: 'handoff', lon: 83.85, lat: 28.82,
    altitudeM: 3500, altRangeM: [3500, 3550], sourceIds: ['osm-nominatim', 'wiki-jharkot', 'holymountaintreks', 'search-summary'],
    note: '3,519 (Wikipedia), 3,500 (holymountaintreks), 3,550 (French itinerary via search); on F166; Nominatim 28.8177, 83.8497',
  },
  {
    id: 'khingar', name: 'Khingar', kind: 'handoff', lon: 83.83, lat: 28.82,
    altitudeM: 3200, altRangeM: [3200, 3374], altNote: 'disagree: 3,200 vs 3,374 (unopened)',
    sourceIds: ['osm-nominatim', 'holymountaintreks', 'search-summary'],
    note: 'OSM feature is a residential landuse area, not a village node; on F166 above the drop to Kagbeni; Nominatim 28.8202, 83.8289',
  },
  {
    id: 'kagbeni', name: 'Kagbeni', kind: 'handoff', lon: 83.78, lat: 28.84,
    altitudeM: 2800, altRangeM: [2800, 2810], snapCells: 3,
    sourceIds: ['osm-nominatim', 'wiki-kagbeni', 'holymountaintreks', 'wiki-kaligandaki-corridor', 'osm-overpass'],
    note: 'junction: F166 meets NH48 at its south edge (~28.835, 83.785); Wikipedia 2,804, holymountaintreks 2,800, search 2,810',
  },
  {
    id: 'ekle-bhatti', name: 'Ekle Bhatti', kind: 'handoff', lon: 83.77, lat: 28.82,
    altitudeM: 2730, snapCells: 3, sourceIds: ['osm-nominatim', 'holymountaintreks', 'search-summary'],
    note: 'on NH48 between Jomsom and Kagbeni; 2,730 in two itineraries; the heightfield floor here reads ~2,800',
  },
  {
    id: 'jomsom', name: 'Jomsom', kind: 'handoff', lon: 83.73, lat: 28.78,
    altitudeM: 2743, altRangeM: [2700, 2800], snapCells: 3,
    sourceIds: ['osm-nominatim', 'wiki-jomsom', 'wikivoyage-jomsom', 'holymountaintreks'],
    note: 'Wikipedia infobox 2,743 (lead "about 2,700"), Wikivoyage 2,800, holymountaintreks 2,700; NH48 changes name here',
  },
  {
    id: 'syang', name: 'Syang', kind: 'handoff', lon: 83.71, lat: 28.78,
    altNote: 'no cited altitude found', snapCells: 3, sourceIds: ['osm-nominatim', 'magicalnepal'],
    note: 'between Jomsom and Marpha (magicalnepal); the old village sits a little above the road; Nominatim 28.7753, 83.7081',
  },
  JEEP_STOPS[0],
];
