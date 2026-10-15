import type { Project } from '../model/types';

export function selectFeaturedProjects(projects: readonly Project[], limit = 4): Project[] {
  return projects.filter((p) => p.featured).slice(0, limit);
}
