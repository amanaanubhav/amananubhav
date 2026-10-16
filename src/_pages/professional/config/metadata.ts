import type { Metadata } from 'next';

import { ROUTES, SITE } from '@/shared/config';

const title = 'Work and Projects | Aman Anubhav, AI Engineer';
const description =
  'AI engineer at Atlys building AI agents. The Trav Story, DIVERT, Accolades, OceanBot and YVOO: the problem, the stack, the result. Open to remote roles.';

/**
 * [S-SEO] for this route. openGraph and twitter repeat the root card and image because a page-level
 * openGraph or twitter object replaces the root one.
 */
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: ROUTES.professional },
  openGraph: {
    type: 'website',
    title,
    description,
    url: ROUTES.professional,
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
