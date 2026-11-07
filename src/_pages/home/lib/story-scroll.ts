import { NEXT_MOBILE_MAX_WIDTH, NEXT_REST_TOP, NEXT_TEXT_AT, S_NEXT_REST } from '../ui/scenes/story/next-timeline';
import {
  S_DISSOLVE,
  S_END,
  S_OVERVIEW,
  STORY_ACTS,
  STORY_NUMERAL,
  type StoryActDef,
} from '../ui/scenes/story/timeline';

/* ------------------------------------------------------------------------------------------------
 * Acts with their story range (the scene's act list is the one source).
 * ---------------------------------------------------------------------------------------------- */

export interface StoryAct extends StoryActDef {
  readonly index: number;
  readonly s0: number;
  readonly s1: number;
}

export const ACTS: readonly StoryAct[] = (() => {
  let s = 0;
  return STORY_ACTS.map((def, index) => {
    const act: StoryAct = { ...def, index, s0: s, s1: s + def.len };
    s = act.s1;
    return act;
  });
})();

const CLIMB_ACT = ACTS.find((a) => a.climb) as StoryAct;
const SUMMIT_ACT = ACTS.find((a) => a.summit) as StoryAct;

/** The act at `s` (clamped). */
export function actAt(s: number): StoryAct {
  const v = Math.min(S_END, Math.max(0, s));
  return ACTS.find((a) => v < a.s1) ?? ACTS[ACTS.length - 1];
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** 0 before the story's last 60 vh, 1 at S_END: the story's legend and labels fade (the map itself stays). */
export function dissolveAt(s: number): number {
  return smoothstep(S_DISSOLVE, S_END, s);
}

/*
 * Scroll -> story position `s` (vh), the page side of the story (design §3, §5.1).
 *
 * The text blocks sit in normal flow (their heights vary with the copy and the breakpoint), so `s` is not
 * scrollY / innerHeight: it is a piecewise-linear map through anchors read from the layout. Each anchor is a
 * scroll position at which a block stands where the storyboard wants it:
 *   [data-story-at="148"]      the block's centre at the viewport centre  -> s 148
 *   [data-story-span="a,b"]    a sticky block: its wrapper starts sticking -> s a, stops sticking -> s b
 *                              (the sticky child carries data-story-stick, its top offset is read from CSS)
 *   [data-story-end]           its top reaches the viewport bottom        -> s S_END
 * plus (scroll 0, s 0): the first scroll pixel already walks the line (R8). Then the #next transition
 * (docs/redesign/next-trek/build/CONTRACT.md):
 *   [data-next-anchor="marpha"]  caption C1's centre at the viewport centre  -> s NEXT_TEXT_AT.caption
 *   [data-next-anchor="rest"]    the #next header's top at the rest line     -> s S_NEXT_REST
 *                                (`--rest-line` % on #next; else [data-next-end], the transition slot's end)
 * Past the rest anchor s holds at S_NEXT_REST: the camera is fixed and the copy scrolls over the still map.
 */

export interface ScrollMap {
  /** Scroll positions (px), strictly increasing. */
  readonly y: Float64Array;
  /** Story positions (vh), strictly increasing. */
  readonly s: Float64Array;
}

const EMPTY_MAP: ScrollMap = { y: new Float64Array([0, 1]), s: new Float64Array([0, 0]) };

function docTop(el: Element, scrollY: number): number {
  return el.getBoundingClientRect().top + scrollY;
}

/** Reads the anchors under `root` (layout reads; call on layout changes only, never per frame). */
export function buildScrollMap(root: ParentNode): ScrollMap {
  if (typeof window === 'undefined') return EMPTY_MAP;
  const vh = window.innerHeight || 1;
  const scrollY = window.scrollY;
  const pts: [number, number][] = [[0, 0]];

  root.querySelectorAll<HTMLElement>('[data-story-at]').forEach((el) => {
    const s = Number(el.dataset.storyAt);
    const box = el.getBoundingClientRect();
    if (!Number.isFinite(s) || box.height === 0) return;
    pts.push([box.top + scrollY + box.height / 2 - vh / 2, s]);
  });

  root.querySelectorAll<HTMLElement>('[data-story-span]').forEach((el) => {
    const [a, b] = (el.dataset.storySpan ?? '').split(',').map(Number);
    const child = el.querySelector<HTMLElement>('[data-story-stick]');
    const box = el.getBoundingClientRect();
    if (!child || box.height === 0 || !Number.isFinite(a) || !Number.isFinite(b)) return;
    const stickTop = Number.parseFloat(getComputedStyle(child).top) || 0;
    const top = box.top + scrollY;
    pts.push([top - stickTop, a]);
    pts.push([top + box.height - child.offsetHeight - stickTop, b]);
  });

  const end = root.querySelector<HTMLElement>('[data-story-end]');
  if (end && end.getClientRects().length > 0) pts.push([docTop(end, scrollY) - vh, S_END]);

  // #next: only while the transition slot is laid out (the staged layout; `display: none` when static).
  const slot = root.querySelector<HTMLElement>('[data-next-transition]');
  if (slot && slot.getClientRects().length > 0) {
    const caption = root.querySelector<HTMLElement>('[data-next-anchor="marpha"]');
    const box = caption?.getBoundingClientRect();
    if (caption && box && box.height > 0) {
      pts.push([box.top + scrollY + box.height / 2 - vh / 2, NEXT_TEXT_AT.caption]);
    }
    const restEl =
      root.querySelector<HTMLElement>('[data-next-anchor="rest"]') ?? root.querySelector<HTMLElement>('[data-next-end]');
    if (restEl && restEl.getClientRects().length > 0) {
      const section = document.getElementById('next');
      const line = section ? Number.parseFloat(getComputedStyle(section).getPropertyValue('--rest-line')) : NaN;
      const mobile = window.innerWidth <= NEXT_MOBILE_MAX_WIDTH;
      const top = Number.isFinite(line) ? line / 100 : mobile ? NEXT_REST_TOP.mobile : NEXT_REST_TOP.desktop;
      const at = Number(restEl.dataset.nextAt);
      pts.push([docTop(restEl, scrollY) - top * vh, Number.isFinite(at) && at > S_END ? at : S_NEXT_REST]);
    }
  }

  // Keep the anchors that move forward in both scroll and story (a block taller than its slot can push a
  // later anchor behind an earlier one; dropping it keeps the map monotonic).
  pts.sort((p, q) => p[0] - q[0]);
  const y: number[] = [];
  const s: number[] = [];
  for (const [py, ps] of pts) {
    if (y.length && (py <= y[y.length - 1] + 1 || ps <= s[s.length - 1])) continue;
    y.push(py);
    s.push(ps);
  }
  if (y.length < 2) return EMPTY_MAP;
  return { y: Float64Array.from(y), s: Float64Array.from(s) };
}

/** s at scroll position `scrollY` (clamped to 0..S_NEXT_REST; S_END when the page has no #next anchors). */
export function storyAtScroll(map: ScrollMap, scrollY: number): number {
  const { y, s } = map;
  const n = y.length;
  if (scrollY <= y[0]) return s[0];
  if (scrollY >= y[n - 1]) return s[n - 1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (y[mid] <= scrollY) lo = mid;
    else hi = mid;
  }
  const t = (scrollY - y[lo]) / (y[hi] - y[lo]);
  return Math.min(S_NEXT_REST, s[lo] + (s[hi] - s[lo]) * t);
}

/** The scroll position (px) of the rest anchor (s = S_NEXT_REST), or NaN when the page has none (static layouts). */
export function scrollAtRest(map: ScrollMap): number {
  const { y, s } = map;
  for (let i = 0; i < y.length; i++) if (s[i] >= S_NEXT_REST - 1e-6) return y[i];
  return Number.NaN;
}

/* ------------------------------------------------------------------------------------------------
 * The discrete phase of the story (React reads it with useStoryPhase; per-frame values go through
 * onStoryTick listeners that write the DOM directly).
 * ---------------------------------------------------------------------------------------------- */

export interface StoryPhase {
  /** Index into ACTS. */
  readonly act: number;
  readonly overview: boolean;
  /** The summit hold (the chrome dims). */
  readonly summit: boolean;
  /** The legend fades from dissolve 0.4; the labels from 0.5. */
  readonly legendHidden: boolean;
  /** The map plate has scrolled away with #next (the stage is hidden and the renderer idles). */
  readonly gone: boolean;
}

const INITIAL: StoryPhase = { act: 0, overview: false, summit: false, legendHidden: false, gone: false };
let phase: StoryPhase = INITIAL;
const phaseListeners = new Set<() => void>();

/** The phase at `s`; `gone` is the plate's exit, measured by the driver (the map no longer dissolves). */
export function phaseAt(s: number, gone = false): StoryPhase {
  const act: StoryAct = actAt(s);
  const d = dissolveAt(s);
  return {
    act: act.index,
    overview: s >= S_OVERVIEW,
    summit: s >= SUMMIT_ACT.s0 && s < SUMMIT_ACT.s1,
    legendHidden: d > 0.4,
    gone,
  };
}

export function publishPhase(next: StoryPhase): void {
  const p = phase;
  if (
    p.act === next.act &&
    p.overview === next.overview &&
    p.summit === next.summit &&
    p.legendHidden === next.legendHidden &&
    p.gone === next.gone
  ) {
    return;
  }
  phase = next;
  phaseListeners.forEach((listener) => listener());
}

export function resetPhase(): void {
  publishPhase(INITIAL);
}

export function subscribePhase(listener: () => void): () => void {
  phaseListeners.add(listener);
  return () => {
    phaseListeners.delete(listener);
  };
}

export const getPhase = (): StoryPhase => phase;
export const getServerPhase = (): StoryPhase => INITIAL;

/* Per-tick story position (the page's own damped copy of `s`, τ 0.32 s like the scene). */

type TickListener = (s: number) => void;
const tickListeners = new Set<TickListener>();
let lastS = 0;

export function emitStoryTick(s: number): void {
  lastS = s;
  tickListeners.forEach((listener) => listener(s));
}

/** Calls `listener` with the damped story position on every tick that changes it; returns the unsubscribe. */
export function onStoryTick(listener: TickListener): () => void {
  tickListeners.add(listener);
  listener(lastS);
  return () => {
    tickListeners.delete(listener);
  };
}

/* ------------------------------------------------------------------------------------------------
 * The summit numeral (§5.4): counts 4,880 -> 5,416 with the head through the climb, holds at 5,416.
 * ---------------------------------------------------------------------------------------------- */

export function numeralAt(s: number): number {
  const { fromM, toM } = STORY_NUMERAL;
  if (s >= CLIMB_ACT.s1) return toM;
  const eased = smoothstep(CLIMB_ACT.s0 + 10, CLIMB_ACT.s1, s);
  // Even metres only, so the tabular digits tick instead of flicker.
  return Math.round((fromM + (toM - fromM) * eased) / 2) * 2;
}
