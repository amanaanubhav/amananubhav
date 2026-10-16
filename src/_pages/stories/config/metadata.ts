import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Field Notes: Solo Treks and Build Logs | Aman Anubhav';
const description =
  '250 km solo on the Annapurna Circuit, Kun Tso at 5,000 m in winter, Chandrashila alone, and the GitHub Action that archives my LeetCode work.';

/**
 * [S-SEO] for this route. openGraph and twitter repeat the root card and image because a page-level
 * openGraph or twitter object replaces the root one.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.stories },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.stories,
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
