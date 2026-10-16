/**
 * Media registry (DESIGN-SPEC §E). Every photo, clip, screen, generated plate and data file the site
 * uses or still needs is a slot here; components render `<MediaSlot id="..." />` and never hard-code a path.
 *
 * Rules for this file (§E.1):
 * - No runtime imports (at most `import type`), no enums, no namespaces, no parameter properties,
 *   so Node's built-in type stripping can load it from a script (the requirements report dumps
 *   `MEDIA_REQUESTS` this way).
 * - Status is explicit; there is no runtime 404 probing.
 * - `fill`/`glyph` come from the pending-fill rule (§E.2) and `minPx`/`path` from the §E.2 defaults,
 *   applied once when the module loads (see `pendingFillFor`, `defaultMinPx`, `defaultPath`).
 */

export type MediaStatus = 'existing' | 'placeholder' | 'generated';
export type MediaKind = 'photo' | 'video' | 'screen' | 'data' | 'svg' | 'scene';
export type MediaRatio = '3:2' | '4:5' | '1:1' | '16:10' | '16:9' | '9:16' | '4:3' | '3:4' | '2:1' | '1.91:1';
export type MediaChapter =
  | 'home'
  | 'origin'
  | 'work'
  | 'projects'
  | 'ventures'
  | 'proof'
  | 'expeditions'
  | 'life'
  | 'sky'
  | 'road'
  | 'circle'
  | 'album'
  | 'notebook'
  | 'stories'
  | 'brand';
export type PendingFill = 'contour' | 'stars' | 'grid' | 'glyph' | 'wave' | 'film' | 'none';
/** lucide-react icon names used by pending fills (G-15 project glyphs, G-18 discipline glyphs). */
export type FillGlyph =
  | 'Route'
  | 'MapPin'
  | 'Layers'
  | 'Fish'
  | 'ShieldCheck'
  | 'Leaf'
  | 'GitBranch'
  | 'SquareTerminal'
  | 'Gamepad2'
  | 'Activity'
  | 'Sun'
  | 'Waves'
  | 'Rocket'
  | 'Atom'
  | 'Telescope'
  | 'Dumbbell'
  | 'Footprints'
  | 'MountainSnow'
  | 'Award'
  | 'Bike'
  | 'Camera'
  | 'Laptop'
  | 'NotebookPen'
  | 'Tent'
  | 'Backpack';

/** Every registry id of §E.3 (117 slots; multi-slot rows counted per slot). */
export type MediaSlotId =
  // home
  | 'M-HERO-01'
  | 'M-HERO-02'
  | 'M-ALTIMETER-01'
  | 'M-EPI-01'
  // origin
  | 'M-ORIGIN-01'
  | 'M-ORIGIN-02'
  | 'M-ORIGIN-03'
  | 'M-ORIGIN-04'
  // work and remote
  | 'M-WORK-01'
  | 'M-HOW-01'
  | 'M-HOW-02'
  | 'M-HOW-03'
  | 'M-PRO-AGENT-01'
  | 'M-WORK-03'
  | 'M-PRO-ATLYS-01'
  | 'M-PRO-BRNDO-01'
  // projects and story covers
  | 'M-PROJ-TRAV-01'
  | 'M-PROJ-DIVERT-01'
  | 'M-PROJ-ACC-01'
  | 'M-PROJ-OCEAN-01'
  | 'M-PROJ-YVOO-01'
  | 'M-PROJ-KANAD-01'
  | 'M-PROJ-MARIO-01'
  | 'M-PROJ-RAK-01'
  | 'M-PROJ-SITE-01'
  | 'M-COVER-VYOMAGAMI'
  | 'M-COVER-PAVANA'
  | 'M-LEETSYNC-01'
  | 'M-LEETSYNC-02'
  | 'M-LEETSYNC-03'
  // ventures and proof
  | 'M-VEN-01'
  | 'M-VEN-02'
  | 'M-VEN-03'
  | 'M-VEN-04'
  | 'M-PROOF-NYAS'
  | 'M-PROOF-STARTUP'
  | 'M-PROOF-SIH'
  | 'M-PROOF-PIC'
  | 'M-PROOF-MIT'
  | 'M-PROOF-3MCII'
  | 'M-PROOF-IASC'
  | 'M-PROOF-AGENCIES'
  | 'M-PROOF-XIMB'
  | 'M-PROOF-IITB'
  | 'M-PROOF-DIAS'
  | 'M-PROOF-GDG'
  // expeditions
  | 'M-ALT-01'
  | 'M-ALT-02'
  | 'M-ALT-03'
  | 'M-ALT-04'
  | 'M-EXP-ANN-01'
  | 'M-EXP-ANN-02'
  | 'M-EXP-ANN-03'
  | 'M-EXP-ANN-04'
  | 'M-EXP-ANN-05'
  | 'M-EXP-ANN-06'
  | 'M-EXP-ANN-07'
  | 'M-EXP-KUN-01'
  | 'M-EXP-KUN-02'
  | 'M-EXP-KUN-03'
  | 'M-EXP-KUN-04'
  | 'M-EXP-KUN-05'
  | 'M-EXP-KUN-06'
  | 'M-EXP-CHA-01'
  | 'M-EXP-CHA-02'
  | 'M-EXP-CHA-03'
  | 'M-EXP-CHA-04'
  | 'M-EXP-HIM-01'
  | 'M-EXP-HIM-02'
  | 'M-EXP-HIM-03'
  | 'M-EXP-DOD-01'
  | 'M-EXP-DOD-02'
  | 'M-EXP-DOD-03'
  | 'M-EXP-DOD-04'
  | 'M-EXP-SUMMIT-01'
  | 'M-EXP-HEADLAMP-01'
  // life, sky, road, circle
  | 'M-LIFE-GYM'
  | 'M-LIFE-RUN'
  | 'M-LIFE-BOX'
  | 'M-LIFE-SWIM'
  | 'M-LIFE-CLIMB'
  | 'M-LIFE-FB'
  | 'M-LIFE-BB'
  | 'M-LIFE-SURF'
  | 'M-LIFE-SKY-01'
  | 'M-LIFE-SKY-02'
  | 'M-LIFE-SKY-03'
  | 'M-LIFE-SKY-04'
  | 'M-LIFE-SKY-SETUP'
  | 'M-LIFE-SKY-TENT'
  | 'M-SKY-01'
  | 'M-LIFE-ROAD-01'
  | 'M-LIFE-ROAD-02'
  | 'M-LIFE-ROAD-03'
  | 'M-ROAD-MAP'
  | 'M-LIFE-CIRCLE-01'
  | 'M-LIFE-CIRCLE-02'
  | 'M-LIFE-CIRCLE-03'
  | 'M-CIRCLE-G5'
  // album
  | 'M-ALBUM-G1'
  | 'M-ALBUM-G2'
  | 'M-ALBUM-G5'
  | 'M-ALBUM-G6'
  | 'M-ALBUM-G8'
  | 'M-ALBUM-G9'
  | 'M-ALBUM-G13'
  | 'M-ALBUM-G14'
  | 'M-ALBUM-G21'
  | 'M-ALBUM-GV7'
  | 'M-ALBUM-GV10'
  | 'M-ALBUM-GV16'
  // notebook and brand
  | 'M-NOTEBOOK-01'
  | 'M-NOTEBOOK-02'
  | 'M-NOTEBOOK-03'
  | 'M-BRAND-MARK'
  | 'M-BRAND-OG'
  | 'M-PORTRAIT-OG';

