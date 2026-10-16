import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Life and Discipline | Aman Anubhav';
const description =
  'Where I come from and what I train for: dark skies in Bihar, DeuxStem, early builds, boxing, running, solo treks, road trips and astrophotography.';

/**
 * [S-SEO] for this route. openGraph and twitter repeat the root card and image because a page-level
 * openGraph or twitter object replaces the root one.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.personal },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.personal,
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
