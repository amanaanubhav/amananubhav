import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config';

/** Parity with the legacy public/sitemap.xml (home URL only). */
export function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE.url}/`,
      lastModified: '2025-12-08',
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
