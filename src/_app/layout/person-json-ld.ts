/** Legacy index.html JSON-LD Person block, verbatim. */
export const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Aman Kumar Anubhav',
  givenName: 'Aman',
  familyName: 'Anubhav',
  url: 'https://amananubhav.com',
  image: 'https://amananubhav.com/profile1.jpg',
  jobTitle: 'AI Researcher / Engineer',
  worksFor: {
    '@type': 'Organization',
    name: 'DeuxStem Org',
  },
  memberOf: [
    {
      '@type': 'Organization',
      name: 'Google Developers Group',
      alternateName: 'GDG',
    },
  ],
  alumniOf: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'KIIT University',
      sameAs: 'https://kiit.ac.in/',
    },
    {
      '@type': 'EducationalOrganization',
      name: 'DPS GAYA',
    },
  ],
  knowsAbout: [
    'Liquid Neural Networks',
    'Reinforcement Learning',
    'Climate Tech',
    'Full Stack Development',
    'Artificial Intelligence',
    'Machine Learning',
    'Thermodynamics',
    'Fluid Dynamics',
  ],
  award: [
    'Smart India Hackathon 2025 National Screening Qualified',
    '3M-CII Young Innovators Challenge Award Winner',
    'NYAS Global Champion 2022',
    'The Bihar Teen Who Impressed NASA - Global Indian',
  ],
  sameAs: [
    'https://www.linkedin.com/in/amananubhav/',
    'https://github.com/amanaanubhav',
    'https://twitter.com/amananubhav',
    'https://www.instagram.com/amansanubhav/',
    'https://www.globalindian.com/youth/story/cover-story/aman-anubhav-the-bihar-teen-impresses-nasa/',
  ],
  description:
    'AI Researcher specializing in Liquid Neural Networks, Climate Tech (PAVANA, OceanBot), and Creative Web Development.',
} as const;

/** Serialised for a <script type="application/ld+json">; `<` is escaped so the payload cannot close the tag. */
export const PERSON_JSON_LD_HTML = JSON.stringify(PERSON_JSON_LD).replace(/</g, '\\u003c');
