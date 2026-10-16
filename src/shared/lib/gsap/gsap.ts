import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * The only place GSAP is imported from (§C.2). Plugins are registered once, on the client.
 * `ignoreMobileResize` keeps the mobile URL bar from forcing a refresh on every scroll direction change.
 *
 * The static `SplitText` export is transitional: new code uses `loadSplitText()` so the plugin leaves the
 * shared initial chunk. Drop the static import and its registration once nothing reads `SplitText` as a value.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
