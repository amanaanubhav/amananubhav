import { Vector2, Vector3 } from 'three';

import { stageUniforms } from './stage-uniforms';

/**
 * One uniforms object shared by every material of a relief scene (terrain, route, rings, head,
 * tent, curtain). The theme colors are the shared `stageUniforms` entries (same objects, so the
 * 700 ms theme tween reaches every material); the rest is written by the scene each frame.
 */
export function createReliefUniforms() {
  return {
    ...stageUniforms,
    /** World units of the full height range (§C.5: 2.2). */
    uExaggeration: { value: 2.2 },
    /** 0.05 (a printed sheet) to 1 (full relief). */
    uRelief: { value: 0.05 },
    /** maxM - minM of the heightfield (metres per normalised height unit). */
    uRangeM: { value: 7000 },
    /** Route drape above the ground, world units. */
    uDrape: { value: 0.02 },
    /** Minor contour interval in metres; index contours every 5 intervals. */
    uInterval: { value: 100 },
    /** 0..1: the intermediate half-interval contours (100 m -> 50 m during the summit hold). */
    uIntervalHalf: { value: 0 },
    /** Contour ink multiplier (1 -> 0.55 in the calm entry). */
    uDim: { value: 1 },
    /** Whole-relief opacity toward paper (1 -> 0.3 before the DOM profile). */
    uFade: { value: 1 },
    /** Hillshade strength 0..1 (tier 2 only; off in plan view). */
    uHillshade: { value: 0 },
    uFadeNear: { value: 20 },
    uFadeFar: { value: 60 },
    /** Half of the terrain plane (x, z), for the sheet-edge fade. */
    uHalfSize: { value: new Vector2(10, 10) },
    uResolution: { value: new Vector2(1, 1) },
    uPxPerUnit: { value: 1 },
    /** Route reveal 0..1 along the main route, and along each side trip. */
    uDraw: { value: 0 },
    uSideDraw: { value: 0 },
    /** 1 = graph (dashes + node rings), 0 = solid trail. */
    uGraph: { value: 1 },
    uRouteAlpha: { value: 0 },
    /** Alpha of the dashed ghost of the not-yet-drawn route (and its rings), e.g. 0.25 at P0. */
    uGhost: { value: 0 },
    /** Ribbon width in world units (shown at 2.2 to 4 CSS px). */
    uRouteWidth: { value: 0.035 },
    /** Head marker: world (x, normalised height, z). */
    uHead: { value: new Vector3() },
    uHeadAlpha: { value: 0 },
    /** Tent mark intensity and position (x, normalised height, z). */
    uTent: { value: 0 },
    uTentAt: { value: new Vector3() },
    /** Section curtain. */
    uUnroll: { value: 0 },
    uCurtainAlpha: { value: 0 },
    uProfileOrigin: { value: new Vector3() },
    uProfileRight: { value: new Vector3(1, 0, 0) },
    uProfileUp: { value: new Vector3(0, 1, 0) },
  };
}

export type ReliefUniforms = ReturnType<typeof createReliefUniforms>;
