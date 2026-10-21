import type { CSSVars } from '@/shared/lib/css';
import { STORY_PALETTE } from '@/shared/config';

/** The map-only hues as custom properties for story.module.css (one source with the shader, §6.2). */
export const STORY_HUE_VARS: CSSVars = {
  '--story-cold-night': STORY_PALETTE.night.isoZero,
  '--story-cold-day': STORY_PALETTE.day.isoZero,
  '--story-cold-fine-night': STORY_PALETTE.night.isoCold,
  '--story-cold-fine-day': STORY_PALETTE.day.isoCold,
  '--story-warm-night': STORY_PALETTE.night.isoWarm,
  '--story-warm-day': STORY_PALETTE.day.isoWarm,
  '--story-lake-night': STORY_PALETTE.night.branchText,
  '--story-lake-day': STORY_PALETTE.day.branchText,
};
