/*
 * three.js-dependent stage primitives (§C.5). Imported only by scene modules and the stage
 * renderer, both of which load lazily; never from a page, widget or the stage index.
 */
export { stageUniforms, themeUniformTargets } from './stage-uniforms';
export type { StageColorUniform, StageUniforms, ThemeUniformTargets } from './stage-uniforms';
export { useSlotRender, SLOT_RENDER_PRIORITY } from './use-slot-render';
export type { SlotRenderOptions } from './use-slot-render';
export { StageSceneRoot, useSceneRoot } from './scene-root';
export type { StageSceneRootProps } from './scene-root';
export { useSlotSize, useStageLive } from './slot-hooks';
export type { SlotSize } from './slot-hooks';

export { GLSL_CONTOUR, GLSL_DEPTH_FADE, GLSL_DISC, GLSL_DITHER, GLSL_RELIEF, GLSL_SCREEN } from './glsl';

export { loadHeightfield, createTerrainFrame } from './heightfield';
export type { HeightfieldMeta, LoadHeightfieldOptions, LoadedHeightfield, TerrainFrame } from './heightfield';
export { buildRouteCurve } from './route';
export type { BuildRouteOptions, RouteCurve, RouteNode, RouteWaypoint } from './route';
export { createReliefUniforms } from './relief-uniforms';
export type { ReliefUniforms } from './relief-uniforms';
export { ContourTerrain } from './contour-terrain';
export type { ContourTerrainProps } from './contour-terrain';
export { RouteRibbon, PRIMITIVE_UPDATE_PRIORITY } from './route-ribbon';
export type { RouteRibbonProps } from './route-ribbon';
export { SectionCurtain } from './section-curtain';
export type { SectionCurtainProps } from './section-curtain';
export { TentMark } from './tent-mark';
export type { TentMarkProps } from './tent-mark';

export { loadStarCatalogue, TIER1_STAR_LIMIT } from './sky-data';
export type { StarCatalogue } from './sky-data';
export { StarDome, createSkyUniforms } from './star-dome';
export type { SkyUniforms, StarDomeProps } from './star-dome';

/** Per-frame drivers of scenes run before primitives (0.8) and the slot render (1). */
export const SCENE_DRIVER_PRIORITY = 0.6;
