import type { SplitText } from 'gsap/SplitText';

import { gsap } from './gsap';

let pending: Promise<typeof SplitText> | null = null;

/**
 * SplitText on demand (§J.2): fetches and registers the plugin on first call and resolves to the class,
 * so only the components that split text pay for it, after first paint. Repeat calls share one request;
 * a failed load (offline) is forgotten so the next call retries.
 *
 *   const SplitText = await loadSplitText();
 *   const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
 */
export function loadSplitText(): Promise<typeof SplitText> {
  pending ??= import('gsap/SplitText').then(
    ({ SplitText: Split }) => {
      gsap.registerPlugin(Split);
      return Split;
    },
    (error: unknown) => {
      pending = null;
      throw error;
    },
  );
  return pending;
}
