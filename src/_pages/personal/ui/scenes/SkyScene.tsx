'use client';

import { useFrame } from '@react-three/fiber';
import { damp } from 'maath/easing';
import { useEffect, useRef, useState } from 'react';
import { PerspectiveCamera } from 'three';

import { SKY_OBSERVER, equatorialToHorizontalMatrix, localSiderealTime, skyTimeAt } from '@/shared/lib/astro';
import { stageParams, stageProgress, type SceneProps } from '@/shared/ui/stage';
import {
  SCENE_DRIVER_PRIORITY,
  StarDome,
  createSkyUniforms,
  loadStarCatalogue,
  useSlotRender,
  useStageLive,
  type StarCatalogue,
} from '@/shared/ui/stage-three';

/*
 * `sky` (§G.2, §G.8): the night over Bihar, 25° N, turning from 18:30 to 05:30 IST as the visitor
 * scrolls `/personal#sky`. p arrives through `setSceneProgress('sky', p)`; each frame the scene
 * damps it, converts it to a time with the same `skyTimeAt` the DOM clock log uses, and rotates
 * the sphere by `equatorialToHorizontalMatrix`. The camera looks south at 35° altitude, FOV 60°.
 * Three draw calls: graticule, constellation lines, stars.
 */

const SMOOTH = 0.25;
const LOOK_ALT = 35 * (Math.PI / 180);
const LAT = SKY_OBSERVER.latDeg * (Math.PI / 180);

interface FrameState {
  ready: boolean;
  p: number;
  lines: number;
}

/*
 * One sky scene exists at a time (one slot per page), so its uniforms and camera live at module
 * scope: plain three.js objects written every frame, holding no GPU resources.
 */
const uniforms = createSkyUniforms();
const camera = new PerspectiveCamera(60, 1, 0.1, 200);
// x = east, y = up, z = south: look south, 35° above the horizon (fixed).
camera.lookAt(0, Math.sin(LOOK_ALT), Math.cos(LOOK_ALT));

export default function SkyScene({ id, tier, slot }: SceneProps) {
  const [catalogue, setCatalogue] = useState<StarCatalogue | null>(null);
  // The visitor's current date (IST): the scrubbed night is tonight's.
  const [base] = useState(() => new Date());
  const state = useRef<FrameState>({ ready: false, p: 0, lines: 0 });
  const markLive = useStageLive(slot);

  useEffect(() => {
    let alive = true;
    void loadStarCatalogue(tier).then((loaded) => {
      if (alive) setCatalogue(loaded);
    });
    return () => {
      alive = false;
    };
  }, [tier]);

  useEffect(() => {
    if (!slot || !catalogue) return;
    // "Illustrative sky" when the catalogue is the fallback; no constellation lines then.
    slot.setAttribute('data-stage-source', catalogue.illustrative ? 'illustrative' : 'measured');
    slot.setAttribute('data-stage-lines', catalogue.segments ? '1' : '0');
    return () => {
      slot.removeAttribute('data-stage-source');
      slot.removeAttribute('data-stage-lines');
    };
  }, [slot, catalogue]);

  useFrame((frame, rawDelta) => {
    if (!catalogue) return;
    const s = state.current;
    const delta = Math.min(Math.max(rawDelta, 0), 0.1);
    const goal = Math.min(1, Math.max(0, stageProgress.get(id) ?? 0));
    const linesGoal = stageParams.get(id)?.constellations === 1 ? 1 : 0;
    if (s.ready) {
      damp(s, 'p', goal, SMOOTH, delta);
      damp(s, 'lines', linesGoal, SMOOTH, delta);
    } else {
      s.p = goal;
      s.lines = linesGoal;
      s.ready = true;
    }

    const date = skyTimeAt(s.p, base);
    const matrix = equatorialToHorizontalMatrix(localSiderealTime(date, SKY_OBSERVER.lonDeg), LAT);
    uniforms.uEqToHor.value.fromArray(matrix);
    uniforms.uConstellationAlpha.value = 0.12 + 0.23 * s.lines;
    uniforms.uPixelRatio.value = frame.gl.getPixelRatio();
    uniforms.uTwinkle.value = tier === 2 ? 1 : 0;
    uniforms.uTime.value = tier === 2 ? frame.clock.elapsedTime : 0;
  }, SCENE_DRIVER_PRIORITY);

  useSlotRender(slot, catalogue ? camera : null, { onRender: markLive });

  return catalogue ? <StarDome catalogue={catalogue} uniforms={uniforms} /> : null;
}
