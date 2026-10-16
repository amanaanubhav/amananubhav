import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Inbox | Aman Anubhav';
const description = 'Private inbox.';

/**
 * [S-SEO] for this route. The owner inbox is never indexed or followed; twitter repeats the root card so
 * the page-level object does not drop it.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.adminChat },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.adminChat,
    images: [SITE.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [SITE.ogImage],
  },
  robots: { index: false, follow: false },
};
