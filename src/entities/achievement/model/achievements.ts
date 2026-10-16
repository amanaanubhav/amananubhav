import type { Achievement } from './types';

/**
 * [S-ACH], grouped. `featured` marks the six starred entries. `[TBD]` descriptions are '' (title
 * only); `[CONFIRM]` facts use the deck's interim text. No filler entries.
 */
export const ACHIEVEMENTS: readonly Achievement[] = [
  // Competitions
  {
    // Q-29 interim: one NYAS entry, no year. The deck's separate "NYAS Global Champion 2022" line is the
    // same win; it stays out until Q-29 confirms the title and year.
    title: 'New York Academy of Sciences, Junior Academy: Winner',
    desc: 'KANAD, crop-disease detection and irrigation scheduling with CNNs and LSTMs.',
    skills: ['KANAD', 'CNN', 'LSTM'],
    rank: 'Winner',
    group: 'Competitions',
    featured: true,
    org: 'New York Academy of Sciences',
    slotId: 'M-PROOF-NYAS',
  },
  {
    title: 'Best Startup Idea, KIIT University',
    desc: 'The Trav Story, AI travel platform.',
    skills: ['The Trav Story'],
    rank: '1st',
    group: 'Competitions',
    featured: true,
    org: 'KIIT University',
    slotId: 'M-PROOF-STARTUP',
  },
  {
    title: 'Smart India Hackathon 2025: national qualifier',
    desc: 'YVOO, CIBIL and income fraud detection.',
    skills: ['YVOO'],
    rank: 'Qualifier',
    group: 'Competitions',
    featured: true,
    year: '2025',
    org: 'Smart India Hackathon',
    slotId: 'M-PROOF-SIH',
  },
  {
    // Q-85 interim (flagged)
    title: 'PIC conference: 1st and 2nd rank',
    desc: 'YVOO (CIBIL and income fraud detection) took 1st; OceanBot (98.87% species classification) was runner-up.',
    skills: ['YVOO', 'OceanBot'],
    rank: '1st & 2nd',
    group: 'Competitions',
    featured: true,
    org: 'PIC conference',
    slotId: 'M-PROOF-PIC',
  },
  {
    title: 'UNNOVATION, XIM Bhubaneswar: Winner',
    desc: '',
    rank: 'Winner',
    group: 'Competitions',
    org: 'XIM Bhubaneswar',
    slotId: 'M-PROOF-XIMB',
  },
  {
    title: 'IIT Bombay E-Summit: Finalist',
    desc: '',
    rank: 'Finalist',
    group: 'Competitions',
    org: 'IIT Bombay',
    slotId: 'M-PROOF-IITB',
  },
  {
    title: '3M-CII Young Innovators Challenge: Winner',
    desc: 'RAKSHAK, bladeless river-flow energy harvester.',
    skills: ['RAKSHAK'],
    rank: 'Winner',
    group: 'Competitions',
    org: '3M-CII',
    slotId: 'M-PROOF-3MCII',
  },

  // Selections
  {
    // Q-83 neutral fallback, Q-47 figure
    title: 'MIT LaunchX, 2022: full ride, top 8%',
    desc: 'Awarded a full ride, in the top 8% of applicants. Co-founded Sedu, a game-based health-education startup, with a global cohort; it made $785 in revenue across 4+ countries.',
    skills: ['Sedu'],
    rank: 'Full ride',
    group: 'Selections',
    featured: true,
    year: '2022',
    org: 'MIT LaunchX',
    slotId: 'M-PROOF-MIT',
  },
  {
    title: 'GDG growth team: top 8%',
    desc: '1,500+ registrations for Breaking an LLM; 350% registration growth.',
    skills: ['GDG KIIT'],
    rank: 'Top 8%',
    group: 'Selections',
    org: 'GDG KIIT',
    slotId: 'M-PROOF-GDG',
  },
  {
    title: 'Google Cloud Study Jam 2025',
    desc: '',
    group: 'Selections',
    year: '2025',
    org: 'Google Cloud',
  },
  {
    title: 'Startup Grind KIIT: founding team, 2025',
    desc: '',
    group: 'Selections',
    year: '2025',
    org: 'Startup Grind KIIT',
  },
  {
    title: 'Microsoft Learn Student Ambassador, Project Wing',
    desc: '',
    group: 'Selections',
    org: 'Microsoft Learn Student Ambassadors',
  },

  // Recognition
  {
    // Q-82 / Q-32 interim: "detections", never "discoveries"
    title: '20+ asteroid detections with NASA-affiliated IASC',
    desc: "Through DeuxStem's search campaigns, VT60 and UF78 among them.",
    skills: ['DeuxStem', 'Astronomy'],
    group: 'Recognition',
    featured: true,
    org: 'International Astronomical Search Collaboration',
    slotId: 'M-PROOF-IASC',
  },
  {
    title: 'Commendations from NASA, the Canadian Space Agency and the German Aerospace Center (DLR)',
    desc: "For DeuxStem's work.",
    skills: ['DeuxStem'],
    group: 'Recognition',
    slotId: 'M-PROOF-AGENCIES',
  },
  {
    title: 'Featured by Global Indian: “The Bihar teen who impressed NASA”',
    desc: '',
    group: 'Recognition',
    org: 'Global Indian',
  },
  {
    title: 'Dias Gamechanger Award',
    desc: '',
    group: 'Recognition',
    slotId: 'M-PROOF-DIAS',
  },

  // Service
  {
    title: '28 hours of community service with CRY (Child Rights and You)',
    desc: '',
    group: 'Service',
    org: 'CRY',
  },
];
