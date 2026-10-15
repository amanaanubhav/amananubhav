/* ─────────────────────────────────────────────
   STORY DATA
   ───────────────────────────────────────────── */
export interface StoryPoint {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
}

export const STORY_POINTS: readonly StoryPoint[] = [
  {
    title: 'Origin',
    subtitle: 'Where it began',
    description:
      'I am a Genetically Engineered Learner. My journey is not defined by inheriting talent, but by cultivating an obsessive curiosity. This space is a living architecture of my thoughts, built to translate theoretical knowledge into practical systems that solve real problems.',
  },
  {
    title: 'Life',
    subtitle: 'The human layer',
    description:
      'Beyond the code and the algorithms, this section explores my personal philosophies, core values, and the intrinsic motivations that drive my work. A raw look at the mindset required to constantly evolve, adapt, and build from the ground up.',
  },
  {
    title: 'Professional',
    subtitle: 'The trajectory',
    description:
      'A curated overview of my engineering journey and career milestones. Trace my path as an AI Researcher and Full Stack Engineer, from architecting sophisticated LLM pipelines to deploying scalable microservices for real world impact.',
  },
  {
    title: 'Terminal',
    subtitle: 'The interface',
    description:
      'A direct gateway to an intelligent agent embedded within this platform. The AI Terminal lets you dynamically interact with my portfolio, execute commands, and explore my capabilities through a powerful, developer centric environment.',
  },
  {
    title: 'Secure Contact',
    subtitle: 'The gateway',
    description:
      'A specialized, highly secure channel for communication. Designed with privacy and efficiency at its core, ensuring that professional inquiries and collaborations are handled with the utmost security and speed.',
  },
  {
    title: 'Insights',
    subtitle: 'The repository',
    description:
      'A collection of deep dives, technical breakdowns, and research notes. This serves as an open ledger of my ongoing experiments, discoveries in Artificial Intelligence, and thoughts on the future of scalable architectures.',
  },
];

/* ─────────────────────────────────────────────
   FLOATING GEOMETRIC SHAPES DATA
   ───────────────────────────────────────────── */
export type ShapeType = 'hexagon' | 'triangle' | 'circle' | 'diamond';

export interface FloatingShape {
  readonly type: ShapeType;
  readonly x: string;
  readonly y: string;
  readonly size: number;
  readonly delay: number;
  readonly duration: number;
}

export const FLOATING_SHAPES: readonly FloatingShape[] = [
  { type: 'hexagon', x: '8%', y: '15%', size: 24, delay: 0, duration: 28 },
  { type: 'triangle', x: '85%', y: '25%', size: 18, delay: 3, duration: 32 },
  { type: 'circle', x: '12%', y: '70%', size: 14, delay: 6, duration: 24 },
  { type: 'hexagon', x: '90%', y: '65%', size: 20, delay: 2, duration: 30 },
  { type: 'triangle', x: '75%', y: '85%', size: 16, delay: 5, duration: 26 },
  { type: 'circle', x: '20%', y: '45%', size: 10, delay: 8, duration: 22 },
  { type: 'diamond', x: '92%', y: '12%', size: 12, delay: 1, duration: 35 },
  { type: 'diamond', x: '5%', y: '88%', size: 16, delay: 4, duration: 27 },
];

/** Outline colour of the floating shapes. */
export const SHAPE_STROKE = 'rgba(6, 182, 212, 0.15)';

/** Number of twinkling stars in the dark star field. */
export const STAR_COUNT = 180;

/** Scroll progress reserved for the "Meander" title screen. */
export const TITLE_END = 0.1;

/** Section height in viewports per chapter. */
export const VIEWPORTS_PER_CHAPTER = 3;
