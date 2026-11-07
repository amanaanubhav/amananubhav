'use client';

import { useSyncExternalStore } from 'react';

import { getLenis } from '@/shared/lib/smooth-scroll';

export type MotionTier = 0 | 1 | 2;

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/* ------------------------------------------------------------------------------------------------
 * Tier store. The tier is computed once on the client and can only go down at runtime
 * (degradeStage, the OS setting turning on).
 * ---------------------------------------------------------------------------------------------- */

let cachedTier: MotionTier | null = null;
let forcedZero = false;
const tierListeners = new Set<() => void>();
let reduceQuery: MediaQueryList | null = null;

function emitTier(): void {
  tierListeners.forEach((listener) => listener());
}

function probeWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function computeTier(): MotionTier {
  const root = document.documentElement;
  if (root.dataset.motion === 'off' || root.dataset.lite === '1') return 0;
  if (window.matchMedia(REDUCE_QUERY).matches) return 0;

  // Repeat the cheap gate checks in case the inline script did not run.
  const nav = navigator as Navigator & NavigatorHints;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (nav.connection?.saveData) return 0;
  if ((nav.deviceMemory ?? 8) < 4) return 0;
  if (coarse && (nav.hardwareConcurrency ?? 8) <= 4) return 0;

  if (!probeWebGL2()) return 0;
  if (coarse || window.innerWidth < 768) return 1;
  return 2;
}

/* ------------------------------------------------------------------------------------------------
 * Keeping the visitor's place. Some staged-only boxes leave the layout when the page turns static at run time
 * (the home #next transition slot, 242 / 272 vh, `[data-next-transition]`; any box marked `data-static-collapse`).
 * A visitor inside or below one would jump down the page by its height.
 * - A visitor at or past an anchor (`data-static-anchor`, the home #next section; on screen or above it) keeps the
 *   anchor where it was on screen. That covers every box above it, marked or not.
 * - Otherwise the marked boxes are read before the switch, and the scroll moves up by as much of each as was above the
 *   viewport's top once it has collapsed.
 * React commits the static layout in a microtask; the next two frames and a resize watch over the next 1.5 s catch a
 * later commit. Any scroll input from the visitor ends the hold, so a late commit never undoes their own scroll.
 * ---------------------------------------------------------------------------------------------- */

const COLLAPSES_WHEN_STATIC = '[data-next-transition], [data-static-collapse]';
const STATIC_ANCHOR = '[data-static-anchor]';
const HOLD_CANCEL = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
/** How long one hold follows its boxes: some collapse in a later React commit (the story entries' slots). */
const HOLD_MS = 1500;
/** One hold per switch: the OS setting path calls this twice (directly, then through dropToZero). */
let holdingUntil = 0;

/** Call just before the page turns static; it restores the place itself once the boxes collapse. */
export function holdPlaceAcrossStatic(): void {
  if (typeof document === 'undefined') return;
  const now = performance.now();
  if (now < holdingUntil) return;
  const before: { el: HTMLElement; top: number; height: number }[] = [];
  document.querySelectorAll<HTMLElement>(COLLAPSES_WHEN_STATIC).forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.height > 0 && box.top < 0) before.push({ el, top: box.top, height: box.height });
  });
  // The last anchor that is on screen or above it: the visitor is reading at or past it.
  let anchor: { el: HTMLElement; top: number } | null = null;
  document.querySelectorAll<HTMLElement>(STATIC_ANCHOR).forEach((el) => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight) anchor = { el, top };
  });
  if (before.length === 0 && !anchor) return;
  holdingUntil = now + HOLD_MS;
  const held = anchor as { el: HTMLElement; top: number } | null;
  // The target is absolute: the browser may already have moved the scroll (clamped to a shorter page, or by
  // scroll anchoring), so a relative step from the current position would count the collapse twice.
  const startY = window.scrollY;
  const targetY = (): number => {
    if (held?.el.isConnected) return held.el.getBoundingClientRect().top + window.scrollY - held.top;
    let shift = 0;
    for (const b of before) {
      const height = b.el.isConnected ? b.el.getBoundingClientRect().height : 0;
      const lost = b.height - height;
      if (lost > 0) shift += Math.min(lost, -b.top);
    }
    return startY - shift;
  };
  let last = startY;
  let stopped = false;
  const settle = () => {
    if (stopped) return;
    const target = Math.max(0, targetY());
    if (Math.abs(target - last) < 0.5) return; // nothing new has collapsed since the last step
    last = target;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
  };
  // A later commit is caught as it lays out (a resize callback runs before that frame paints).
  const watch = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(settle);
  const stop = () => {
    stopped = true;
    watch?.disconnect();
    for (const type of HOLD_CANCEL) window.removeEventListener(type, stop, true);
  };
  for (const type of HOLD_CANCEL) window.addEventListener(type, stop, { capture: true, passive: true });
  queueMicrotask(settle);
  requestAnimationFrame(() => {
    settle();
    requestAnimationFrame(settle);
  });
  for (const b of before) watch?.observe(b.el);
  watch?.observe(document.body);
  window.setTimeout(() => {
    settle();
    stop();
  }, HOLD_MS);
}

function dropToZero(): void {
  if (forcedZero && cachedTier === 0) return;
  holdPlaceAcrossStatic();
  forcedZero = true;
  cachedTier = 0;
  emitTier();
}

function onReduceChange(event: MediaQueryListEvent): void {
  if (!event.matches) return; // turning the OS setting off takes effect on the next load
  holdPlaceAcrossStatic(); // before data-motion=off collapses the slot through CSS
  document.documentElement.dataset.motion = 'off';
  dropToZero();
}

function subscribeTier(callback: () => void): () => void {
  tierListeners.add(callback);
  if (!reduceQuery && typeof window !== 'undefined') {
    reduceQuery = window.matchMedia(REDUCE_QUERY);
    reduceQuery.addEventListener('change', onReduceChange);
  }
  return () => {
    tierListeners.delete(callback);
  };
}

/** 0 on the server; on the client the tier of §C.4 (computed once, then only lowered). */
export function getMotionTier(): MotionTier {
  if (typeof window === 'undefined') return 0;
  if (forcedZero) return 0;
  if (cachedTier === null) cachedTier = computeTier();
  return cachedTier;
}

const getServerTier = (): MotionTier => 0;

/** Reactive tier. Server snapshot 0, so the SSR markup never depends on it. */
export function useMotionTier(): MotionTier {
  return useSyncExternalStore(subscribeTier, getMotionTier, getServerTier);
}

/** True when reveals, draws, count-ups and Lenis may run (tier > 0). */
export function useMotionAllowed(): boolean {
  return useMotionTier() > 0;
}

/** Runtime drop to tier 0 (PerformanceMonitor fallback, WebGL context loss). Posters for the rest of the session. */
export function degradeStage(): void {
  if (typeof window === 'undefined') return;
  dropToZero();
}
