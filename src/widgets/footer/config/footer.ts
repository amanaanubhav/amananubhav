import { Database, Github, Instagram, Linkedin, type LucideIcon } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { ROUTES } from '@/shared/config';

export interface ElsewhereLink {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

/** "Elsewhere" (§H.3): the kept profiles plus Kaggle, all opening in a new tab. */
export const ELSEWHERE_LINKS: readonly ElsewhereLink[] = [
  { label: 'LinkedIn', href: PROFILE.links.linkedin, icon: Linkedin },
  { label: 'GitHub', href: PROFILE.links.github, icon: Github },
  { label: 'Kaggle', href: PROFILE.links.kaggle, icon: Database },
  { label: 'Instagram', href: PROFILE.links.instagram, icon: Instagram },
];

export interface PageLink {
  readonly label: string;
  readonly href: string;
}

/**
 * The site index on the last page, so the footer is never a dead end. Labels follow the navbar (Q-92:
 * "Work", "Journal"); the two archives are listed by name. The admin route is never listed.
 */
export const PAGE_LINKS: readonly PageLink[] = [
  { label: 'Home', href: ROUTES.home },
  { label: 'Life', href: ROUTES.personal },
  { label: 'Work', href: ROUTES.professional },
  { label: 'Journal', href: ROUTES.stories },
  { label: 'Project archive', href: ROUTES.projectArchive },
  { label: 'Achievements', href: ROUTES.achievements },
];

/**
 * Routes that already end on the page's one full ask (§A.4, §H.3). Their last page keeps the full-viewport
 * composition but closes on the sign-off instead of a second ask: no h2, no body, no primary buttons;
 * The Vault stays as a quiet link in the "write" column so the vault is reachable from every footer.
 */
export const COMPACT_FOOTER_ROUTES: readonly string[] = [ROUTES.home, ROUTES.professional];

/** [S-UI-COPY] footer copy. */
export const FOOTER_COPY = {
  heading: "Let's build something worth the climb.",
  bodyLead: "I'm open to remote AI engineering roles and good problems. Email",
  bodyTail: ", or use the Vault if it's sensitive.",
  signOff: 'Pack light. Ship clean. Keep climbing.',
  /** The giant decorative stamp across the foot of the page (the previous footer's wordmark, kept). */
  wordmark: 'ANUBHAV',
} as const;
