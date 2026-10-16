import { Database, Github, Instagram, Linkedin, type LucideIcon } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { ROUTES } from '@/shared/config';

export interface ElsewhereLink {
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

/** "Elsewhere" in the footer log (§H.3): the kept profiles plus Kaggle, all opening in a new tab. */
export const ELSEWHERE_LINKS: readonly ElsewhereLink[] = [
  { label: 'LinkedIn', href: PROFILE.links.linkedin, icon: Linkedin },
  { label: 'GitHub', href: PROFILE.links.github, icon: Github },
  { label: 'Kaggle', href: PROFILE.links.kaggle, icon: Database },
  { label: 'Instagram', href: PROFILE.links.instagram, icon: Instagram },
];

/** Routes that already carry the page's one full ask, so the footer drops its heading and ask (§A.4, §H.3). */
export const COMPACT_FOOTER_ROUTES: readonly string[] = [ROUTES.home, ROUTES.professional];

/** [S-UI-COPY] footer copy. */
export const FOOTER_COPY = {
  heading: "Let's build something worth the climb.",
  bodyLead: "I'm open to remote AI engineering roles and good problems. Email",
  bodyTail: ", or use the secure contact if it's sensitive.",
  signOff: 'Pack light. Ship clean. Keep climbing.',
  /** §F colophon credits. */
  colophon: [
    'Set in Archivo, Literata and IBM Plex Mono.',
    'Relief from Terrain Tiles (Mapzen, AWS Open Data; SRTM and other public sources) where marked, otherwise illustrative.',
    'Stars and constellation lines from d3-celestial (BSD-3-Clause), derived from the Hipparcos catalogue.',
  ],
} as const;
