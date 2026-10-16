// The offline CLI's knowledge: commands, texts, guardrails and the free-text keyword table.
// Loaded with a dynamic import (lib/load-offline-knowledge.ts), never statically, so it stays out of
// the initial JS; the terminal preloads it on first open and when the browser is idle.
//
// Content rules (DESIGN-SPEC §A.6, the terminal KB): [public] and [interim] facts only, interim ones in
// the site's own hedged wording ("about", "~", "more than", "planned"). Never: phone, birth date or age,
// exact Sikahar coordinates, friends beyond first names, dates of upcoming trips or "on the trail now",
// Brndo's client or vendor names, CPI, Atlys internals, salary or start dates, GDG event figures, or
// anything the site hides. Asteroids are "detections". Plain text only: the UI renders `pre-wrap`.

/** A named sub-entry of a command, e.g. `projects divert`. `names[0]` is the canonical name. */
export interface OfflineEntry {
  readonly names: readonly string[];
  readonly text: string;
}

export type OfflineBuiltin = 'help' | 'ls' | 'cat' | 'open' | 'history' | 'clear' | 'exit';

export interface OfflineCommand {
  /** Canonical name, shown by `ls` and in suggestions. */
  readonly name: string;
  readonly aliases?: readonly string[];
  /** Printed when the command runs with no argument. */
  readonly text: string;
  readonly entries?: readonly OfflineEntry[];
  /** Listed by `ls` and readable with `cat`. */
  readonly section?: boolean;
  /** Not offered as a "did you mean" suggestion. */
  readonly hidden?: boolean;
  /** Words after the command are read as a question (`who is sahil`, `where did you trek`). */
  readonly followArgs?: boolean;
  /** Behaviour implemented by the resolver instead of a fixed text. */
  readonly builtin?: OfflineBuiltin;
}

/** A refusal or redirect checked before anything else; first match wins. */
export interface OfflineGuard {
  readonly pattern: RegExp;
  readonly reply: string;
}

/** Free text: the first pattern that matches runs `run` as if it were typed. */
export interface OfflineKeyword {
  readonly pattern: RegExp;
  readonly run: string;
}

export interface OfflinePage {
  readonly names: readonly string[];
  readonly path: string;
}

export interface OfflineKnowledge {
  readonly commands: readonly OfflineCommand[];
  readonly guards: readonly OfflineGuard[];
  readonly keywords: readonly OfflineKeyword[];
  readonly pages: readonly OfflinePage[];
  readonly replies: {
    /** Free text that matched nothing. */
    readonly unknown: string;
    /** Appended to "command not found". */
    readonly notFoundHint: string;
    readonly tooLong: string;
    readonly openNote: string;
  };
}

const t = (...rows: readonly string[]): string => rows.join('\n');

const EMAIL = 'amannbhv.cswork@gmail.com';

// Refusals keep the wording of the terminal's system-prompt rules (rules 9-17).
const REFUSE_PRIVATE = 'I keep that private. For anything personal, use the secure contact.';
const REFUSE_SYSTEM = "That's behind the scenes. Ask me about my work, treks or how I work remotely.";
const REFUSE_COMMIT = `I can't commit to anything from this terminal. Email me at ${EMAIL} and I'll reply myself.`;
const REFUSE_ACTION = `I can't send emails, book calls or forward messages from here. Email me at ${EMAIL} or use the secure contact.`;
const REFUSE_OPINION =
  "I don't rate or criticise employers, clients or the people I work with. I can tell you about my own work: try 'work'.";
const REFUSE_POLITICS = 'I keep politics and religion out of this terminal. Ask me about my work, treks or how I work remotely.';
const REFUSE_HARM = "That's not something I'll help with. Ask me about my work, treks or how I work remotely.";
const REFUSE_SELF_HARM =
  "I'm sorry you're going through that. Please reach out to someone you trust or a local crisis helpline right now.";
const REFUSE_ADVICE =
  "I'm not a doctor or a guide. At altitude, acclimatise slowly and trek with qualified guidance. I can tell you what my own treks looked like: try 'treks'.";
const REFUSE_ASSISTANT =
  "Offline, I only know about me. No homework, essays, translations or code here; ask how I built something instead, e.g. 'projects divert'.";
const ATLYS_PRIVATE =
  "Atlys specifics are not public. I build the AI brains and agents there on the Data, AI & Product team; that's what I can share.";

const HELP = t(
  "OFFLINE MODE: the AI isn't reachable right now, so I'm answering from built-in notes.",
  '',
  '> whoami          : who I am',
  "> now             : what I'm doing and looking for",
  "> work [name]     : where I've worked",
  "> projects [name] : what I've built",
  '> skills          : my stack',
  '> education       : KIIT and school',
  '> awards          : wins, with context',
  "> treks [name]    : where I've walked",
  '> astro           : the night sky',
  "> ventures        : what I've started",
  '> remote          : how I work',
  '> contact         : how to reach me',
  '> resume, socials : résumé and links',
  '> ls, cat <x>     : list and read sections',
  "> open <page>     : print a page's path",
  '> history, clear  : your commands, a clean screen',
  '',
  'Or just ask a question.',
);

