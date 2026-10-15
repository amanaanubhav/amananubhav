import { BookOpen, Briefcase, FolderGit2, Home, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/shared/config';

export interface NavItem {
  readonly name: string;
  readonly link: string;
  readonly icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { name: 'Home', link: ROUTES.home, icon: Home },
  { name: 'Life', link: ROUTES.personal, icon: Briefcase },
  { name: 'Professional', link: ROUTES.professional, icon: FolderGit2 },
  { name: 'Blogs', link: ROUTES.stories, icon: BookOpen },
];
