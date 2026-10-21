import type { ProjectId } from '@/entities/project';
import type { SkillCategoryKey } from '@/entities/skill';

/**
 * Page copy for /professional (§G.3, §I.7), transcribed from docs/redesign/content/story-content.md by id.
 * `[TBD]` facts are absent (the UI hides the field); `[CONFIRM]` facts use the deck's interim; Brndo's clients
 * use the Q-80 fallbacks ("a cricket-equipment brand", "a client's YouTube channel", "an e-commerce client").
 */

/** A run of text where `{ data }` parts render in Plex Mono (numbers, measurements). */
export type RichText = readonly (string | { readonly data: string })[];

// ── Hero: [S-PRO-SUMMARY] ───────────────────────────────────────────────────────────────────────────

export const HERO_COPY = {
  title: 'AI engineer. I take systems from schema to screen.',
  /**
   * [S-PRO-SUMMARY] lead, split so the actions sit in the first viewport: the first two sentences set as the lead,
   * the rest (same words) as a body paragraph under the actions.
   */
  lead:
    "I'm an AI engineer at Atlys, building AI agents on the Data, AI & Product team. Since 2025 I've built multimodal RAG chatbots for The Trav Story, an emergency-vehicle routing system on PostGIS, a fraud-detection ensemble and a marine-species classifier at 98.87% accuracy.",
  more:
    "I also spent a remote internship at Brndo migrating its site to Next.js and winning back 9.1% of a client's abandoned checkouts. I write Python and TypeScript every day, ship with Docker, and care as much about the API contract and the database schema as about the model.",
  log: {
    /** Q-10 interim. */
    role: 'AI engineer, Data, AI & Product, Atlys',
    status: 'Open to remote roles',
    statusHref: '#remote',
    /** [S-PRO-EDU], no CPI (Q-37). */
    education: 'B.Tech, Mathematics and Computer Science, KIIT, 2027 (expected)',
  },
  logLabel: 'At a glance',
  actions: { email: 'Email me', vault: 'Vault' },
  proofLabel: 'Three things I can show you',
  /**
   * Plate 1 caption (M-PRO-AGENT-01): the G-05a note, word for word. It is set in HTML under the plate rather than
   * inside the drawing so it stays readable at any plate width (§B.4.3 minimum text).
   */
  plateCaption: 'How I structure agents. Atlys specifics are not public.',
} as const;

/** [S-PRO-SUMMARY] proof points. The Atlys metric (Q-11) is `[TBD]` and left out. */
export const PROOF_POINTS: readonly { readonly id: string; readonly title: string; readonly body: RichText }[] = [
  {
    id: 'agents',
    title: 'Agents in production.',
    body: [
      'I build AI agents at Atlys and built the multimodal RAG chatbots behind The Trav Story (LangChain, FastAPI, vector databases).',
    ],
  },
  {
    id: 'real-time',
    title: 'Real-time systems.',
    body: [
      'DIVERT routes first responders around traffic with OSRM, PostGIS and WebSocket tracking at about ',
      { data: '500 ms' },
      ' latency.',
    ],
  },
  {
    id: 'models',
    title: 'Models that hold up.',
    body: [
      'OceanBot: ',
      { data: '98.87%' },
      ' validation accuracy across 31 species. YVOO: ',
      { data: '94%' },
      ' with an XGBoost and logistic-regression ensemble.',
    ],
  },
];

// ── #experience: [S-CH2-WORK] ───────────────────────────────────────────────────────────────────────

export const EXPERIENCE_COPY = {
  title: 'I build AI that does real work.',
  listLabel: 'Work and education, newest first',
  present: 'Present',
} as const;

// ── #remote: [S-REMOTE-*] ───────────────────────────────────────────────────────────────────────────

