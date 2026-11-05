'use client';

import { createContext, useContext } from 'react';
import type { DrawOnViewHandle } from '@/shared/ui/draw';

/**
 * The light table's index of plate drawings: each plate registers its `DrawOnView` handle under a key
 * (`"<build id>:phone"` or `"<build id>:viewer"`), so the viewer and the Draw again buttons can replay or finish a
 * drawing that a server component rendered. Outside a provider nothing registers.
 */
export interface DrawRegistry {
  register: (key: string, handle: DrawOnViewHandle) => () => void;
  get: (key: string) => DrawOnViewHandle | undefined;
}

export function createDrawRegistry(): DrawRegistry {
  const handles = new Map<string, DrawOnViewHandle>();
  return {
    register(key, handle) {
      handles.set(key, handle);
      return () => {
        if (handles.get(key) === handle) handles.delete(key);
      };
    },
    get: (key) => handles.get(key),
  };
}

export const DrawRegistryContext = createContext<DrawRegistry | null>(null);

export function useDrawRegistry(): DrawRegistry | null {
  return useContext(DrawRegistryContext);
}
