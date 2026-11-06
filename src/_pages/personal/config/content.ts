/**
 * Copy and data for the Life page (§G.2), pulled from the story deck by id
 * (`docs/redesign/content/story-content.md`). `[TBD]` facts are left out; `[CONFIRM]` facts use the deck's interim.
 * Photos are referenced only by media-registry id (§E); nothing here names a file in `public/`.
 */
import type { MediaSlotId } from '@/shared/config';
import type { ExpeditionId } from '@/entities/expedition';

// ── #about: Origin ([S-CH1-ORIGIN], [S-LIFE-PROFILE]) ─────────────────────────────────────────────

export const ORIGIN = {
  title: "I didn't inherit talent. I built it.",
  /** The one-sentence intro under the h1, condensed from paragraphs[0] (Q-F1). */
  statement:
    'On a roof in Sikahar, under the Milky Way, a habit stuck: find a question that is too big, then build something small enough to start answering it.',
  paragraphs: [
    'I was born in Sikahar, a village in Bihar where the nights were dark enough to see the Milky Way from the roof. I spent a lot of evenings up there working out what I was looking at, and the habit stuck: find a question that is too big, then build something small enough to start answering it.',
    "At school that meant rockets, carbon capture and physics papers I had no business attempting. In 2020 I founded DeuxStem, a non-profit that teaches STEM to students who, like me, didn't have a lab down the road. It now reaches students in more than 10 countries. Through our campaigns with the International Astronomical Search Collaboration, a NASA-affiliated citizen-science program, we've reported more than 20 asteroid detections, and the work earned commendations from NASA, the Canadian Space Agency and Germany's DLR.",
    // Q-71 keeps this line until Aman drops it.
    'I used to call myself a "genetically engineered learner", half as a joke. The joke is the point: nothing here was handed down. I learned it, and I still do.',
  ],
  bornIn: 'Sikahar, Bihar',
  /** Never the village's exact coordinates (Q-06). */
  latitude: '25° N',
  /** Q-03 interim. */
  now: 'Bhubaneswar',
  featuredIn: 'Global Indian',
  insetCaption: 'The sky I grew up under: 25° N, January, 21:00 IST',
  insetTitle: 'Winter sky over Bihar',
  insetDesc: 'Star chart of the winter sky at 25° N on a January night at 21:00 IST, seen from the roof where I learned the sky.',
} as const;

/** Second plate row in #about; both render nothing until Aman supplies them. */
export const ORIGIN_OPTIONAL_SLOTS: readonly MediaSlotId[] = ['M-ORIGIN-02', 'M-ORIGIN-04'];

// ── #stem: Early builds ([S-LIFE-STEM], [S-PROJ-*]) ──────────────────────────────────────────────

export type EarlyBuildId = 'schrodinger' | 'pavana' | 'vyomagami' | 'asteroids' | 'rakshak';

export interface EarlyBuild {
  id: EarlyBuildId;
  title: string;
  desc: string;
  tags: readonly string[];
  /** Period, only where the deck gives one. */
  year?: string;
  /** Plate caption; diagrams always say so (§A.4). The blink comparator carries its own caption. */
  plateCaption?: string;
  /** Optional photo shown under the diagram once supplied. */
  photoSlot?: MediaSlotId;
}

/** Not rendered by the redesign (the h2 is the rail label, the statement is `SECTION_STATEMENTS`); kept as his copy. */
export const STEM_INTRO = {
  title: 'Before the job titles.',
  lead: "The questions I couldn't leave alone at school, and what I built to chase them.",
} as const;

