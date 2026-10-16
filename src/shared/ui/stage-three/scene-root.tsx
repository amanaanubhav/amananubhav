'use client';

import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import type { Group, Object3D } from 'three';

const SceneRootContext = createContext<RefObject<Object3D | null> | null>(null);

export interface StageSceneRootProps {
  visible: boolean;
  children?: ReactNode;
}

/**
 * The root group of one registered scene (used by the renderer). `useSlotRender` renders this
 * group, not the whole R3F scene, so each scene draws only itself into its own slot.
 */
export function StageSceneRoot({ visible, children }: StageSceneRootProps) {
  const ref = useRef<Group>(null);
  return (
    <group ref={ref} visible={visible}>
      <SceneRootContext.Provider value={ref}>{children}</SceneRootContext.Provider>
    </group>
  );
}

/** The current scene's root object (null outside a StageSceneRoot). */
export function useSceneRoot(): RefObject<Object3D | null> | null {
  return useContext(SceneRootContext);
}
