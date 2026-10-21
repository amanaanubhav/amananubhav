/*
 * The home story's scene contract, safe for the page's initial chunk (no three.js): the timeline
 * (S_END, text anchors), the mark catalogue (label names, kinds, cited altitudes), the temperature
 * model and the per-frame types the relief scene emits.
 */
export {
  ENTRANCE_SECONDS,
  REVEAL_SECONDS,
  S_DISSOLVE,
  S_END,
  S_OVERVIEW,
  STORY_ACTS,
  STORY_MOBILE_MAX_WIDTH,
  STORY_NUMERAL,
  STORY_TEXT_AT,
} from './timeline';
export type { StoryActDef } from './timeline';
export { STORY_FREEZE_M, STORY_MARKS, STORY_OVERVIEW_PRIORITY, STORY_TEMPERATURE, modelledTempC } from './marks';
export type { StoryMarkDef, StoryMarkKind } from './marks';
export { STORY_PARAM, STORY_SCENE_ID } from './frame';
export type { StoryFrame, StoryMarkState, StoryReadout } from './frame';