const PROJECT_ENTRIES: readonly OfflineEntry[] = [
  {
    names: ['travstory', 'the-trav-story', 'trav-story', 'trav', 'thetravstory'],
    text: t(
      '>> THE TRAV STORY',
      'An AI travel platform that turns a conversation into a bookable itinerary. I co-founded it and built the stack: Next.js, FastAPI, LangChain, RAG over vector databases, Supabase PostgreSQL, Docker, GitHub Actions, Feature-Sliced Design.',
      'Result: Best Startup Idea, KIIT University.',
      'https://thetravstory.com',
    ),
  },
  {
    names: ['divert'],
    text: t(
      '>> DIVERT',
      'Clears a signal corridor for ambulances and fire trucks before they reach the junction. Dec 2025 to Apr 2026.',
      '- OSRM + PostGIS routing with diversions of about 800 m around congestion',
      '- Random Forest ETA per junction for signal pre-emption (XGBoost is in the stack too)',
      '- Dockerised FastAPI + Redis microservices, WebSocket tracking at about 500 ms',
      'Result: a working pipeline, built as the Smart City Infrastructure module of my minor project.',
    ),
  },
  {
    names: ['accolades'],
    text: t(
      '>> ACCOLADES',
      'An opportunity-discovery portal for student grants, fellowships and hackathons. Founder, Dec 2025 to present.',
      '- Next.js 14 + Supabase (PostgreSQL), server-rendered first load',
      '- A TypeScript ingestion pipeline into a normalised schema with strict unique constraints: zero duplicate listings by construction',
      '- Open Graph, XML sitemaps and schema.org Event JSON-LD',
      'https://accolades.site',
    ),
  },
  {
    names: ['oceanbot', 'ocean', 'marine'],
    text: t(
      '>> OCEANBOT',
      'Identifies marine species from photos and pulls coordinates out of field reports. Jul to Sep 2025.',
      '- InceptionV3 transfer learning: 98.87% validation accuracy across 31 species, 12 points above the baseline',
      '- 15+ regular expressions for coordinates, plus a Power BI dashboard',
      '- Runner-up (2nd rank) at the PIC conference',
      'https://www.kaggle.com/code/amananubhav/marine-ai',
    ),
  },
  {
    names: ['yvoo'],
    text: t(
      '>> YVOO',
      'Flags CIBIL-score and income fraud before a loan is approved. Sep to Dec 2025.',
      '- Synthesised behavioural datasets, EDA, and an XGBoost + logistic regression ensemble: 94% and 92% validation accuracy',
      '- Secured FastAPI endpoints, Docker, Render with auto-scaling',
      '- 1st rank at the PIC conference; Smart India Hackathon 2025 qualifier',
      'https://github.com/amanaanubhav/YVOO',
    ),
  },
  {
    names: ['kanad'],
    text: t(
      '>> KANAD',
      'Spots crop disease from a leaf photo with a CNN, and schedules irrigation from the weather with an LSTM on time-series data.',
      'Winner, New York Academy of Sciences Junior Academy challenge.',
    ),
  },
  {
    names: ['leetcode', 'leetsync', 'leetcode-sync'],
    text: t(
      '>> LEETCODE TO GITHUB',
      'A GitHub Actions workflow that archives every accepted LeetCode solution, daily at 11:55 PM IST plus manual dispatch, on the open-source joshcai/leetcode-sync action. Session cookies live in encrypted GitHub Secrets.',
      "The step-by-step guide is in my journal: type 'stories'.",
    ),
  },
  {
    names: ['site', 'website', 'amananubhav', 'terminal', 'portfolio'],
    text: t(
      '>> AMANANUBHAV.COM',
      'This site: Next.js App Router + Feature-Sliced Design.',
      '- This terminal: an AI assistant with automatic fallback, plus these offline notes when it is unreachable',
      '- A secure contact, encrypted in your browser (AES-GCM) and chained into a tamper-evident ledger',
      '- A visitor chat with email alerts',
    ),
  },
  {
    names: ['mario', 'mario-rl'],
    text: t(
      '>> MARIO-RL',
      'DDQN and PPO with Stable-Baselines3 on Gym Super Mario Bros, trained to expert-level play during MLSA Project Wing, 2024.',
      'https://github.com/amanaanubhav/Mario-RL',
    ),
  },
  {
    names: ['liquid', 'liquid-neural-networks', 'lnn'],
    text: t(
      '>> LIQUID NEURAL NETWORKS',
      'A research interest: ODE-based continuous-time recurrent networks for robotics and edge devices that adapt without retraining.',
    ),
  },
  {
    names: ['pavana'],
    text: t(
      '>> PAVANA',
      'Solar-powered CO2 capture, 2020 to present, early build. A cast-iron and copper gradient chamber runs on 250 to 400 °C differentials from concentrated solar heat.',
      "Projected from my models: $94 to $232 per tonne of CO2, against roughly $600 for today's direct air capture.",
    ),
  },
  {
    names: ['rakshak'],
    text: t(
      '>> RAKSHAK',
      'A bladeless river-flow energy harvester that lets fish pass safely. 2021 to 2022.',
      'Winner, 3M-CII Young Innovators Challenge.',
    ),
  },
  {
    names: ['vyomagami'],
    text: t(
      '>> VYOMAGAMI',
      "Research phase. A high-altitude balloon carries the launch vehicle to about 30 km, above roughly 99% of the atmosphere's mass, before ignition.",
      'My simulations estimate a 60 to 70% reduction in fuel mass and structural weight. Presented at SpaceOnova.',
    ),
  },
  {
    names: ['schrodinger', 'schroedinger', 'bekenstein'],
    text: t(
      '>> DEFYING THE SCHRÖDINGER EQUATION',
      'A school-age theory paper on locating an electron near the nucleus using the Bekenstein bound.',
      'An ambitious early exploration, not a result.',
    ),
  },
  {
    names: ['asteroids', 'asteroid', 'asteroid-search'],
    text: t(
      '>> ASTEROID SEARCH',
      '2020 to present. I analyse telescope image sets for moving objects with the International Astronomical Search Collaboration, a NASA-affiliated citizen-science program.',
      'Through DeuxStem: more than 20 asteroid detections, VT60 and UF78 among them.',
    ),
  },
  {
    names: ['sedu', 'launchx'],
    text: t(
      '>> SEDU',
      'A game-based health-education startup I co-founded with a global cohort at MIT LaunchX in 2022 (full ride, top 8% of applicants).',
      '$785 in revenue across 4+ countries.',
    ),
  },
];

