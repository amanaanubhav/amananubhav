import { getExpedition } from '@/entities/expedition';
import { PROFILE } from '@/entities/profile';
import type { LogEntry } from '@/shared/ui/journal';

/*
 * Home copy, pulled from the story deck by id (docs/redesign/content/story-content.md):
 * [S-PROLOGUE], [S-HOME-CHAPTERS], [S-EPILOGUE], [S-REMOTE-SHORT], [S-AI-OFFLINE] (`who`).
 * `[CONFIRM]` facts render the deck's interim text; `[TBD]` facts are left undefined, so the log row hides.
 */

/** The six entries of `#meander`, in walking order. */
export type HomeEntryId = 'origin' | 'work' | 'how' | 'pass' | 'ask' | 'write';

export const HOME_ENTRY_IDS: readonly HomeEntryId[] = ['origin', 'work', 'how', 'pass', 'ask', 'write'];

export interface StoryPoint {
  readonly id: HomeEntryId;
  /** Rail label ([S-HOME-CHAPTERS] title). */
  readonly title: string;
  /** Entry h2 ([S-HOME-CHAPTERS] subtitle; upright, §G.1). */
  readonly subtitle: string;
  readonly description: string;
}

/** [S-HOME-CHAPTERS]. Chapter 1 carries the deck's interim wording for Q-82 and Q-31. */
export const STORY_POINTS: readonly StoryPoint[] = [
  {
    id: 'origin',
    title: 'Origin',
    subtitle: 'Dark skies, early questions',
    description:
      'I grew up in Sikahar, a village in Bihar where the night sky was the best screen in town. I started asking how things work, then building them to find out: a solar carbon-capture design, a non-profit that reached more than two million learners in 10+ countries, and more than 20 asteroid detections through its NASA-affiliated search campaigns.',
  },
  {
    id: 'work',
    title: 'Work',
    subtitle: 'I build AI that does the work',
    description:
      "I'm an AI engineer at Atlys, building the AI brains and agents behind the product. Before that I interned remotely at Brndo, and I took The Trav Story's RAG chatbots from schema to deployment. I like owning a system end to end: data, model, API, and the screen a person actually touches.",
  },
  {
    id: 'how',
    title: 'How I work',
    subtitle: 'Quiet room, clear problem',
    description:
      "My best work happened remotely. In two remote months at Brndo I moved its site from WordPress to Next.js and built WhatsApp reminders that recovered 9.1% of a client's abandoned checkouts. A calm desk and no commute put the hours into the problem. I'm looking for a remote role where that focus is the default, and where I can keep seeing new places between deadlines.",
  },
  {
    id: 'pass',
    title: 'Altitude',
    subtitle: 'Everything on my back',
    description:
      'I trek solo and self-supported: my own tent, my own food, my own call on when to turn back. Annapurna Circuit in 14 days with 18 kg. Kun Tso near 5,000 m in deep winter snow. Chandrashila alone via Deoriatal and Rohini Bugyal.',
  },
  {
    id: 'ask',
    title: 'Terminal',
    subtitle: 'Ask me anything',
    description:
      "There's a version of me built into this site. Ask it about my projects, my stack or my last trek, and it answers in my words, with a local fallback when the network drops.",
  },
  {
    id: 'write',
    title: 'Contact',
    subtitle: 'Write to me, privately',
    description:
      'For roles, collaborations or a trek recommendation, send me a note through the secure channel. Your message is encrypted in your browser (AES-GCM) and chained into a tamper-evident ledger before it is stored.',
  },
];

export function getStoryPoint(id: HomeEntryId): StoryPoint {
  return STORY_POINTS.find((point) => point.id === id) as StoryPoint;
}

/* ------------------------------------------------------------------ hero */

/**
 * [S-PROLOGUE], Survey Ridge (HERO-FOOTER-SPEC §2.1): the h1 is his name; the aphorism is the statement under it.
 * The kicker becomes the field line; the key-facts strip is not rendered.
 */
export const HERO_COPY = {
  name: PROFILE.displayName ?? 'Aman Anubhav',
  statement: 'Everything I need, I carry.',
  body: 'I build AI agents at Atlys and cross Himalayan passes alone. Both take the same thing: a clear plan, a light pack, and the patience to keep going when the air gets thin.',
  readStory: 'Read my story',
  status: 'Open to remote roles',
  statusHref: '/professional#remote',
} as const;

