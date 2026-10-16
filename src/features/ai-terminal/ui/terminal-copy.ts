import { ROUTES, SITE } from '@/shared/config';

/** Questions that fill the input (never submit). `short` labels the phone chip row. */
export const TERMINAL_PROMPTS = [
  { short: 'Work at Atlys', full: 'What are you building at Atlys?' },
  { short: 'Hardest trek', full: 'Which trek was the hardest?' },
  { short: 'Night sky', full: 'How do you shoot the night sky?' },
  { short: 'Remote work', full: 'How do you work remotely?' },
] as const;

/** Commands the offline CLI and the live model both understand; they fill the input too. */
export const TERMINAL_COMMANDS = ['help', 'projects', 'treks', 'remote', 'contact', 'clear'] as const;

/** Phone chips after the prompts. */
export const TERMINAL_CHIP_COMMANDS = ['help', 'contact'] as const;

export interface TerminalQuickLink {
  label: string;
  href: string;
  external?: boolean;
}

export const TERMINAL_QUICK_LINKS: readonly TerminalQuickLink[] = [
  { label: 'Work', href: '/#work' },
  { label: 'Projects', href: ROUTES.projectArchive },
  { label: 'Journal', href: ROUTES.stories },
  { label: 'Contact', href: '/#write' },
  { label: 'Résumé', href: SITE.resumeDriveUrl, external: true },
];
