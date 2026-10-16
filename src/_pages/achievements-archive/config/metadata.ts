import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Honors and Awards | Aman Anubhav';
const description =
  'NYAS Junior Academy winner, MIT LaunchX full ride, Best Startup Idea, PIC 1st and 2nd rank, SIH 2025 qualifier and 20+ asteroid detections with IASC.';

/**
 * [S-SEO] for this route. openGraph and twitter repeat the root card and image because a page-level
 * openGraph or twitter object replaces the root one.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.achievements },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.achievements,
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
