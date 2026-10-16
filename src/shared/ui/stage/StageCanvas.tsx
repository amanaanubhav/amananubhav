'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { useBootDone } from '@/shared/lib/boot';
import { useMotionTier } from '@/shared/lib/motion-tier';

import { onIdle } from './idle';
import { useStageEntries } from './registry';

/* The three/R3F chunk. Never in an initial chunk: reached only through this dynamic import. */
const StageRenderer = dynamic(() => import('./StageRenderer'), { ssr: false, loading: () => null });

export interface StageCanvasProps {
  /** Booting, an overlay open, a story open, or any scroll lock held. */
  paused: boolean;
  isDark: boolean;
}

/**
 * The one persistent canvas, owned by the shell (§C.5). Renders nothing until it is armed: boot
 * done, tier >= 1 and at least one scene registered, then an idle callback. Once armed it stays
 * mounted across routes; it unmounts only when the tier drops to 0 (context loss, degradeStage,
 * the footer switch), and the posters stay for the rest of the session.
 */
export function StageCanvas({ paused, isDark }: StageCanvasProps) {
  const tier = useMotionTier();
  const bootDone = useBootDone();
  const sceneCount = useStageEntries().length;
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (armed || tier === 0 || !bootDone || sceneCount === 0) return;
    return onIdle(() => setArmed(true), 2000);
  }, [armed, tier, bootDone, sceneCount]);

  if (!armed || tier === 0) return null;
  return <StageRenderer paused={paused} isDark={isDark} tier={tier} />;
}
