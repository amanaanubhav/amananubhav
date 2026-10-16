import type { MediaSlotId } from '@/shared/config';

export type ActivityId =
  | 'gym'
  | 'run'
  | 'box'
  | 'swim'
  | 'climb'
  | 'football'
  | 'basketball'
  | 'surf'
  | 'trek'
  | 'astro'
  | 'ride'
  | 'coast';

export interface Activity {
  id: ActivityId;
  name: string;
  /** Final one-line copy from the deck. */
  line: string;
  /** Undefined until Q-57 is answered (rendered as nothing). */
  fact?: string;
  /** Open question id. */
  confirm?: string;
  group: 'discipline' | 'hobby';
  status: 'active' | 'soon';
  slotId: MediaSlotId;
  /** G-18 glyph: a lucide icon name, or a hand-drawn glyph key (hold, glove, football, hoop, wave). */
  glyph: string;
  href?: string;
}