export const REMOTE_COPY = {
  /**
   * [S-REMOTE-LONG] paragraphs 1-3 (§G.3: three paragraphs). The deck's fourth ("There's a second reason", the
   * travel motive) stays off the recruiter lane; the overlap sentence (`[TBD]` Q-20) is removed until Aman gives a
   * window.
   */
  title: 'Quiet room, clear problem.',
  paragraphs: [
    'The most productive stretch of my working life so far was two months at Brndo in 2026: fully remote, as an e-commerce intern on SEO and software. I set up somewhere calm and clean, and the time I’d have spent getting to work went into the work itself. No commute, and a schedule shaped around the hours when I think best.',
    'It shows in what shipped. I moved brndo.in from WordPress to a Next.js app with server-side rendering and Schema.org markup, and wired Meta Pixel into the lead pipeline. I built Shopify Liquid product modals for a cricket-equipment brand’s buyers. I ran predictive analysis on a client’s YouTube metrics and raised viewer engagement by 12%. And the WhatsApp reminder flows I built won back 9.1% of abandoned checkouts.',
    'That’s the setup I’m looking for next: a remote AI engineering role on a team that trusts people with outcomes.',
  ],
  log: {
    lastRole: 'Brndo, Jun to Jul 2026',
  },
  logLabel: 'Remote, in numbers',

  /**
   * [S-REMOTE-PROOF]: the ledger (M-HOW-03), rows exactly as the deck with the Q-80 fallbacks. Kwikengage is named
   * nowhere until Q-80 is answered (the #experience entry uses the same neutral wording).
   */
  proof: {
    title: 'Two remote months, measured.',
    lead: 'An e-commerce internship in SEO and software engineering, done fully remote for Brndo, an ads and marketing agency, and its clients.',
    caption: 'Two remote months at Brndo, measured',
    columns: { stat: 'Result', line: 'What it was' },
    rows: [
      {
        stat: 'WordPress → Next.js',
        line: 'I rebuilt brndo.in as a Next.js single-page app with Tailwind and React, connected to Zoho CRM’s APIs.',
      },
      {
        stat: 'SSR + Schema.org',
        line: 'Server-side rendering and structured data, so search engines can read every page.',
      },
      { stat: 'Meta Pixel', line: 'Inbound leads tracked from the first visit through the pipeline.' },
      {
        stat: 'Shopify Liquid',
        line: 'Product modals that give a cricket-equipment brand’s buyers a clean, uncluttered view.',
      },
      {
        stat: '+12%',
        line: 'Viewer engagement on a client’s YouTube channel, after my predictive analysis of its metrics.',
      },
      {
        stat: '9.1%',
        line: 'Abandoned checkouts won back by WhatsApp reminder flows I built on a WhatsApp marketing platform from on-site behaviour and user segments.',
      },
      /** Q-81: shown with the deck wording until Aman says what the 21% measures. */
      { stat: '21%', line: 'An e-commerce client’s revenue driven by those reminder campaigns.' },
    ],
    closing: 'All of it shipped from a quiet room, on a schedule I set.',
    log: [
      { key: 'where', value: 'Brndo, ads and marketing' },
      { key: 'mode', value: 'remote' },
      { key: 'length', value: '2 months' },
      { key: 'when', value: 'Jun to Jul 2026' },
    ],
  },

  /** [S-REMOTE-VALUE]: three numbered principles, in the deck's order. */
  values: {
    title: 'What a remote team gets',
    items: [
      {
        title: 'I own the whole path.',
        body: 'Schema, model, API, deployment, interface. Fewer hand-offs means fewer meetings to coordinate them. At Brndo that meant taking brndo.in from WordPress to Next.js, with the SEO and lead tracking built in.',
      },
      {
        title: 'I write it down.',
        body: 'Briefs before code, pull requests with context and a test plan, decisions recorded where the team can find them. This site ships with its own architecture document; my LeetCode automation ships with a step-by-step guide.',
      },
      {
        title: 'I manage myself.',
        body: 'Solo expeditions are planning exercises with real consequences: route, food, weather windows, turn-back times. I bring the same habits to deadlines.',
      },
    ],
  },

  /** [S-REMOTE-ASYNC] heading; the lines live in config/remote.ts (Q-23). */
  checklist: { title: 'How I work asynchronously', tickLabel: 'Done' },

  /** [S-REMOTE-FIT]; `[TBD]` rows (type, start) have no value and are hidden. */
  fit: {
    title: 'What I’m looking for',
    /** Q-21 interim, used until PROFILE.availability.roles is set. */
    roles: 'AI engineer, applied ML engineer, LLM and agent systems, backend for AI products',
    location: 'Remote',
    team: 'Ships to real users, writes things down, measures outcomes rather than hours online.',
    keys: { roles: 'Roles', type: 'Type', start: 'Start', location: 'Location', team: 'Team' },
  },

  /** [S-REMOTE-CTA]. */
  cta: {
    title: 'Hiring remotely?',
    line: 'I’d like to hear what you’re building.',
    email: 'Email me',
    vault: 'Vault',
  },
} as const;