export const EARLY_BUILDS: readonly EarlyBuild[] = [
  {
    id: 'schrodinger',
    title: 'Defying the Schrödinger equation',
    desc: "A school-age theory paper on pinning down an electron's position near the nucleus using the Bekenstein bound. Ambitious, unfinished, formative.",
    tags: ['Theoretical physics', 'Bekenstein bound'],
    plateCaption: 'Diagram: an electron probability cloud inside a dotted Bekenstein bound (illustrative).',
  },
  {
    id: 'pavana',
    title: 'PAVANA',
    desc: 'Solar-thermal carbon capture in a cast-iron and copper chamber, projected at $94 to $232 per tonne of CO₂.',
    tags: ['Climate tech', 'Thermodynamics'],
    year: '2020 to present',
    plateCaption: 'Diagram: the chamber in cutaway, with the heat gradient hatched.',
  },
  {
    // Q-44 interim: the balloon-launched concept.
    id: 'vyomagami',
    title: 'VYOMAGAMI',
    desc: 'A launch concept that rides a balloon to about 30 km before lighting the rocket.',
    tags: ['Aerospace', 'Propulsion'],
    plateCaption: 'Diagram: altitude against time, the balloon phase to about 30 km, then the burn.',
  },
  {
    // Wording rule until Q-82: "detections", never "discovered".
    id: 'asteroids',
    title: 'Asteroid search',
    desc: "More than 20 asteroid detections through DeuxStem's campaigns with the NASA-affiliated International Astronomical Search Collaboration, VT60 and UF78 among them.",
    tags: ['Astronomy', 'Citizen science'],
  },
  {
    // No efficiency figure until Q-43.
    id: 'rakshak',
    title: 'RAKSHAK',
    // The award moved out of the sentence into its stamp (BUILD_STAMPS.rakshak).
    desc: 'A bladeless river-flow energy harvester that lets fish pass.',
    tags: ['Clean energy', 'Fluid dynamics'],
    year: '2021 to 2022',
    plateCaption: 'Diagram: flow lines around a bladeless body.',
    photoSlot: 'M-PROJ-RAK-01',
  },
];

// ── #athletics: Discipline ([S-CH5-LIFE], [S-LIFE-DISCIPLINE]) ───────────────────────────────────

/** Not rendered as a block any more; his own words, the source of the Training headings below. */
export const DISCIPLINE_INTRO = {
  title: 'I train for thin air.',
  paragraphs: [
    "The mountains set the standard and the rest of the week trains for it. I lift, run, box and swim; I play football and basketball when there's a team; I climb; and I'm about to start learning to surf. None of it is for show. It's how I keep the engine ready for the next 5,000 m pass.",
    'The other half is slower: long motorcycle rides, coastal drives to Puri, nights out with a camera pointed at the sky, and trips with the two friends who show up for anything, Sahil and Arpit.',
  ],
  logLabel: 'Training log',
  soonLabel: 'Learning soon',
  trekLinkLabel: 'Journal',
  stripLabel: 'Mountain plates',
} as const;

export interface MountainPlate {
  id: string;
  category: string;
  title: string;
  line: string;
  slotId: MediaSlotId;
  /** Spot height read from `entities/expedition` (never hard-coded); omitted for "Behind the lens". */
  spot?: { expedition: ExpeditionId; waypoint: string };
  href: string;
}

/** The mountain slides of [S-LIFE-DISCIPLINE]. Not rendered by the redesign (High points reads the entities); kept as his record. */
export const MOUNTAIN_PLATES: readonly MountainPlate[] = [
  {
    id: 'thorong-la',
    category: 'Solo trekking',
    title: 'Thorong La',
    line: '5,416 m, Annapurna Circuit, 2026.',
    slotId: 'M-EXP-ANN-01',
    spot: { expedition: 'annapurna', waypoint: 'Thorong La' },
    href: '/stories#annapurna',
  },
  {
    id: 'tilicho',
    category: 'Solo trekking',
    title: 'Tilicho Lake',
    line: 'About 4,919 m, one of the highest lakes in the world.',
    slotId: 'M-EXP-ANN-02',
    spot: { expedition: 'annapurna', waypoint: 'Tilicho Lake' },
    href: '/stories#annapurna',
  },
  {
    id: 'kun-tso',
    category: 'Winter climb',
    title: 'Kun Tso',
    line: '5,000 m in North Sikkim, in waist-deep snow.',
    slotId: 'M-EXP-KUN-05',
    spot: { expedition: 'kun-tso', waypoint: 'Kun Tso' },
    href: '/stories#kun-tso',
  },
  {
    // Altitude hidden until Q-52 (the waypoint carries showAltitude: false).
    id: 'ice-lake',
    category: 'Solo trekking',
    title: 'Ice Lake',
    line: 'Acclimatisation climb above Manang.',
    slotId: 'M-EXP-ANN-03',
    spot: { expedition: 'annapurna', waypoint: 'Ice Lake' },
    href: '/stories#annapurna',
  },
  {
    id: 'chandrashila',
    category: 'Solo trekking',
    title: 'Chandrashila',
    line: 'Alone via Deoriatal and Rohini Bugyal.',
    slotId: 'M-EXP-CHA-01',
    spot: { expedition: 'chandrashila', waypoint: 'Chandrashila' },
    href: '/stories#chandrashila',
  },
  {
    id: 'behind-the-lens',
    category: 'Behind the lens',
    title: 'Night skies and video',
    line: 'I film and photograph the trips, and point the camera up when it gets dark.',
    slotId: 'M-LIFE-SKY-01',
    href: '#sky',
  },
];

