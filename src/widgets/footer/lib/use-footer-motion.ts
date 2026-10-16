'use client';

import { useEffect, type RefObject } from 'react';

/** Only a real mouse or pen gets the pointer effects: touch never sees magnetic pull or the lens. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
/** Share of the cursor's offset from a magnet's centre that the magnet follows, and its cap in px. */
const PULL = 0.3;
const MAX_PULL = 12;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/**
 * The last page's two pointer effects, one delegated listener on the footer and one rAF per frame:
 * - Magnetic pull: an element marked `[data-magnetic]` sets `--mx`/`--my` on its `[data-magnet]` child, which
 *   CSS turns into a transform. The marker itself never moves, so its rect is a stable reference.
 * - Lens: a soft disc (`[data-lens]`) follows the cursor over the wordmark (`[data-wordmark]`), and the lit
 *   copy inside it (`[data-lens-copy]`) is counter-translated so its letters stay registered with the stamp.
 * Transforms only; style writes come after the frame's rect reads. Off unless `enabled` (motion tier > 0,
 * which the footer switch and the OS setting both force to 0) and the pointer is fine.
 */
export function useFooterPointer(rootRef: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || !window.matchMedia(FINE_POINTER).matches) return;

    const stage = root.querySelector<HTMLElement>('[data-wordmark]');
    const lens = root.querySelector<HTMLElement>('[data-lens]');
    const lensCopy = root.querySelector<HTMLElement>('[data-lens-copy]');

    let frame = 0;
    let x = 0;
    let y = 0;
    let inside = false;
    let target: Element | null = null;
    let magnet: HTMLElement | null = null;

    const release = (marker: HTMLElement) => {
      const body = marker.querySelector<HTMLElement>('[data-magnet]');
      body?.style.removeProperty('--mx');
      body?.style.removeProperty('--my');
      marker.removeAttribute('data-pulling');
    };

    const tick = () => {
      frame = 0;

      const next = inside ? (target?.closest<HTMLElement>('[data-magnetic]') ?? null) : null;
      if (magnet && magnet !== next) release(magnet);
      magnet = next;
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const body = magnet.querySelector<HTMLElement>('[data-magnet]');
        body?.style.setProperty('--mx', `${clamp((x - (r.left + r.width / 2)) * PULL, MAX_PULL)}px`);
        body?.style.setProperty('--my', `${clamp((y - (r.top + r.height / 2)) * PULL, MAX_PULL)}px`);
        magnet.setAttribute('data-pulling', '');
      }

      if (stage && lens && lensCopy) {
        const r = stage.getBoundingClientRect();
        const half = lens.offsetWidth / 2;
        const lx = x - r.left;
        const ly = y - r.top;
        const near = inside && lx > -half && lx < r.width + half && ly > -half && ly < r.height + half;
        if (near) {
          lens.style.transform = `translate3d(${lx - half}px, ${ly - half}px, 0)`;
          lensCopy.style.transform = `translate3d(${half - lx}px, ${half - ly}px, 0)`;
        }
        stage.toggleAttribute('data-lit', near);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      x = event.clientX;
      y = event.clientY;
      target = event.target as Element | null;
      inside = true;
      schedule();
    };
    const onLeave = () => {
      inside = false;
      target = null;
      schedule();
    };
    // Lenis moves the page under a still cursor: re-register the lens against the wordmark's new rect.
    const onScroll = () => {
      if (inside) schedule();
    };

    // The lit copy must be exactly as wide as the stamp it overlays.
    const sync = () => {
      if (stage) stage.style.setProperty('--wm-w', `${stage.clientWidth}px`);
    };
    sync();
    const resize = new ResizeObserver(sync);
    if (stage) resize.observe(stage);

    root.dataset.pointer = 'fine';
    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      if (magnet) release(magnet);
      stage?.removeAttribute('data-lit');
      delete root.dataset.pointer;
    };
  }, [rootRef, enabled]);
}

/**
 * Reveal on arrival: when motion is allowed and the footer starts below the fold, `data-reveal="pending"`
 * holds the headline words and the wordmark letters low and clear; the first intersection sets "in" and CSS
 * lifts them (transform and opacity). Server markup has no attribute, so without JS everything is simply there.
 * Re-armed per route (`routeKey`), never armed when the footer is already on screen (restored scroll positions).
 */
export function useFooterReveal(rootRef: RefObject<HTMLElement | null>, enabled: boolean, routeKey: string): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    if (root.getBoundingClientRect().top < window.innerHeight) return;

    root.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        root.dataset.reveal = 'in';
        observer.disconnect();
      },
      { threshold: 0.18 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      delete root.dataset.reveal;
    };
  }, [rootRef, enabled, routeKey]);
}