export interface MediaSlotEntry {
  id: MediaSlotId;
  chapter: MediaChapter;
  kind: MediaKind;
  status: MediaStatus;
  ratio: MediaRatio;
  /** Minimum original size Aman should send (§E.2 defaults filled in where §E.3 leaves it open). */
  minPx?: { w: number; h: number };
  /** Clips, e.g. '6-10 s'. */
  duration?: string;
  /** Canonical final location (§E.2): `/media/<chapter>/<lowercase id>.<ext>`; data slots stay in `media-inbox/`. */
  path: string;
  /** existing: the file served today (may differ from `path`). */
  src?: string;
  /** Intrinsic px of `src`. */
  width?: number;
  height?: number;
  objectPosition?: string;
  /** Pre-rendered toned variants (§C.7). */
  duotone?: { night: string; day: string };
  /** The brief for Aman: what to shoot or send. */
  subject: string;
  /** Pending caption: "Photo to come: {short}". */
  short: string;
  /** Alt text once the file exists (existing: the final alt). */
  alt: string;
  /** Render-ready caption parts; unknown parts stay undefined. */
  caption?: string;
  place?: string;
  date?: string;
  /** Pending fill per the §E.2 rule. */
  fill: PendingFill;
  glyph?: FillGlyph;
  /** Render nothing until supplied. */
  optional?: boolean;
  /** Render nothing until the condition is met. */
  hidden?: 'after-trip' | 'consent' | 'permission';
  /** Existing interim that should be replaced by a better file. */
  replace?: boolean;
  /** Linked open questions (Q ids). */
  confirm?: readonly string[];
  usedIn: readonly string[];
  /** G-xx (generated). */
  generator?: string;
  /** Request priority for Aman (placeholders). */
  priority?: 1 | 2 | 3;
  /** Percent of the image; only for confirmed frames. */
  callouts?: readonly { x: number; y: number; label: string }[];
  exif?: { lens?: string; aperture?: string; exposure?: string; iso?: number };
  /** Additive: number of files a multi-file slot needs (desktop + mobile screens, a three-screen flow). */
  files?: number;
}

/** A row of §E.3 before the §E.2 defaults are applied. */
type SlotInput = Omit<MediaSlotEntry, 'id' | 'fill' | 'glyph' | 'path'> & { path?: string };

const PHOTO_L_32 = { w: 3000, h: 2000 } as const;
const PHOTO_P = { w: 2400, h: 3000 } as const;
const SCREEN = { w: 2560, h: 1600 } as const;
const NOTHING_NEEDED = 'Already on the site; nothing needed.';
/** Aman-only 4:5 derivative of the private G5 original in media-inbox/ (Q-60), cut by scripts/photos (npm run gen:photos). */
const G5_AMAN_ONLY = '/media/album/g5-aman.webp';

/** Achievement proof slot (§E.3 proof rows: 1:1 photo, optional, minimum PHOTO-S). */
function proof(
  subject: string,
  short: string,
  alt: string,
  priority: 1 | 2 | 3,
  confirm?: readonly string[],
  usedIn: readonly string[] = ['/achievements'],
): SlotInput {
  return {
    chapter: 'proof', kind: 'photo', status: 'placeholder', ratio: '1:1', minPx: { w: 1600, h: 1600 }, optional: true,
    subject: `${subject} A flat 300 dpi scan or a daylight phone photo of the whole page, nothing private visible.`,
    short, alt, usedIn, priority, ...(confirm ? { confirm } : {}),
  };
}

/** Album slot (§E.3 album rows: existing files; captions are drafts until Q-09). */
function album(
  file: string,
  width: number,
  height: number,
  ratio: MediaRatio,
  alt: string,
  extra: Partial<SlotInput> = {},
): SlotInput {
  return {
    chapter: 'album', kind: 'photo', status: 'existing', ratio,
    src: `/${file}`, width, height,
    subject: NOTHING_NEEDED, short: alt, alt,
    usedIn: ['/personal#gallery'], confirm: ['Q-09'],
    ...extra,
  };
}

/**
 * Existing 478 × 850 album clip; the original file is wanted (replace). `what` is a draft description of the
 * first frames (Q-09 corrects it); it is both the visible caption ("Clip: ...") and the video's label.
 */
function albumClip(file: string, seconds: string, what: string): SlotInput {
  const caption = `Clip: ${what}`;
  return {
    chapter: 'album', kind: 'video', status: 'existing', ratio: '9:16', minPx: { w: 1080, h: 1920 }, duration: '6-15 s',
    src: `/${file}`, width: 478, height: 850, replace: true,
    subject: `The original file of this clip (today a 478 × 850, ${seconds} copy), and where and when it was shot.`,
    short: `a clip from the album (${what})`, alt: caption, caption,
    usedIn: ['/personal#gallery'], confirm: ['Q-09'],
  };
}

/** Astrophotograph slot (§E.3 `M-LIFE-SKY-01` to `-04`). */
function astro(target: string, usedIn: readonly string[] = ['/personal#sky']): SlotInput {
  return {
    chapter: 'sky', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 4000, h: 2667 },
    subject: `Astrophotograph: ${target}. Send the edited version and the unedited original with EXIF.`,
    short: `an astrophotograph of ${target}`, alt: '[target] over [place]',
    usedIn, priority: 1, confirm: ['Q-53', 'Q-99'],
  };
}

/** Trips with friends (§E.3 `M-LIFE-CIRCLE-01` to `-03`): only with their consent. */
function circle(alt: string): SlotInput {
  return {
    chapter: 'circle', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 2400, h: 1600 }, hidden: 'consent',
    subject: 'Trips with Sahil and Arpit (only with their OK); 3:2 or 4:5.',
    short: 'a trip with friends', alt,
    usedIn: ['/personal#gallery (circle spread)'], priority: 3, confirm: ['Q-60'],
  };
}

/** Field-book pages (§E.3 `M-NOTEBOOK-01` to `-03`). */
function notebook(usedIn: readonly string[]): SlotInput {
  return {
    chapter: 'notebook', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P, optional: true,
    subject: 'Real pages from a trek log, notebook or a whiteboard system sketch (cover anything private); 4:5 or 3:2, shot flat in daylight or scanned.',
    short: 'a page from my trek log', alt: 'A page from my trek log, [trip]',
    usedIn, priority: 2, confirm: ['Q-89'],
  };
}

