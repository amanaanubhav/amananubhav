'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useState, type ReactNode } from 'react';

import { useBootDone } from '@/shared/lib/boot';
import { degradeStage, useMotionTier } from '@/shared/lib/motion-tier';

import { onIdle } from './idle';
import { loadRenderer } from './load-renderer';
import { useStageEntries } from './registry';

/* The three/R3F chunk. Never in an initial chunk: reached only through loadRenderer's dynamic import. */
const StageRenderer = dynamic(loadRenderer, { ssr: false, loading: () => null });

/**
 * Starts downloading the renderer chunk now (the same module StageCanvas loads), for a page that wants its
 * scene as early as possible (the home story's kick, load-in-3d §4). On a first load of '/' the pre-hydration
 * kick (early-kick.ts, §10) has usually started it already; this joins that load. Rejects when the chunk fails.
 */
export function preloadStage(): Promise<unknown> {
  return loadRenderer();
}

/**
 * The renderer chunk failed to load, or the renderer threw (no WebGL context): no canvas for the rest of
 * the session. The tier drops to 0, so every stage shows its static map instead of an error page.
 */
class RendererBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    if (process.env.NODE_ENV !== 'production') console.warn('Stage renderer failed; static maps from now on.', error);
    degradeStage();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface StageCanvasProps {
  /** Booting, an overlay open, a story open, or any scroll lock held. */
  paused: boolean;
  isDark: boolean;
}

/**
 * The one persistent canvas, owned by the shell (§C.5). Renders nothing until it is armed: tier >= 1
 * and at least one scene registered, then an idle callback once boot is done, or the next frame when a
 * registered scene is `eager` (the home relief, which loads under the first-load curtain). Once armed it
 * stays mounted across routes; it unmounts only when the tier drops to 0 (context loss, degradeStage, the
 * footer switch), and the posters stay for the rest of the session.
 */
export function StageCanvas({ paused, isDark }: StageCanvasProps) {
  const tier = useMotionTier();
  const bootDone = useBootDone();
  const entries = useStageEntries();
  const sceneCount = entries.length;
  const eager = entries.some((entry) => entry.eager);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (armed || tier === 0 || !(bootDone || eager) || sceneCount === 0) return;
    if (eager) {
      const frame = requestAnimationFrame(() => setArmed(true));
      return () => cancelAnimationFrame(frame);
    }
    return onIdle(() => setArmed(true), 2000);
  }, [armed, tier, bootDone, sceneCount, eager]);

  if (!armed || tier === 0) return null;
  return (
    <RendererBoundary>
      <StageRenderer paused={paused} isDark={isDark} tier={tier} />
    </RendererBoundary>
  );
}
