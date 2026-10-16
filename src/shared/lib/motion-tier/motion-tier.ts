'use client';

import { useSyncExternalStore } from 'react';

export type MotionTier = 0 | 1 | 2;

/** localStorage value '1' = the visitor forced reduced motion with the footer switch. */
export const MOTION_PREF_KEY = 'aa:reduce-motion';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/* ------------------------------------------------------------------------------------------------
 * Tier store. The tier is computed once on the client and can only go down at runtime
 * (degradeStage, the footer switch, the OS setting turning on).
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
  if (readPreference()) return 0;
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

function dropToZero(): void {
  if (forcedZero && cachedTier === 0) return;
  forcedZero = true;
  cachedTier = 0;
  emitTier();
}

function onReduceChange(event: MediaQueryListEvent): void {
  if (!event.matches) return; // turning the OS setting off takes effect on the next load
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

/* ------------------------------------------------------------------------------------------------
 * The footer "Reduce motion" switch (§C.4). Turning it on drops the tier to 0 immediately;
 * turning it off is stored and takes effect on the next load (the tier only goes down at runtime).
 * ---------------------------------------------------------------------------------------------- */

let cachedPreference: boolean | null = null;
const preferenceListeners = new Set<() => void>();

function readPreference(): boolean {
  if (cachedPreference !== null) return cachedPreference;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(MOTION_PREF_KEY);
  } catch {
    stored = null;
  }
  cachedPreference = stored === '1';
  return cachedPreference;
}

function subscribePreference(callback: () => void): () => void {
  preferenceListeners.add(callback);
  return () => {
    preferenceListeners.delete(callback);
  };
}

const getPreferenceSnapshot = () => (typeof window === 'undefined' ? false : readPreference());
const getPreferenceServerSnapshot = () => false;

export function setReducedMotionPreference(on: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (on) window.localStorage.setItem(MOTION_PREF_KEY, '1');
    else window.localStorage.removeItem(MOTION_PREF_KEY);
  } catch {
    // Storage blocked (private mode, policies): the choice still applies for this page view.
  }
  const changed = cachedPreference !== on;
  cachedPreference = on;
  if (on) {
    document.documentElement.dataset.motion = 'off';
    dropToZero();
  }
  if (changed) preferenceListeners.forEach((listener) => listener());
}

/** `[forced, set]` for the footer switch. Server snapshot `false`. */
export function useReducedMotionPreference(): readonly [boolean, (on: boolean) => void] {
  const forced = useSyncExternalStore(subscribePreference, getPreferenceSnapshot, getPreferenceServerSnapshot);
  return [forced, setReducedMotionPreference] as const;
}