const SLOTS: Readonly<Record<MediaSlotId, SlotInput>> = {
  // ── Home ────────────────────────────────────────────────────────────────────────────────────────
  'M-HERO-01': {
    chapter: 'home', kind: 'svg', status: 'generated', ratio: '4:5',
    path: 'src/_pages/home/config/plan-sheet.generated.ts', generator: 'G-01 + scene relief-annapurna',
    subject: 'Annapurna plan sheet and relief scene, built from the heightfield and the route.',
    short: 'contour map of the Annapurna Circuit',
    alt: 'Contour map of the Annapurna Circuit with my 250 km route from Besisahar over Thorong La, 5,416 m, to Muktinath.',
    usedIn: ['/#home', '/#meander'],
  },
  'M-HERO-02': {
    chapter: 'home', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, optional: true,
    subject: 'You on a ridge or pass, back or three-quarter view, subject in the left or right third, clean sky (ideal 3840 × 2560).',
    short: 'me on a ridge or pass', alt: 'Aman on [place], [altitude] m',
    usedIn: ['/#pass', 'OG card v2'], priority: 2, confirm: ['Q-09'],
  },
  'M-ALTIMETER-01': {
    chapter: 'home', kind: 'photo', status: 'placeholder', ratio: '1:1', minPx: { w: 1600, h: 1600 }, optional: true,
    subject: 'Your watch, GPS or phone screen showing the altitude on Thorong La (or Kun Tso).',
    short: 'my altimeter on the pass', alt: 'My watch reading [N] m on Thorong La',
    usedIn: ['/#pass', '/stories#annapurna'], priority: 2, confirm: ['Q-97'],
  },
  'M-EPI-01': {
    chapter: 'home', kind: 'svg', status: 'generated', ratio: '1:1',
    path: 'src/_pages/home/config/garhwal-sheet.generated.ts', generator: 'G-09',
    subject: 'Garhwal sheet with the alpine start, built from the heightfield and the waypoints.',
    short: 'the route to Dodital and Darwa Top',
    alt: 'Planned route to Dodital and Darwa Top, dashed, beside my last solo route to Chandrashila.',
    usedIn: ['/#next'],
  },

  // ── Origin ──────────────────────────────────────────────────────────────────────────────────────
  'M-ORIGIN-01': {
    chapter: 'origin', kind: 'photo', status: 'existing', ratio: '4:5', minPx: PHOTO_P,
    src: '/profile1.jpg', width: 1280, height: 960, objectPosition: '58% 40%',
    subject: 'A portrait of you today: face unobstructed (no sunglasses), natural light, chest-up, some room above the head.',
    short: 'a portrait', alt: 'Aman Anubhav',
    usedIn: ['/personal#about', 'chat header avatar (40 px)'], priority: 1, replace: true,
  },
  'M-ORIGIN-02': {
    chapter: 'origin', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, optional: true,
    subject: "Sikahar: the village, the roof you watched the sky from, or its night sky (no house numbers, signs or other people's faces).",
    short: 'the roof in Sikahar', alt: 'The roof in Sikahar, Bihar, where I learned the sky',
    usedIn: ['/personal#about'], priority: 3, confirm: ['Q-06'],
  },
  'M-ORIGIN-03': {
    chapter: 'origin', kind: 'svg', status: 'generated', ratio: '1:1',
    path: 'src/_pages/personal/config/sky-charts.generated.ts', generator: 'G-04a',
    subject: 'Winter star chart at 25° N, built from the star catalogue.',
    short: 'the winter sky at 25° N',
    alt: 'Star chart of the winter sky at 25° N, January, 21:00 IST',
    usedIn: ['/personal#about (inset)'],
  },
  'M-ORIGIN-04': {
    chapter: 'origin', kind: 'photo', status: 'placeholder', ratio: '1:1', minPx: { w: 1600, h: 1600 }, optional: true,
    subject: 'You as a teenager with an early project, a telescope or at a competition.',
    short: 'an early project', alt: 'Aman at [year] with [project]',
    usedIn: ['/personal#about'], priority: 3, confirm: ['Q-02'],
  },

  // ── Work and remote ─────────────────────────────────────────────────────────────────────────────
  'M-WORK-01': {
    chapter: 'work', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, optional: true,
    subject: 'You working: screen glow, notebook and hands, a whiteboard, or speaking at an event (no confidential screens).',
    short: 'me at work', alt: 'Aman working on [what]',
    usedIn: ['/professional#experience'], priority: 2,
  },
  'M-HOW-01': {
    chapter: 'work', kind: 'photo', status: 'existing', ratio: '4:3', minPx: { w: 3000, h: 2250 },
    src: '/G21.webp', width: 1201, height: 1023,
    subject: 'Your actual remote workspace: desk, window, the view; tidy, daylight, nothing private on screen. Final caption: "My desk in [place]".',
    short: 'my desk',
    alt: 'A quiet place in Sikkim. My desk photo is coming.',
    caption: 'A quiet place in Sikkim. My desk photo is coming.',
    usedIn: ['/professional#remote'], priority: 1, replace: true, confirm: ['Q-09'],
  },
  'M-HOW-02': {
    chapter: 'work', kind: 'svg', status: 'generated', ratio: '2:1',
    path: 'src/shared/ui/charts (OverlapBand)', generator: 'G-07',
    subject: 'Time-zone overlap band, drawn from IST and the visitor zone.',
    short: 'my working hours against yours',
    alt: 'Time-zone band: my working hours in IST against yours',
    usedIn: ['/#next', '/professional#remote'], confirm: ['Q-20'],
  },
  'M-HOW-03': {
    chapter: 'work', kind: 'svg', status: 'generated', ratio: '2:1',
    path: 'src/_pages/professional (DOM ledger)',
    subject: 'A DOM ledger table of the two remote months at Brndo.',
    short: 'two remote months, measured',
    alt: 'Two remote months at Brndo, measured',
    usedIn: ['/professional#remote'], confirm: ['Q-80'],
  },
  'M-PRO-AGENT-01': {
    chapter: 'work', kind: 'svg', status: 'generated', ratio: '4:3',
    path: 'src/_pages/professional/ui/blueprints/AgentLoop.tsx', generator: 'G-05a',
    subject: 'Agent-loop blueprint, hand-authored SVG.',
    short: 'how I structure an AI agent',
    alt: 'How I structure an AI agent: input, model, tools, memory, decision, action',
    usedIn: ['/professional (hero)'],
  },
  'M-WORK-03': {
    chapter: 'work', kind: 'svg', status: 'generated', ratio: '4:3',
    path: 'src/_pages/professional/ui/blueprints/', generator: 'G-05b to G-05g',
    subject: 'Project system diagrams, hand-authored SVG.',
    short: 'a system diagram', alt: 'System diagram of [project]',
    usedIn: ['/professional#projects'],
  },
  'M-PRO-ATLYS-01': {
    chapter: 'work', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, hidden: 'permission',
    subject: 'You at Atlys or with the team, only if Atlys allows.',
    short: 'with the Atlys team', alt: 'Aman with the Atlys team',
    usedIn: ['/professional#experience'], priority: 3, confirm: ['Q-12'],
  },
  'M-PRO-BRNDO-01': {
    chapter: 'work', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN, hidden: 'permission', files: 2,
    subject: 'brndo.in after your migration: desktop (2560 × 1600) and mobile (1170 × 2532).',
    short: 'brndo.in after the migration', alt: 'brndo.in after the Next.js migration',
    usedIn: ['/professional#remote'], priority: 3, confirm: ['Q-80'],
  },

  // ── Projects ────────────────────────────────────────────────────────────────────────────────────
  'M-PROJ-TRAV-01': {
    chapter: 'projects', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN, files: 3,
    subject: 'The Trav Story: the chat-to-itinerary flow in three screens.',
    short: 'The Trav Story, from a chat to an itinerary', alt: 'The Trav Story: from a chat to an itinerary',
    usedIn: ['/professional#projects', '/project-archive'], priority: 2,
  },
  'M-PROJ-DIVERT-01': {
    chapter: 'projects', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN, optional: true,
    subject: 'DIVERT: the dashboard map with a cleared corridor.',
    short: 'the DIVERT dashboard', alt: 'DIVERT dashboard',
    usedIn: ['/professional#projects'], priority: 3, confirm: ['Q-24'],
  },
  'M-PROJ-ACC-01': {
    chapter: 'projects', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN, files: 2,
    subject: 'Accolades: search results and one listing, desktop (2560 × 1600) and mobile (1170 × 2532).',
    short: 'Accolades search results', alt: 'Accolades search results',
    usedIn: ['/professional#projects'], priority: 2, confirm: ['Q-26'],
  },
  'M-PROJ-OCEAN-01': {
    chapter: 'projects', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN,
    subject: 'OceanBot: the Power BI dashboard and one classification result.',
    short: 'the OceanBot dashboard', alt: 'OceanBot dashboard',
    usedIn: ['/professional#projects'], priority: 2, confirm: ['Q-27'],
  },
  'M-PROJ-YVOO-01': {
    chapter: 'projects', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN,
    subject: 'YVOO: the scoring screen.',
    short: 'the YVOO scoring screen', alt: 'YVOO scoring screen',
    usedIn: ['/professional#projects'], priority: 2, confirm: ['Q-28'],
  },
  'M-PROJ-KANAD-01': {
    chapter: 'projects', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 1600, h: 1067 },
    subject: 'KANAD: the prototype, a field test, or the NYAS award moment (a photo or a screen).',
    short: 'the KANAD prototype', alt: 'KANAD prototype',
    usedIn: ['/professional#projects'], priority: 2, confirm: ['Q-29'],
  },
  'M-PROJ-MARIO-01': {
    chapter: 'projects', kind: 'video', status: 'placeholder', ratio: '16:9', minPx: { w: 1920, h: 1080 },
    duration: '10 s', optional: true,
    subject: 'Screen recording of the Mario-RL agent playing.',
    short: 'the Mario-RL agent playing', alt: 'Mario-RL agent playing World 1-1',
    usedIn: ['/project-archive'], priority: 3, confirm: ['Q-39'],
  },
  'M-PROJ-RAK-01': {
    chapter: 'projects', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 1600, h: 1067 }, optional: true,
    subject: 'RAKSHAK: the prototype or the 3M-CII certificate.',
    short: 'the RAKSHAK prototype', alt: 'RAKSHAK prototype',
    usedIn: ['/personal#stem'], priority: 3, confirm: ['Q-43'],
  },
  'M-PROJ-SITE-01': {
    chapter: 'projects', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: SCREEN, optional: true,
    subject: "This site's home page. We take the screenshot after launch; nothing needed from you.",
    short: "this site's home page", alt: "This site's home page",
    usedIn: ['/project-archive'],
  },

  // ── Story covers and story images ───────────────────────────────────────────────────────────────
  'M-COVER-VYOMAGAMI': {
    chapter: 'stories', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 1600, h: 1067 },
    subject: 'Your own diagram, render or slide of VYOMAGAMI (not AI-generated).',
    short: 'a VYOMAGAMI diagram', alt: 'VYOMAGAMI concept diagram',
    usedIn: ['vyomagami story card and reader'], priority: 3, confirm: ['Q-08', 'Q-44'],
  },
  'M-COVER-PAVANA': {
    chapter: 'stories', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 1600, h: 1067 },
    subject: 'Your own CAD, diagram or slide of PAVANA (not AI-generated).',
    short: 'a PAVANA diagram', alt: 'PAVANA chamber diagram',
    usedIn: ['pavana story card and reader'], priority: 3, confirm: ['Q-08', 'Q-42'],
  },
  'M-LEETSYNC-01': {
    chapter: 'stories', kind: 'screen', status: 'existing', ratio: '2:1',
    src: '/stories/leetsync/actions.png', width: 1897, height: 899,
    subject: NOTHING_NEEDED, short: 'GitHub Actions runs',
    alt: 'GitHub Actions tab with scheduled Sync Leetcode runs',
    usedIn: ['LeetSync story cover and body'],
  },
  'M-LEETSYNC-02': {
    chapter: 'stories', kind: 'screen', status: 'existing', ratio: '2:1',
    src: '/stories/leetsync/leetcode.png', width: 1919, height: 908,
    subject: NOTHING_NEEDED, short: 'the LeetCode cookie names',
    alt: 'Chrome DevTools listing the LeetCode cookie names, values truncated',
    usedIn: ['LeetSync story body'], confirm: ['Q-07'],
  },
  'M-LEETSYNC-03': {
    chapter: 'stories', kind: 'screen', status: 'existing', ratio: '2:1',
    src: '/stories/leetsync/secrets_github.png', width: 1893, height: 902, objectPosition: '85% 50%',
    subject: NOTHING_NEEDED, short: 'the repository secret names',
    alt: 'GitHub repository secrets LEETCODE_CSRF_TOKEN and LEETCODE_SESSION, names only',
    usedIn: ['LeetSync story body'],
  },

  // ── Ventures ────────────────────────────────────────────────────────────────────────────────────
  'M-VEN-01': {
    chapter: 'ventures', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: { w: 1600, h: 1000 },
    subject: 'The Trav Story: a screen or a logo lockup you own.',
    short: 'The Trav Story', alt: 'The Trav Story',
    usedIn: ['/personal#business'], priority: 2, confirm: ['Q-17'],
  },
  'M-VEN-02': {
    chapter: 'ventures', kind: 'screen', status: 'placeholder', ratio: '16:10', minPx: { w: 1600, h: 1000 },
    subject: 'Accolades: a screen.',
    short: 'Accolades', alt: 'Accolades',
    usedIn: ['/personal#business'], priority: 2,
  },
  'M-VEN-03': {
    chapter: 'ventures', kind: 'photo', status: 'placeholder', ratio: '16:10', minPx: { w: 1600, h: 1000 },
    subject: 'DeuxStem: a workshop photo or the logo.',
    short: 'a DeuxStem workshop', alt: 'A DeuxStem workshop',
    usedIn: ['/personal#business'], priority: 2, confirm: ['Q-31'],
  },
  'M-VEN-04': {
    chapter: 'ventures', kind: 'photo', status: 'placeholder', ratio: '16:10', minPx: { w: 1600, h: 1000 },
    subject: 'Sedu at MIT LaunchX: a team photo or game screens.',
    short: 'Sedu at MIT LaunchX', alt: 'Sedu at MIT LaunchX',
    usedIn: ['/personal#business'], priority: 3, confirm: ['Q-47', 'Q-83'],
  },

  // ── Proof ───────────────────────────────────────────────────────────────────────────────────────
  'M-PROOF-NYAS': /*#__PURE__*/ proof('NYAS Junior Academy win: certificate, announcement or team photo.', 'the NYAS Junior Academy certificate', 'NYAS Junior Academy certificate', 3, ['Q-29']),
  'M-PROOF-STARTUP': /*#__PURE__*/ proof('Best Startup Idea (The Trav Story) award moment.', 'the Best Startup Idea award', 'Best Startup Idea award, KIIT', 3, ['Q-19']),
  'M-PROOF-SIH': /*#__PURE__*/ proof('Smart India Hackathon 2025 qualifier.', 'SIH 2025', 'SIH 2025', 3),
  'M-PROOF-PIC': /*#__PURE__*/ proof('PIC conference ranks.', 'the PIC conference', 'PIC conference', 3, ['Q-85']),
  'M-PROOF-MIT': /*#__PURE__*/ proof('MIT LaunchX 2022.', 'MIT LaunchX 2022', 'MIT LaunchX 2022', 3),
  'M-PROOF-3MCII': /*#__PURE__*/ proof('3M-CII Young Innovators Challenge (RAKSHAK).', 'the 3M-CII award', '3M-CII award', 3, ['Q-43']),
  'M-PROOF-IASC': /*#__PURE__*/ proof('IASC certificate or report for the asteroid detections.', 'the IASC certificate', 'IASC certificate', 2, ['Q-32', 'Q-82'], ['/achievements', 'star-hunter story']),
  'M-PROOF-AGENCIES': /*#__PURE__*/ proof('The NASA, CSA and DLR commendations (scan or photo).', 'the commendation letters', 'Commendation letter', 2, ['Q-84']),
  'M-PROOF-XIMB': /*#__PURE__*/ proof('UNNOVATION, XIM Bhubaneswar.', 'the UNNOVATION win', 'UNNOVATION win', 3, ['Q-49']),
  'M-PROOF-IITB': /*#__PURE__*/ proof('IIT Bombay E-Summit finalist.', 'the IIT Bombay E-Summit', 'IIT Bombay E-Summit', 3, ['Q-49']),
  'M-PROOF-DIAS': /*#__PURE__*/ proof('Dias Gamechanger Award.', 'the Dias Gamechanger Award', 'Dias Gamechanger Award', 3, ['Q-49']),
  'M-PROOF-GDG': /*#__PURE__*/ proof('A GDG KIIT event or stage photo (Breaking an LLM).', 'Breaking an LLM at GDG KIIT', 'Breaking an LLM, GDG KIIT', 3, ['Q-34'], ['/achievements', '/professional#experience']),

  // ── Expeditions ─────────────────────────────────────────────────────────────────────────────────
  'M-ALT-01': {
    chapter: 'expeditions', kind: 'svg', status: 'generated', ratio: '2:1',
    path: 'src/shared/ui/charts (ElevationProfile)', generator: 'G-02 (+ relief)',
    subject: 'Elevation profiles, drawn at runtime from the expedition waypoints (GPX when supplied).',
    short: 'an elevation profile', alt: 'Elevation profile of [trek]',
    usedIn: ['/stories', 'story reader', '/#meander (section cut)'],
  },
  'M-ALT-02': {
    chapter: 'expeditions', kind: 'svg', status: 'generated', ratio: '3:2',
    path: 'src/_pages/stories/config/atlas.generated.ts', generator: 'G-03',
    subject: 'Expedition atlas, built from the heightfield and the trek waypoints.',
    short: 'the atlas of my treks',
    alt: 'Atlas of every trek I have done, Himachal to Sikkim and central Nepal',
    usedIn: ['/stories#atlas'],
  },
  'M-ALT-03': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 4000, h: 2667 },
    subject: 'The single best mountain photo you have (Thorong La, Tilicho or Kun Tso).',
    short: 'my best mountain photo', alt: '[place], [altitude] m',
    usedIn: ['/stories#annapurna (lead plate)', 'annapurna-circuit-solo story cover', '/personal#athletics (trek tile)'],
    priority: 1,
  },
  'M-ALT-04': {
    chapter: 'expeditions', kind: 'video', status: 'placeholder', ratio: '16:9', minPx: { w: 1920, h: 1080 },
    duration: '6-10 s', optional: true,
    subject: 'Walking, or wind on a pass (16:9, or 9:16 if that is what you have).',
    short: 'wind on Thorong La', alt: 'Wind on Thorong La',
    usedIn: ['/stories#annapurna'], priority: 3,
  },
  'M-EXP-ANN-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Thorong La: the pass sign or prayer flags, with you in frame.',
    short: 'me at the Thorong La sign', alt: 'Aman at the Thorong La sign, 5,416 m', place: 'Thorong La',
    usedIn: ['/stories#annapurna', 'story reader', '/personal#athletics (strip)'], priority: 1,
  },
  'M-EXP-ANN-02': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Tilicho Lake.',
    short: 'Tilicho Lake', alt: 'Tilicho Lake, about 4,919 m', place: 'Tilicho Lake',
    usedIn: ['/stories#annapurna', 'story reader', '/personal#athletics (strip)'], priority: 1,
  },
  'M-EXP-ANN-03': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Ice Lake (Kicho Tal) above Manang.',
    short: 'Ice Lake above Manang', alt: 'Ice Lake above Manang', place: 'Ice Lake',
    usedIn: ['/stories#annapurna', 'story reader', '/personal#athletics (strip)'], priority: 1, confirm: ['Q-52'],
  },
  'M-EXP-ANN-04': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: { w: 2400, h: 1600 },
    subject: 'Your tent pitched at a camp (Khudi, Dharapani, Chame or higher).',
    short: 'my tent at a camp', alt: 'My tent at [camp]',
    usedIn: ['/stories#annapurna', 'story reader'], priority: 1,
  },
  'M-EXP-ANN-05': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '1:1', minPx: { w: 3000, h: 3000 },
    subject: 'The 18 kg pack laid out flat, top-down, on a plain ground, every item visible; plus a one-line note per item.',
    short: 'the 18 kg pack, laid out', alt: 'Everything in the 18 kg pack, laid out',
    usedIn: ['/stories#pack'], priority: 1, confirm: ['Q-56'],
  },
  'M-EXP-ANN-06': {
    chapter: 'expeditions', kind: 'video', status: 'placeholder', ratio: '9:16', minPx: { w: 1080, h: 1920 },
    duration: '6-10 s', optional: true,
    subject: 'Wind on the pass.',
    short: 'wind on the pass', alt: 'Wind on the pass',
    usedIn: ['story reader'], priority: 3,
  },
  'M-EXP-ANN-07': {
    chapter: 'expeditions', kind: 'data', status: 'placeholder', ratio: '1:1',
    subject: 'The full circuit track (Strava, Gaia, Komoot, OsmAnd or Garmin export), or a camp list with altitude and date.',
    short: 'the Annapurna track', alt: '',
    usedIn: ['relief scene', 'elevation profiles', 'atlas'], priority: 1, confirm: ['Q-41', 'Q-52', 'Q-100'],
  },
  'M-EXP-KUN-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'The frozen lake at Kun Tso.',
    short: 'the frozen lake at Kun Tso', alt: 'Kun Tso, frozen, 5,000 m', place: 'Kun Tso',
    usedIn: ['/stories#kun-tso'], priority: 1, confirm: ['Q-51'],
  },
  'M-EXP-KUN-02': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: { w: 1600, h: 2000 },
    subject: 'The duct-taped boots (a phone photo is fine, even a blurry one).',
    short: 'my duct-taped boots', alt: 'My boots, duct-taped against the snow',
    usedIn: ['/stories#kun-tso'], priority: 1, confirm: ['Q-101'],
  },
  'M-EXP-KUN-03': {
    chapter: 'expeditions', kind: 'video', status: 'placeholder', ratio: '9:16', minPx: { w: 1080, h: 1920 },
    duration: '6-10 s', optional: true,
    subject: 'Walking through deep snow (is GV16.mp4 from this trip?).',
    short: 'deep snow on the way to Kun Tso', alt: 'Deep snow on the way to Kun Tso',
    usedIn: ['/stories#kun-tso'], priority: 3, confirm: ['Q-09'],
  },
  'M-EXP-KUN-04': {
    chapter: 'expeditions', kind: 'data', status: 'placeholder', ratio: '1:1',
    subject: 'Zero Point (Yumesamdong) to Kun Tso: a GPX track or a camp list with altitude and date.',
    short: 'the Kun Tso track', alt: '',
    usedIn: ['elevation profile'], priority: 2, confirm: ['Q-51'],
  },
  'M-EXP-KUN-05': {
    chapter: 'expeditions', kind: 'photo', status: 'existing', ratio: '4:3', minPx: { w: 3000, h: 2250 },
    src: '/G2.webp', width: 1600, height: 1200,
    duotone: { night: '/media/album/g2-duo-night.webp', day: '/media/album/g2-duo-day.webp' },
    subject: 'An uncast original of this frame.',
    short: 'me in snow goggles, North Sikkim',
    alt: 'Aman in snow goggles and a neck gaiter, North Sikkim in winter (toned)', place: 'North Sikkim',
    usedIn: ['/stories#kun-tso', 'kun-tso-winter-climb story cover', '/personal#athletics (strip)'],
    priority: 2, replace: true, confirm: ['Q-09'],
  },
  'M-EXP-KUN-06': {
    chapter: 'expeditions', kind: 'photo', status: 'existing', ratio: '4:3',
    src: '/G9.webp', width: 1156, height: 868,
    subject: NOTHING_NEEDED, short: 'a snowfield, North Sikkim',
    alt: 'A snowfield under high cloud, North Sikkim in winter', place: 'North Sikkim',
    usedIn: ['/stories#kun-tso'], confirm: ['Q-09'],
  },
  'M-EXP-CHA-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'The view from Chandrashila summit.',
    short: 'the view from Chandrashila', alt: 'From the summit of Chandrashila', place: 'Chandrashila',
    usedIn: ['/stories#chandrashila', 'chandrashila-solo story cover', '/personal#athletics (strip)'],
    priority: 1, confirm: ['Q-54'],
  },
  'M-EXP-CHA-02': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Deoriatal with the reflection.',
    short: 'Deoriatal at dawn', alt: 'Deoriatal at dawn', place: 'Deoriatal',
    usedIn: ['/stories#chandrashila'], priority: 2,
  },
  'M-EXP-CHA-03': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Rohini Bugyal meadow with your tent.',
    short: 'my tent on Rohini Bugyal', alt: 'My tent on Rohini Bugyal', place: 'Rohini Bugyal',
    usedIn: ['/stories#chandrashila'], priority: 2,
  },
  'M-EXP-CHA-04': {
    chapter: 'expeditions', kind: 'data', status: 'placeholder', ratio: '1:1',
    subject: 'Deoriatal to Chandrashila: the GPX track.',
    short: 'the Chandrashila track', alt: '',
    usedIn: ['elevation profile'], priority: 2, confirm: ['Q-54'],
  },
  'M-EXP-HIM-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Triund.',
    short: 'the Triund ridge', alt: 'Triund ridge', place: 'Triund',
    usedIn: ['/stories#himachal'], priority: 3, confirm: ['Q-55'],
  },
  'M-EXP-HIM-02': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Kheerganga.',
    short: 'Kheerganga', alt: 'Kheerganga', place: 'Kheerganga',
    usedIn: ['/stories#himachal'], priority: 3, confirm: ['Q-55'],
  },
  'M-EXP-HIM-03': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Yulla Kanda.',
    short: 'the Yulla Kanda lake', alt: 'Yulla Kanda lake', place: 'Yulla Kanda',
    usedIn: ['/stories#himachal'], priority: 3, confirm: ['Q-55'],
  },
  'M-EXP-DOD-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, hidden: 'after-trip',
    subject: 'Dodital lake (after the trip).',
    short: 'Dodital', alt: 'Dodital', place: 'Dodital',
    usedIn: ['/stories#dodital', '/#next'], priority: 2, confirm: ['Q-46', 'Q-48'],
  },
  'M-EXP-DOD-02': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, hidden: 'after-trip',
    subject: 'Darwa Top (after the trip).',
    short: 'Darwa Top', alt: 'Darwa Top', place: 'Darwa Top',
    usedIn: ['/stories#dodital', '/#next'], priority: 2,
  },
  'M-EXP-DOD-03': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, hidden: 'after-trip',
    subject: 'Your camp (after the trip).',
    short: 'my camp below Darwa Top', alt: 'My camp below Darwa Top',
    usedIn: ['/stories#dodital', '/#next'], priority: 2,
  },
  'M-EXP-DOD-04': {
    chapter: 'expeditions', kind: 'data', status: 'placeholder', ratio: '1:1', hidden: 'after-trip',
    subject: 'The Dodital and Darwa Top track (after the trip).',
    short: 'the Dodital track', alt: '',
    usedIn: ['elevation profile', 'Garhwal sheet'], priority: 2,
  },
  'M-EXP-SUMMIT-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P, optional: true,
    subject: 'The full-resolution original of the goggles-and-down-jacket summit portrait (the site only has a small crop of it, which is the favicon again): who, where.',
    short: 'the summit portrait', alt: 'Aman on [summit], [altitude] m',
    usedIn: ['/stories#atlas', 'OG card v2'], priority: 2, confirm: ['Q-102'],
  },
  'M-EXP-HEADLAMP-01': {
    chapter: 'expeditions', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, optional: true,
    subject: 'A headlamp trail or an alpine start at night.',
    short: 'an alpine start at night', alt: 'Alpine start, [place]',
    usedIn: ['Dodital story (after the trip)'], priority: 3,
  },

  // ── Life: disciplines ───────────────────────────────────────────────────────────────────────────
  'M-LIFE-GYM': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P,
    subject: 'Strength training (a photo, or a 6 to 10 s clip).',
    short: 'strength training', alt: 'Training in the gym',
    usedIn: ['/personal#athletics'], priority: 2, confirm: ['Q-57'],
  },
  'M-LIFE-RUN': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P,
    subject: 'Running.',
    short: 'a run', alt: 'On a run',
    usedIn: ['/personal#athletics'], priority: 2, confirm: ['Q-57'],
  },
  'M-LIFE-BOX': {
    chapter: 'life', kind: 'video', status: 'placeholder', ratio: '4:5', minPx: { w: 1080, h: 1350 }, duration: '6-10 s',
    subject: 'Boxing pad work (a clip preferred).',
    short: 'pad work', alt: 'Pad work',
    usedIn: ['/personal#athletics'], priority: 2, confirm: ['Q-57'],
  },
  'M-LIFE-SWIM': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P,
    subject: 'Swimming.',
    short: 'swimming', alt: 'Swimming',
    usedIn: ['/personal#athletics'], priority: 2, confirm: ['Q-57'],
  },
  'M-LIFE-CLIMB': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P,
    subject: 'Climbing (rock or alpine).',
    short: 'climbing', alt: 'Climbing',
    usedIn: ['/personal#athletics'], priority: 2, confirm: ['Q-57'],
  },
  'M-LIFE-FB': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P, optional: true,
    subject: 'Football.',
    short: 'football', alt: 'Football',
    usedIn: ['/personal#athletics'], priority: 3,
  },
  'M-LIFE-BB': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P, optional: true,
    subject: 'Basketball.',
    short: 'basketball', alt: 'Basketball',
    usedIn: ['/personal#athletics'], priority: 3,
  },
  'M-LIFE-SURF': {
    chapter: 'life', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P, hidden: 'after-trip',
    subject: 'Learning to surf (after the lessons).',
    short: 'learning to surf', alt: 'Learning to surf at [place]',
    usedIn: ['/personal#athletics'], priority: 3, confirm: ['Q-58'],
  },

  // ── Sky ─────────────────────────────────────────────────────────────────────────────────────────
  'M-LIFE-SKY-01': /*#__PURE__*/ astro('the Milky Way', ['/personal#sky', 'star-hunter story cover', '/personal#athletics ("Behind the lens" slide)']),
  'M-LIFE-SKY-02': /*#__PURE__*/ astro('a star field'),
  'M-LIFE-SKY-03': /*#__PURE__*/ astro('star trails'),
  'M-LIFE-SKY-04': /*#__PURE__*/ astro('the Moon'),
  'M-LIFE-SKY-SETUP': {
    chapter: 'sky', kind: 'photo', status: 'placeholder', ratio: '4:5', minPx: PHOTO_P, optional: true,
    subject: 'Your camera, tripod or tracker set up at night.',
    short: 'my astro setup', alt: 'My astro setup',
    usedIn: ['/personal#sky'], priority: 3, confirm: ['Q-53'],
  },
  'M-LIFE-SKY-TENT': {
    chapter: 'sky', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32, optional: true,
    subject: 'Your tent lit from inside under the stars.',
    short: 'my tent under the stars', alt: 'My tent under the stars at [place]',
    usedIn: ['/personal#sky'], priority: 2,
  },
  'M-SKY-01': {
    chapter: 'sky', kind: 'scene', status: 'generated', ratio: '16:10',
    path: 'src/_pages/personal/ui/scenes/SkyScene.tsx', generator: 'scene sky + G-04b',
    subject: 'Star dome scene and its sky poster, built from the star catalogue.',
    short: "tonight's sky over Bihar", alt: "Tonight's sky over Bihar, 25° N, from dusk to dawn",
    usedIn: ['/personal#sky'],
  },

  // ── Road ────────────────────────────────────────────────────────────────────────────────────────
  'M-LIFE-ROAD-01': {
    chapter: 'road', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Your motorcycle on a highway.',
    short: 'my motorcycle on the road', alt: 'My motorcycle on [road]',
    usedIn: ['/personal#gallery (road spread)'], priority: 2, confirm: ['Q-59'],
  },
  'M-LIFE-ROAD-02': {
    chapter: 'road', kind: 'photo', status: 'placeholder', ratio: '3:2', minPx: PHOTO_L_32,
    subject: 'Puri beach.',
    short: 'the coast at Puri', alt: 'The coast at Puri', place: 'Puri',
    usedIn: ['/personal#gallery (road spread)'], priority: 2,
  },
  'M-LIFE-ROAD-03': {
    chapter: 'road', kind: 'video', status: 'placeholder', ratio: '16:9', minPx: { w: 1920, h: 1080 },
    duration: '6-10 s', optional: true,
    subject: 'Riding POV.',
    short: 'riding to Puri', alt: 'Riding to Puri',
    usedIn: ['/personal#gallery (road spread)'], priority: 3,
  },
  'M-ROAD-MAP': {
    chapter: 'road', kind: 'svg', status: 'generated', ratio: '16:9',
    path: 'src/_pages/personal/ui/plates/RoadSheet.tsx', generator: 'G-10',
    subject: 'Schematic road sheet, drawn from the rides list.',
    short: 'a map of my rides', alt: 'Map of my rides: Bhubaneswar to Puri and Chandaka',
    usedIn: ['/personal#gallery (road spread)'], confirm: ['Q-59'],
  },

  // ── Circle ──────────────────────────────────────────────────────────────────────────────────────
  'M-LIFE-CIRCLE-01': /*#__PURE__*/ circle('With Sahil at [place]'),
  'M-LIFE-CIRCLE-02': /*#__PURE__*/ circle('With Arpit at [place]'),
  'M-LIFE-CIRCLE-03': /*#__PURE__*/ circle('With Sahil and Arpit at [place]'),
  /*
   * G5 privacy (Q-60, §A.6): the G5 original (4032 × 3024) shows a friend whose face no object-position crop of a
   * 4:5 box hides. Both G5 slots therefore serve the Aman-only 4:5 derivative (x >= 2180 px of the original,
   * metadata stripped) that scripts/photos cuts; the original stays in the private media-inbox/, unpublished,
   * until the friend consents.
   */
  'M-CIRCLE-G5': {
    chapter: 'circle', kind: 'photo', status: 'existing', ratio: '4:5',
    src: G5_AMAN_ONLY, width: 1852, height: 2315,
    subject: 'An Aman-only 4:5 crop of G5 (bridge over a gorge in Sikkim), made from the original so no friend is in frame; the full frame shows only with their consent.',
    short: 'me at a bridge over a gorge in Sikkim', alt: 'Aman at a bridge over a gorge in Sikkim', place: 'Sikkim',
    usedIn: ['/personal#gallery (circle spread)'], confirm: ['Q-60'],
  },

  // ── Album ───────────────────────────────────────────────────────────────────────────────────────
  'M-ALBUM-G1': /*#__PURE__*/ album('G1.webp', 3472, 4624, '3:4', 'Aman stopping to pet a white dog outside a tin-roofed shop in the hills.', {
    caption: 'Every trail has a welcome committee.',
  }),
  'M-ALBUM-G2': /*#__PURE__*/ album('G2.webp', 1600, 1200, '4:3', 'Aman in snow goggles and a neck gaiter, North Sikkim in winter (toned)', {
    duotone: { night: '/media/album/g2-duo-night.webp', day: '/media/album/g2-duo-day.webp' },
  }),
  // The Aman-only derivative, for privacy (see M-CIRCLE-G5).
  'M-ALBUM-G5': {
    chapter: 'album', kind: 'photo', status: 'existing', ratio: '4:5',
    src: G5_AMAN_ONLY, width: 1852, height: 2315,
    subject: 'Same Aman-only 4:5 crop of G5 as M-CIRCLE-G5 (one file serves both).',
    short: 'me at a bridge over a gorge in Sikkim', alt: 'Aman at a bridge over a gorge in Sikkim', place: 'Sikkim',
    usedIn: ['/personal#gallery'], confirm: ['Q-09', 'Q-60'],
  },
  'M-ALBUM-G6': /*#__PURE__*/ album('G6.webp', 1280, 1280, '1:1', 'Aman looking down a wide green river between forested slopes'),
  'M-ALBUM-G8': /*#__PURE__*/ album('G8.webp', 1156, 868, '4:3', 'A hillside town lit up at night (toned)', {
    duotone: { night: '/media/album/g8-duo-night.webp', day: '/media/album/g8-duo-day.webp' },
  }),
  'M-ALBUM-G9': /*#__PURE__*/ album('G9.webp', 1156, 868, '4:3', 'A snowfield under high cloud'),
  'M-ALBUM-G13': /*#__PURE__*/ album('G13.webp', 868, 692, '4:3', 'Hill-town lights stacked on a ridge at night (toned)', {
    duotone: { night: '/media/album/g13-duo-night.webp', day: '/media/album/g13-duo-day.webp' },
  }),
  'M-ALBUM-G14': /*#__PURE__*/ album('G14.webp', 1280, 960, '4:3', 'Aman at a bridge strung with prayer flags, a waterfall behind'),
  'M-ALBUM-G21': /*#__PURE__*/ album('G21.webp', 1201, 1023, '4:3', 'Green tin roofs, flowers and blue ridges at dusk'),
  'M-ALBUM-GV7': /*#__PURE__*/ albumClip('GV7.mp4', '51.5 s', 'walking through deep snow'),
  'M-ALBUM-GV10': /*#__PURE__*/ albumClip('GV10.mp4', '15.5 s', 'boots sunk in fresh snow'),
  'M-ALBUM-GV16': /*#__PURE__*/ albumClip('GV16.mp4', '5.5 s', 'a dry, grassy slope underfoot'),

  // ── Notebook and brand ──────────────────────────────────────────────────────────────────────────
  'M-NOTEBOOK-01': /*#__PURE__*/ notebook(['story reader plates']),
  'M-NOTEBOOK-02': /*#__PURE__*/ notebook(['story reader plates', '/professional#projects (beside the DIVERT blueprint)']),
  'M-NOTEBOOK-03': /*#__PURE__*/ notebook(['story reader plates']),
  'M-BRAND-MARK': {
    chapter: 'brand', kind: 'svg', status: 'generated', ratio: '1:1',
    path: 'src/shared/ui/trig-mark/TrigMark.tsx', generator: 'G-11',
    subject: 'Trig-point brand mark, hand-drawn SVG.',
    short: 'the trig-point mark', alt: '',
    // The favicons are Aman's summit portrait again (scripts/brand, gen:brand); the mark stays in the navbar and footer.
    usedIn: ['navbar', 'footer'],
  },
  'M-BRAND-OG': {
    chapter: 'brand', kind: 'svg', status: 'generated', ratio: '1.91:1',
    path: '/og/aman-anubhav.png', width: 1200, height: 630, generator: 'G-12',
    subject: 'Social card, rendered by the brand script.',
    short: 'the social card', alt: 'Aman Anubhav: Everything I need, I carry.',
    usedIn: ['SITE.ogImage', 'JSON-LD image'],
  },
  'M-PORTRAIT-OG': {
    chapter: 'brand', kind: 'photo', status: 'placeholder', ratio: '1.91:1', minPx: { w: 2400, h: 1256 }, optional: true,
    subject: 'A landscape portrait for social cards, you in the left third, plain background.',
    short: 'a landscape portrait', alt: 'Aman Anubhav',
    usedIn: ['OG card v2'], priority: 3,
  },
};