const WORK_ENTRIES: readonly OfflineEntry[] = [
  {
    names: ['atlys'],
    text: t(
      '>> ATLYS',
      'AI Engineer, Data, AI & Product. Present.',
      'I build the AI brains and agents behind Atlys: systems that read documents and conversations, make a decision, and take the next step without a human in the loop.',
      'Atlys specifics are not public.',
    ),
  },
  {
    names: ['brndo'],
    text: t(
      '>> BRNDO',
      'E-Commerce Intern, SEO & SDE, at Brndo, an ads and marketing agency. Jun to Jul 2026, fully remote: my first remote role.',
      '- Moved brndo.in from WordPress to a Next.js app with SSR, Schema.org, Zoho CRM APIs and Meta Pixel lead tracking',
      "- Shopify Liquid product modals for a cricket-equipment brand's buyers",
      "- Predictive analysis that raised viewer engagement by 12% on a client's YouTube channel",
      "- WhatsApp flows that recovered 9.1% of abandoned checkouts and drove 21% of an e-commerce client's revenue",
    ),
  },
  {
    names: ['travstory', 'the-trav-story', 'trav-story', 'trav'],
    text: t(
      '>> THE TRAV STORY',
      'Co-founder & Lead Architect, Nov 2025 to present, Bhubaneswar.',
      'Multimodal LLM chatbots on LangChain and FastAPI, grounded with RAG over vector databases; the whole stack as cloud services over APIs, with Docker, GitHub Actions CI/CD and Supabase PostgreSQL.',
      'Best Startup Idea at KIIT University. https://thetravstory.com',
    ),
  },
  {
    names: ['deuxstem'],
    text: t(
      '>> DEUXSTEM',
      "Founder & CEO, 2020 to present. An ed-tech non-profit I started so students who, like me, didn't have a lab down the road get real STEM exposure.",
      '- An audience of more than 2 million; students in 10+ countries, on every continent',
      '- More than 20 asteroid detections with the NASA-affiliated IASC, VT60 and UF78 among them',
      "- Commendations from NASA, the Canadian Space Agency and Germany's DLR",
    ),
  },
  {
    names: ['gdg', 'gdg-kiit'],
    text: t(
      '>> GDG KIIT',
      'Growth Specialist and organizer, 2024 to present. Top 8% of the growth team: marketing, outreach and sponsors for the Breaking an LLM symposium, the chapter\'s largest hackathons, and mentoring students in cloud and AI.',
    ),
  },
  {
    names: ['startup-grind', 'startupgrind'],
    text: t(
      '>> STARTUP GRIND KIIT',
      'Founding team, late 2025 to present: selected to the founding team building the campus startup community, with founder talks.',
    ),
  },
  {
    names: ['mlsa', 'project-wing'],
    text: t(
      '>> MLSA PROJECT WING',
      'Microsoft Learn Student Ambassadors, 2024, 6 months. Trained DQN and PPO agents with Stable-Baselines3 to play Super Mario Bros at expert level, and taught AI, ML and cloud basics to peers.',
    ),
  },
  {
    names: ['elabs', 'e-labs'],
    text: t('>> E-LABS', 'AI/ML Researcher, 2023 to 2024. Guided student AI/ML research projects and mentored juniors.'),
  },
];

const TREK_ENTRIES: readonly OfflineEntry[] = [
  {
    names: ['annapurna', 'annapurna-circuit', 'tilicho', 'ice-lake', 'manang', 'nepal'],
    text: t(
      '>> ANNAPURNA CIRCUIT',
      'Manang and Mustang, Nepal. 2026, solo and self-supported: 14 days, 250 km, an 18 kg pack.',
      '- Route: Besisahar ~760 m, Chame ~2,670 m, Manang ~3,540 m, Thorong Phedi ~4,450 m, Thorong La 5,416 m, Muktinath ~3,760 m',
      '- From Manang: Ice Lake as an acclimatisation climb, then Tilicho Lake at about 4,919 m, one of the highest lakes in the world',
      '"I\'m capable of more than I plan for, if I plan well."',
    ),
  },
  {
    names: ['thorong', 'thorong-la'],
    text: t(
      '>> THORONG LA, 5,416 m',
      'The high point of my solo Annapurna Circuit in 2026, and my highest pass so far: up from Thorong Phedi (~4,450 m), down to Muktinath (~3,760 m), with an 18 kg pack.',
      "Type 'treks annapurna' for the whole route.",
    ),
  },
  {
    names: ['kun-tso', 'kun', 'kuntso', 'sikkim'],
    text: t(
      '>> KUN TSO',
      'A winter climb in North Sikkim, Nov 2025. From Zero Point, Yumesamdong, at 4,600 m to Kun Tso at 5,000 m: 400 m of gain through waist-deep snow, with my boots wrapped in duct tape.',
    ),
  },
  {
    names: ['chandrashila', 'tungnath', 'chopta', 'deoriatal'],
    text: t(
      '>> CHANDRASHILA',
      'Rudraprayag, Uttarakhand. Solo, 2026: my most recent trek.',
      'Deoriatal ~2,438 m, Rohini Bugyal, Chopta ~2,680 m, Tungnath ~3,680 m, Chandrashila summit ~4,000 m.',
      'Entry coming.',
    ),
  },
  {
    names: ['himachal', 'triund', 'kheerganga', 'yulla-kanda', 'yulla'],
    text: t(
      '>> HIMACHAL TRAILS',
      '- Triund, Kangra: ~2,850 m',
      '- Kheerganga, Parvati Valley: ~2,950 m',
      '- Yulla Kanda, Kinnaur: ~3,900 m',
    ),
  },
  {
    names: ['next', 'dodital', 'darwa', 'darwa-top'],
    text: t(
      '>> NEXT UP',
      'Dodital, a lake in the forests above Uttarkashi, and Darwa Top (~4,100 m), Uttarakhand. Planned.',
      "Journal entries when I'm back.",
    ),
  },
];

