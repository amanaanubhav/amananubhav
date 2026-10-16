/**
 * [S-SEO-JSONLD] Person, phase 1: `worksFor` (Q-12), `homeLocation` and `birthPlace` (Q-03) stay out
 * until Aman answers; no birthDate, no telephone; no Twitter in sameAs (Q-61).
 */
export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://amananubhav.com/#person',
  name: 'Aman Kumar Anubhav',
  alternateName: 'Aman Anubhav',
  givenName: 'Aman',
  familyName: 'Anubhav',
  url: 'https://amananubhav.com',
  image: 'https://amananubhav.com/og/aman-anubhav.png',
  email: 'mailto:amannbhv.cswork@gmail.com',
  jobTitle: 'AI Engineer',
  memberOf: [
    { '@type': 'Organization', name: 'Google Developer Group KIIT', alternateName: 'GDG KIIT' },
    { '@type': 'Organization', name: 'Startup Grind KIIT' },
  ],
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'KIIT University', sameAs: 'https://kiit.ac.in/' },
    { '@type': 'EducationalOrganization', name: 'Delhi Public School' },
  ],
  knowsAbout: [
    'AI agents',
    'Large language models',
    'Retrieval-augmented generation',
    'Vector databases',
    'LangChain',
    'Machine learning',
    'Deep learning',
    'Reinforcement learning',
    'FastAPI',
    'Next.js',
    'PostgreSQL',
    'PostGIS',
    'Docker',
    'Technical SEO',
    'Geospatial routing',
    'High-altitude trekking',
  ],
  award: [
    'New York Academy of Sciences Junior Academy Winner',
    'Best Startup Idea, KIIT University (The Trav Story)',
    'Smart India Hackathon 2025 Qualifier',
    'PIC 1st and 2nd Rank (YVOO and OceanBot)',
    '3M-CII Young Innovators Challenge Winner',
    'MIT LaunchX 2022, full ride (top 8%)',
  ],
  sameAs: [
    'https://www.linkedin.com/in/amananubhav/',
    'https://github.com/amanaanubhav',
    'https://www.kaggle.com/amananubhav',
    'https://www.instagram.com/amansanubhav/',
    'https://www.globalindian.com/youth/story/cover-story/aman-anubhav-the-bihar-teen-impresses-nasa/',
  ],
  description:
    'AI engineer at Atlys building AI agents; co-founder of The Trav Story and founder of DeuxStem; solo high-altitude trekker who crossed Thorong La (5,416 m) on a 250 km solo Annapurna Circuit.',
} as const;

/** Serialised for a <script type="application/ld+json">; `<` is escaped so the payload cannot close the tag. */
export const PERSON_JSON_LD_HTML = JSON.stringify(PERSON_JSON_LD).replace(/</g, '\\u003c');
