import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config';

/** Parity with the legacy public/robots.txt. /admin-chat is intentionally not disallowed. */
export function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