// ── #sky: Night sky ([S-LIFE-SKY]) ───────────────────────────────────────────────────────────────

/** `title` and `connective` are his deck copy, not rendered now (the h2 is the rail label); kept as the record. */
export const SKY_COPY = {
  title: 'Pointing the camera up.',
  // The deck's [TBD Q-53] sentence (setup, favourite target, best location) stays hidden.
  body: 'The sky over Sikahar started all of this, and I still chase it. On treks and dark-sky nights I shoot the Milky Way and star fields.',
  /** D1 connective line: shown only once Aman approves it (Q-91). */
  connective: {
    approved: false,
    text: "Above the pass the air runs out and the sky goes dark. It's the same sky I counted from a roof in Sikahar.",
  },
  /** Static layout (reduced motion, lite): the poster is a fixed January night, not tonight's sky. */
  staticLegend: 'The sky over Bihar, 25° N, on a January night.',
  posterTitle: 'Night sky over Bihar, looking south',
  posterDesc:
    'The sky over Bihar at 25° N, looking south from the horizon up, on a January night at 21:00 IST. Stars are sized by brightness.',
} as const;

/** The astrophotographs after the track: the largest photo plates on the site. */
export const SKY_PHOTO_SLOTS: readonly MediaSlotId[] = ['M-LIFE-SKY-01', 'M-LIFE-SKY-02', 'M-LIFE-SKY-03', 'M-LIFE-SKY-04'];
/** Optional: render nothing until supplied. */
export const SKY_EXTRA_SLOTS: readonly MediaSlotId[] = ['M-LIFE-SKY-SETUP', 'M-LIFE-SKY-TENT'];

// ── #business: Ventures ([S-VENTURES]) ───────────────────────────────────────────────────────────

export interface VentureLink {
  name: string;
  url: string;
}

export interface Venture {
  id: string;
  title: string;
  role: string;
  years?: string;
  subtitle: string;
  desc: string;
  links: readonly VentureLink[];
  slotId: MediaSlotId;
}

/** Rail label from [S-UI-COPY] until Aman retitles the section (Q-79). */
export const VENTURES_TITLE = 'Ventures';
/** Visually hidden caption of the ventures ledger table (§J.1). */
export const VENTURES_CAPTION = 'Ventures I have started: my role, the years, and what each one is';

export const VENTURES: readonly Venture[] = [
  {
    // Q-17 interim role.
    id: 'trav-story',
    title: 'The Trav Story',
    role: 'Co-founder',
    years: 'Nov 2025 to present',
    subtitle: 'AI travel platform',
    desc: 'Tell it where you want to go and how you like to travel; it proposes the trip and books it. Best Startup Idea at KIIT.',
    links: [
      { name: 'thetravstory.com', url: 'https://www.thetravstory.com' },
      { name: 'Instagram', url: 'https://www.instagram.com/the_travstory/' },
    ],
    slotId: 'M-VEN-01',
  },
  {
    id: 'accolades',
    title: 'Accolades',
    role: 'Founder',
    years: 'Dec 2025 to present',
    subtitle: 'Opportunity search for students',
    desc: 'Grants, fellowships and hackathons in one place, each listed once, found before the deadline.',
    links: [{ name: 'accolades.site', url: 'https://www.accolades.site' }],
    slotId: 'M-VEN-02',
  },
  {
    // Q-30 interim: "2020"; Q-82 and Q-84 interims as the deck.
    id: 'deuxstem',
    title: 'DeuxStem',
    role: 'Founder & CEO',
    years: '2020 to present',
    subtitle: 'Ed-tech non-profit',
    desc: 'STEM workshops and citizen-science campaigns for students outside big cities, in 10+ countries. 2M+ audience, 20+ asteroid detections, commendations from NASA, CSA and DLR.',
    links: [
      { name: 'LinkedIn', url: 'https://in.linkedin.com/company/deuxstem' },
      { name: 'Instagram', url: 'https://www.instagram.com/deuxstem/' },
      { name: 'Google', url: 'https://www.google.com/search?q=deuxstem' },
    ],
    slotId: 'M-VEN-03',
  },
  {
    // Q-83 neutral fallback from [S-PROJ-SEDU]; Q-47 interim figure.
    id: 'sedu',
    title: 'Sedu at MIT LaunchX',
    role: 'Co-founder',
    years: '2022',
    subtitle: 'Full ride, top 8% of applicants',
    desc: 'A game-based health-education startup built with a global cohort at MIT LaunchX; $785 in revenue across 4+ countries.',
    links: [],
    slotId: 'M-VEN-04',
  },
];