// ── §E.2 rules ────────────────────────────────────────────────────────────────────────────────────

/** Width over height of a registry ratio ('3:2' -> 1.5, '1.91:1' -> 1.91). */
export function mediaRatioValue(ratio: MediaRatio): number {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
}

/**
 * §E.2 minimum-size shorthand by kind and ratio, for rows that leave the minimum open:
 * PHOTO-L ≥ 3000 px long edge (landscape), PHOTO-P 2400 × 3000 (portrait), PHOTO-S ≥ 1600 px (square),
 * SCREEN 2560 × 1600, CLIP ≥ 1080p. Data, SVG and scene slots carry no pixel minimum.
 */
function defaultMinPx(kind: MediaKind, ratio: MediaRatio): { w: number; h: number } | undefined {
  const r = mediaRatioValue(ratio);
  if (kind === 'photo') {
    if (r > 1) return { w: 3000, h: Math.round(3000 / r) };
    if (r === 1) return { w: 1600, h: 1600 };
    return { w: 2400, h: Math.round(2400 / r) };
  }
  if (kind === 'screen') return r >= 1 ? { w: 2560, h: Math.round(2560 / r) } : { w: 1170, h: 2532 };
  if (kind === 'video') return r >= 1 ? { w: Math.round(1080 * r), h: 1080 } : { w: 1080, h: Math.round(1080 / r) };
  return undefined;
}

