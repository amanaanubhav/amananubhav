export { PROJECTS } from './model/projects';
export type { Project, ProjectId, ProjectLink, ProjectType } from './model/types';
export {
  getProjectSortKey,
  compareProjectYears,
  formatProjectYearShort,
  UNKNOWN_PROJECT_SORT_KEY,
} from './lib/project-year';
export { selectFeaturedProjects } from './lib/select-featured-projects';
