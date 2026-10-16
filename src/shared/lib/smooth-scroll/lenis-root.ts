import type Lenis from 'lenis';
import { useEffect, useSyncExternalStore } from 'react';

import { MOTION } from '@/shared/config';
import { gsap, ScrollTrigger } from '@/shared/lib/gsap';

/* ------------------------------------------------------------------------------------------------
 * Module state: the one Lenis instance (window scroller) and the ref-counted scroll lock.
 * ---------------------------------------------------------------------------------------------- */

let lenis: Lenis | null = null;
let lockCount = 0;
let pendingAfterUnlock: { run: () => void; expires: number } | null = null;
const lockListeners = new Set<() => void>();

/** A jump requested while a lock is held runs on release, if that happens within this window. */
const PENDING_SCROLL_TTL_MS = 1500;

function emitLock(): void {
  lockListeners.forEach((listener) => listener());
}

/** The live Lenis instance, or `null` (tier 0, `/admin-chat`, server). */
export function getLenis(): Lenis | null {
  return lenis;
}

export function isScrollLocked(): boolean {
  return lockCount > 0;
}

/** Internal: queue a jump for when the last lock is released (see scrollToTarget). */
export function runAfterUnlock(run: () => void): void {
  pendingAfterUnlock = { run, expires: Date.now() + PENDING_SCROLL_TTL_MS };
}

/**
 * Ref-counted page scroll lock (§C.3). The first lock stops Lenis (`html.lenis-stopped`
 * clips the overflow); the last release starts it again from the current position.
 * The returned release function is idempotent.
 */
export function acquireScrollLock(): () => void {
  lockCount += 1;
  if (lockCount === 1) {
    lenis?.stop();
    emitLock();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0) return;
    lenis?.start();
    emitLock();
    const pending = pendingAfterUnlock;
    pendingAfterUnlock = null;
    if (pending && Date.now() <= pending.expires) {
      // Let the overlay finish unmounting (and the overflow styles reset) before jumping.
      requestAnimationFrame(() => pending.run());
    }
  };
}

function subscribeLock(callback: () => void): () => void {
  lockListeners.add(callback);
  return () => {
    lockListeners.delete(callback);
  };
}

const getLockSnapshot = () => lockCount > 0;
const getLockServerSnapshot = () => false;

/** True while any overlay or the preloader holds a scroll lock (the stage pauses, §C.3). */
export function useScrollLocked(): boolean {
  return useSyncExternalStore(subscribeLock, getLockSnapshot, getLockServerSnapshot);
}

/**
 * Creates Lenis on the window, driven by `gsap.ticker` and feeding ScrollTrigger (§C.2).
 * Call once, from the AppShell, with `tier > 0 && pathname !== ROUTES.adminChat`.
 * Lenis is loaded on demand (it is only ever created here, after hydration and at tier > 0), so it
 * stays out of every route's initial JS (§J.2). Until it arrives, and if it fails to load, the page
 * keeps native scrolling; getLenis() returns null meanwhile and every caller already handles that.
 */
export function useSmoothScrollRoot(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let teardown: (() => void) | null = null;

    import('lenis')
      .then(({ default: LenisCtor }) => {
        if (disposed) return;
        const instance = new LenisCtor({
          autoRaf: false,
          lerp: MOTION.lenis.lerp,
          smoothWheel: true,
          syncTouch: false,
          stopInertiaOnNavigate: true,
          anchors: false,
        });
        const offScroll = instance.on('scroll', () => ScrollTrigger.update());
        const tick = (time: number) => instance.raf(time * 1000);

        gsap.ticker.add(tick, false, true);
        gsap.ticker.lagSmoothing(0);
        lenis = instance;
        if (lockCount > 0) instance.stop();

        const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

        teardown = () => {
          cancelAnimationFrame(frame);
          gsap.ticker.remove(tick);
          offScroll();
          // lenis@1.3 destroy() leaves its native-scroll velocity reset timer running; when it
          // fires it sets isScrolling = false, which re-adds `html.lenis` after the teardown.
          const internals = instance as unknown as { _resetVelocityTimeout: ReturnType<typeof setTimeout> | null };
          if (internals._resetVelocityTimeout !== null) clearTimeout(internals._resetVelocityTimeout);
          internals._resetVelocityTimeout = null;
          instance.destroy();
          gsap.ticker.lagSmoothing(500, 33);
          if (lenis === instance) lenis = null;
          requestAnimationFrame(() => ScrollTrigger.refresh());
        };
      })
      .catch(() => {
        // Chunk failed to load (offline, blocked): native scrolling stays, nothing else depends on Lenis.
      });

    return () => {
      disposed = true;
      teardown?.();
      teardown = null;
    };
  }, [enabled]);
}
