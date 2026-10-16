import type { MediaSlotId } from '@/shared/config';

export type AchievementGroup = 'Competitions' | 'Selections' | 'Recognition' | 'Service';

export type Achievement = {
  title: string;
  /** '' when the deck marks the description `[TBD]` (render the title only). */
  desc: string;
  skills?: string[];
  rank?: string;
  group?: AchievementGroup;
  /** The six shown on /professional#achievements. */
  featured?: boolean;
  year?: string;
  org?: string;
  slotId?: MediaSlotId;
};

export type AchievementInput = string | Achievement;
