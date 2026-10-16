import type { ExperienceEntry } from './types';

/**
 * [S-PRO-EXPERIENCE], newest first. `[TBD]` facts are left out; `[CONFIRM]` facts use the deck's
 * interim text. Brndo's clients are not named until Q-80 (neutral fallbacks below).
 */
export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    id: 'atlys',
    // Q-10 interim
    role: 'AI Engineer, Data, AI & Product',
    org: 'Atlys',
    time: 'Present',
    detail:
      'I build the AI brains and agents behind Atlys: systems that read documents and conversations, make a decision, and take the next step without a human in the loop.',
    oneLiner: 'Building AI agents on the Data, AI & Product team.',
  },
  {
    id: 'brndo',
    role: 'E-Commerce Intern, SEO & SDE',
    org: 'Brndo · Ads and marketing',
    time: 'Jun 2026 — Jul 2026',
    start: '2026-06',
    end: '2026-07',
    mode: 'remote',
    detail:
      'My first fully remote role: two months at Brndo, an ads and marketing agency, working across SEO, web engineering and e-commerce growth for Brndo and its clients.',
    bullets: [
      "Migrated brndo.in from WordPress to a Next.js single-page app built with Tailwind and React, integrated Zoho CRM's APIs, added server-side rendering and Schema.org markup for SEO, and set up Meta Pixel to track inbound leads through the pipeline.",
      "Built Shopify Liquid product modals that give a cricket-equipment brand's buyers a clean, uncluttered product view.",
      "Ran predictive analysis on a client's YouTube channel metrics and raised viewer engagement by 12%.",
      // Q-80 fallback: the vendor platform stays unnamed until Aman confirms it.
      "Built flows on a WhatsApp marketing platform from website behaviour and user segments, then ran targeted reminder campaigns that recovered 9.1% of abandoned checkouts and drove 21% of an e-commerce client's revenue.",
    ],
    stack: [
      'Next.js',
      'React',
      'Tailwind CSS',
      'Shopify Liquid',
      'Meta Pixel',
      'Google Tag Manager',
      'Zoho CRM',
      // Q-80 fallback (vendor unnamed)
      'WhatsApp Business flows',
    ],
    oneLiner:
      'Remote. A WordPress-to-Next.js migration with SEO, and WhatsApp flows that won back 9.1% of abandoned checkouts.',
  },
  {
    id: 'travstory',
    // Q-17 interim (flagged)
    role: 'Co-founder & Lead Architect',
    org: 'The Trav Story · AI-unified travel platform · Bhubaneswar',
    time: 'Nov 2025 — Present',
    start: '2025-11',
    detail:
      'The Trav Story plans a trip the way a well-travelled friend would: ask a few questions, propose an itinerary, and book it without twelve open tabs. I designed and built the platform.',
    bullets: [
      'Built multimodal LLM chatbots with LangChain and FastAPI, grounded in our own data through RAG pipelines on vector databases.',
      'Deployed the whole stack (frontend, backend, database and the neural models) as distributed cloud services that talk to each other over APIs.',
      'Set up the Docker builds and GitHub workflows the team ships through, and designed the Supabase PostgreSQL schemas, with server-side rendering for fast retrieval.',
      'Won Best Startup Idea at KIIT University.',
    ],
    stack: ['LangChain', 'RAG', 'FastAPI', 'Vector databases', 'Supabase PostgreSQL', 'Docker', 'GitHub workflows (CI/CD)'],
    oneLiner: 'AI travel platform; I built the RAG chatbots, the data model and the infrastructure.',
  },
  {
    id: 'deuxstem',
    role: 'Founder & CEO',
    org: 'DeuxStem · Ed-tech non-profit',
    // Q-30 interim
    time: '2020 — Present',
    start: '2020',
    detail:
      'I started DeuxStem in 2020 to give students outside big cities the STEM exposure I had to find on my own. It grew to an audience of more than 2 million worldwide.',
    bullets: [
      'Taught students in more than 10 countries, on every continent.',
      'Secured funding and hosted international workshops.',
      'Worked with students on improving aviation designs.',
      'Led asteroid-search campaigns with the International Astronomical Search Collaboration (NASA-affiliated): more than 20 asteroid detections, VT60 and UF78 among them.',
      'Earned commendations from NASA, the Canadian Space Agency (CSA) and the German Aerospace Center (DLR).',
    ],
    oneLiner: 'Ed-tech non-profit, 2M+ audience in 10+ countries, 20+ asteroid detections.',
  },
  {
    id: 'gdg-kiit',
    // Q-33 interim
    role: 'Growth Specialist and organizer',
    org: 'GDG KIIT',
    time: '2024 — Present',
    start: '2024',
    detail: 'I work on growth: getting the right people into the room and keeping them there.',
    bullets: [
      'Selected in the top 8% of the growth team.',
      'Led marketing, outreach and sponsor relations for the Breaking an LLM symposium: 1,500+ registrations.',
      "Helped host the chapter's largest hackathons to date, with 600+ attendees; through promotion and sponsorships, grew registrations by 350% and engagement by 84% across events reaching 2,500+ attendees.",
      'Competed in Building Bad and joined the Asteroid Hunt deep-tech initiative. Mentored students in cloud and AI and completed 19 Google Cloud courses.',
    ],
    oneLiner: 'Growth for a 2,500+ attendee developer community.',
  },
  {
    id: 'startup-grind-kiit',
    role: 'Founding team member',
    org: 'Startup Grind KIIT',
    time: 'Late 2025 — Present',
    start: '2025',
    // Q-35: the events run and what I own stay out until answered.
    detail: 'Selected to the founding team building the campus startup community: founder talks.',
  },
  {
    id: 'mlsa',
    role: 'Project Wing contributor',
    org: 'Microsoft Learn Student Ambassadors (MLSA)',
    time: '2024 · 6 months',
    start: '2024',
    end: '2024',
    detail:
      'Implemented DQN and PPO with Stable-Baselines3 and trained an agent to play Super Mario Bros at an expert level. Taught AI, ML and cloud basics to peers.',
  },
  {
    id: 'e-labs',
    role: 'AI/ML Researcher',
    org: 'E-Labs',
    time: '2023 — 2024',
    start: '2023',
    end: '2024',
    detail: 'Guided student research projects in AI and ML and mentored juniors.',
  },
];
