import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

/** Dot-nav anchors for the Life page, in render order. */
export const PERSONAL_SECTIONS = [
  { id: 'about', label: 'Identity' },
  { id: 'stem', label: 'Engineering' },
  { id: 'athletics', label: 'Athletics' },
  { id: 'business', label: 'Business' },
  { id: 'gallery', label: 'Gallery' },
] as const satisfies readonly SectionNavItem[];
