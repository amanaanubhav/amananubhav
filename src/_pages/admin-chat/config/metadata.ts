import type { Metadata } from 'next';

import { SITE } from '@/shared/config';

/** Owner inbox: same title/description as every page, but never indexed or followed. */
export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  robots: { index: false, follow: false },
};
