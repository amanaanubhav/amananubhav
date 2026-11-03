import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * The only place GSAP is imported from (§C.2). Plugins are registered once, on the client.
 * `ignoreMobileResize` keeps the mobile URL bar from forcing a refresh on every scroll direction change.
 * SplitText is not registered here: `loadSplitText()` fetches and registers it on demand, so the plugin stays out of
 * the shared initial chunk.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
