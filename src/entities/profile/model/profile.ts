import type { Profile } from './types';

/** [S-LIFE-PROFILE], [S-PRO-EDU]. No phone (Q-01), no CPI (Q-37). */
export const PROFILE: Profile = {
  name: 'Aman Kumar Anubhav',
  displayName: 'Aman Anubhav',
  role: 'AI Engineer',
  tagline: 'Everything I need, I carry.',
  about:
    'I was born in Sikahar, a village in Bihar where the nights were dark enough to see the Milky Way from the roof. I spent a lot of evenings up there working out what I was looking at, and the habit stuck: find a question that is too big, then build something small enough to start answering it.',
  // Q-03 interim
  location: 'Bhubaneswar, India · from Sikahar, Bihar',
  links: {
    linkedin: 'https://www.linkedin.com/in/amananubhav',
    github: 'https://github.com/amanaanubhav',
    email: 'amannbhv.cswork@gmail.com',
    news: 'https://www.globalindian.com/youth/story/cover-story/aman-anubhav-the-bihar-teen-impresses-nasa/',
    website: 'https://amananubhav.com',
    kaggle: 'https://www.kaggle.com/amananubhav',
    instagram: 'https://www.instagram.com/amansanubhav/',
  },
  education: [
    {
      institution: 'KIIT University',
      degree: 'B.Tech in Mathematics and Computer Science',
      focus: 'Computational mathematics, distributed backends, ML pipelines, graph and spatial algorithms',
      year: '2027 (expected)',
    },
    {
      // Q-38 interim
      institution: 'Delhi Public School',
      degree: 'High school, computer science focus',
      focus: 'Competitive programming and my first real software',
      year: '2019 to 2023',
    },
  ],
  interests: [
    'Solo high-altitude trekking',
    'Astrophotography',
    'Boxing and strength training',
    'Motorcycle road trips',
    'Mentoring',
  ],
  dailyStack: ['Python', 'TypeScript', 'FastAPI', 'Next.js', 'PostgreSQL', 'Docker'],
  focus: ['AI agents', 'Real-time systems', 'Applied ML'],
  availability: {
    openToRemote: true,
    timeZone: 'Asia/Kolkata',
    utcLabel: 'IST, UTC+5:30',
  },
};
