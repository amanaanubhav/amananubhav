'use client';

import type { RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { isStaticStack, useStaticStack } from './use-static-stack';

/** Timeline spacing between card reveals, and each reveal's length (timeline seconds). */
const STEP = 0.8;
const REVEAL = 1;
/** The last card rests on top this long before the pin lets go (timeline seconds). */
const HOLD = 0.4;
/** Scroll per timeline second, in % of the viewport height (P-06: the pin length follows the timeline). */
const SCROLL_PER_SECOND = 90;

/**
 * The stacked journal-entry cards. Pins `trackRef` (the cards and the index button; the section heading
 * scrolls away above it) and reveals each `.blog-card` inside `scopeRef` after the first, in sequence (§G.4):
 *
 * - The pin is CSS `position: sticky` (the track inside `pinRef`), so the track never switches between
 *   `relative` and `fixed` and the pin records no layout shift (CLS). This hook publishes `--fn-pin-len` (the
 *   pin's scroll length, the wrapper's spacer) and `--fn-h` (the track height, which the sticky `top` centres
 *   in the band under the navbar) on the wrapper, and scrubs the timeline over that range.
 *
 * - The first card rests in place, so the pin opens on it; the second starts rising at the first pixel of the
 *   pin (P-06: reveals at `(i - 1) * STEP`, so no stretch of pinned scroll shows nothing moving).
 * - The pin is as long as the timeline: `tl.duration() * 90%` of the viewport, recomputed on refresh, so adding a
 *   card or changing STEP never leaves dead scroll at the end.
 * - A card arrives by transform only (from just below the track's clipped bottom edge); its glass surface (alpha-glass
 *   0.86 with the soft blur) keeps the card underneath to a faint, blurred light.
 * - A card that stacks under the next scales to 0.96 and its cover (`[data-fn-dim]`; never the surface or the
 *   text column, whose violet keys and aqua readouts have no opacity headroom) dims to 0.85. No blur.
 * - Nothing is hidden with `visibility`, so every card's button stays in the tab order. When focus enters a
 *   card (Tab, Shift+Tab, or focus returned by the story reader), the page scrolls to the point of the scrub
 *   where that card is on top, so focus never lands on a covered or off-track card (WCAG 2.1.1, 2.4.11).
 *
 * Runs inside `useGSAP` so every tween, the pin length and the focus listener revert on unmount. Under reduced
 * motion, the footer switch or a lite device it does not run, and the page CSS lays the cards out as a list.
 */
export function useStackedCardsTimeline(
  scopeRef: RefObject<HTMLElement | null>,
  pinRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
): void {
  const isStatic = useStaticStack();

  useGSAP(
    () => {
      // The hydration render sees the server snapshot (staged): re-check the DOM so static mode never pins.
      const pin = pinRef.current;
      const track = trackRef.current;
      if (isStatic || isStaticStack() || !pin || !track) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.blog-card', scopeRef.current);
        const tl = gsap.timeline();

        cards.forEach((card, i) => {
          if (i === 0) return; // already in place
          const at = (i - 1) * STEP;
          // 1. Reveal. Moving down by the full track height puts the card's top below the track's clipped
          //    bottom edge, whatever the card's height.
          tl.fromTo(
            card,
            { y: () => track.offsetHeight, scale: 0.95 },
            { y: 0, scale: 1, duration: REVEAL, ease: 'power2.out' },
            at,
          );
          // 2. Recession: the previous page settles and its content dims as this one arrives.
          const prev = cards[i - 1];
          tl.to(prev, { scale: 0.96, duration: REVEAL, ease: 'power2.out' }, at);
          tl.to(prev.querySelectorAll('[data-fn-dim]'), { opacity: 0.85, duration: REVEAL, ease: 'power2.out' }, at);
        });
        // The last card holds on top for a beat before the page moves on.
        tl.to({}, { duration: HOLD });

        // The sticky pin: its scroll length (the timeline's) and the track height its centred `top` reads.
        const pinLength = (): number => Math.round(((tl.duration() * SCROLL_PER_SECOND) / 100) * window.innerHeight);
        const publish = (): void => {
          pin.style.setProperty('--fn-pin-len', `${pinLength()}px`);
          pin.style.setProperty('--fn-h', `${track.offsetHeight}px`);
        };
        publish();

        // Created once the timeline is complete, so `end` always reads its real duration. The scrub runs while
        // the track is stuck: from the wrapper's top reaching the sticky `top`, for the pin length.
        const st = ScrollTrigger.create({
          animation: tl,
          trigger: pin,
          start: () => `top ${Math.round(parseFloat(getComputedStyle(track).top) || 0)}px`,
          end: () => `+=${pinLength()}`,
          scrub: 1,
          onRefreshInit: publish,
          // Created after the triggers inside the page above it (child effects run first): refresh first.
          refreshPriority: 1,
          // The off-track start offset depends on the track height: recompute it on resize.
          invalidateOnRefresh: true,
        });

        // Focus entering a card brings that card to the top of the stack: the scrub time where its reveal
        // is all but done and the next one has not started (the first card: the pin start).
        const onFocusIn = (event: FocusEvent): void => {
          const target = event.target as Element | null;
          // Keyboard focus only: a pointer press on the top card's title must never move the page.
          if (!target?.matches(':focus-visible')) return;
          const card = target.closest<HTMLElement>('.blog-card');
          if (!card) return;
          const index = cards.indexOf(card);
          if (index < 0) return;
          // Overflow is clipped, but never let a focus scroll leave the track offset.
          track.scrollTop = 0;
          const time = index === 0 ? 0 : Math.min((index - 1) * STEP + REVEAL * 0.9, tl.duration());
          const y = st.start + (time / tl.duration()) * (st.end - st.start);
          scrollToTarget(Math.round(y), { immediate: true });
          // Skip the scrub's catch-up so the focused card is on top at once.
          requestAnimationFrame(() => {
            st.update();
            st.getTween()?.progress(1);
          });
        };
        track.addEventListener('focusin', onFocusIn);
        return () => {
          track.removeEventListener('focusin', onFocusIn);
          pin.style.removeProperty('--fn-pin-len');
          pin.style.removeProperty('--fn-h');
        };
      });
      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [isStatic], revertOnUpdate: true },
  );
}
