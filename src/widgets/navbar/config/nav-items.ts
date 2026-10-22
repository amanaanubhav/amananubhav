import { BookOpen, Briefcase, FolderGit2, Home, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/shared/config';

export interface NavItem {
  /** Visible label (≥ 640 px) and the accessible name of the icon link below 640 px. */
  readonly name: string;
  readonly link: string;
  /** Shown instead of the label below 640 px. */
  readonly icon: LucideIcon;
  /** Other routes that belong to this item: the item reads as current there too (`aria-current="true"`). */
  readonly section?: readonly string[];
}

/**
 * Main navigation (§H.1). Routes unchanged; labels per Q-92: "Professional" is now "Work"; "Blogs" became "Field notes"
 * and is now "Journal" (the owner's rename; the route stays /stories).
 * Order per the owner (2026-10-22): Home, Work, Life, Journal. Below 640 px each item keeps its §H.1 icon from the
 * previous site; each link's accessible name is the page name.
 * The project archive and the achievements archive are reached from Work, so they mark Work as current.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { name: 'Home', link: ROUTES.home, icon: Home },
  {
    name: 'Work',
    link: ROUTES.professional,
    icon: FolderGit2,
    section: [ROUTES.projectArchive, ROUTES.achievements],
  },
  { name: 'Life', link: ROUTES.personal, icon: Briefcase },
  { name: 'Journal', link: ROUTES.stories, icon: BookOpen },
];

/** `'page'` on the item's own route, `'true'` on a route of its section, otherwise undefined. */
export function navItemCurrent(item: NavItem, pathname: string | null): 'page' | 'true' | undefined {
  if (!pathname) return undefined;
  if (pathname === item.link) return 'page';
  return item.section?.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ? 'true' : undefined;
}
