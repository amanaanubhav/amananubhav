'use client';

import { useEffect } from 'react';

import { setChromeDimmed } from '@/shared/lib/chrome';
import { gsap } from '@/shared/lib/gsap';
import { getLenis } from '@/shared/lib/smooth-scroll';
import { prefetch } from '@/shared/lib/stage-prefetch';
import { onStageBeforeAdvance, setSceneParam, setSceneProgress } from '@/shared/ui/stage';

import { STORY_PARAM, STORY_SCENE_ID } from '../ui/scenes/story/frame';
import { NEXT_DATA_PREFETCH, NEXT_PREFETCH_FROM, S_NEXT_REST } from '../ui/scenes/story/next-timeline';
import { S_END } from '../ui/scenes/story/timeline';
import {
  buildScrollMap,
  emitStoryTick,
  phaseAt,
  publishPhase,
  resetPhase,
  scrollAtRest,
  storyAtScroll,
  type ScrollMap,
} from './story-scroll';

/*
 * The per-tick driver of the home story (one gsap.ticker callback, after Lenis; the stage renderer also runs it
 * right before it advances R3F, M-10, so the scene always reads this frame's params; it runs once per frame):
 *  - scroll -> s through the anchor map, sent raw to the scene (`progress = s / S_END`; the scene damps it),
 *    and a damped copy for the page's own readouts (legend line, numeral);
 *  - the recede pools (§9): every on-screen `[data-recede]` text box (padded 14 px) and the fixed chrome
 *    (navbar glass, rail, chat launcher, the legend; padded 6 px), the 10 largest, as `rects` in CSS px
 *    (viewport, top-left origin, the scene's default `rectUnits`), plus `rectN`;
 *  - the label obstacles (the same boxes in CSS px), read by StoryLabels in the same tick.
 *
 *  - #next (docs/redesign/next-trek/build/CONTRACT.md): the north data is prefetched at idle once the story
 *    reaches the numeral (or the page opens on #next), and the plate's exit: once #next's bottom passes the
 *    viewport bottom the fixed stage is translated up by the overshoot (composite only) and, half a viewport
 *    past fully off screen, marked gone. Every box above is then given in the stage's own (translated) coordinates.
 *
 * Layout reads happen only when the layout changes (resize, fonts, content size); per tick the text boxes
 * are shifted by scrollY and only the few fixed chrome elements are measured.
 */

export const SCENE_ID = STORY_SCENE_ID;

/** Text and chrome boxes in viewport CSS px [x0, y0, x1, y1], refreshed every tick (read by the labels). */
export const storyObstacles: { text: number[][]; chrome: number[][] } = { text: [], chrome: [] };

const TEXT_PAD = 14;
const CHROME_PAD = 6;
const MAX_RECTS = 10;
const TAU = 0.32;
/** The plate is marked gone once #next's bottom is this many viewports above the viewport bottom (1 = just off). */
const GONE_PAST = 1.5;

interface CachedBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Inside a sticky block (the summit numeral): its document position changes, so it is read live. */
  live?: HTMLElement;
}

function chromeElements(): HTMLElement[] {
  const out: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>('[data-chrome], [data-recede-chrome]').forEach((el) => {
    // The navbar's <header> is a click-through full-width band: its glass is the <nav> inside it.
    const target = el.tagName === 'HEADER' ? (el.querySelector<HTMLElement>('nav') ?? el) : el;
    out.push(target);
  });
  return out;
}

