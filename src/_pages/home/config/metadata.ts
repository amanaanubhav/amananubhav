import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Aman Anubhav | AI Engineer and Solo Himalayan Trekker';
const description =
  "I'm Aman Anubhav, an AI engineer building AI agents at Atlys and a solo high-altitude trekker. My work, my expeditions, and how to hire me remotely.";

/**
 * [S-SEO] for this route. openGraph and twitter repeat the root card and image because a page-level
 * openGraph or twitter object replaces the root one.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.home },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.home,
    images: [SITE.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [SITE.ogImage],
  },
  robots: { index: true, follow: true },
};
