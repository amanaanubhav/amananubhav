import type { Project } from './types';

type ProjectInput = Omit<Project, 'desc'>;

const GITHUB_PROFILE = 'https://github.com/amanaanubhav';

/** `desc` stays for older consumers: the one-liner followed by the approach. */
function withDesc(project: ProjectInput): Project {
  const oneLiner = project.oneLiner ?? '';
  return { ...project, desc: project.approach ? `${oneLiner} ${project.approach}` : oneLiner };
}

/**
 * [S-PROJ-*]. Featured six first (featuredOrder 1 to 6), then the archive.
 * `[TBD]` facts are left out, `[CONFIRM]` facts use the deck's interim text, and links we do not
 * have yet (Q-25) stay out.
 */
const PROJECT_DATA: readonly ProjectInput[] = [
  // ---------------------------------------------------------------- featured
  {
    id: 'travstory',
    title: 'The Trav Story',
    type: 'Products and platforms',
    oneLiner: 'An AI travel platform that turns a conversation into a bookable itinerary.',
    problem:
      'Planning a trip means hours across blogs, maps and booking sites, and the result still misses what the traveller wanted.',
    approach:
      "Multimodal LLM chatbots built with LangChain and FastAPI take the brief, grounded in the platform's own travel data through RAG pipelines on vector databases. The frontend, backend, database and neural models run as distributed cloud services that talk over APIs. Supabase PostgreSQL holds trip state, with server-side rendering for fast retrieval; Docker builds and GitHub workflows ship it.",
    result: 'Best Startup Idea, KIIT University.',
    tech: [
      'Next.js',
      'FastAPI',
      'LangChain',
      'RAG',
      'Vector databases',
      'PostgreSQL',
      'Supabase',
      'Docker',
      'GitHub Actions',
      'Feature-Sliced Design',
    ],
    period: 'Nov 2025 to present',
    year: 'Nov 2025 - Present',
    role: 'Co-founder & Lead Architect',
    link: 'https://thetravstory.com',
    links: [
      { label: 'thetravstory.com', url: 'https://thetravstory.com' },
      { label: 'Instagram', url: 'https://www.instagram.com/the_travstory/' },
    ],
    featured: true,
    tier: 'featured',
    featuredOrder: 1,
    glyph: 'MapPin',
    slotIds: ['M-PROJ-TRAV-01'],
  },
  {
    id: 'divert',
    title: 'DIVERT',
    type: 'Products and platforms',
    oneLiner: 'Clears a signal corridor for ambulances and fire trucks before they reach the junction.',
    problem: 'First responders lose critical minutes at red lights and in jams that a routing app can see coming.',
    approach:
      "OSRM and PostGIS compute the route and automatically generate diversions of about 800 m around congestion. A Random Forest model predicts the vehicle's ETA at each junction so signals can be pre-empted in time. Dockerised FastAPI and Redis microservices track the vehicle over WebSockets with about 500 ms latency.",
    result: 'Working pipeline built as the Smart City Infrastructure module of my minor project.',
    // Q-24 interim: both models listed
    tech: ['FastAPI', 'Node.js', 'PostGIS', 'OSRM', 'Redis', 'WebSockets', 'Docker', 'Random Forest', 'XGBoost'],
    period: 'Dec 2025 to Apr 2026',
    year: 'Dec 2025 - Apr 2026',
    link: GITHUB_PROFILE,
    featured: true,
    tier: 'featured',
    featuredOrder: 2,
    glyph: 'Route',
    slotIds: ['M-PROJ-DIVERT-01'],
  },
  {
    id: 'accolades',
    title: 'Accolades',
    type: 'Products and platforms',
    oneLiner: 'An opportunity-discovery portal: student grants, fellowships and hackathons, searchable in one place.',
    problem:
      'The best opportunities for students are scattered across hundreds of sites and usually found a week after the deadline.',
    approach:
      'A Next.js 14 portal on Supabase (PostgreSQL) with a navigation-centric routing architecture: server-side rendering for a fast first load, then an interactive Framer Motion "Cyber-Glass" interface rendered on the client. An automated TypeScript ingestion pipeline sanitises and upserts JSON records into a normalised relational schema with strict unique constraints, so a listing appears once and only once. Open Graph metadata, XML sitemaps and schema.org Event JSON-LD make each listing eligible for Google rich results.',
    result: 'Live at accolades.site; 100% data integrity, with zero duplicate listings by construction.',
    tech: ['Next.js 14', 'TypeScript', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    period: 'Dec 2025 to present',
    year: 'Dec 2025 - Present',
    role: 'Founder',
    link: 'https://accolades.site',
    links: [{ label: 'accolades.site', url: 'https://accolades.site' }],
    featured: true,
    tier: 'featured',
    featuredOrder: 3,
    glyph: 'Layers',
    slotIds: ['M-PROJ-ACC-01'],
  },
  {
    id: 'oceanbot',
    title: 'OceanBot',
    type: 'Machine learning',
    oneLiner: 'Identifies marine species from photos and pulls coordinates out of field reports.',
    problem: 'Marine survey data arrives as unlabelled images and free-text logs, and both are slow to process by hand.',
    approach:
      'Transfer learning on InceptionV3 with a custom head (Dense 1024 ReLU, Dense 31 softmax), L2 regularisation at 0.001 and Dropout at 0.4 to curb overfitting. A language processor with 15+ regular expressions extracts coordinates from text. A Power BI dashboard shows the results.',
    // Q-85 interim (flagged)
    result:
      '98.87% validation accuracy across 31 species, 12 points above the baseline. Runner-up (2nd rank) at the PIC conference.',
    tech: ['TensorFlow', 'InceptionV3', 'Python', 'RegEx', 'Power BI'],
    period: 'Jul 2025 to Sep 2025',
    year: 'Jul 2025 - Sep 2025',
    link: 'https://www.kaggle.com/code/amananubhav/marine-ai',
    links: [{ label: 'Kaggle notebook', url: 'https://www.kaggle.com/code/amananubhav/marine-ai' }],
    featured: true,
    tier: 'featured',
    featuredOrder: 4,
    glyph: 'Fish',
    slotIds: ['M-PROJ-OCEAN-01'],
  },
  {
    id: 'yvoo',
    title: 'YVOO',
    type: 'Machine learning',
    oneLiner: 'Flags CIBIL-score and income fraud before a loan is approved.',
    problem: 'Lenders need to spot fabricated credit histories and inflated incomes without real fraud data to learn from.',
    approach:
      'I synthesised behavioural datasets, ran EDA to find the signals, and trained an ensemble of XGBoost and logistic regression. Models run behind secured FastAPI endpoints, Dockerised and deployed on Render with auto-scaling.',
    // Q-28 and Q-85 interim (flagged)
    result:
      '94% and 92% validation accuracy. 1st rank at the PIC conference. Qualified for Smart India Hackathon 2025.',
    tech: ['Python', 'XGBoost', 'scikit-learn', 'FastAPI', 'Docker', 'Render', 'React', 'PostgreSQL'],
    period: 'Sep 2025 to Dec 2025',
    year: 'Sep 2025 - Dec 2025',
    link: 'https://github.com/amanaanubhav/YVOO',
    links: [{ label: 'GitHub', url: 'https://github.com/amanaanubhav/YVOO' }],
    featured: true,
    tier: 'featured',
    featuredOrder: 5,
    glyph: 'ShieldCheck',
    slotIds: ['M-PROJ-YVOO-01'],
  },
  {
    id: 'kanad',
    title: 'KANAD',
    type: 'Machine learning',
    oneLiner: 'Spots crop disease from a leaf photo and schedules irrigation from the weather.',
    problem: 'Smallholder farmers often notice disease too late and water on habit rather than need.',
    approach:
      'A convolutional neural network classifies leaf images by disease; an LSTM forecasts water need from time-series data to schedule irrigation.',
    // Q-29 interim: no year
    result: 'Winner, New York Academy of Sciences Junior Academy challenge.',
    tech: ['CNN', 'LSTM'],
    year: '',
    link: GITHUB_PROFILE,
    featured: true,
    tier: 'featured',
    featuredOrder: 6,
    glyph: 'Leaf',
    slotIds: ['M-PROJ-KANAD-01'],
  },

  // ----------------------------------------------------------------- archive
  {
    id: 'leetsync',
    title: 'LeetCode to GitHub, automated',
    type: 'Products and platforms',
    oneLiner: 'A GitHub Actions workflow that archives every accepted LeetCode solution, nightly.',
    problem:
      "Copying solutions to GitHub by hand doesn't last, and browser extensions that do it ask for broad permissions over your session.",
    approach:
      'A scheduled workflow (daily at 11:55 PM IST, plus manual dispatch) built on the open-source joshcai/leetcode-sync action, with the session cookies stored as encrypted GitHub Secrets.',
    result: 'A hands-off archive in my-leetcode-solutions/, and a step-by-step guide others can copy.',
    tech: ['GitHub Actions', 'YAML', 'GitHub Secrets'],
    period: 'Dec 2025',
    year: 'Dec 2025',
    link: GITHUB_PROFILE,
    links: [{ label: 'GitHub', url: GITHUB_PROFILE }],
    tier: 'archive',
    glyph: 'GitBranch',
    slotIds: ['M-LEETSYNC-01'],
  },
  {
    id: 'site',
    title: 'amananubhav.com',
    type: 'Products and platforms',
    oneLiner: 'This site: a story you can scroll and a version of me you can talk to.',
    approach:
      'Next.js App Router with Feature-Sliced Design; an AI terminal that streams answers from /api/chat with automatic provider fallback and an offline knowledge base; a secure contact channel that encrypts messages in the browser (AES-GCM) into a hash-chained ledger; a visitor chat on Firestore with email alerts.',
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'three.js', 'GSAP', 'Motion', 'Firestore', 'WebCrypto'],
    year: 'Present',
    link: 'https://amananubhav.com',
    links: [{ label: 'amananubhav.com', url: 'https://amananubhav.com' }],
    tier: 'archive',
    glyph: 'SquareTerminal',
    slotIds: ['M-PROJ-SITE-01'],
  },
  {
    id: 'mario-rl',
    title: 'Mario-RL',
    type: 'Machine learning',
    oneLiner: 'A reinforcement-learning agent that learned to play Super Mario Bros.',
    approach: 'DDQN and PPO with Stable-Baselines3 on the Gym Super Mario Bros environment.',
    result: 'Expert-level play. Built during the MLSA Project Wing.',
    tech: ['DDQN', 'PPO', 'Reinforcement learning', 'Stable-Baselines3'],
    // Q-39 interim
    period: '2024',
    year: '2024',
    link: 'https://github.com/amanaanubhav/Mario-RL',
    links: [{ label: 'GitHub', url: 'https://github.com/amanaanubhav/Mario-RL' }],
    tier: 'archive',
    glyph: 'Gamepad2',
    slotIds: ['M-PROJ-MARIO-01'],
  },
  {
    id: 'lnn',
    title: 'Liquid Neural Networks',
    type: 'Research',
    oneLiner: 'Exploring continuous-time neural networks that keep adapting after deployment.',
    approach:
      'Studying ODE-based, continuous-time recurrent networks for robotics and edge devices that need to adapt without retraining.',
    tech: ['ODEs', 'Continuous-time RNNs'],
    year: 'Active',
    link: GITHUB_PROFILE,
    tier: 'archive',
    tag: 'Research',
    glyph: 'Activity',
  },
  {
    id: 'pavana',
    title: 'PAVANA',
    type: 'Science and engineering',
    oneLiner: 'A solar-powered machine that pulls CO2 out of the air, designed to be cheaper than direct air capture.',
    approach:
      'A gradient composite chamber of cast iron and copper creates 250 to 400 °C temperature differentials from concentrated solar heat to drive the capture cycle; a digital twin simulates airflow through the corrugated metal maze.',
    // No capture percentage until Q-42.
    result:
      "Projected from my models: $94 to $232 per tonne of CO2, against roughly $600 for today's direct air capture.",
    tech: ['Thermodynamics', 'CAD', 'Simulation'],
    period: '2020 to present',
    year: '2020 - Present',
    link: GITHUB_PROFILE,
    tier: 'archive',
    tag: 'Early build',
    glyph: 'Sun',
    slotIds: ['M-COVER-PAVANA'],
  },
  {
    id: 'rakshak',
    title: 'RAKSHAK',
    type: 'Science and engineering',
    oneLiner: 'A river-flow energy harvester with no turbine blades, so fish pass safely.',
    approach: 'A bladeless design driven by river flow, shaped to avoid harming aquatic life on migration paths.',
    // No efficiency figure until Q-43.
    result: 'Winner, 3M-CII Young Innovators Challenge.',
    tech: ['Fluid dynamics', 'Eco-design'],
    period: '2021 to 2022',
    year: '2021 - 2022',
    link: GITHUB_PROFILE,
    tier: 'archive',
    tag: 'Early build',
    glyph: 'Waves',
    slotIds: ['M-PROJ-RAK-01'],
  },
  {
    id: 'vyomagami',
    title: 'VYOMAGAMI',
    type: 'Science and engineering',
    oneLiner: 'Lift the rocket on a balloon first, then light it where the air is thin.',
    // Q-44 interim: the balloon-launch description
    approach:
      "A high-altitude balloon carries the launch vehicle to about 30 km, above roughly 99% of the atmosphere's mass; the rocket ignites in near-vacuum. My simulations estimate a 60 to 70% reduction in fuel mass and structural weight. Presented at SpaceOnova.",
    tech: ['Physics simulation', 'Concept design'],
    period: 'Research phase',
    year: 'Research Phase',
    link: GITHUB_PROFILE,
    tier: 'archive',
    tag: 'Research',
    glyph: 'Rocket',
    slotIds: ['M-COVER-VYOMAGAMI'],
  },
  {
    id: 'schrodinger',
    title: 'Defying the Schrödinger equation',
    type: 'Research',
    oneLiner:
      'A school-age theory paper on locating an electron near the nucleus using the Bekenstein bound.',
    approach: 'An ambitious early exploration, not a result.',
    tech: ['Theoretical physics', 'Bekenstein bound'],
    year: '',
    link: GITHUB_PROFILE,
    tier: 'archive',
    tag: 'Early build',
    glyph: 'Atom',
  },
  {
    id: 'asteroids',
    title: 'Asteroid search',
    type: 'Research',
    oneLiner:
      "More than 20 asteroid detections reported through DeuxStem's campaigns with the International Astronomical Search Collaboration.",
    approach: "Analysed telescope image sets for moving objects as part of DeuxStem's IASC campaigns.",
    // Q-82 / Q-32 interim: "detections", never "discovered".
    result: '20+ detections, VT60 and UF78 among them.',
    tech: ['Astronomy', 'Image analysis'],
    period: '2020 to present',
    year: '2020 - Present',
    link: GITHUB_PROFILE,
    tier: 'archive',
    glyph: 'Telescope',
  },
  {
    id: 'sedu',
    title: 'Sedu',
    type: 'Products and platforms',
    // Q-83 neutral fallback
    oneLiner: 'A game-based health-education startup I co-founded with a global cohort at MIT LaunchX.',
    result: '$785 in revenue across 4+ countries. A full ride at MIT LaunchX, in the top 8% of applicants.',
    tech: ['Game design', 'Entrepreneurship'],
    period: '2022',
    year: '2022',
    role: 'Co-founder',
    team: 'A global cohort at MIT LaunchX',
    link: GITHUB_PROFILE,
    tier: 'archive',
    glyph: 'Gamepad2',
  },
];

export const PROJECTS: readonly Project[] = PROJECT_DATA.map(withDesc);