const COMMANDS: readonly OfflineCommand[] = [
  { name: 'help', aliases: ['h', '?', 'commands', 'man', 'menu'], text: HELP, builtin: 'help' },
  {
    name: 'about',
    followArgs: true,
    aliases: ['whoami', 'who', 'bio', 'intro', 'aman', 'profile'],
    section: true,
    text: t(
      '>> WHOAMI',
      'Aman Kumar Anubhav (Aman Anubhav). AI engineer at Atlys, building AI agents on the Data, AI & Product team, and a solo, self-supported Himalayan trekker: Thorong La, 5,416 m.',
      '- Based in Bhubaneswar, India; from Sikahar, Bihar',
      '- B.Tech in Mathematics and Computer Science, KIIT University, 2027 (expected)',
      '- Open to remote roles',
      '',
      '"Everything I need, I carry." Try \'work\', \'projects\' or \'treks\'.',
    ),
  },
  {
    name: 'now',
    aliases: ['today', 'current'],
    section: true,
    text: t(
      '>> NOW',
      '- AI engineer at Atlys, Data, AI & Product: building AI agents',
      '- Co-founder & Lead Architect, The Trav Story; founder of Accolades; DeuxStem keeps running',
      '- Finishing my B.Tech at KIIT University, 2027 (expected)',
      '- Looking for a remote AI engineering role on a team that trusts people with outcomes',
      '',
      "Next trek: Dodital and Darwa Top, planned. Journal entries when I'm back.",
    ),
  },
  {
    name: 'work',
    aliases: ['experience', 'exp', 'jobs', 'career'],
    section: true,
    entries: WORK_ENTRIES,
    text: t(
      '>> WORK',
      '- atlys         : AI Engineer, Data, AI & Product (present)',
      '- brndo         : E-Commerce Intern, SEO & SDE (Jun to Jul 2026, remote)',
      '- travstory     : Co-founder & Lead Architect, The Trav Story (Nov 2025 to present)',
      '- deuxstem      : Founder & CEO (2020 to present)',
      '- gdg           : Growth Specialist and organizer, GDG KIIT (2024 to present)',
      '- startup-grind : founding team, Startup Grind KIIT (late 2025 to present)',
      '- mlsa          : Project Wing, Microsoft Learn Student Ambassadors (2024)',
      '- elabs         : AI/ML Researcher, E-Labs (2023 to 2024)',
      '',
      "Type 'work <name>', e.g. 'work brndo'.",
    ),
  },
  {
    name: 'projects',
    aliases: ['project', 'proj', 'builds'],
    section: true,
    entries: PROJECT_ENTRIES,
    text: t(
      '>> PROJECTS',
      '- travstory : AI travel platform (The Trav Story)',
      '- divert    : signal corridors for ambulances',
      '- accolades : student opportunity search',
      '- oceanbot  : marine species classifier, 98.87%',
      '- yvoo      : loan fraud detection',
      '- kanad     : crop disease + irrigation',
      'Archive: leetcode, site, mario, liquid, pavana, rakshak, vyomagami, schrodinger, asteroids, sedu',
      '',
      "Type 'projects <name>', e.g. 'projects divert'.",
    ),
  },
  {
    name: 'skills',
    aliases: ['stack', 'tech', 'techstack', 'tools'],
    section: true,
    text: t(
      '>> STACK',
      '[DAILY] Python, TypeScript, FastAPI, Next.js, PostgreSQL, Docker, LangChain',
      '[LANG]  Python, TypeScript, SQL, C/C++, JavaScript',
      '[AI/ML] AI agents, RAG + vector DBs, PyTorch, TensorFlow, scikit-learn, XGBoost, CNNs, LSTMs, transfer learning, RL (DQN, PPO)',
      '[WEB]   React, Node.js, PostGIS, Redis, Supabase, Firebase, WebSockets, OSRM, Tailwind CSS',
      '[OPS]   GitHub Actions, Kafka, Jenkins, GCP, Vercel, Render, MLOps',
      '[TOOLS] Git, Power BI, Kaggle, Google Colab, Figma, LaTeX',
    ),
  },
  {
    name: 'education',
    aliases: ['edu', 'school', 'college', 'university', 'study', 'kiit'],
    section: true,
    text: t(
      '>> EDUCATION',
      '- KIIT University: B.Tech in Mathematics and Computer Science, 2027 (expected). Focus: computational mathematics, distributed backends, ML pipelines, graph and spatial algorithms',
      '- Delhi Public School: high school with a computer science focus, 2019 to 2023. Competitive programming and my first real software',
    ),
  },
  {
    name: 'awards',
    aliases: ['achievements', 'honors', 'honours', 'wins', 'prizes'],
    section: true,
    text: t(
      '>> AWARDS',
      '- New York Academy of Sciences, Junior Academy: Winner (KANAD)',
      '- Best Startup Idea, KIIT University (The Trav Story)',
      '- Smart India Hackathon 2025: national qualifier (YVOO)',
      '- PIC conference: YVOO 1st, OceanBot runner-up',
      '- MIT LaunchX 2022: full ride, top 8% of applicants',
      '- 3M-CII Young Innovators Challenge: Winner (RAKSHAK)',
      '- UNNOVATION, XIM Bhubaneswar: Winner; IIT Bombay E-Summit: Finalist',
      '- 20+ asteroid detections with the NASA-affiliated IASC',
      '- Commendations from NASA, CSA and DLR for DeuxStem',
      '- Featured by Global Indian: "The Bihar teen who impressed NASA"',
      'The full register: /achievements',
    ),
  },
  {
    name: 'treks',
    aliases: ['trek', 'expeditions', 'expedition', 'trips', 'hikes', 'atlas', 'trails'],
    section: true,
    entries: TREK_ENTRIES,
    text: t(
      '>> TREKS',
      'Solo and self-supported: my own tent, stove and food, and my own decision about when the weather says no.',
      '- annapurna    : Annapurna Circuit, Nepal, 2026, solo. Thorong La 5,416 m',
      '- kun-tso      : Kun Tso winter climb, North Sikkim. 5,000 m',
      '- chandrashila : Chandrashila, Uttarakhand, 2026, solo. Summit ~4,000 m',
      '- himachal     : Triund, Kheerganga, Yulla Kanda',
      '- next         : Dodital and Darwa Top, planned',
      'Six treks done. Highest 5,416 m, longest 250 km, heaviest pack 18 kg.',
      '',
      "Type 'treks <name>', e.g. 'treks thorong'.",
    ),
  },
  {
    name: 'astro',
    aliases: ['sky', 'stars', 'astrophotography', 'stargazing', 'night-sky'],
    section: true,
    text: t(
      '>> NIGHT SKY',
      'It started on a village roof in Sikahar, Bihar (25° N), where the nights were dark enough to see the Milky Way: the best screen in town.',
      '- On treks and dark-sky nights I shoot the Milky Way and star fields',
      '- Through DeuxStem: more than 20 asteroid detections with the NASA-affiliated IASC, VT60 and UF78 among them',
      "Try 'projects asteroids' or 'origin'.",
    ),
  },
  {
    name: 'ventures',
    aliases: ['startups', 'business', 'founder'],
    section: true,
    text: t(
      '>> VENTURES',
      '- The Trav Story: co-founder, AI travel platform, Nov 2025 to present. Best Startup Idea at KIIT',
      '- Accolades: founder, student opportunity search, Dec 2025 to present. https://accolades.site',
      '- DeuxStem: founder & CEO, ed-tech non-profit, 2020 to present. 2M+ audience in 10+ countries',
      '- Sedu: co-founder at MIT LaunchX 2022, game-based health education. $785 in revenue across 4+ countries',
    ),
  },
  {
    name: 'remote',
    aliases: ['hire', 'hiring', 'availability', 'available', 'looking'],
    section: true,
    text: t(
      '>> REMOTE',
      "Open to remote roles. I'm looking for a remote AI engineering role on a team that trusts people with outcomes: AI engineer, applied ML engineer, LLM and agent systems, or backend for AI products.",
      '- Time zone: IST, UTC+5:30',
      '- Proof: two fully remote months at Brndo in 2026, my most productive stretch so far',
      '- I own the whole path, I write it down, I manage myself',
      "Hiring remotely? I'd like to hear what you're building: type 'contact'.",
    ),
  },
  {
    name: 'sports',
    aliases: ['fitness', 'training', 'discipline', 'boxing', 'gym'],
    section: true,
    text: t(
      '>> DISCIPLINE',
      'I train for thin air.',
      '- Strength: an 18 kg pack at 5,000 m is a strength problem first',
      '- Running, for the lungs and the head',
      '- Boxing: footwork, conditioning, staying calm under pressure',
      "- Swimming for recovery; football and basketball whenever there's a team",
      '- Alpine climbs, solo, with my own kit',
      '- Next on the list: learning to surf',
    ),
  },
  {
    name: 'origin',
    aliases: ['sikahar', 'roots', 'hometown', 'story'],
    section: true,
    text: t(
      '>> ORIGIN',
      "I didn't inherit talent. I built it.",
      'Born in Sikahar, a village in Bihar (25° N), where the nights were dark enough to see the Milky Way from the roof. The habit from that roof: find a question that is too big, then build something small enough to start answering it.',
      'Now based in Bhubaneswar, India.',
    ),
  },
  {
    name: 'rides',
    aliases: ['ride', 'roadtrips', 'road-trips', 'motorcycle', 'bike'],
    section: true,
    text: t(
      '>> RIDES',
      'Two wheels, open road: long motorcycle trips on open highways. My most-repeated drive is Bhubaneswar to the coast at Puri, Odisha, for sea air and a reset; I also ride out to Chandaka.',
    ),
  },
  {
    name: 'friends',
    aliases: ['circle', 'crew'],
    section: true,
    text: t(
      '>> FRIENDS',
      'Most of my trips are solo, but not all. Sahil and Arpit are the two who show up for anything; Sahil has been with me across Sikkim, the Chandaka forest outside Bhubaneswar, and Bengal.',
    ),
  },
  {
    name: 'pack',
    aliases: ['gear', 'backpack', 'kit'],
    section: true,
    text: t(
      '>> THE PACK',
      '18 kg, everything included: shelter, kitchen, food, clothing, water treatment, navigation and first aid.',
      'Everything I need, I carry.',
    ),
  },
  {
    name: 'stories',
    aliases: ['journal', 'notes', 'field-notes', 'blog', 'posts'],
    section: true,
    text: t(
      '>> JOURNAL',
      'Trip reports, build logs and the occasional how-to:',
      '- 250 km Alone on the Annapurna Circuit',
      '- Duct Tape at 5,000 m: Kun Tso in Winter',
      '- LeetCode to GitHub, Automated',
      '- Asteroids from a Village Roof',
      '- VYOMAGAMI: Launching Above the Air',
      '- PAVANA: Carbon Capture on Sunlight',
      'Read them at /stories#adventures.',
    ),
  },
  {
    name: 'contact',
    aliases: ['email', 'mail', 'reach'],
    section: true,
    text: t(
      '>> CONTACT',
      `[EMAIL]    ${EMAIL}`,
      '[LINKEDIN] https://www.linkedin.com/in/amananubhav',
      '[GITHUB]   https://github.com/amanaanubhav',
      '[SECURE]   the secure contact on this site, encrypted in your browser before it is stored',
      '',
      "For anything private, use the secure contact. Type 'socials' for the rest.",
    ),
  },
  {
    name: 'resume',
    aliases: ['cv', 'resume.pdf'],
    section: true,
    text: t(
      '>> RÉSUMÉ',
      'https://drive.google.com/drive/folders/1fj8BIHpUcvZEpkfAyvdmK_Ke8jpmRNDv?usp=sharing',
      "The site's Résumé button opens the same folder.",
    ),
  },
  {
    name: 'socials',
    aliases: ['links', 'social', 'linkedin', 'github', 'kaggle', 'instagram'],
    section: true,
    text: t(
      '>> SOCIALS',
      '[LINKEDIN]  https://www.linkedin.com/in/amananubhav',
      '[GITHUB]    https://github.com/amanaanubhav',
      '[KAGGLE]    https://www.kaggle.com/amananubhav',
      '[INSTAGRAM] https://www.instagram.com/amansanubhav/',
      '[PRESS]     https://www.globalindian.com/youth/story/cover-story/aman-anubhav-the-bihar-teen-impresses-nasa/',
    ),
  },
  { name: 'ls', aliases: ['dir', 'sections', 'll'], text: '', builtin: 'ls' },
  { name: 'cat', aliases: ['less', 'more', 'read', 'show'], text: '', builtin: 'cat' },
  { name: 'open', aliases: ['cd', 'goto', 'go'], text: '', builtin: 'open' },
  { name: 'history', aliases: ['hist'], text: '', builtin: 'history' },
  { name: 'clear', aliases: ['cls'], text: '', builtin: 'clear' },
  { name: 'exit', aliases: ['quit', 'logout', 'close'], text: '', builtin: 'exit' },
  {
    name: 'status',
    aliases: ['ping', 'uptime'],
    text: t('STATUS', '> AI: unreachable', '> Offline notes: loaded', "> I'll keep answering from my notes. Type 'help'."),
  },
  {
    name: 'location',
    followArgs: true,
    aliases: ['where', 'whereami', 'based'],
    hidden: true,
    text: 'Based in Bhubaneswar, India; from Sikahar, Bihar (25° N). Open to remote roles, on IST (UTC+5:30). My exact address stays private.',
  },
  { name: 'pwd', hidden: true, text: '/home/aman' },
  {
    name: 'bot',
    hidden: true,
    text: "This is a terminal on my site. The AI is offline right now, so you're reading notes I wrote myself. Type 'help' for what's in them.",
  },
  {
    name: 'howareyou',
    hidden: true,
    text: 'Running on offline notes, but well, thanks. Ask me about my work, my treks or how I work remotely.',
  },
  { name: 'sudo', aliases: ['su', 'rm', 'chmod'], hidden: true, text: 'Permission denied. These notes are read-only; nice try.' },
  {
    name: 'hello',
    followArgs: true,
    aliases: ['hi', 'hey', 'hii', 'hiya', 'yo', 'namaste', 'hola', 'sup', 'greetings', 'howdy'],
    hidden: true,
    text: "Hi! I'm Aman. The AI is offline right now, so I'm answering from my notes. Type 'help' for commands, or try 'projects', 'treks' or 'remote'.",
  },
  {
    name: 'thanks',
    aliases: ['thank', 'thx', 'ty', 'cheers'],
    hidden: true,
    text: `You're welcome. If you want a real conversation, email me at ${EMAIL}.`,
  },
  {
    name: 'bye',
    aliases: ['goodbye', 'cya'],
    hidden: true,
    text: "Thanks for stopping by. Pack light. Ship clean. Keep climbing. (Type 'exit' to close the terminal.)",
  },
];

