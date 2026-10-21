'use client';

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

import { setChromeDimmed } from '@/shared/lib/chrome';
import { useMotionTier } from '@/shared/lib/motion-tier';
import { useStageScene } from '@/shared/ui/stage';

import type { MarkAltitude } from '../../lib/story-labels';
import { useStoryDriver } from '../../lib/story-driver';
import { getPhase, getServerPhase, subscribePhase } from '../../lib/story-scroll';
import styles from './story.module.css';
import { StoryLabels } from './StoryLabels';

/** The relief scene module, resolved lazily inside the shared canvas (§C.5). Module-level constant. */
const loadRelief = () => import('../scenes/ReliefAnnapurnaScene');

/** The crossfade from the poster to the live scene (the poster is removed after it). */
const HANDOFF_MS = 320;

export interface StoryStageProps {
  /** The SSR plan sheet: the arrival poster at tier >= 1 and the one static map at tier 0. */
  poster: ReactNode;
  /** Printed altitude per STORY_MARKS entry (resolved on the server). */
  altitudes: readonly MarkAltitude[];
}

/**
 * THE map of the home page (design §3): one fixed, full-bleed stage behind the hero and every story
 * section. The poster (an SVG plan sheet, server-rendered, moving from first paint) and the WebGL canvas
 * live in this one element and are the same map: the renderer moves its canvas inside this slot, the
 * scene sets `data-stage-live` on its first frame, the poster fades for 300 ms and is then removed from
 * the DOM. At tier 0 (reduced motion, lite, no WebGL) the poster stays as the single static map.
 *
 * aria-hidden: the route list (RouteList, beside it in the page) carries the facts as text.
 */
export function StoryStage({ poster, altitudes }: StoryStageProps) {
  const tier = useMotionTier();
  const staged = tier > 0;
  const register = useStageScene('relief-annapurna', loadRelief, { fullBleed: true });
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [live, setLive] = useState(false);
  const [posterGone, setPosterGone] = useState(false);
  const phase = useSyncExternalStore(subscribePhase, getPhase, getServerPhase);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      register(node);
      setEl(node);
    },
    [register],
  );

  useStoryDriver(staged);

  // The scene marks the slot live on its first frame; it removes the mark when it unmounts (tier drop).
  useEffect(() => {
    if (!el) return;
    const read = () => setLive(el.hasAttribute('data-stage-live'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ['data-stage-live'] });
    return () => observer.disconnect();
  }, [el]);

  useEffect(() => {
    if (!live) {
      setPosterGone(false);
      return;
    }
    const id = window.setTimeout(() => setPosterGone(true), HANDOFF_MS);
    return () => window.clearTimeout(id);
  }, [live]);

  // The summit hold dims the chrome (§5.4), never under reduced motion.
  const dim = staged && phase.summit;
  useEffect(() => {
    setChromeDimmed(dim);
  }, [dim]);
  useEffect(() => () => setChromeDimmed(false), []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-story-stage=""
      data-scene="relief-annapurna"
      data-tier={tier}
      data-gone={staged && phase.gone ? '' : undefined}
      className={`stage-slot ${styles.stage}`}
    >
      {posterGone && staged ? null : (
        <div className={styles.poster}>
          <div className={styles.sheet}>{poster}</div>
        </div>
      )}
      {staged ? <StoryLabels altitudes={altitudes} hidden={!live} /> : null}
    </div>
  );
}
