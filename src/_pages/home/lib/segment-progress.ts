import { useEffect, useSyncExternalStore, type RefObject } from 'react';

import { setChromeDimmed } from '@/shared/lib/chrome';
import { ScrollTrigger, useGSAP } from '@/shared/lib/gsap';
import { setSceneProgress } from '@/shared/ui/stage';

/*
 * Segment progress: the contract between the home page and the `relief-annapurna` scene (§G.1, §K.8).
 * One ScrollTrigger per segment element (`start: 'top center'`, `end: 'bottom center'`), combined into
 * `t` in segment units; the scene receives `t / 6.6` through `setSceneProgress`, the DOM overlays read
 * discrete phases from a small store (never a React render per frame).
 */

export type SegmentId = 'origin' | 'work' | 'how' | 'pass' | 'pass-hold' | 'ask' | 'write';

export interface Segment {
  readonly id: SegmentId;
  readonly start: number;
  readonly end: number;
}

export const SEGMENTS: readonly Segment[] = [
  { id: 'origin', start: 0, end: 1 },
  { id: 'work', start: 1, end: 2 },
  { id: 'how', start: 2, end: 3 },
  { id: 'pass', start: 3, end: 4 },
  { id: 'pass-hold', start: 4, end: 4.6 },
  { id: 'ask', start: 4.6, end: 5.6 },
  { id: 'write', start: 5.6, end: 6.6 },
];

/** Total route length in segment units; the scene's progress is `t / T_MAX`. */
export const T_MAX = 6.6;
/** The summit hold, the one authored moment (§G.1). */
export const HOLD_START = 4;
export const HOLD_END = 4.6;
/** The canvas profile hands over to the DOM profile here (300 ms crossfade). */
export const PROFILE_FROM = 5.3;

/** Segment attribute on the `<li>` elements of `#meander`. */
export const SEGMENT_ATTR = 'data-segment';

/** Where the route head stands, by segment (the stage legend reads it). */
export type MeanderWaypoint = 'Besisahar' | 'Khudi' | 'Chame' | 'Manang' | 'Thorong La' | 'Muktinath';

export interface MeanderPhase {
  readonly waypoint: MeanderWaypoint;
  readonly hold: boolean;
  readonly profile: boolean;
}

const INITIAL: MeanderPhase = { waypoint: 'Besisahar', hold: false, profile: false };

let current: MeanderPhase = INITIAL;
const listeners = new Set<() => void>();

function waypointAt(t: number, started: boolean): MeanderWaypoint {
  if (!started) return 'Besisahar';
  if (t < 1) return 'Khudi';
  if (t < 2) return 'Chame';
  if (t < 3) return 'Manang';
  if (t < HOLD_END) return 'Thorong La';
  return 'Muktinath';
}

function publish(next: MeanderPhase): void {
  if (next.waypoint === current.waypoint && next.hold === current.hold && next.profile === current.profile) return;
  current = next;
  listeners.forEach((listener) => listener());
}

/** Combines per-segment progress into `t`: the last segment that has started decides. */
export function combineProgress(progress: readonly number[]): { t: number; started: boolean } {
  for (let i = SEGMENTS.length - 1; i >= 0; i -= 1) {
    const p = progress[i] ?? 0;
    if (p > 0) {
      const seg = SEGMENTS[i];
      return { t: seg.start + p * (seg.end - seg.start), started: true };
    }
  }
  return { t: 0, started: false };
}

function phaseAt(t: number, started: boolean): MeanderPhase {
  return {
    waypoint: waypointAt(t, started),
    hold: started && t >= HOLD_START && t < HOLD_END,
    profile: started && t >= PROFILE_FROM,
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): MeanderPhase => current;
const getServerSnapshot = (): MeanderPhase => INITIAL;

/** The discrete phase of the route (waypoint, summit hold, profile shown). SSR: before the first entry. */
export function useMeanderPhase(): MeanderPhase {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function isDisplayed(el: Element | null): el is HTMLElement {
  return el instanceof HTMLElement && el.getClientRects().length > 0;
}

/**
 * Creates the per-segment triggers inside `scope` while the staged layout is displayed (a `.motion-stage`
 * element marked `data-meander-stage`). Under the static layout (tier 0 before paint, or the footer's
 * "Reduce motion" switch) nothing is created and the phase resets. `deps` re-run the setup
 * (e.g. when the motion tier drops at runtime).
 */
export function useSegmentProgress(scope: RefObject<HTMLElement | null>, deps: readonly unknown[] = []): void {
  useGSAP(
    () => {
      const root = scope.current;
      const stage = root?.querySelector('[data-meander-stage]') ?? null;
      if (!root || !isDisplayed(stage)) {
        publish(INITIAL);
        return;
      }

      const progress = SEGMENTS.map(() => 0);
      const update = () => {
        const { t, started } = combineProgress(progress);
        setSceneProgress('relief-annapurna', t / T_MAX);
        publish(phaseAt(t, started));
      };

      SEGMENTS.forEach((seg, index) => {
        const el = root.querySelector<HTMLElement>(`[${SEGMENT_ATTR}="${seg.id}"]`);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onUpdate: (self) => {
            progress[index] = self.progress;
            update();
          },
          onRefresh: (self) => {
            progress[index] = self.progress;
            update();
          },
        });
      });
      update();

      return () => {
        publish(INITIAL);
        setSceneProgress('relief-annapurna', 0);
      };
    },
    { scope, dependencies: [...deps], revertOnUpdate: true },
  );
}

function reducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  const html = document.documentElement;
  return (
    html.dataset.motion === 'off' ||
    html.dataset.lite === '1' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Dims the chrome to 40% during the summit hold (§C.8). Never under reduced motion or when motion is
 * not allowed; always reset on leaving the hold and on unmount.
 */
export function useSummitChromeDim(hold: boolean, motionAllowed: boolean): void {
  useEffect(() => {
    setChromeDimmed(hold && motionAllowed && !reducedMotion());
  }, [hold, motionAllowed]);

  useEffect(() => () => setChromeDimmed(false), []);
}
