'use client';

import { useRef, type ReactNode } from 'react';

import { gsap, useGSAP } from '@/shared/lib/gsap';
import { useMotionTier } from '@/shared/lib/motion-tier';

/** Desktop, tier 2, motion allowed only (§G.1): the one ambient touch on the hero. */
const DRIFT_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
/** Over the hero's scroll the index contours drift up 12 px and the minor contours 6 px (§G.1). */
const DRIFT_INDEX_PX = 12;
const DRIFT_MINOR_PX = 6;

/**
 * Wraps the hero plate and lets its contour layer drift up a few pixels while the hero scrolls away
 * (scrubbed, transform only). The route and labels stay put, so the sheet reads as layered paper.
 * No motion at tier 0 or 1, below 1024 px, or under reduced motion.
 */
export function HeroPlateDrift({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tier = useMotionTier();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || tier !== 2) return;
      const mm = gsap.matchMedia();
      mm.add(DRIFT_QUERY, () => {
        const minor = root.querySelector<SVGGElement>('[data-sheet-contours] [data-sheet-minor]');
        const index = root.querySelector<SVGGElement>('[data-sheet-contours] [data-sheet-index]');
        const hero = root.closest('section');
        if (!minor || !index || !hero) return;
        const scrollTrigger = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
        gsap.timeline({ scrollTrigger })
          .to(minor, { y: -DRIFT_MINOR_PX, ease: 'none' }, 0)
          .to(index, { y: -DRIFT_INDEX_PX, ease: 'none' }, 0);
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [tier], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
