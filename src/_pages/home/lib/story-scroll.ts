import { actAt, CLIMB_ACT, dissolveAt, NUMERAL_SPAN, S_END, S_OVERVIEW, SUMMIT_ACT, type StoryAct } from '../config/story-timeline';

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
 * plus (scroll 0, s 0): the first scroll pixel already walks the line (R8).
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

/** s at scroll position `scrollY` (clamped to 0..S_END). */
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
  return Math.min(S_END, s[lo] + (s[hi] - s[lo]) * t);
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
  /** The map has melted into the ground (the stage is hidden and the renderer idles). */
  readonly gone: boolean;
}

const INITIAL: StoryPhase = { act: 0, overview: false, summit: false, legendHidden: false, gone: false };
let phase: StoryPhase = INITIAL;
const phaseListeners = new Set<() => void>();

export function phaseAt(s: number): StoryPhase {
  const act: StoryAct = actAt(s);
  const d = dissolveAt(s);
  return {
    act: act.index,
    overview: s >= S_OVERVIEW,
    summit: s >= SUMMIT_ACT.s0 && s < SUMMIT_ACT.s1,
    legendHidden: d > 0.4,
    gone: d >= 0.999,
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

const COUNT_FROM_M = 4880;

export function numeralAt(s: number, summitM: number): number {
  if (s >= CLIMB_ACT.s1) return summitM;
  const t = Math.min(1, Math.max(0, (s - (CLIMB_ACT.s0 + 10)) / (CLIMB_ACT.s1 - CLIMB_ACT.s0 - 10)));
  const eased = t * t * (3 - 2 * t);
  // Even metres only, so the tabular digits tick instead of flicker.
  return Math.round((COUNT_FROM_M + (summitM - COUNT_FROM_M) * eased) / 2) * 2;
}

/** The numeral span (the sticky readout is shown while the story is inside it). */
export const NUMERAL_ACTIVE = { from: NUMERAL_SPAN[0] - 60, to: NUMERAL_SPAN[1] + 40 } as const;
