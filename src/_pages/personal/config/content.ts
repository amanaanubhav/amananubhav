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
    desc: 'Solar-thermal carbon capture in a cast-iron and copper chamber, projected at $94 to $232 per tonne of CO2.',
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
    desc: 'A bladeless river-flow energy harvester that lets fish pass. 3M-CII Young Innovators Challenge winner.',
    tags: ['Clean energy', 'Fluid dynamics'],
    year: '2021 to 2022',
    plateCaption: 'Diagram: flow lines around a bladeless body.',
    photoSlot: 'M-PROJ-RAK-01',
  },
];

// ── #athletics: Discipline ([S-CH5-LIFE], [S-LIFE-DISCIPLINE]) ───────────────────────────────────

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

/** The mountain slides of [S-LIFE-DISCIPLINE], as the altitude strip. */
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

export const SKY_COPY = {
  title: 'Pointing the camera up.',
  // The deck's [TBD Q-53] sentence (setup, favourite target, best location) stays hidden.
  body: 'The sky over Sikahar started all of this, and I still chase it. On treks and dark-sky nights I shoot the Milky Way and star fields.',
  /** D1 connective line: shown only once Aman approves it (Q-91). */
  connective: {
    approved: false,
    text: "Above the pass the air runs out and the sky goes dark. It's the same sky I counted from a roof in Sikahar.",
  },
  description: 'The night sky over Bihar, 25° N, turning from dusk to dawn as you scroll.',
  legend: 'The sky over Bihar, 25° N, tonight.',
  /** Static layout (reduced motion, lite): the poster is a fixed January night, not tonight's sky. */
  staticLegend: 'The sky over Bihar, 25° N, on a January night.',
  posterTitle: 'Night sky over Bihar, looking south',
  posterDesc:
    'The sky over Bihar at 25° N, looking south from the horizon up, on a January night at 21:00 IST. Stars are sized by brightness.',
  logLabel: 'Night log',
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

/** Hidden until consent (Q-60); `M-CIRCLE-G5` shows the Aman-only crop until then. */
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
