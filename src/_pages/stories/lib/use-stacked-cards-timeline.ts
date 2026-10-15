'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from '@/shared/lib/gsap';

/**
 * GSAP ScrollTrigger - Progressive Translucency Implementation (verbatim from legacy Adventures.jsx).
 * Pins `triggerRef`, reveals every `.blog-card` inside `scopeRef` in sequence, then the CTA.
 */
export function useStackedCardsTimeline(
  scopeRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  ctaRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.blog-card');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: '+=350%',
          scrub: 1, // Strictly linked to scroll
          pin: true,
          anticipatePin: 1,
        },
      });

      cards.forEach((card, i) => {
        // 1. Reveal Interaction
        tl.fromTo(
          card,
          {
            yPercent: 120,
            opacity: 0,
            scale: 0.95,
            visibility: 'hidden',
            '--card-opacity': 0.3,
            filter: 'blur(0px)', // Explicit start
          },
          {
            yPercent: 0,
            opacity: 1,
            scale: 1,
            visibility: 'visible',
            duration: 1,
            ease: 'power2.out',
            '--card-opacity': 0.85,
            filter: 'blur(0px)', // Ensure sharp on arrival
          },
          i * 0.8,
        );

        // 2. Recession Logic (Progressive Translucency)
        // If there is a previous card, fade it out as this card arrives
        if (i > 0) {
          const prevCard = cards[i - 1];
          // Use exact same duration/position as current card's arrival to sync perfectly
          tl.to(
            prevCard,
            {
              opacity: 0.4, // Visually recede
              scale: 0.95, // Shrink slightly to emphasize depth
              filter: 'blur(4px)', // Optical blur
              duration: 1, // Matches arrival duration
              ease: 'power2.out',
            },
            i * 0.8,
          ); // Start at same time current card starts arriving
        }
      });

      tl.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0, pointerEvents: 'none' },
        { y: 0, opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' },
        '+=0.2',
      );
    }, scopeRef);
    return () => ctx.revert();
  }, [scopeRef, triggerRef, ctaRef]);
}