// ── #techstack: [S-SKILLS] ──────────────────────────────────────────────────────────────────────────

export const STACK_COPY = {
  title: 'Stack',
  groupOrder: ['languages', 'ai_ml', 'full_stack', 'cloud_devops', 'tools'] as const satisfies readonly SkillCategoryKey[],
  groups: {
    languages: 'Languages',
    ai_ml: 'AI and ML',
    full_stack: 'Full stack',
    cloud_devops: 'Cloud and DevOps',
    tools: 'Tools',
  } satisfies Record<SkillCategoryKey, string>,
  logLabel: 'Kit list',
  dailyLabel: 'Every day',
} as const;

// ── #projects: [S-PROJ-*] ───────────────────────────────────────────────────────────────────────────

export const PROJECTS_COPY = {
  title: 'Projects',
  runIn: { problem: 'Problem.', approach: 'Approach.', result: 'Result.' },
  archiveLink: 'Every build, early experiments included',
} as const;

/**
 * Disclaimers a diagram must carry next to it (§F: KANAD is "illustrative", Q-29; OceanBot's class strip claims no
 * accuracy, Q-27). Set in HTML after the caption because inside the SVG it fell below the §B.4.3 minimum on phones.
 */
export const BLUEPRINT_NOTES: Readonly<Partial<Record<ProjectId, string>>> = {
  oceanbot: 'The class strip is drawn evenly; it shows no per-species accuracy.',
  kanad: 'Illustrative. Inputs, crops and dataset are not public yet.',
};

/** Caption of a project's M-WORK-03 plate (§G.3): "System diagram of {title}", then a disclaimer when it has one. */
export function blueprintCaption(projectTitle: string, note?: string): string {
  return note ? `System diagram of ${projectTitle}. ${note}` : `System diagram of ${projectTitle}`;
}

/**
 * §G.3 log `result`: the short form of each featured project's Result line (one number where the deck has one); the
 * full sentence stays in the *Result.* run-in. Transcribed from [S-PROJ-*]; `[CONFIRM]` parts keep the deck interim.
 */
export const PROJECT_LOG_RESULT: Readonly<Partial<Record<ProjectId, RichText>>> = {
  travstory: ['Best Startup Idea, KIIT University'],
  divert: ['Working pipeline'],
  accolades: [{ data: '100%' }, ' data integrity'],
  oceanbot: [{ data: '98.87%' }, ' validation accuracy'],
  yvoo: [{ data: '94%' }, ' and ', { data: '92%' }, ' validation accuracy'],
  kanad: ['Winner, NYAS Junior Academy challenge'],
};

// ── #achievements: [S-ACH] ──────────────────────────────────────────────────────────────────────────

export const HONORS_COPY = {
  title: 'Honors',
  listLabel: 'Six honors',
  fullRegister: 'The full register',
} as const;
