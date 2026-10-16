'use client';

import type { RefObject } from 'react';
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { isStaticStack, useStaticStack } from './use-static-stack';

/** Timeline spacing between card reveals, and each reveal's length (timeline seconds). */
const STEP = 0.8;
const REVEAL = 1;

/**
 * The stacked field-note cards (legacy Adventures.jsx timeline). Pins `triggerRef`, reveals each
 * `.blog-card` inside `scopeRef` after the first in sequence, then the CTA. Pin, scrub and end are
 * unchanged; only the visual targets changed (§G.4):
 *
 * - The first card rests in place, so the top of the section (the rail and chip target) always shows it.
 * - A card arrives by transform only (from just below the track's clipped bottom edge); its surface stays
 *   opaque, so the card underneath never shows through it.
 * - A card that stacks under the next scales to 0.96 and its content (`[data-fn-dim]`, never the surface)
 *   dims to 0.6. No blur.
 * - Nothing is hidden with `visibility`, so every card's button stays in the tab order. When focus enters a
 *   card (Tab, Shift+Tab, or focus returned by the story reader), the page scrolls to the point of the scrub
 *   where that card is on top, so focus never lands on a covered or off-track card (WCAG 2.1.1, 2.4.11).
 *
 * Runs inside `useGSAP` so every tween, the pin and the focus listener revert on unmount. Under reduced
 * motion, the footer switch or a lite device it does not run, and the page CSS lays the cards out as a list.
 */
export function useStackedCardsTimeline(
  scopeRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  ctaRef: RefObject<HTMLElement | null>,
): void {
  const isStatic = useStaticStack();

  useGSAP(
    () => {
      // The hydration render sees the server snapshot (staged): re-check the DOM so static mode never pins.
      const track = triggerRef.current;
      if (isStatic || isStaticStack() || !track) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.blog-card', scopeRef.current);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: track,
            start: 'top top',
            end: '+=350%',
            scrub: 1, // Strictly linked to scroll
            pin: true,
            anticipatePin: 1,
            // Created after the triggers inside the page above it (child effects run first): refresh first.
            refreshPriority: 1,
            // The off-track start offset depends on the track height: recompute it on resize.
            invalidateOnRefresh: true,
          },
        });

        cards.forEach((card, i) => {
          // 1. Reveal (the first card is already in place). Moving down by the full track height puts the
          //    card's top below the track's clipped bottom edge, whatever the card's height.
          if (i > 0) {
            tl.fromTo(
              card,
              { y: () => track.offsetHeight, scale: 0.95 },
              { y: 0, scale: 1, duration: REVEAL, ease: 'power2.out' },
              i * STEP,
            );

            // 2. Recession: the previous page settles and its content dims as this one arrives.
            const prev = cards[i - 1];
            tl.to(prev, { scale: 0.96, duration: REVEAL, ease: 'power2.out' }, i * STEP);
            tl.to(prev.querySelectorAll('[data-fn-dim]'), { opacity: 0.6, duration: REVEAL, ease: 'power2.out' }, i * STEP);
          }
        });

        tl.fromTo(
          ctaRef.current,
          { y: 20, opacity: 0, pointerEvents: 'none' },
          { y: 0, opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power2.out' },
          '+=0.2',
        );

        // Focus entering a card brings that card to the top of the stack: the scrub time where its reveal
        // is all but done and the next one has not started (the first card: the pin start).
        const onFocusIn = (event: FocusEvent): void => {
          const st = tl.scrollTrigger;
          const target = event.target as Element | null;
          // Keyboard focus only: a pointer press on the top card's title must never move the page.
          if (!st || !target?.matches(':focus-visible')) return;
          const card = target.closest<HTMLElement>('.blog-card');
          if (!card) return;
          const index = cards.indexOf(card);
          if (index < 0) return;
          // Overflow is clipped, but never let a focus scroll leave the track offset.
          track.scrollTop = 0;
          const time = index === 0 ? 0 : Math.min((index + 1) * STEP, tl.duration());
          const y = st.start + (time / tl.duration()) * (st.end - st.start);
          scrollToTarget(Math.round(y), { immediate: true });
          // Skip the scrub's catch-up so the focused card is on top at once.
          requestAnimationFrame(() => {
            st.update();
            st.getTween()?.progress(1);
          });
        };
        track.addEventListener('focusin', onFocusIn);
        return () => track.removeEventListener('focusin', onFocusIn);
      });
      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [isStatic], revertOnUpdate: true },
  );
}
