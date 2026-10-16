import type { MediaSlotId } from '@/shared/config';

/** Stable project ids (React keys, the blueprint map and the G-15 glyph map use them). */
export type ProjectId =
  | 'travstory'
  | 'divert'
  | 'accolades'
  | 'oceanbot'
  | 'yvoo'
  | 'kanad'
  | 'leetsync'
  | 'site'
  | 'mario-rl'
  | 'lnn'
  | 'pavana'
  | 'rakshak'
  | 'vyomagami'
  | 'schrodinger'
  | 'asteroids'
  | 'sedu';

/**
 * Coarse archive type: the ledger groups by it and the Type filter lists it. The specific phrase
 * ("Emergency-vehicle routing") lives in `oneLiner`.
 */
export type ProjectType = 'Products and platforms' | 'Machine learning' | 'Science and engineering' | 'Research';

export type ProjectLink = { label: string; url: string };

export type Project = {
  id: ProjectId;
  title: string;
  type: ProjectType;
  /** One-liner plus approach (kept for older consumers). */
  desc: string;
  /** The best public link, or the GitHub profile. */
  link: string;
  /** Display label ("Dec 2025 - Apr 2026"); '' when unknown. */
  year: string;
  tech: string[];
  featured?: boolean;
  oneLiner?: string;
  problem?: string;
  approach?: string;
  result?: string;
  period?: string;
  role?: string;
  team?: string;
  links?: readonly ProjectLink[];
  tier?: 'featured' | 'archive';
  /** 1..6 for the featured set on /professional. */
  featuredOrder?: number;
  tag?: 'Early build' | 'Research';
  /** lucide icon name of the G-15 glyph. */
  glyph?: string;
  slotIds?: readonly MediaSlotId[];
};