// ── #gallery: Field album ([S-LIFE-GALLERY], [S-LIFE-ROAD], [S-LIFE-CIRCLE]) ─────────────────────

export const ALBUM_COPY = {
  title: 'Field album.',
  lead: 'Unfiltered frames from the road and the trail.',
  sheetLabel: 'Contact sheet',
} as const;

/** Contact-sheet order (§G.2). Captions are the registry's drafts until Q-09. */
export const ALBUM_FRAMES: readonly MediaSlotId[] = [
  'M-ALBUM-G1',
  'M-ALBUM-G21',
  'M-ALBUM-G8',
  'M-ALBUM-G5',
  'M-ALBUM-G6',
  'M-ALBUM-GV16',
  'M-ALBUM-G13',
  'M-ALBUM-G14',
  'M-ALBUM-GV10',
  'M-ALBUM-G2',
  'M-ALBUM-G9',
  'M-ALBUM-GV7',
];

export const ROAD_COPY = {
  title: 'Two wheels, open road.',
  // The deck's [TBD Q-59] aside (bike and favourite route) stays hidden.
  body: "When I'm not walking, I'm riding. Long motorcycle trips on open highways, and the drive I repeat most: to the coast at Puri, Odisha, for sea air and a reset.",
} as const;

export const ROAD_PHOTO_SLOTS: readonly MediaSlotId[] = ['M-LIFE-ROAD-01', 'M-LIFE-ROAD-02'];
/** Optional clip: renders nothing until supplied. */
export const ROAD_CLIP_SLOT: MediaSlotId = 'M-LIFE-ROAD-03';

export const CIRCLE_COPY = {
  title: 'The people who say yes.',
  // First names only; Arpit's trips stay hidden until Q-60.
  body: 'Most of my trips are solo, but not all. Sahil has been with me across Sikkim, the Chandaka forest outside Bhubaneswar and Bengal. Every one of those trips is better for it.',
} as const;

/** Hidden until consent (Q-60). The page shows no G5 crop meanwhile (`M-CIRCLE-G5` is in no slot, `usedIn: []`). */
export const CIRCLE_SLOTS: readonly MediaSlotId[] = ['M-LIFE-CIRCLE-01', 'M-LIFE-CIRCLE-02', 'M-LIFE-CIRCLE-03'];

// ── G-10 road sheet data (contract with w1-personal-plates, §F, §K.8) ────────────────────────────

/** Schematic node positions live inside `RoadSheet`; Q-59 adds places. */
export type RoadPlace = 'bhubaneswar' | 'puri' | 'chandaka';

export interface Ride {
  id: string;
  from: RoadPlace;
  to: RoadPlace;
  label: string;
  /** 3 = most frequent, drawn most opaque. */
  frequency: 1 | 2 | 3;
}

/** Until Q-59. */
export const RIDES: readonly Ride[] = [
  { id: 'puri', from: 'bhubaneswar', to: 'puri', label: 'Bhubaneswar to Puri', frequency: 3 },
  { id: 'chandaka', from: 'bhubaneswar', to: 'chandaka', label: 'Bhubaneswar to Chandaka', frequency: 1 },
];

// ═══ Life page redesign (docs/redesign/life/FINAL-DESIGN.md, the reviewed prototype) ═════════════════════════════
// Exact copy for the new layout. Owner questions are marked in comments only: production renders nothing for an open
// question (no tags, no "photo to come" plates). Section headings are the rail labels in `config/sections.ts`.

