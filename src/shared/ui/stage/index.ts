/*
 * The stage's DOM side (§C.5, §D.3). Nothing exported here imports three.js: StageRenderer and
 * ThemeUniforms (same folder) are reached only through the dynamic import in load-renderer.ts (StageCanvas,
 * preloadStage, and early-kick.ts, the pre-hydration kick that next.config injects; never exported here).
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
export type { SceneId, SceneLoader, SceneParamValue, SceneProps, StageSceneEntry, StageSceneOptions } from './registry';
export { StageCanvas, preloadStage } from './StageCanvas';
export type { StageCanvasProps } from './StageCanvas';
export { StageSlot } from './StageSlot';
export type { StageSlotProps } from './StageSlot';
export { StagePoster } from './StagePoster';
export type { StagePosterProps } from './StagePoster';
// The story map's colours live in shared/config (server-safe, used by the SSR plan sheet too).
export { STORY_HYPSO_STOPS_M, STORY_PALETTE, STORY_TEMP_STOPS_C, storyRampGradient } from '@/shared/config';
export type { StoryThemeColors } from '@/shared/config';
