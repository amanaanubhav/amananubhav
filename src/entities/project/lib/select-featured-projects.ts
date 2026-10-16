import type { Project } from '../model/types';

/** The featured set (§I.1: six, in `featuredOrder`; entries without an order keep their list position, last). */
export function selectFeaturedProjects(projects: readonly Project[], limit = 6): Project[] {
  return projects
    .filter((p) => p.featured)
    .map((p, index) => ({ p, index }))
    .sort((a, b) => (a.p.featuredOrder ?? Infinity) - (b.p.featuredOrder ?? Infinity) || a.index - b.index)
    .slice(0, limit)
    .map(({ p }) => p);
}