/** The statement under each section's h2 (§2.1). Origin's is `ORIGIN.statement`; Next on the route has none. */
export const SECTION_STATEMENTS = {
  sky: 'Pointing the camera up. The sky over Sikahar started all of this, and I still chase it.',
  stem: "Before the job titles: the questions I couldn't leave alone at school, and what I built to chase them.",
  // Q-F2: new UI copy over the existing four rows.
  business: 'Four things I started, and where each one stands.',
  athletics: 'I train for thin air. The mountains set the standard and the rest of the week trains for it.',
  gallery: 'Unfiltered frames from the road and the trail.',
} as const;

// ── #about: the title block (§4.1) ──────────────────────────────────────────────────────────────────────────────────

/** The facts row. The latitude fact is gone (P1-9): the readout and the route carry 25° N. */
export const ORIGIN_FACTS = {
  bornInKey: 'born in',
  // Q-03 interim value (`ORIGIN.now`).
  nowKey: 'now',
  featuredInKey: 'featured in',
  /** Accessible name of the Global Indian link (`PROFILE.links.news`). */
  featuredInLinkName: 'Global Indian cover story (opens in a new tab)',
} as const;

/**
 * The live Sikahar readout (`SikaharReadout`): "{time} IST in Sikahar. {phase line}". Phase from the Sun's altitude at
 * 25° N 85° E (`@/shared/lib/astro` `readSun`): night below −18°, twilight to −0.833°, day above. Not a live region.
 */
export const SIKAHAR_READOUT = {
  zone: 'IST',
  /** After the time and zone: "21:40 IST in Sikahar." */
  inPlace: 'in Sikahar.',
  night: 'Night: the sky is dark.',
  twilight: 'Twilight: the first stars are showing.',
  /** Followed by the sunset time in Plex Mono and a full stop: "Daylight; sunset at 17:22." */
  dayBeforeSunset: 'Daylight; sunset at ',
  /** Phones show the short phase word instead of the line. */
  short: { night: 'Night.', twilight: 'Twilight.', day: 'Daylight.' },
  link: 'Look up',
  /** In daylight the link also scrubs the sky to sunset + 1 h. */
  dayLink: "See tonight's sky",
  /** Server render and no JS: no time, so hydration never mismatches. */
  serverLine: 'Sikahar, 25° N · IST',
  /** The link lands on the sky plate, with the sky's heading focused (fix 19). */
  href: '#sky-live',
} as const;

/** "Read the long version" (§4.1.3): ORIGIN.paragraphs and the winter chart inside a `hidden="until-found"` region. */
export const LONG_VERSION = {
  button: 'Read the long version',
  /** "· 1 min": minutes from the word count of ORIGIN.paragraphs at about 200 words a minute, at least 1. */
  minutes: (n: number) => `· ${n} min`,
  /** Sets the sky to Sikahar, 15 Jan, 21:00 IST (SKY_PRESET) and lands on #sky-live. */
  openThisSky: 'Open this sky',
} as const;

/** The route map under the title block: its rows come from PERSONAL_SECTIONS (teaser, tag, routeHref). */
export const ROUTE_MAP = {
  /** `nav aria-label` (the rail's is "On this page"). */
  navLabel: 'Page route',
  /** Visually hidden h2 of the route map. */
  heading: 'On this page',
} as const;

// ── #sky: the live sky (§4.2, SKY-SPEC) ─────────────────────────────────────────────────────────────────────────────

/** Moment of the winter chart (`ORIGIN.insetCaption`): 15 Jan of the current year, 21:00 IST at Sikahar, facing south. */
export const SKY_PRESET = { month: 1, day: 15, hour: 21, minute: 0, timeZone: 'Asia/Kolkata' } as const;

