/** Site-wide SEO values ([S-SEO]). Per-route titles and descriptions live in each page's config/metadata.ts. */
export const SITE = {
  url: 'https://amananubhav.com',
  name: 'Aman Anubhav',
  title: 'Aman Anubhav | AI Engineer and Solo Himalayan Trekker',
  description:
    "I'm Aman Anubhav, an AI engineer building AI agents at Atlys and a solo high-altitude trekker. My work, my expeditions, and how to hire me remotely.",
  ogDescription:
    'AI engineer building AI agents at Atlys, solo trekker over Thorong La (5,416 m), open to remote roles.',
  ogImage: 'https://amananubhav.com/og/aman-anubhav.png',
  gaId: 'G-5QXFLQJ7NH',
  gtmId: 'GTM-KQ9JGXKP',
  resumeDriveUrl:
    'https://drive.google.com/drive/folders/1fj8BIHpUcvZEpkfAyvdmK_Ke8jpmRNDv?usp=sharing',
  keywords: [
    'Aman Anubhav',
    'Aman Kumar Anubhav',
    'AI Engineer',
    'AI agents',
    'LLM engineer',
    'RAG',
    'remote AI engineer',
    'Atlys',
    'Brndo',
    'The Trav Story',
    'DeuxStem',
    'DIVERT',
    'Accolades',
    'OceanBot',
    'YVOO',
    'KANAD',
    'FastAPI',
    'Next.js',
    'LangChain',
    'PostGIS',
    'KIIT University',
    'Google Developer Group',
    'Annapurna Circuit solo',
    'Thorong La',
    'Himalayan trekking',
  ],
  /** Content last updated (sitemap `lastModified`). */
  updated: '2026-10-15',
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
  updated: string;
};
