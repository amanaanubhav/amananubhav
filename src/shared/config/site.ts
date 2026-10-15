export const SITE = {
  url: 'https://amananubhav.com',
  name: 'Aman Anubhav',
  title: 'Aman Anubhav | AI Researcher & Creative Developer',
  description:
    'Portfolio of Aman Anubhav, an AI Researcher specializing in Liquid Neural Networks, Climate Tech (PAVANA, OceanBot), and Creative Web Development.',
  ogDescription:
    'Portfolio of Aman Anubhav - AI Researcher & Creative Developer specializing in Liquid Neural Networks, Climate Tech, and Intelligent Systems.',
  ogImage: 'https://amananubhav.com/profile1.jpg',
  gaId: 'G-5QXFLQJ7NH',
  gtmId: 'GTM-KQ9JGXKP',
  resumeDriveUrl:
    'https://drive.google.com/drive/folders/1fj8BIHpUcvZEpkfAyvdmK_Ke8jpmRNDv?usp=sharing',
  keywords: [
    'Aman Anubhav',
    'Aman Kumar Anubhav',
    'AI Researcher',
    'Liquid Neural Networks',
    'Climate Tech',
    'PAVANA',
    'OceanBot',
    'Full Stack Developer',
    'React',
    'Next.js',
    'TensorFlow',
    'PyTorch',
    'Reinforcement Learning',
    'Creative Developer',
    'WebGL',
    'Marine AI',
    'FinTech AI',
    'Google Cloud',
    'MLOps',
    'KIIT University',
    'Deuxstem',
    'Google Developers Group',
    'GDG',
  ],
} as const satisfies {
  url: string;
  name: string;
  title: string;
  description: string;
  ogDescription: string;
  ogImage: string;
  gaId: string;
  gtmId: string;
  resumeDriveUrl: string;
  keywords: readonly string[];
};