/** Every UI string of the sky section. Engine-made text (card facts, the summary sentence) stays in the engine. */
export const SKY_UI = {
  sheetEdge: ['Sky', '25° N'],
  canvasLabel: (place: string) => `Interactive sky over ${place}`,
  canvasRoleDescription: 'interactive sky',
  hereLabel: 'where you are',
  keysLine:
    'Arrow keys look around, plus and minus zoom, N E S W face a direction, Enter names what is in the middle, Escape clears it.',
  placeLabel: 'Place',
  // Q-SKY-2: Thorong La and Chandrashila as places; Q-SKY-3: control copy and the "Sikahar" label.
  places: {
    sikahar: { segment: 'Sikahar', option: 'Sikahar, 25° N' },
    thorong: { segment: 'Thorong La', option: 'Thorong La' },
    chandrashila: { segment: 'Chandrashila', option: 'Chandrashila' },
    you: { segment: 'Where you are', option: 'Where you are' },
  },
  hint: { fine: 'Drag to look around · click a star', coarse: 'Swipe sideways to turn · tap a star' },
  zoomHint: 'Hold Ctrl (⌘) and scroll to zoom',
  location: {
    asking: 'Asking for your location…',
    denied: 'Location was not shared, staying at Sikahar',
    unavailable: 'Location is not available here, staying at Sikahar',
    /** Announced (not shown) once the sky moves to the visitor's own place. */
    here: 'Showing the sky over where you are',
  },
  controlsLabel: 'Sky controls',
  where: 'Where',
  when: 'When',
  show: 'Show',
  view: 'View',
  whenNow: 'now',
  sunset: 'sunset ',
  sunrise: 'sunrise ',
  /** Range `aria-valuetext` is "21:40", plus this while live. */
  valueNowSuffix: ', now',
  preset: { title: 'The sky I grew up under', sub: '15 Jan · 21:00' },
  tonight: { title: 'See tonight', sub: 'sunset + 1 h' },
  live: 'Live',
  lines: 'Lines',
  names: 'Names',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  faceSouth: 'Face south',
  keysButton: 'Keyboard keys',
  keysTitle: 'Keys for the sky',
  keys: [
    ['← ↑ → ↓', 'Look around'],
    ['+ −', 'Zoom in and out'],
    ['N E S W', 'Face a direction'],
    ['0 or Home', 'Face south again'],
    ['Enter', 'Name what is in the middle'],
    ['Esc', 'Clear the selection'],
    ['Ctrl + scroll', 'Zoom with the mouse'],
  ],
  pointUp: 'Point your phone up',
  pointUpCaption: 'Hold your phone up and the sky follows.',
  lookAround: 'Look around, full screen',
  openFull: 'Open the sky full screen',
  sideLabel: 'About the sky right now',
  card: {
    selected: 'Selected',
    empty: 'Click a star, a planet or a constellation, or pick one below.',
    centre: 'Centre it',
    more: 'More',
    less: 'Less',
    close: 'Close',
  },
  upNow: 'Up now',
  constellations: 'Constellations',
  daySummary: 'The Sun is up, so only the Moon and the brightest planets show.',
  showAll: (n: number) => `Show all ${n}`,
  find: 'Find',
  findPlaceholder: 'A star, planet or constellation',
  findNone: 'Nothing by that name. Try a star like Sirius, a planet or a constellation like Orion.',
  /** Spoken by Find's status line (the list itself is not a live region). */
  findStatus: (count: number, first: string) => (count === 1 ? `1 match: ${first}` : `${count} matches, first ${first}`),
  table: {
    button: 'Read the sky as a table',
    caption: 'What is up now',
    headers: ['Name', 'Kind', 'Height', 'Direction', 'Brightness', 'Rises and sets'],
  },
  /** A privacy notice, not a credit: the d3-celestial BSD-3 notice lives only in source comments. */
  source: 'Your location, if you share it, stays in this page and is never stored or sent.',
  // Q-FIX-2: copy of the phone controls and the full-screen dialog titles.
  full: {
    done: 'Done',
    modeSky: 'The sky',
    modePointing: 'Pointing',
    middle: 'In the middle:',
    nothingYet: 'nothing named yet.',
    note: 'Drag to look anywhere, pinch to zoom, tap a star.',
    follow: 'Follow my phone',
    holdUp: 'Hold your phone up to the sky.',
    noCompass: 'North is approximate: this phone reports no compass.',
    calibrate: 'Move your phone in a figure 8 to calibrate the compass.',
    dragOff: 'Pointing is off while you drag. Tap Follow my phone to point again.',
    declined: 'Motion access was declined. Drag instead.',
    unavailable: "Pointing isn't available here. Drag instead.",
  },
} as const;

// ── #stem: the light table (§4.3) ───────────────────────────────────────────────────────────────────────────────────

