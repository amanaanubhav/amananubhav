'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { applyPendingHistoryScroll, restoreHistoryScroll, settleHistoryTraversal } from '@/shared/lib/dom';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { getLenis } from '@/shared/lib/smooth-scroll';

const RESIZE_DEBOUNCE_MS = 200;

/**
 * Keeps Lenis and ScrollTrigger in step with the App Router (§C.6): on every route change Lenis
 * re-measures and adopts the scroll position Next.js chose, ScrollTrigger forgets the old page's
 * scroll memory and refreshes on the next frame; `<main>` resizes (debounced) and the web fonts
 * arriving refresh too. Back/forward (§J.4 #16): the browser restores first; once the route has
 * committed and ScrollTrigger has refreshed (pin spacers exist), the position remembered for the
 * history entry is re-applied if that restore was clamped by the shorter pre-hydration page, and the
 * Back/Forward flag that keeps useScrollToTopOnMount from resetting it is settled.
 */
export function RouteScrollSync() {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.resize();
      // Adopt the position Next.js chose, unless an animated jump is still running: the navbar
      // starts scrollToTop() when the new route commits (an effect before this one), and snapping here would stop it.
      if (lenis.isScrolling !== 'smooth') {
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      }
    }
    ScrollTrigger.clearScrollMemory();
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      restoreHistoryScroll();
      // The new route's mount effects (which ran before this one) have seen the Back/Forward flag.
      settleHistoryTraversal();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const main = document.getElementById('content');
    if (!main || typeof ResizeObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastHeight = main.offsetHeight;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const height = main.offsetHeight;
        if (Math.abs(height - lastHeight) < 1) return;
        lastHeight = height;
        getLenis()?.resize();
        ScrollTrigger.refresh();
      }, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(main);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // A restore the page was still too short for is retried after every later refresh (boot, resize, fonts).
  useEffect(() => {
    ScrollTrigger.addEventListener('refresh', applyPendingHistoryScroll);
    return () => ScrollTrigger.removeEventListener('refresh', applyPendingHistoryScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
