'use client';

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

import { signalBootReady } from '@/shared/lib/boot';
import { setChromeDimmed } from '@/shared/lib/chrome';
import { useMotionTier } from '@/shared/lib/motion-tier';
import { encodePrefetchList, prefetch, releaseStageHold } from '@/shared/lib/stage-prefetch';
import { preloadStage, useStageScene } from '@/shared/ui/stage';

import { useStoryDriver } from '../../lib/story-driver';
import { getPhase, getServerPhase, subscribePhase } from '../../lib/story-scroll';
import { STORY_DATA_PREFETCH } from '../scenes/story/frame';
import { STORY_HUE_VARS } from './palette-vars';
import styles from './story.module.css';
import { StoryLabels } from './StoryLabels';

/** The relief scene module, resolved lazily inside the shared canvas (§C.5). Module-level constant. */
const loadRelief = () => import('../scenes/ReliefAnnapurnaScene');
/** The story data, listed on the SSR stage for the pre-hydration kick (shared/ui/stage early-kick.ts, §10). */
const DATA_LIST = encodePrefetchList(STORY_DATA_PREFETCH);

const noSubscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export interface StoryStageProps {
  /** The SSR plan sheet: the one static map (motion off, lite, no JavaScript, or a failed 3D load). */
  poster: ReactNode;
}

/**
 * THE map of the home page (design §3, load-in-3d): one fixed, full-bleed stage behind the hero and every
 * story section. On a capable device with motion on (the pre-paint gate `html[data-motion=on][data-lite=0]`)
 * the plan sheet is never painted: the hero shows its text on the plain ground, the renderer moves its
 * canvas into this slot, and the scene's first frame is the ground itself, from which the relief rises in
 * 3D. The sheet is the whole map only where it is static from first paint (motion off, lite, no JS), or
 * after a hard failure (tier 0 at hydration, a chunk, data or scene error), where it fades in once and
 * stays. Once the sheet has been shown on a page view the scene never takes over on that page view: every
 * input of `staged` only ever turns it off (the tier only drops, the gate only turns off, failure sticks).
 *
 * aria-hidden: the route list (RouteList, beside it in the page) carries the facts as text.
 */
export function StoryStage({ poster }: StoryStageProps) {
  const tier = useMotionTier();
  const hydrated = useSyncExternalStore(noSubscribe, onClient, onServer);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(false);
  const [live, setLive] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const phase = useSyncExternalStore(subscribePhase, getPhase, getServerPhase);
  const register = useStageScene('relief-annapurna', loadRelief, { fullBleed: true, eager: true });

  const root = hydrated ? document.documentElement.dataset : null;
  const gateOn = root !== null && root.motion === 'on' && root.lite === '0';
  const staged = gateOn && tier > 0 && !failed;
  const isStatic = hydrated && !staged;

  const ref = useCallback((node: HTMLDivElement | null) => setEl(node), []);

  // The scene registers only while staged; it unregisters (and the canvas leaves) once the stage is static.
  useEffect(() => {
    if (!el || !staged) return;
    register(el);
    return () => register(null);
  }, [el, staged, register]);

  useStoryDriver(staged);

  // The kick (load-in-3d §4, §10): after the fonts (the h1's LCP keeps the network), the renderer chunk, the
  // scene module and the story data load in parallel. On a first load of '/' the renderer chunk and the data are
  // usually in flight already (the pre-hydration kick, shared/ui/stage early-kick.ts), and these calls join. A
  // renderer chunk that fails to load never reaches the scene's boundary, so it is caught here as a failure.
  useEffect(() => {
    if (!staged) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      preloadStage().catch(() => {
        if (!cancelled) setFailed(true);
      });
      loadRelief().catch(() => {}); // a scene chunk error reaches the scene boundary (data-stage-failed)
      for (const [url, kind] of STORY_DATA_PREFETCH) prefetch(url, kind);
    });
    return () => {
      cancelled = true;
    };
  }, [staged]);

  // The scene marks the slot: `data-stage-live` on its first (ground-identical) frame, `data-stage-shown`
  // once the relief has risen far enough for the labels, `data-stage-failed` when it cannot draw. A failure
  // sticks for the page view (the scene's unmount clears the attribute, so an addition seen in the records
  // counts too).
  useEffect(() => {
    if (!el) return;
    const read = (records: readonly MutationRecord[]) => {
      setLive(el.hasAttribute('data-stage-live'));
      setShown(el.hasAttribute('data-stage-shown'));
      const added = records.some((r) => r.attributeName === 'data-stage-failed' && r.oldValue === null);
      if (added || el.hasAttribute('data-stage-failed')) setFailed(true);
    };
    const observer = new MutationObserver(read);
    observer.observe(el, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['data-stage-live', 'data-stage-shown', 'data-stage-failed'],
    });
    if (['data-stage-live', 'data-stage-shown', 'data-stage-failed'].some((a) => el.hasAttribute(a))) read([]);
    return () => observer.disconnect();
  }, [el]);

  // The first-load curtain waits for the stage on '/' (preloader design §4.2): ready once the relief's first
  // frame is drawn (it rises when the curtain leaves), or once the stage is static or has failed. The same
  // moment ends the link-prefetch hold (§10), as does leaving the page before it.
  useEffect(() => {
    if (!(live || isStatic || failed)) return;
    signalBootReady('stage');
    releaseStageHold();
  }, [live, isStatic, failed]);
  useEffect(() => releaseStageHold, []);

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
      data-static={isStatic ? '' : undefined}
      data-stage-instant=""
      data-stage-prefetch={DATA_LIST}
      data-gone={staged && phase.gone ? '' : undefined}
      className={`stage-slot ${styles.stage}`}
      style={STORY_HUE_VARS}
    >
      {hydrated && !isStatic ? null : (
        <div className={styles.poster} data-stage-poster="">
          <div className={styles.sheet}>{poster}</div>
        </div>
      )}
      {staged ? <StoryLabels hidden={!shown} /> : null}
    </div>
  );
}
