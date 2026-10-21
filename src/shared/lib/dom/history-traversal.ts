import { getLenis } from '@/shared/lib/smooth-scroll';

/**
 * Back/Forward scroll restoration (§J.4 #16) next to "a new navigation starts at the top" (§J.4 #2).
 *
 * The browser restores the scroll position of a history entry as soon as the page is laid out, but
 * routes grow after hydration (the /stories pin spacer adds ~350 % of the viewport), so a deep
 * position is clamped to the shorter page, and `useScrollToTopOnMount` used to reset it to 0. Here:
 *
 * - `isHistoryTraversal()` is true from a `popstate` (client traversal), or on the first load of a
 *   document reached by Back/Forward, until the shell settles the route (`settleHistoryTraversal`).
 * - The scroll position of every history entry is remembered (by Navigation API entry key, kept in
 *   sessionStorage so it survives a document reload). On a traversal the shell calls
 *   `restoreHistoryScroll()` after ScrollTrigger has refreshed (pin spacers exist), which jumps to the
 *   remembered position if the browser's restoration fell short; while the page is still too short
 *   the jump stays pending (`applyPendingHistoryScroll`, after each later refresh) for a short while,
 *   and any user scroll input cancels it.
 * Without the Navigation API only the reset is skipped and restoration stays the browser's.
 */

const STORAGE_KEY = 'aa:scroll-positions';
const MAX_ENTRIES = 60;
const PENDING_TTL_MS = 3000;
const SAVE_DEBOUNCE_MS = 150;

let traversal = false;
let initialised = false;
let positions: Record<string, number> = {};
let pending: { target: number; until: number } | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

interface NavigationLike {
  currentEntry?: { key?: string } | null;
}

function currentKey(): string | null {
  const nav = (window as Window & { navigation?: NavigationLike }).navigation;
  return nav?.currentEntry?.key ?? null;
}

function readStored(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function flush(): void {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  try {
    const keys = Object.keys(positions);
    if (keys.length > MAX_ENTRIES) {
      for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) delete positions[key];
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Storage blocked or full: in-memory positions still cover client-side traversals.
  }
}

function record(): void {
  // During a traversal the current entry is already the target: its stored position must not be
  // overwritten by the clamped or reset position the page passes through on the way.
  if (traversal || pending) return;
  const key = currentKey();
  if (!key) return;
  const y = Math.round(window.scrollY);
  if (positions[key] === y) return;
  delete positions[key]; // re-insert, so the oldest entries are the ones trimmed
  positions[key] = y;
  if (saveTimer === undefined) saveTimer = setTimeout(flush, SAVE_DEBOUNCE_MS);
}

function cancelPending(): void {
  pending = null;
}

function init(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  try {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    traversal = entry?.type === 'back_forward';
  } catch {
    traversal = false;
  }
  positions = readStored();
  window.addEventListener('popstate', () => {
    traversal = true;
    pending = null;
  });
  window.addEventListener('scroll', record, { passive: true });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  // The reader's own scroll input wins over a pending restore.
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
    window.addEventListener(type, cancelPending, { passive: true, capture: true });
  }
}

// Listen from module evaluation, before any route can mount.
init();

export function isHistoryTraversal(): boolean {
  init();
  return traversal;
}

/** The route change (or first load) has committed and its mount effects have run. */
export function settleHistoryTraversal(): void {
  init();
  traversal = false;
}

function jumpTo(y: number): void {
  window.scrollTo(0, y);
  getLenis()?.scrollTo(y, { immediate: true, force: true });
}

/** Re-applies a restore that the page was still too short for. Call after each ScrollTrigger refresh. */
export function applyPendingHistoryScroll(): void {
  if (!pending) return;
  if (Date.now() > pending.until) {
    pending = null;
    return;
  }
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const y = Math.min(pending.target, max);
  if (Math.abs(window.scrollY - y) > 1) jumpTo(y);
  if (pending.target <= max) pending = null;
}

/**
 * On a Back/Forward arrival, once the route is laid out (after ScrollTrigger's refresh), puts the
 * page back at the position remembered for this history entry. No-op on a new navigation.
 */
export function restoreHistoryScroll(): void {
  init();
  if (!traversal) return;
  const key = currentKey();
  const target = key ? positions[key] : undefined;
  if (typeof target !== 'number' || !Number.isFinite(target)) return;
  pending = { target, until: Date.now() + PENDING_TTL_MS };
  applyPendingHistoryScroll();
}
