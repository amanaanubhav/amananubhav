/*
 * The stage's DOM side (§C.5, §D.3). Nothing exported here imports three.js: StageRenderer and
 * ThemeUniforms (same folder) are reached only through the next/dynamic import in StageCanvas.
 */
export {
  emitSceneFrame,
  hasVisibleScene,
  lastSceneFrame,
  setSceneParam,
  setSceneProgress,
  stageBufferParams,
  stageParams,
  stageProgress,
  stageTextParams,
  subscribeSceneFrame,
  useSceneFrame,
  useStageEntries,
  useStageScene,
} from './registry';
export type {
  SceneId,
  SceneLoader,
  SceneParamValue,
  SceneProps,
  StageSceneEntry,
  StageSceneOptions,
} from './registry';
export { StageCanvas } from './StageCanvas';
export type { StageCanvasProps } from './StageCanvas';
export { StageSlot } from './StageSlot';
export type { StageSlotProps } from './StageSlot';
export { StagePoster } from './StagePoster';
export type { StagePosterProps } from './StagePoster';
export { STORY_HYPSO_STOPS_M, STORY_PALETTE, STORY_TEMP_STOPS_C, storyRampGradient } from './story-palette';
export type { StoryThemeColors } from './story-palette';
