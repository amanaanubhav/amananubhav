import { getProjectSortKey, type Project } from '@/entities/project';

export type ProjectSortOrder = 'newest' | 'oldest';

export interface ProjectFilters {
  filterType: string;
  searchQuery: string;
  sortBy: ProjectSortOrder;
}

/** Unique project types in first-seen order, prefixed with 'All'. */
export function getProjectTypes(projects: readonly Project[]): string[] {
  return ['All', ...new Set(projects.map((p) => p.type))];
}

/**
 * Legacy filter + sort. The sort keeps the legacy quirk where month-prefixed
 * labels (e.g. "Dec 2025 - Apr 2026") parse to 0 via getProjectSortKey.
 */
export function filterProjects(
  projects: readonly Project[],
  { filterType, searchQuery, sortBy }: ProjectFilters,
): Project[] {
  let result = [...projects];

  // Filter by Type
  if (filterType !== 'All') {
    result = result.filter((p) => p.type === filterType);
  }

  // Filter by Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (p) => p.title.toLowerCase().includes(q) || p.tech.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Sort
  result.sort((a, b) => {
    const yearA = getProjectSortKey(a.year);
    const yearB = getProjectSortKey(b.year);
    return sortBy === 'newest' ? yearB - yearA : yearA - yearB;
  });

  return result;
}

/** Groups projects by type, preserving first-seen order (legacy object insertion order). */
export function groupProjectsByType(projects: readonly Project[]): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();
  for (const p of projects) {
    const group = groups.get(p.type);
    if (group) group.push(p);
    else groups.set(p.type, [p]);
  }
  return groups;
}
