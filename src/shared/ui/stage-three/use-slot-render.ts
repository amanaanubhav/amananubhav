'use client';

import { useFrame, type RootState } from '@react-three/fiber';
import type { Camera, Object3D, PerspectiveCamera } from 'three';

import { useSceneRoot } from './scene-root';

export interface SlotRenderOptions {
  /** What to draw; default: the scene root group provided by the renderer. */
  root?: Object3D | null;
  /** Called after each frame actually drawn into the slot (e.g. to mark the slot live). */
  onRender?: () => void;
}

/** Render priority of slot renders (after the renderer's frame clear at 0.5). */
export const SLOT_RENDER_PRIORITY = 1;

function isPerspective(camera: Camera): camera is PerspectiveCamera {
  return (camera as PerspectiveCamera).isPerspectiveCamera === true;
}

/**
 * One slot render (module scope, outside the hook, so mutating the camera is plain three.js).
 * Returns false when the slot is off-screen or empty (nothing drawn).
 */
export function renderIntoSlot(state: RootState, slot: HTMLElement, camera: Camera, target: Object3D): boolean {
  const rect = slot.getBoundingClientRect();
  const { width: canvasW, height: canvasH, left: canvasLeft, top: canvasTop } = state.size;
  const x = rect.left - canvasLeft;
  const y = rect.top - canvasTop;
  const w = rect.width;
  const h = rect.height;
  if (w < 1 || h < 1) return false;

  const left = Math.max(0, x);
  const right = Math.min(canvasW, x + w);
  const top = Math.max(0, y);
  const bottom = Math.min(canvasH, y + h);
  if (right <= left || bottom <= top) return false; // off-screen: nothing to draw

  const gl = state.gl;
  gl.setViewport(x, canvasH - (y + h), w, h);
  gl.setScissor(left, canvasH - bottom, right - left, bottom - top);
  gl.setScissorTest(true);

  if (isPerspective(camera)) {
    const aspect = w / h;
    if (Math.abs(camera.aspect - aspect) > 1e-4) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }

  gl.render(target, camera);
  return true;
}

/**
 * Renders the calling scene into its slot's rectangle each frame (§C.5): reads the slot box once,
 * skips when it is off-screen, sets the viewport to the whole slot and the scissor to its visible
 * part (three applies the DPR; y is flipped), keeps a perspective camera's aspect in step with
 * the slot, and draws the scene root with `camera`.
 */
export function useSlotRender(
  slot: HTMLElement | null,
  camera: Camera | null,
  opts: SlotRenderOptions = {},
): void {
  const rootRef = useSceneRoot();
  const { root, onRender } = opts;

  useFrame((state) => {
    const target = root ?? rootRef?.current ?? null;
    if (!slot || !camera || !target || !target.visible) return;
    if (renderIntoSlot(state, slot, camera, target)) onRender?.();
  }, SLOT_RENDER_PRIORITY);
}
