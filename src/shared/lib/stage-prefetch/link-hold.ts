import { useSyncExternalStore } from 'react';

/*
 * The link-prefetch hold (load-in-3d §10, P3). The pre-hydration renderer kick (shared/ui/stage/early-kick.ts)
 * sets `html[data-stage-hold]` on a first load of '/', so the three chunk has the network to itself; the navbar
 * keeps its links' prefetch off while it is there. The home stage releases it once it is live, static or failed
 * (or unmounts), and the kick's own cap releases it regardless. Nothing in this file ever sets it.
 */

export const STAGE_HOLD_ATTR = 'data-stage-hold';

/** The kick releases the hold after this long whatever the stage does. */
export const STAGE_HOLD_CAP_MS = 15_000;

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [STAGE_HOLD_ATTR] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.hasAttribute(STAGE_HOLD_ATTR);
// Held during hydration on every route (no prefetch from the first render); a route without a hold re-renders
// once with the client value and starts its normal prefetch.
const getServerSnapshot = () => true;

/** True while the stage holds link prefetch. */
export function useStageHold(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function releaseStageHold(): void {
  document.documentElement.removeAttribute(STAGE_HOLD_ATTR);
}