/** §E.2 path rule: `/media/<chapter>/<lowercase id>.<ext>`; data originals stay in the git-ignored `media-inbox/`. */
function defaultPath(id: MediaSlotId, chapter: MediaChapter, kind: MediaKind): string {
  const name = id.toLowerCase();
  if (kind === 'data') return `media-inbox/${name}.gpx`;
  return `/media/${chapter}/${name}.${kind === 'video' ? 'mp4' : 'webp'}`;
}

const PROJECT_GLYPHS: Readonly<Partial<Record<MediaSlotId, FillGlyph>>> = {
  'M-PROJ-TRAV-01': 'MapPin',
  'M-PROJ-DIVERT-01': 'Route',
  'M-PROJ-ACC-01': 'Layers',
  'M-PROJ-OCEAN-01': 'Fish',
  'M-PROJ-YVOO-01': 'ShieldCheck',
  'M-PROJ-KANAD-01': 'Leaf',
  'M-PROJ-MARIO-01': 'Gamepad2',
  'M-PROJ-RAK-01': 'Waves',
  'M-PROJ-SITE-01': 'SquareTerminal',
  'M-VEN-01': 'MapPin',
  'M-VEN-02': 'Layers',
  'M-VEN-03': 'Telescope',
  'M-VEN-04': 'Gamepad2',
};