/** Q-F3: what to watch in each diagram (wording about the diagram, no facts about Aman). Shown after WATCH_LABEL. */
export const WATCH_LABEL = 'Watch:';
export const WATCH_LINES: Readonly<Record<EarlyBuildId, string>> = {
  schrodinger: 'the dots gather where the electron is most likely to be, inside the dotted bound.',
  pavana: 'follow the air in through the baffles and out of the hot chamber.',
  vyomagami: 'the balloon does the slow climb; the rocket lights only above about 30 km.',
  asteroids: 'blink the frames. The stars stay put; the asteroid jumps.',
  rakshak: 'the flow sheds vortices that sway the column, and the fish passes with no blades in the way.',
};

/** The phone chip index (`nav aria-label="Builds"`), each article's stretched button name, and Draw again. */
export const BUILD_NAV = {
  label: 'Builds',
  chips: {
    schrodinger: 'Schrödinger',
    pavana: 'PAVANA',
    vyomagami: 'VYOMAGAMI',
    asteroids: 'Asteroids',
    rakshak: 'RAKSHAK',
  },
  show: {
    schrodinger: 'Show the Schrödinger diagram',
    pavana: 'Show the PAVANA diagram',
    vyomagami: 'Show the VYOMAGAMI diagram',
    asteroids: 'Show the asteroid search',
    rakshak: 'Show the RAKSHAK diagram',
  },
  drawAgain: 'Draw again',
  /** Phones and tablets: the builds as a swipeable strip, one card at a time. */
  strip: {
    label: 'Early builds, one at a time',
    prev: 'Previous build',
    next: 'Next build',
    /** `{n}` and `{total}` are filled on the server and again by the client as the strip moves. */
    count: '{n} of {total}',
  },
} as const satisfies {
  label: string;
  chips: Record<EarlyBuildId, string>;
  show: Record<EarlyBuildId, string>;
  drawAgain: string;
  strip: { label: string; prev: string; next: string; count: string };
};

/** Award stamps (`bg-oxblood-deep text-on-oxblood glint-metal`): in the index row and in the plate's corner. */
export const BUILD_STAMPS: Partial<Record<EarlyBuildId, string>> = {
  rakshak: 'Winner, 3M-CII Young Innovators Challenge',
};

/** Q-F3: the blink comparator's game. Messages go to a polite live region. */
/** The blink comparator's own words (its controls and the field's description). */
export const BLINK_UI = {
  caption: 'Illustration of how a moving asteroid is spotted between frames',
  description:
    'Three synthetic exposures of the same patch of sky, about 200 stars. The stars stay put; one dot shifts down and to the right from frame to frame. Synthetic, not survey data.',
  fieldLabel: 'Synthetic frames',
  blink: 'Blink',
  previous: 'Previous frame',
  next: 'Next frame',
  frame: (n: number, total: number) => `Frame ${n} of ${total}`,
} as const;

export const SPOT_THE_MOVER = {
  label: 'Spot the mover:',
  prompt: 'tap the dot that moves between frames.',
  found: 'Found it. Real searches work the same way: compare frames, look for the dot that moves.',
  miss: 'That one stays put. Blink again and compare.',
  showMe: 'Show me',
  shown: 'There it is, ringed. Step through the frames and watch it move.',
  reducedMotion: 'Blinking is off while reduced motion is on. Step through the frames with Previous and Next.',
} as const;

// ── #business: the ledger (§4.4) ────────────────────────────────────────────────────────────────────────────────────

export interface VentureLedgerRow {
  /** Replaces `Venture.subtitle` on the Life ledger; `null` shows none. */
  subtitle?: string | null;
  /** An in-page link after the subtitle. */
  crossLink?: { label: string; href: string };
  /** Award stamp (oxblood). */
  stamp?: string;
  /** Qualifier stamp (`bg-accent-2-soft border-accent-2-line`), not an award. */
  qualifier?: string;
}

/** Per-venture ledger extras keyed by `Venture.id`; everything else comes from VENTURES. */
export const VENTURE_LEDGER: Readonly<Record<string, VentureLedgerRow>> = {
  // Q-17 interim role (VENTURES).
  'trav-story': { stamp: 'Best Startup Idea, KIIT' },
  // The detection count lives in the Asteroid search build; this row links there instead of repeating it.
  deuxstem: {
    subtitle: 'Ed-tech non-profit, students in 10+ countries.',
    crossLink: { label: 'See the asteroid search', href: '#build-asteroids' },
    stamp: 'Commended by NASA, CSA and DLR',
  },
  sedu: { subtitle: null, qualifier: 'Full ride, top 8% of applicants' },
};

