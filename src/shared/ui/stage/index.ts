/*
 * The stage's DOM side (§C.5, §D.3). Nothing exported here imports three.js: StageRenderer and
 * ThemeUniforms (same folder) are reached only through the next/dynamic import in StageCanvas.
 */
export {
  hasVisibleScene,
  setSceneParam,
  setSceneProgress,
  stageParams,
  stageProgress,
  useStageEntries,
  useStageScene,
} from './registry';
export type { SceneId, SceneLoader, SceneProps, StageSceneEntry } from './registry';
export { StageCanvas } from './StageCanvas';
export type { StageCanvasProps } from './StageCanvas';
export { StageSlot } from './StageSlot';
export type { StageSlotProps } from './StageSlot';
export { StagePoster } from './StagePoster';
export type { StagePosterProps } from './StagePoster';
