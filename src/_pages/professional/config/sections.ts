import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

/** §G.3: a plain rail (no altitudes). Labels from [S-UI-COPY]; `remote` is new. The hero has no id. */
export const PROFESSIONAL_SECTIONS: readonly SectionNavItem[] = [
  { id: 'experience', label: 'Work' },
  { id: 'remote', label: 'How I work' },
  { id: 'techstack', label: 'Stack' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Honors' },
];
