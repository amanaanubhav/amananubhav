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
 * Routes that already end on the page's one full ask (§A.4, §H.3). Their last sheet closes on the sign-off instead
 * of a second ask: no h2, no body, no primary button; the email, the Vault and Ask Alpenglow stay as quiet text
 * actions under it, so both are reachable from every footer.
 */
export const COMPACT_FOOTER_ROUTES: readonly string[] = [ROUTES.home, ROUTES.professional];

/** [S-UI-COPY] footer copy (HERO-FOOTER-SPEC §2.5). The email is shown once, with Copy beside it. */
export const FOOTER_COPY = {
  heading: "Let's build something worth the climb.",
  bodyLead: "I'm open to remote AI engineering roles and good problems.",
  signOff: 'Pack light. Ship clean. Keep climbing.',
  /** His name across the foot of the sheet (decorative: the © line carries it). */
  wordmark: 'Aman Anubhav',
  /** Opens the Alpenglow terminal (`openTerminal()`): the old site's `>_`, back as the terminal entry. */
  askLabel: 'Ask Alpenglow',
  vaultLabel: 'Vault',
  status: 'Open to remote roles',
  statusHref: `${ROUTES.professional}#remote`,
  keys: { write: 'write', pages: 'pages', elsewhere: 'elsewhere' },
} as const;
