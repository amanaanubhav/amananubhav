'use client';

import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { useStageScene, type SceneId, type SceneLoader } from './registry';
import { StagePoster } from './StagePoster';

export interface StageSlotProps {
  sceneId: SceneId;
  /** Module-level constant: `const loadX = () => import('../scenes/X');` */
  load: SceneLoader;
  /** Visually hidden: what the scene shows, in words. */
  description: string;
  /** SSR poster (an SVG plate), visible until the scene goes live. */
  poster: ReactNode;
  /** Sticky / size classes from the page. */
  className?: string;
  /** DOM overlays (readouts, legend, the DOM profile). */
  children?: ReactNode;
}

/**
 * A rectangle the shared canvas renders one scene into (§C.5, §D.3). It registers the scene while
 * mounted; the canvas behind the page is scissored to this element's box. Text never depends on
 * the canvas: the poster and the description are always in the DOM.
 */
export function StageSlot({ sceneId, load, description, poster, className, children }: StageSlotProps) {
  const ref = useStageScene(sceneId, load);

  return (
    <div ref={ref} className={cn('stage-slot relative', className)} data-scene={sceneId}>
      <StagePoster>{poster}</StagePoster>
      <p className="sr-only">{description}</p>
      {children}
    </div>
  );
}
