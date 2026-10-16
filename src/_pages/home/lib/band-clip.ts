import type { RefObject } from 'react';

import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap';

/** Below this width the stage is a sticky band on top and the entries slide under it (§G.1). */
export const BAND_QUERY = '(max-width: 1023px)';

/**
 * Below 1024 px the entries list scrolls under the sticky stage band. The shared canvas sits behind the
 * page, so anything opaque inside the band's rectangle would cover the relief (and text must never sit
 * on the canvas). This clips the list to the part below the band, once per scroll frame: one rect read
 * of the band and one of the list, one `clip-path` write. Nothing runs at 1024 px and up, nor when the
 * staged layout is not displayed.
 */
export function useBandClip(
  scope: RefObject<HTMLElement | null>,
  bandSelector: string,
  listSelector: string,
  deps: readonly unknown[] = [],
): void {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(BAND_QUERY, () => {
        const band = root.querySelector<HTMLElement>(bandSelector);
        const list = root.querySelector<HTMLElement>(listSelector);
        if (!band || !list || band.getClientRects().length === 0) return;

        const apply = () => {
          const bandBottom = band.getBoundingClientRect().bottom;
          const listTop = list.getBoundingClientRect().top;
          const clip = Math.max(0, Math.round(bandBottom - listTop));
          list.style.clipPath = clip > 0 ? `inset(${clip}px 0 0 0)` : '';
        };

        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: apply,
          onRefresh: apply,
          onLeave: apply,
          onLeaveBack: apply,
        });
        apply();

        return () => {
          list.style.clipPath = '';
        };
      });
      return () => mm.revert();
    },
    { scope, dependencies: [...deps], revertOnUpdate: true },
  );
}
