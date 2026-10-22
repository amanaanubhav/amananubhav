import { STAGE_HOLD_ATTR, STAGE_HOLD_CAP_MS, prefetchListed, releaseStageHold } from '@/shared/lib/stage-prefetch';

import { loadRenderer } from './load-renderer';

/*
 * The pre-hydration renderer kick (load-in-3d §10, P1). Injected by next.config `instrumentationClientInject`:
 * Next runs it once per full page load, after the initial chunks and before React hydrates, on every route.
 * On '/' with the pre-paint gate on (html[data-motion=on][data-lite=0]), WebGL2 present and a slow link, it
 * starts the three/R3F chunk and the stage data the page lists (`data-stage-prefetch`) in the idle network gap
 * before hydration, and holds the navbar's link prefetch so they have the link to themselves. The home stage
 * releases the hold once it is live, static or failed; the cap releases it regardless. No context probe here:
 * StoryStage still decides at hydration whether the stage runs, and a renderer chunk error surfaces there
 * (preloadStage joins this load).
 *
 * Only on a slow link: there the chunk takes seconds and lands after the hydration commit. On a fast one it
 * would land inside hydration, and its ~0.9 s evaluation (4x CPU) would hold the commit back, for a gain of a
 * few hundred milliseconds; the kick at hydration (StoryStage) is the right time there.
 */

/** Script bytes per ms below which the link counts as slow: the 240 KB chunk then needs more than ~1.5 s. */
const SLOW_BYTES_PER_MS = 160;

/** Throughput of the initial scripts (all loaded before this runs), bytes per ms; Infinity when unknown. */
function scriptThroughput(): number {
  let bytes = 0;
  let start = Infinity;
  let end = 0;
  for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    if (entry.initiatorType !== 'script' || entry.encodedBodySize === 0) continue;
    bytes += entry.encodedBodySize;
    start = Math.min(start, entry.startTime);
    end = Math.max(end, entry.responseEnd);
  }
  return end > start ? bytes / (end - start) : Infinity;
}

try {
  const root = document.documentElement;
  const gate = root.dataset;
  if (
    location.pathname === '/' &&
    gate.motion === 'on' &&
    gate.lite === '0' &&
    typeof WebGL2RenderingContext === 'function' &&
    scriptThroughput() < SLOW_BYTES_PER_MS
  ) {
    root.setAttribute(STAGE_HOLD_ATTR, '');
    setTimeout(releaseStageHold, STAGE_HOLD_CAP_MS);
    // After the fonts: the h1 (LCP) keeps the network until then. The data at low priority, so a prioritising
    // transport (HTTP/2) still serves the renderer chunk first: its evaluation can overlap the data download.
    document.fonts.ready
      .then(() => {
        const renderer = loadRenderer();
        prefetchListed('low');
        return renderer;
      })
      .catch(() => {});
  }
} catch {
  // never block hydration
}