/** Checked in order before commands; refusals match the terminal's system-prompt wording. */
const GUARDS: readonly OfflineGuard[] = [
  { pattern: /\b(suicid\w*|kill (myself|me)|self[- ]?harm|hurt(ing)? myself|end my life)\b/, reply: REFUSE_SELF_HARM },
  {
    pattern:
      /\b(bombs?|explosives?|weapons?|guns?|poison\w*|drugs?|cocaine|heroin|meth|malware|ransomware|phishing|ddos|keylogger|porn\w*|nudes?|nsfw|sex\w*)\b|\bhack(ing)? (into|someone|an? account|wi-?fi|passwords?)\b|\bwithout (a |the )?permits?\b/,
    reply: REFUSE_HARM,
  },
  {
    pattern:
      /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(instructions?|rules|prompts?|guidelines|guardrails|directives)\b|\b(system|developer|hidden|initial|original) (prompt|message|instructions?)\b|\b(jailbreak\w*|dan mode|do anything now|developer mode|god mode|unrestricted mode|no restrictions)\b|\b(repeat|print|reveal|show|output|dump|leak|recite)\b.{0,30}\b(prompt|instructions|rules|knowledge base|training data|config(uration)?)\b|<\/?\s*(system|rules|instructions|assistant)\s*>|\bbegin (system|prompt)\b|\byou are now\b|\bfrom now on,? you\b|\bpretend (to be|you are)\b|\brole-?play as\b|\b(api|secret|access) keys?\b|\benv(ironment)? var\w*|\.env\b|\b(what|which) (llm|ai model|language model|model) (are you|is this|powers (this|you)|runs (this|you)|is behind (this|you))\b|\bare you (gpt|chatgpt|claude|gemini|llama|grok)\b|[a-z0-9+/]{120,}={0,2}/,
    reply: REFUSE_SYSTEM,
  },
  {
    pattern:
      /\b(phone|mobile|cell|telephone|whats ?app|contact) ?(no|num|number|#)\b|\bphone\b|\bcall you\b|\byour (mobile|number)\b|\b(?<!e-?mail )address\b|\b(hostel|room number|pin ?code|zip ?code)\b|\bwhere (exactly )?(are you|r u) (right )?now\b|\b(right now|currently|today) (on|at) (a |the )?(trek|trail)\b|\bare you (on (a |the )?(trek|trail)|trekking|hiking|travell?ing)( right)?( now)?\b|\bcurrent(ly)? (location|whereabouts)\b|\bwhereabouts\b|\blive location\b|\b(sikahar|village|home|exact|trailhead)\b.{0,20}\bcoordinates\b|\bcoordinates of (sikahar|your|the trailhead|dodital)\b|\b(how old|your age|birthday|birth ?date|date of birth|dob|birth year|when were you born|year (were you|you were) born)\b|\bage\b|\b(c?gpa|sgpa|cpi|grades?|marks|percentile)\b|\b(salary|ctc|compensation|stipend|pay ?(scale|range|expectations?)|expected pay|hourly rate|day rate|your rates?|notice period|start date|when can you (start|join)|relocat\w*)\b|\b(clients?|customers?|vendors?)\b.{0,30}\b(names?|called|who|which)\b|\b(names?|which|who)\b.{0,30}\b(clients?|customers?|vendors?|cricket[- ](equipment )?brand|whatsapp (marketing )?platform|youtube channel|e-?commerce (client|brand|company))\b|\b(sahil|arpit|friends?)\b.{0,30}\b(surnames?|last names?|family names?|full names?)\b|\b(surnames?|last names?|family names?|full names?)\b.{0,20}\b(sahil|arpit|friends?)\b|\b(sahil|arpit)\b.{0,30}\b(instagram|handle|photos?|number|phone|contact)\b|\bwhen (are|will|do) you (go|going|leav\w*|start\w*|head\w*|trek\w*|travel\w*)\b|\b(dates?|when)\b.{0,30}\b(dodital|darwa|next (trek|trip)|upcoming)\b|\b(dodital|darwa|next (trek|trip)|upcoming (trek|trip))\b.{0,30}\b(dates?|when|leav\w*|depart\w*)\b|\b(girlfriend|boyfriend|married|wife|husband|dating|relationship status|are you single|parents'? names?|father'?s? name|mother'?s? name)\b/,
    reply: REFUSE_PRIVATE,
  },
  {
    pattern:
      /\batlys\b.{0,40}\b(join(ed)?|start(ed)?|since|salary|stipend|ctc|customers?|clients?|revenue|metrics?|numbers|internal|team ?mates?|colleagues?|manager|policy|intern(ship)?|full[- ]?time|screenshots?|confidential)\b|\b(when did you|since when)\b.{0,30}\batlys\b/,
    reply: ATLYS_PRIVATE,
  },
  {
    pattern:
      /\b(promise|guarantee|commit|agree|accept|confirm)\b.{0,40}\b(interview|offer|job|salary|rate|start(ing)?|join(ing)?|deadline|nda|contract|reference|position|work for)\b|\b(will|can|would) you (accept|join|sign|take)\b.{0,20}\b(offer|job|role|position|contract|nda)\b|\bwrite (me )?an? (reference|recommendation)\b|\bsay (that )?you('ll| will)? (start|join|accept)\b/,
    reply: REFUSE_COMMIT,
  },
  {
    pattern:
      /\b(send|forward|pass|deliver|relay)\b.{0,20}\b(this|that|it|my message|a message|him|to aman)\b|\bemail (this|that|it|him|aman)\b|\b(book|schedule|set up|arrange)\b.{0,10}\b(call|meeting|interview|chat|slot)\b|\btell aman\b|\bleave (a |him a )?message\b/,
    reply: REFUSE_ACTION,
  },
  {
    pattern:
      /\b(hate|dislike|worst|toxic|scam\w*|gossip|complain\w*|honest opinion|badmouth)\b.{0,40}\b(atlys|brndo|kiit|co-?founders?|team ?mates?|colleagues?|manager|boss|employers?|company|clients?)\b|\b(atlys|brndo|kiit|co-?founders?|manager|boss|employers?)\b.{0,40}\b(hate|dislike|worst|toxic|scam\w*|gossip|sucks?)\b/,
    reply: REFUSE_OPINION,
  },
  { pattern: /\b(elections?|politic\w*|vote|voting|religio\w*|caste)\b/, reply: REFUSE_POLITICS },
  {
    pattern:
      /\b(altitude sickness|ams|diamox|hape|hace|dosage|medical advice|medication)\b|\bis it safe (for me )?to (trek|climb|go)\b|\bshould i (take diamox|trek|climb|ascend)\b/,
    reply: REFUSE_ADVICE,
  },
  {
    pattern:
      /(?<!\b(did|do|does|how|when|why) (you|he|aman) )\b(write|solve|debug|fix|draft|generate|create|build|make) (me |my |a |an |this |the |some ){0,2}([\w+#.-]+ ){0,2}(essays?|homework|assignments?|poems?|code|programs?|scripts?|functions?|components?|apps?|websites?|cover letters?|sql|regex|leetcode problems?)\b|\b(do|finish) my (homework|assignment)\b|\btranslate\b|\bhomework\b|\bwhat is \d+ ?[-+*/x] ?\d+/,
    reply: REFUSE_ASSISTANT,
  },
];

/** Free text to the closest section. Specific names first, broad topics last. */
const KEYWORDS: readonly OfflineKeyword[] = [
  { pattern: /^(hi+|hello|hey+|yo|namaste|hola|sup|howdy|greetings|good (morning|afternoon|evening))\b/, run: 'hello' },
  { pattern: /^(thanks|thank you|thx|ty|cheers)\b/, run: 'thanks' },
  { pattern: /\bhow (are|r) (you|u)\b/, run: 'howareyou' },
  { pattern: /\bthorong\b/, run: 'treks thorong' },
  { pattern: /\b(annapurna|tilicho|ice lake|manang|muktinath|nepal)\b/, run: 'treks annapurna' },
  { pattern: /\b(kun ?tso|zero point|duct tape|sikkim)\b/, run: 'treks kun-tso' },
  { pattern: /\b(chandrashila|tungnath|chopta|deoriatal)\b/, run: 'treks chandrashila' },
  { pattern: /\b(triund|kheerganga|yulla|himachal)\b/, run: 'treks himachal' },
  { pattern: /\b(dodital|darwa|next (trek|trip|adventure)|upcoming (trek|trip))\b/, run: 'treks next' },
  { pattern: /\btrav ?story\b/, run: 'projects travstory' },
  { pattern: /\b(divert|ambulances?|emergency vehicles?|fire trucks?)\b/, run: 'projects divert' },
  { pattern: /\baccolades\b/, run: 'projects accolades' },
  { pattern: /\b(yvoo|cibil|loan fraud)\b/, run: 'projects yvoo' },
  { pattern: /\b(ocean ?bot|marine)\b/, run: 'projects oceanbot' },
  { pattern: /\b(kanad|crops?|irrigation)\b/, run: 'projects kanad' },
  { pattern: /\bleetcode\b/, run: 'projects leetcode' },
  { pattern: /\b(mario|reinforcement learning)\b/, run: 'projects mario' },
  { pattern: /\bliquid\b/, run: 'projects liquid' },
  { pattern: /\b(pavana|carbon capture|co2)\b/, run: 'projects pavana' },
  { pattern: /\brakshak\b/, run: 'projects rakshak' },
  { pattern: /\b(vyomagami|balloon|rocket)\b/, run: 'projects vyomagami' },
  { pattern: /\b(schr(o|oe)dinger|bekenstein)\b/, run: 'projects schrodinger' },
  { pattern: /\b(sedu|launchx)\b/, run: 'projects sedu' },
  { pattern: /\b(asteroids?|vt60|uf78|iasc)\b/, run: 'projects asteroids' },
  { pattern: /\b(this|the|your) (site|website|portfolio|terminal)\b|\bamananubhav\.com\b/, run: 'projects site' },
  { pattern: /\batlys\b/, run: 'work atlys' },
  { pattern: /\bbrndo\b/, run: 'work brndo' },
  { pattern: /\b(deuxstem|nasa)\b/, run: 'work deuxstem' },
  { pattern: /\b(gdg|google developer)/, run: 'work gdg' },
  { pattern: /\bstartup grind\b/, run: 'work startup-grind' },
  { pattern: /\b(mlsa|student ambassadors?|project wing)\b/, run: 'work mlsa' },
  { pattern: /\be-?labs\b/, run: 'work elabs' },
  { pattern: /\bare you (an? )?(ai|bot|robot|real|human|llm)\b|\bwho am i (talking|speaking) to\b/, run: 'bot' },
  { pattern: /\b(current|present) (role|job|position|work)\b|\bwhere do you work\b/, run: 'work atlys' },
  { pattern: /\b(remote\w*|hir(e|ing)|recruit\w*|open to (work|roles)|availab\w*|looking for|opportunit\w*|job|roles?|position)\b/, run: 'remote' },
  { pattern: /\b(resume|cv)\b/, run: 'resume' },
  { pattern: /\b(contact|e-?mail|reach (you|out)|get in touch|message you|talk to you)\b/, run: 'contact' },
  { pattern: /\b(linkedin|github|kaggle|instagram|socials?|links?)\b/, run: 'socials' },
  { pattern: /\b(skills?|stack|tech\w*|languages?|frameworks?|tools|python|typescript|pytorch|langchain|fastapi)\b/, run: 'skills' },
  { pattern: /\b(educat\w*|college|universit\w*|kiit|school|degree|b\.?tech|stud(y|ying)|graduat\w*|major)\b/, run: 'education' },
  { pattern: /\b(awards?|achievements?|honou?rs?|won|win|wins|winner|prizes?|hackathons?|competitions?|recogni\w*)\b/, run: 'awards' },
  { pattern: /\b(ventures?|startups?|found(ed|er)|business|entrepreneur\w*)\b/, run: 'ventures' },
  { pattern: /\b(stars?|astro\w*|night sky|milky way|telescopes?|space|galax\w*)\b/, run: 'astro' },
  { pattern: /\b(treks?|trekking|hik(e|es|ing)|expeditions?|mountains?|himalaya\w*|summits?|climb\w*|altitudes?|passes)\b/, run: 'treks' },
  { pattern: /\b(pack|gear|backpack|carry)\b/, run: 'pack' },
  { pattern: /\b(sports?|fitness|training|workouts?|gym|boxing|running|swim\w*|football|basketball|surf\w*|exercise|strength)\b/, run: 'sports' },
  { pattern: /\b(rides?|riding|bikes?|motorcycles?|road ?trips?|puri|chandaka)\b/, run: 'rides' },
  { pattern: /\b(friends?|sahil|arpit)\b/, run: 'friends' },
  { pattern: /\b(origin|sikahar|bihar|grew up|hometown|childhood|village|roots)\b|\bwhere (are you|r u) from\b/, run: 'origin' },
  { pattern: /\bwhere (are you|r u) (based|located)\b|\b(location|city)\b|\bwhere do you (live|stay)\b/, run: 'location' },
  { pattern: /\b(stories|journal|field notes?|blog|articles?|write-?ups?)\b/, run: 'stories' },
  { pattern: /\b(projects?|built|build|made|portfolio)\b/, run: 'projects' },
  { pattern: /\b(experience|work\w*|career|internships?|intern|employ\w*|compan(y|ies))\b/, run: 'work' },
  { pattern: /\bwhat'?s next\b|\bwhat (are you|r u) (doing|up to|working on)\b|\b(currently|these days|nowadays|now)\b/, run: 'now' },
  { pattern: /\bwho (are|r) (you|u)\b|\babout (you|yourself|aman)\b|\byourself\b|\bintroduc\w*\b|\baman\b|\b(your|full) name\b/, run: 'about' },
  { pattern: /\b(help|commands?|options|menu)\b|\bwhat can (you|i)\b/, run: 'help' },
];

const PAGES: readonly OfflinePage[] = [
  { names: ['home', '~', '/'], path: '/' },
  { names: ['professional', 'work-page', 'career'], path: '/professional' },
  { names: ['experience', 'work'], path: '/professional#experience' },
  { names: ['remote', 'how-i-work'], path: '/professional#remote' },
  { names: ['skills', 'stack', 'techstack'], path: '/professional#techstack' },
  { names: ['projects'], path: '/professional#projects' },
  { names: ['honors', 'honours'], path: '/professional#achievements' },
  { names: ['personal', 'life'], path: '/personal' },
  { names: ['origin', 'about'], path: '/personal#about' },
  { names: ['stem', 'early-builds'], path: '/personal#stem' },
  { names: ['sports', 'discipline', 'athletics'], path: '/personal#athletics' },
  { names: ['astro', 'sky'], path: '/personal#sky' },
  { names: ['ventures', 'business'], path: '/personal#business' },
  { names: ['album', 'gallery', 'photos'], path: '/personal#gallery' },
  { names: ['stories', 'treks'], path: '/stories' },
  { names: ['atlas'], path: '/stories#atlas' },
  { names: ['pack', 'gear'], path: '/stories#pack' },
  { names: ['journal', 'notes', 'field-notes', 'adventures'], path: '/stories#adventures' },
  { names: ['achievements', 'awards'], path: '/achievements' },
  { names: ['archive', 'project-archive'], path: '/project-archive' },
  { names: ['resume', 'cv'], path: 'https://drive.google.com/drive/folders/1fj8BIHpUcvZEpkfAyvdmK_Ke8jpmRNDv?usp=sharing' },
];

export const OFFLINE_KNOWLEDGE: OfflineKnowledge = {
  commands: COMMANDS,
  guards: GUARDS,
  keywords: KEYWORDS,
  pages: PAGES,
  replies: {
    unknown: `I haven't written that down here yet. Ask me directly at ${EMAIL} or through the secure contact. Type 'help' for what I can answer offline.`,
    notFoundHint: "Type 'help' for the list.",
    tooLong: "That's longer than I can read offline. Ask in a sentence or two, or type 'help'.",
    openNote: "Offline, so I'm only printing the path: close the terminal (Esc) and go there from the navbar.",
  },
};
