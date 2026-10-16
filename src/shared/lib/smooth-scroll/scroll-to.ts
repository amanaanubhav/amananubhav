import { getLenis, isScrollLocked, runAfterUnlock } from './lenis-root';

export interface ScrollToOptions {
  /** Added to the target's top, in CSS px. Default 0 (sections carry their own top padding). */
  offset?: number;
  immediate?: boolean;
}

const LENIS_JUMP_DURATION_S = 1.1;

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function resolveTarget(target: HTMLElement | string | number): HTMLElement | number | null {
  if (typeof target === 'number') return target;
  if (typeof target === 'string') {
    const id = target.startsWith('#') ? target.slice(1) : target;
    if (!id) return 0;
    const el = document.getElementById(id);
    if (!el && process.env.NODE_ENV !== 'production') {
      console.warn(`scrollToTarget: no element with id "${id}"`);
    }
    return el;
  }
  return target;
}

function jump(target: HTMLElement | number, offset: number, immediate: boolean): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: LENIS_JUMP_DURATION_S, immediate });
    return;
  }
  const top =
    typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: Math.max(0, top + offset), behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
}

/**
 * The one way to jump inside a page (§C.2 rule 7). A string is an element id (with or without `#`).
 * Uses Lenis when it exists, else a native scroll (smooth unless motion is reduced).
 * While an overlay holds the scroll lock, the jump waits for the lock to be released
 * (for example the navbar closing a story and scrolling to the top in the same click).
 */
export function scrollToTarget(
  target: HTMLElement | string | number,
  opts: ScrollToOptions = {},
): void {
  if (typeof window === 'undefined') return;
  const resolved = resolveTarget(target);
  if (resolved === null) return;
  const offset = opts.offset ?? 0;
  const immediate = opts.immediate ?? false;
  if (isScrollLocked()) {
    runAfterUnlock(() => {
      const fresh = typeof resolved === 'number' || resolved.isConnected ? resolved : resolveTarget(target);
      if (fresh !== null) jump(fresh, offset, immediate);
    });
    return;
  }
  jump(resolved, offset, immediate);
}

export function scrollToTop(opts: { immediate?: boolean } = {}): void {
  scrollToTarget(0, { immediate: opts.immediate });
}