const DISCIPLINE_GLYPHS: Readonly<Partial<Record<MediaSlotId, FillGlyph>>> = {
  'M-LIFE-GYM': 'Dumbbell',
  'M-LIFE-RUN': 'Footprints',
  'M-LIFE-SWIM': 'Waves',
  'M-LIFE-BOX': 'Activity',
  'M-LIFE-CLIMB': 'Activity',
  'M-LIFE-FB': 'Activity',
  'M-LIFE-BB': 'Activity',
};

const SINGLE_GLYPHS: Readonly<Partial<Record<MediaSlotId, FillGlyph>>> = {
  'M-COVER-VYOMAGAMI': 'Rocket',
  'M-COVER-PAVANA': 'Sun',
  'M-EXP-ANN-04': 'Tent',
  'M-EXP-ANN-05': 'Backpack',
  'M-ALTIMETER-01': 'MountainSnow',
};

const STAR_SLOTS: ReadonlySet<MediaSlotId> = /*#__PURE__*/ new Set<MediaSlotId>(['M-ORIGIN-02', 'M-ORIGIN-04', 'M-EXP-HEADLAMP-01']);

/** §E.2 pending-fill rule, in the order the spec states it (first match wins). */
function pendingFillFor(id: MediaSlotId, input: SlotInput): { fill: PendingFill; glyph?: FillGlyph } {
  const { kind, status } = input;
  if (kind === 'video') return { fill: 'film' };
  if (kind === 'data' || kind === 'svg' || kind === 'scene' || status === 'generated') return { fill: 'none' };
  if (id.startsWith('M-LIFE-SKY-') || STAR_SLOTS.has(id)) return { fill: 'stars' };
  if (id === 'M-LIFE-SURF') return { fill: 'wave' };
  if (id.startsWith('M-LIFE-ROAD-')) return { fill: 'glyph', glyph: 'Bike' };
  if (id.startsWith('M-LIFE-CIRCLE-')) return { fill: 'contour' };
  const discipline = DISCIPLINE_GLYPHS[id];
  if (discipline) return { fill: 'glyph', glyph: discipline };
  const project = PROJECT_GLYPHS[id];
  if (project) return { fill: 'glyph', glyph: project };
  const single = SINGLE_GLYPHS[id];
  if (single) return { fill: 'glyph', glyph: single };
  if (id.startsWith('M-PROOF-')) return { fill: 'glyph', glyph: 'Award' };
  if (id === 'M-WORK-01' || id === 'M-HOW-01' || id.startsWith('M-PRO-')) return { fill: 'glyph', glyph: 'Laptop' };
  if (id.startsWith('M-NOTEBOOK-')) return { fill: 'glyph', glyph: 'NotebookPen' };
  if (id === 'M-PORTRAIT-OG' || id === 'M-ORIGIN-01') return { fill: 'grid' };
  return { fill: 'contour' };
}

