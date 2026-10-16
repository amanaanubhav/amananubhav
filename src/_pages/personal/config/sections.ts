import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

/** Waypoint rail for the Life page (§G.2): a plain rail, no altitudes; labels from [S-UI-COPY]. Render order. */
export const PERSONAL_SECTIONS = [
  { id: 'about', label: 'Origin' },
  { id: 'stem', label: 'Early builds' },
  { id: 'athletics', label: 'Discipline' },
  { id: 'sky', label: 'Night sky' },
  { id: 'business', label: 'Ventures' },
  { id: 'gallery', label: 'Field album' },
] as const satisfies readonly SectionNavItem[];