export const VENTURE_LEDGER_COPY = {
  headers: ['Venture', 'Role', 'Years', 'Recognition', 'Links'],
  /** The line under the ledger; the link is same-site, so it opens in the same tab (P1-10). */
  after: 'Revenue, audience and the full story of each: ',
  afterLink: { label: 'on the Work page', href: '/professional' },
} as const;

// ── #athletics: Altitude (§4.5) ─────────────────────────────────────────────────────────────────────────────────────

export const HIGH_POINTS_COPY = {
  /** Screen-reader words for a height ("~4,919 m" is spoken "about 4,919 metres"). */
  spoken: { about: 'about', metres: 'metres' },
  /** The high point card's close button. */
  close: 'Close',
  /** Visually hidden h3 of the chart block, whose anchor id is `anchorId`. */
  title: 'High points, to scale',
  anchorId: 'heights',
  /** Phone bar list `aria-label`. */
  barsLabel: 'High points, highest first',
  highest: 'Highest',
  readJournal: 'Read the journal',
  solo: 'solo',
  // Q-F7: Tilicho and the undated treks; Q-55: the "~" heights.
  caption: 'Spot heights are commonly cited figures; ~ marks an approximate one.',
} as const;

/** The standard panel: values read from `getExpedition('annapurna')`; distance hidden until he picks a total. */
export const STANDARD_COPY = {
  keys: { how: 'how', days: 'days', pack: 'pack', when: 'when' },
  how: 'Solo, self-supported',
  link: { label: 'Read the Annapurna journal', href: '/stories#annapurna' },
} as const;

/**
 * Training, one line per group (P1-9). Headings are his own words from DISCIPLINE_INTRO.paragraphs[0]; lines are the
 * reviewed condensation of the `entities/activity` lines for those ids (no frequency claims). Q-B8: the pack.
 */
export const TRAINING_COPY = {
  title: 'Training',
  groups: [
    {
      heading: 'Lift, run, box and swim',
      activities: ['gym', 'run', 'box', 'swim'],
      line: 'Progressive strength training, because an 18 kg pack at 5,000 m is a strength problem first. Runs for the lungs and the head; boxing for footwork, conditioning and calm under pressure; swimming for recovery and endurance.',
    },
    { heading: "When there's a team", activities: ['football', 'basketball'], line: 'Football, and pick-up basketball.' },
    { heading: 'Climb', activities: ['climb'], line: 'Alpine climbs, solo, with my own kit.' },
    { heading: 'Learning soon', activities: ['surf'], line: 'Surfing: the next skill on the list.' },
  ],
} as const;

// ── #gallery: Field album (§4.6) ────────────────────────────────────────────────────────────────────────────────────

export const ALBUM_UI = {
  /** Phones show the first `phoneVisible` frames, then this (expands in place, focus moves to the next frame). */
  showAll: (n: number) => `Show all ${n} frames`,
  /** The clip bead's visible word; each button name starts with it, so the visible label is in the name (2.5.3). */
  play: 'Play',
  pause: 'Pause',
  /** Each clip's play button names its clip (WCAG 2.4.6). */
  playClip: (caption: string) => `Play clip: ${caption}`,
  pauseClip: (caption: string) => `Pause clip: ${caption}`,
  phoneVisible: 6,
} as const;

// ── #next: Next on the route (§4.7) ─────────────────────────────────────────────────────────────────────────────────

/**
 * The closing field entry. OPEN QUESTION (owner, 2026-11-04): Dodital and Darwa Top is now done, but he gave no details,
 * so nothing may present it as the next climb: the "next climb" row is omitted until he names the next one (and the
 * expedition entity's status is updated). The "as of" row stays hidden until he gives a date (Q-F8).
 */
export const NEXT_ENTRY = {
  id: 'next',
  title: 'Next on the route',
  rows: [
    { key: 'next skill', value: 'Surfing' },
    // Q-03 interim.
    { key: 'based in', value: ORIGIN.now },
  ],
} as const;