function isReduced(): boolean {
  const html = document.documentElement;
  return html.dataset.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Runs the story while `enabled` (the staged layout: tier >= 1, motion on). Cleans up to the initial phase.
 */
export function useStoryDriver(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      resetPhase();
      return;
    }
    const content = document.getElementById('content') ?? document.body;
    let map: ScrollMap = buildScrollMap(content);
    let boxes: CachedBox[] = [];
    let chrome: HTMLElement[] = [];
    let dirty = true;
    let damped = -1;
    let last = performance.now();
    let lastFrame = -1;
    const rects = new Float32Array(MAX_RECTS * 4);
    // Looked up again on every layout change: a tier change remounts the stage.
    let stage = document.querySelector<HTMLElement>('[data-story-stage]');
    let nextBottom = Infinity; // #next's bottom edge, document px
    let plate = 0;
    let prefetched = false;
    // At the rest view: the scroll position past the rest line (px), -1 elsewhere; and the last tick's scrollY.
    let restOff = -1;
    let lastSy = -1;

    const measure = () => {
      dirty = false;
      map = buildScrollMap(content);
      const sy = window.scrollY;
      boxes = [];
      content.querySelectorAll<HTMLElement>('[data-recede]').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        const sticky = el.closest('[data-story-stick]') ? el : undefined;
        boxes.push({ x0: b.left, y0: b.top + sy, x1: b.right, y1: b.bottom + sy, live: sticky });
      });
      chrome = chromeElements();
      const found = document.querySelector<HTMLElement>('[data-story-stage]');
      if (found !== stage) {
        if (stage) stage.style.transform = '';
        stage = found;
        plate = -1; // re-apply the plate transform on the new node
      }
      const next = document.getElementById('next');
      nextBottom = next ? next.getBoundingClientRect().bottom + sy : Infinity;
    };
    const markDirty = () => {
      dirty = true;
    };

    const resize = new ResizeObserver(markDirty);
    resize.observe(content);
    window.addEventListener('resize', markDirty);
    void document.fonts?.ready.then(markDirty);

    const tick = () => {
      // Once per frame: the ticker and the renderer's pre-advance hook both call it (M-10).
      const frame = gsap.ticker.frame;
      if (frame === lastFrame) return;
      lastFrame = frame;
      const relaid = dirty;
      if (dirty) measure();
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;
      let sy = window.scrollY;
      // A layout change at the rest view that moved the anchors under an unchanged scroll position (a resize after the
      // browser clamped the scroll to a shorter page) would drop the visitor back into the transition: keep them at
      // the rest view instead (fix2 verify P2). A scroll of their own (scrollY moved) is never undone.
      const restY = scrollAtRest(map);
      if (relaid && restOff >= 0 && sy === lastSy && Number.isFinite(restY) && storyAtScroll(map, sy) < S_NEXT_REST - 0.5) {
        const target = Math.max(0, Math.min(restY + restOff, document.documentElement.scrollHeight - h));
        const lenis = getLenis();
        if (lenis) {
          // Lenis re-measures the page on a debounce: its limit may still be the shorter page's, which would clamp.
          lenis.resize();
          lenis.scrollTo(target, { immediate: true, force: true });
        }
        else window.scrollTo(0, target);
        sy = window.scrollY;
      }
      const moved = sy !== lastSy;
      lastSy = sy;
      const sRaw = storyAtScroll(map, sy);
      // Set and cleared only by the visitor's own scroll: kept through a layout change, while the scroll stands still
      // and through a move that ends at the page end (the browser's clamp when the page got shorter, which can leave
      // the scroll short of the rest line until the next resize).
      if (!relaid && (restOff < 0 || moved)) {
        const atRest = sRaw >= S_NEXT_REST - 0.5 && Number.isFinite(restY);
        if (atRest && restOff < 0) restOff = Math.max(0, sy - restY);
        else if (moved && sy < document.documentElement.scrollHeight - h - 1) restOff = atRest ? Math.max(0, sy - restY) : -1;
      }
      damped = damped < 0 ? sRaw : damped + (sRaw - damped) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(sRaw - damped) < 0.01) damped = sRaw;

      setSceneProgress(SCENE_ID, sRaw / S_END);

      // The plate's exit: #next's bottom above the viewport bottom moves the stage up by as much.
      const over = Math.max(0, h - (nextBottom - sy));
      const nextPlate = Math.min(over, h + 1);
      if (stage && nextPlate !== plate) {
        stage.style.transform = nextPlate > 0 ? `translate3d(0, ${(-nextPlate).toFixed(1)}px, 0)` : '';
      }
      plate = nextPlate;
      setSceneParam(SCENE_ID, STORY_PARAM.plateY, -plate);
      // Gone (hidden, so the renderer idles) only half a viewport past fully off screen: on the way back the stage
      // is shown again while still above the viewport, so the renderer wakes and draws before any of it scrolls in.
      publishPhase(phaseAt(damped, over >= h * GONE_PAST));
      emitStoryTick(damped);

      // The #next data, at idle, once the story nears its end or the page opens on #next.
      if (!prefetched && (damped >= NEXT_PREFETCH_FROM || window.location.hash === '#next')) {
        prefetched = true;
        const run = () => {
          for (const [url, kind] of NEXT_DATA_PREFETCH) prefetch(url, kind, 'low');
        };
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 1500 });
        else setTimeout(run, 200);
      }

      // Text boxes on screen (CSS px), then the chrome.
      const text: number[][] = [];
      for (const b of boxes) {
        let y0 = b.y0 - sy;
        let y1 = b.y1 - sy;
        if (b.live) {
          const r = b.live.getBoundingClientRect();
          y0 = r.top;
          y1 = r.bottom;
        }
        if (y1 < -40 || y0 > h + 40) continue;
        // In the stage's coordinates (it is translated up by `plate` while it leaves with #next).
        y0 += plate;
        y1 += plate;
        text.push([b.x0 - TEXT_PAD, y0 - TEXT_PAD, Math.min(w, b.x1 + TEXT_PAD), y1 + TEXT_PAD]);
      }
      const chromeBoxes: number[][] = [];
      for (const el of chrome) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > h) continue;
        if (getComputedStyle(el).opacity === '0') continue;
        chromeBoxes.push([
          r.left - CHROME_PAD,
          r.top + plate - CHROME_PAD,
          r.right + CHROME_PAD,
          r.bottom + plate + CHROME_PAD,
        ]);
      }
      storyObstacles.text = text;
      storyObstacles.chrome = chromeBoxes;

      // The 10 largest pools (CSS px, viewport, top-left origin).
      const pools = [...text, ...chromeBoxes].sort(
        (p, q) => (q[2] - q[0]) * (q[3] - q[1]) - (p[2] - p[0]) * (p[3] - p[1]),
      );
      const n = Math.min(MAX_RECTS, pools.length);
      rects.fill(0);
      for (let i = 0; i < n; i += 1) rects.set(pools[i], i * 4);
      setSceneParam(SCENE_ID, STORY_PARAM.rectUnits, 'css');
      setSceneParam(SCENE_ID, STORY_PARAM.rects, rects);
      setSceneParam(SCENE_ID, STORY_PARAM.rectN, n);
      setSceneParam(SCENE_ID, STORY_PARAM.reduced, isReduced());
      setSceneParam(SCENE_ID, STORY_PARAM.labels, 1);
    };

    gsap.ticker.add(tick);
    const offAdvance = onStageBeforeAdvance(tick);
    tick();
    return () => {
      gsap.ticker.remove(tick);
      offAdvance();
      resize.disconnect();
      window.removeEventListener('resize', markDirty);
      storyObstacles.text = [];
      storyObstacles.chrome = [];
      if (stage) stage.style.transform = '';
      setSceneParam(SCENE_ID, STORY_PARAM.plateY, 0);
      setSceneParam(SCENE_ID, STORY_PARAM.rectN, 0);
      resetPhase();
      setChromeDimmed(false);
    };
  }, [enabled]);
}