/**
 * The hero's one field line: the role, then the status chip (rendered by the hero). The base city is held back
 * from the hero until Aman confirms it (Q-03 interim), so it is not rendered.
 */
export const HERO_FIELD = {
  role: { key: 'role', value: 'AI engineer, Atlys' },
  base: { key: 'base', value: 'Bhubaneswar, India', confirmed: false },
} as const;

/* ---------------------------------------------------------------- entries */

const ANNAPURNA = getExpedition('annapurna');
const WORK_WINDOW = PROFILE.availability?.workWindowIST;

/** "10:00" from 10, "09:30" from 9.5 (IST hours of the working window). */
function istClock(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * The hours Aman overlaps with a team are his IST working window (Q-20). Until Q-20 is answered the
 * window is undefined, so the row stays hidden; it never claims an overlap it cannot know.
 */
const overlapWindow = WORK_WINDOW ? `${istClock(WORK_WINDOW[0])} to ${istClock(WORK_WINDOW[1])} IST` : undefined;

/** Measured facts per entry (§G.1). The one camp row ("Chame ~2,670 m") is added first from `HOME_WAYPOINTS`. */
export const ENTRY_LOGS: Readonly<Record<HomeEntryId, readonly LogEntry[]>> = {
  origin: [
    { key: 'region', value: 'Bihar, India', mono: false },
    { key: 'latitude', value: '25° N' },
    { key: 'founded', value: 'DeuxStem, 2020', mono: false },
    // Q-31 interim (deck: "more than two million learners").
    { key: 'reach', value: '2M+' },
  ],
  work: [
    { key: 'role', value: 'AI engineer, Atlys', mono: false },
    { key: 'before', value: 'Brndo, remote', mono: false },
    { key: 'stack', value: 'Python, FastAPI, Next.js, PostgreSQL' },
    { key: 'best result', value: '98.87% (OceanBot)' },
    { key: 'tracking', value: '500 ms (DIVERT)', approx: true },
  ],
  how: [
    { key: 'time zone', value: PROFILE.availability?.utcLabel ?? 'IST, UTC+5:30' },
    { key: 'mode', value: 'remote', mono: false },
    { key: 'overlap', value: overlapWindow },
  ],
  pass: [
    { key: 'distance', value: ANNAPURNA.distanceKm, unit: 'km' },
    { key: 'days', value: ANNAPURNA.days },
    { key: 'pack', value: ANNAPURNA.packKg, unit: 'kg' },
    { key: 'mode', value: ANNAPURNA.mode, mono: false },
  ],
  ask: [{ key: 'model', value: 'live, with an offline cache', mono: false }],
  write: [
    { key: 'cipher', value: 'AES-GCM, in your browser', mono: false },
    { key: 'ledger', value: 'hash-chained', mono: false },
  ],
};

/**
 * The log key used for each entry's waypoint ("camp", or "pass" on the pass entry). Entry 6 (write) has no
 * waypoint row: its log is the cipher and the ledger only (§G.1).
 */
export const ENTRY_PLACE_KEY: Readonly<Partial<Record<HomeEntryId, string>>> = {
  origin: 'camp',
  work: 'camp',
  how: 'camp',
  pass: 'pass',
  ask: 'camp',
};

/** Links and actions under each entry's body (§G.1 "Extras"). */
export const ENTRY_LINKS = {
  origin: { label: "More about where I'm from", href: '/personal#about' },
  work: { label: 'See the work', href: '/professional' },
  pass: { label: 'Read the journal entry', storyId: ANNAPURNA.storyId ?? 'annapurna-circuit-solo' },
  ask: { label: 'Open the terminal' },
  write: { label: 'Vault' },
} as const;

/** Entry 3's extra line renders only once Aman confirms it (Q-90). */
export const QUIET_ROOM_LINE = {
  text: 'The quietest room I know is a tent at 4,800 m.',
  confirmed: false,
} as const;

/* ------------------------------------------------------------ the story map */

/** The one map of the page, in words (the stage is aria-hidden; this and the route list are its text). */
export const MAP_COPY = {
  heading: 'The route on the map',
  description:
    'A relief map of the Annapurna massif behind the page. As you scroll, my 14-day walk draws along the trail from Besisahar over Thorong La, 5,416 m, to Muktinath, with side trips to Blue Lake, Green Lake, Ice Lake and Tilicho Lake. Colour shows altitude; lines show temperature, modelled from altitude.',
  routeListLabel: 'The route, in walking order',
  sideTrip: 'side trip',
  approxPosition: 'approximate position',
  /** The sheet's title and description when it is the static map (tier 0) or the arrival poster. */
  sheetTitle: 'Annapurna Circuit, the whole route',
  sheetDesc:
    'Contour map of the Annapurna Circuit with my route from Besisahar over Thorong La, 5,416 m, to Muktinath, and the side trips to the lakes.',
} as const;

/** One-line captions of the map-only stretch (the Manang days, §4 B6-B9), each anchored to its beat. */
export const STORY_CAPTIONS = [
  { id: 'day6', head: 'Day 6', text: 'A rest day at Mungji: Blue Lake, then Green Lake.' },
  { id: 'day7', head: 'Day 7', text: 'Ice Lake, from Mungji up past the small lake below it, and back down.' },
  {
    id: 'days910',
    head: 'Days 9 and 10',
    text: 'Through Manang and Khangsar to Shri Kharka. Then Tilicho Lake, 4,919 m, and back.',
  },
] as const;

/** The summit numeral (§5.4), counted once with the head and held. */
export const NUMERAL_COPY = {
  kicker: 'Thorong La, day 14',
  after: 'The highest point of the circuit. Then a long way down to Muktinath.',
} as const;

/** The map legend (§13). Honesty notes only: no sources or credits. */
export const LEGEND_COPY = {
  label: 'Map legend',
  day: (day: number, of: number) => `Day ${day} of ${of}`,
  wholeDays: (days: number) => `${days} days`,
  wholePlace: 'Annapurna Circuit, April–May 2026',
  emphasis: 'Colour the terrain by',
  altitude: 'Altitude',
  temperature: 'Temperature',
  key: 'Key',
  altitudeScale: 'Altitude scale, metres',
  temperatureScale: 'Temperature scale, degrees Celsius',
  isoWarm: '+10',
  isoZero: '0 °C',
  isoCold: '−10',
  frost: 'below 0',
  noteAltitude: 'Colour: altitude, 500 m bands. Lines: temperature, modelled from altitude, not measured.',
  noteTemperature:
    'Colour: temperature on an April–May day, modelled from altitude (−6.5 °C per 1,000 m from about +22 °C at Besisahar). Not measured.',
  keys: [
    { id: 'walked', style: 'kRoute', text: 'Walked' },
    { id: 'ahead', style: 'kGhost', text: 'To walk' },
    { id: 'side', style: 'kSide', text: 'Side trip' },
    { id: 'lake', style: 'kLake', text: 'Lake' },
    { id: 'peak', style: 'kPeak', text: 'Peak' },
  ],
  honesty:
    'April–May 2026. Altitudes are commonly cited and approximate (~). Blue Lake and Green Lake are at approximate positions.',
} as const;

/* ------------------------------------------------------------ G-21 extras */

/** G-21 terminal preview: the title bar, `> who`, and the first line of the offline `who` reply. */
export const TERMINAL_PREVIEW = {
  title: 'aman@anubhav: ~',
  prompt: 'who',
  reply: "I'm Aman Anubhav: an AI engineer at Atlys building AI agents, and a solo high-altitude trekker.",
} as const;

/** G-21 ledger glyph: three linked blocks, no fake hashes. */
export const LEDGER_GLYPH = {
  caption: 'Each message is chained to the one before it.',
  title: 'Three linked message blocks',
  desc: 'Blocks 1, 2 and 3, each joined to the one before it, the way the Vault chains messages.',
} as const;

/* ------------------------------------------------------------------ #next */

/**
 * [S-EPILOGUE] and [S-REMOTE-SHORT], the next-trek redesign (docs/redesign/next-trek/NEXT-DESIGN.md §3.4). The next
 * trek is planned, so it is never dated before the trip (Q-48). Route facts are the research's Route A (ROUTE-FACTS.md):
 * a planned leg from Muktinath, where the walked circuit ends, past Marpha to Humkhola (dashed; the owner, 2026-11-07: "the
 * route should resume from muktinath"), then the expected Herzog Trail (dotted). The page never names a mode
 * of transport (Aman, 2026-11-07): the legs differ by line style only. Every route fact says "planned",
 * "expected" or "commonly cited", and no source is listed on the page (the citations live in the docs and the data
 * scripts).
 */
export const NEXT_COPY = {
  kicker: 'Next trek · planned',
  /** The approved headline, "Next: Annapurna North Base Camp. Then, ideally, your team.", set as two lines. */
  headlineLines: ['Next: Annapurna North Base Camp.', 'Then, ideally, your team.'],
  /** The trek after the last one (Aman, 2026-11-06): planned, so no dates. */
  nextTrek: { name: 'Annapurna North Base Camp', region: 'Nepal' },
  /** Caption C1, over the planned leg of the 3D transition (staged layout only). */
  caption: {
    head: 'Next, from Muktinath',
    text: 'Down the Kali Gandaki past Jomsom and Marpha to Humkhola, where the trail starts. Planned.',
  },
  /** One paragraph: the remote role is asked for once (Q-C, the merge of the old `body` and `remote`). */
  body: "Last seen on Darwa Top in Uttarkashi, in October. After Annapurna North, I'd like my next climb to be a remote AI engineering role: a clear problem, a quiet room, and a team that ships AI people actually use. If that sounds like your team, write to me.",
  route: 'Muktinath to Humkhola, then up to the base camp',
  routeNote: '(expected)',
  then: 'a remote AI engineering role',
  /** The map key: solid = walked, dashes = the planned leg, dots = the expected trek (`jeep` / `foot` are ids only). */
  key: {
    label: 'Map key',
    walked: 'walked',
    jeep: 'Muktinath to Humkhola, planned',
    foot: 'Humkhola to base camp, expected',
    note: 'Expected route and altitudes as commonly cited; approximate line.',
  },
  /** The visually hidden route list (the canvas and the sheet are images). */
  routeList: {
    label: 'Expected route, planned',
    stops: [
      'Muktinath, start of the planned leg',
      'Kagbeni',
      'Jomsom',
      'Marpha',
      'Tatopani',
      'Narchyang',
      'Humkhola, where the trail starts',
      'Sadhi Kharka',
      'Bhusket Mela',
      'Panchakunda Lake',
      'Annapurna I Base Camp (North)',
    ],
  },
  /** The static plan sheet (reduced motion, lite devices, no JavaScript, a failed 3D load). */
  sheet: {
    title: 'Plan sheet: the expected route to Annapurna North Base Camp',
    desc: 'A relief map of the Kali Gandaki and the north side of Annapurna I. A dashed line marks the planned leg from Muktinath, where the walked circuit ends, past Kagbeni, Jomsom and Marpha down to Tatopani and up past Narchyang to Humkhola. A dotted line marks the expected route from Humkhola past Sadhi Kharka, Bhusket Mela and Panchakunda Lake to Annapurna I Base Camp (North). Lines are approximate.',
    km: 'km',
  },
  /**
   * Names and notes of the next route's places, by route-file place id: the one source for the static sheet and the
   * 3D map's labels (NEXT_MARKS). Muktinath is where the walked circuit ends and the planned leg starts; the road towns
   * carry names only.
   */
  places: {
    muktinath: { name: 'Muktinath', note: 'end of the circuit' },
    jharkot: { name: 'Jharkot' },
    kagbeni: { name: 'Kagbeni' },
    jomsom: { name: 'Jomsom' },
    marpha: { name: 'Marpha' },
    kalopani: { name: 'Kalopani' },
    ghasa: { name: 'Ghasa' },
    tatopani: { name: 'Tatopani' },
    narchyang: { name: 'Narchyang' },
    humkhola: { name: 'Humkhola', note: 'trail starts, expected' },
    'sadhi-kharka': { name: 'Sadhi Kharka' },
    'bhusket-mela': { name: 'Bhusket Mela' },
    panchakunda: { name: 'Panchakunda Lake' },
    anbc: { name: 'Annapurna I Base Camp (North)', note: 'expected' },
    'annapurna-i': { name: 'Annapurna I' },
  } as Readonly<Record<string, { readonly name: string; readonly note?: string }>>,
  terminal: 'Open the terminal',
  vault: 'Vault',
  email: 'Email me',
  storyLink: 'Read the journal entry',
  overlapCaption: 'My working day in IST, against yours.',
} as const;