function buildRegistry(): Readonly<Record<MediaSlotId, MediaSlotEntry>> {
  const out = {} as Record<MediaSlotId, MediaSlotEntry>;
  for (const id of Object.keys(SLOTS) as MediaSlotId[]) {
    const input = SLOTS[id];
    const { fill, glyph } = pendingFillFor(id, input);
    const minPx = input.minPx ?? defaultMinPx(input.kind, input.ratio);
    const entry: MediaSlotEntry = {
      id,
      ...input,
      path: input.path ?? defaultPath(id, input.chapter, input.kind),
      fill,
      ...(glyph ? { glyph } : {}),
      ...(minPx ? { minPx } : {}),
    };
    out[id] = Object.freeze(entry);
  }
  return Object.freeze(out);
}

// ── Public API ────────────────────────────────────────────────────────────────────────────────────

export const MEDIA: Readonly<Record<MediaSlotId, MediaSlotEntry>> = /*#__PURE__*/ buildRegistry();

export function getMedia(id: MediaSlotId): MediaSlotEntry {
  return MEDIA[id];
}

/** Chapter order used to sort requests (the order of the §E.3 tables). */
const CHAPTER_ORDER: readonly MediaChapter[] = [
  'home', 'origin', 'work', 'projects', 'stories', 'ventures', 'proof', 'expeditions',
  'life', 'sky', 'road', 'circle', 'album', 'notebook', 'brand',
];

/**
 * Everything Aman must supply: every `placeholder` (data slots, hidden and optional ones included) plus the
 * `existing` interims marked `replace`, minus M-PROJ-SITE-01 (we take that screenshot ourselves);
 * sorted by priority (1 first, missing priority last), then chapter (§E.3 order), then id.
 */
export const MEDIA_REQUESTS: readonly MediaSlotEntry[] = /*#__PURE__*/ buildRequests();

function buildRequests(): readonly MediaSlotEntry[] {
  return Object.freeze(
    Object.values(MEDIA)
      .filter(
        (e) => e.id !== 'M-PROJ-SITE-01' && (e.status === 'placeholder' || (e.status === 'existing' && e.replace === true)),
      )
      .sort(
        (a, b) =>
          (a.priority ?? 4) - (b.priority ?? 4) ||
          CHAPTER_ORDER.indexOf(a.chapter) - CHAPTER_ORDER.indexOf(b.chapter) ||
          a.id.localeCompare(b.id, 'en', { numeric: true }),
      ),
  );
}
