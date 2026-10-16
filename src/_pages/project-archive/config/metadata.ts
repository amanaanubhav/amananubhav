import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Project Archive | Aman Anubhav';
const description =
  'Every build: AI agents, real-time routing, fraud detection, marine AI, carbon capture and rocket concepts. Filter by year, stack and type.';

/**
 * [S-SEO] for this route. openGraph and twitter repeat the root card and image because a page-level
 * openGraph or twitter object replaces the root one.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.projectArchive },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.projectArchive,
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
