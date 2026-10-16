'use client';

import { useSyncExternalStore } from 'react';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/*
 * The stacked cards use the same cheap pre-paint signals as the page CSS (§C.4: `data-motion`,
 * `data-lite`, plus the OS setting), never the WebGL probe, so the CSS layout and the timeline always
 * agree: a failed WebGL probe keeps the staged stack and its animation.
 */
/** Read now, from the DOM (also used inside the timeline, which must never trust a stale snapshot). */
export function isStaticStack(): boolean {
  const { motion, lite } = document.documentElement.dataset;
  return motion === 'off' || lite === '1' || window.matchMedia(REDUCE_QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion', 'data-lite'] });
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    query.removeEventListener('change', onChange);
  };
}

/** True when the stacked cards must render as a static list (reduced motion, footer switch, lite device). */
export function useStaticStack(): boolean {
  return useSyncExternalStore(subscribe, isStaticStack, () => false);
}
