import type { MetadataRoute } from 'next';

import { ROUTES, SITE } from '@/shared/config';

type Entry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

/** Indexed routes only (§I.6); /admin-chat is never listed. */
const ENTRIES: readonly Entry[] = [
  { path: ROUTES.home, changeFrequency: 'weekly', priority: 1.0 },
  { path: ROUTES.professional, changeFrequency: 'monthly', priority: 0.9 },
  { path: ROUTES.personal, changeFrequency: 'monthly', priority: 0.8 },
  { path: ROUTES.stories, changeFrequency: 'monthly', priority: 0.8 },
  { path: ROUTES.projectArchive, changeFrequency: 'monthly', priority: 0.6 },
  { path: ROUTES.achievements, changeFrequency: 'monthly', priority: 0.6 },
];

export function sitemap(): MetadataRoute.Sitemap {
  return ENTRIES.map(({ path, changeFrequency, priority }) => ({
    url: path === ROUTES.home ? `${SITE.url}/` : `${SITE.url}${path}`,
    lastModified: SITE.updated,
    changeFrequency,
    priority,
  }));
}
