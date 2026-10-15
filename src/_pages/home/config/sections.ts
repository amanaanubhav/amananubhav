import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

/** Dot-nav targets for the home page. The Hero section has no "home" id (legacy parity). */
export const HOME_SECTIONS = [
  { id: 'home', label: 'Hero' },
  { id: 'meander', label: 'Meander' },
] as const satisfies readonly SectionNavItem[];
