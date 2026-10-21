'use client';

import { useEffect } from 'react';

import { setChromeDimmed } from '@/shared/lib/chrome';
import { gsap } from '@/shared/lib/gsap';
import { setSceneParam, setSceneProgress } from '@/shared/ui/stage';

import { MOBILE_MAX_WIDTH, S_END, STORY_PARAM } from '../config/story-timeline';
import {
  buildScrollMap,
  emitStoryTick,
  phaseAt,
  publishPhase,
  resetPhase,
  storyAtScroll,
  type ScrollMap,
} from './story-scroll';

/*
 * The per-tick driver of the home story (one gsap.ticker callback, after Lenis):
 *  - scroll -> s through the anchor map, sent raw to the scene (`progress = s / S_END`; the scene damps it),
 *    and a damped copy for the page's own readouts (legend line, numeral);
 *  - the recede pools (§9): every on-screen `[data-recede]` text box (padded 14 px) and the fixed chrome
 *    (navbar glass, rail, chat launcher, the legend; padded 6 px), the 10 largest, as `rects` in device px
 *    with a bottom-left origin, plus `rectN`, `feather` and `radius`;
 *  - the label obstacles (the same boxes in CSS px), read by StoryLabels in the same tick.
 *
 * Layout reads happen only when the layout changes (resize, fonts, content size); per tick the text boxes
 * are shifted by scrollY and only the few fixed chrome elements are measured.
 */

export const SCENE_ID = 'relief-annapurna';

/** Text and chrome boxes in viewport CSS px [x0, y0, x1, y1], refreshed every tick (read by the labels). */
export const storyObstacles: { text: number[][]; chrome: number[][] } = { text: [], chrome: [] };

const TEXT_PAD = 14;
const CHROME_PAD = 6;
const MAX_RECTS = 10;
const TAU = 0.32;

interface CachedBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function chromeElements(): HTMLElement[] {
  const out: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>('[data-chrome], [data-story-chrome]').forEach((el) => {
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
    const rects = new Float32Array(MAX_RECTS * 4);

    const measure = () => {
      dirty = false;
      map = buildScrollMap(content);
      const sy = window.scrollY;
      boxes = [];
      content.querySelectorAll<HTMLElement>('[data-recede]').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        boxes.push({ x0: b.left, y0: b.top + sy, x1: b.right, y1: b.bottom + sy });
      });
      chrome = chromeElements();
    };
    const markDirty = () => {
      dirty = true;
    };

    const resize = new ResizeObserver(markDirty);
    resize.observe(content);
    window.addEventListener('resize', markDirty);
    void document.fonts?.ready.then(markDirty);

    const tick = () => {
      if (dirty) measure();
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const sy = window.scrollY;
      const sRaw = storyAtScroll(map, sy);
      damped = damped < 0 ? sRaw : damped + (sRaw - damped) * (1 - Math.exp(-dt / TAU));
      if (Math.abs(sRaw - damped) < 0.01) damped = sRaw;

      setSceneProgress(SCENE_ID, sRaw / S_END);
      publishPhase(phaseAt(damped));
      emitStoryTick(damped);

      // Text boxes on screen (CSS px), then the chrome.
      const text: number[][] = [];
      for (const b of boxes) {
        const y0 = b.y0 - sy;
        const y1 = b.y1 - sy;
        if (y1 < -40 || y0 > h + 40) continue;
        text.push([b.x0 - TEXT_PAD, y0 - TEXT_PAD, Math.min(w, b.x1 + TEXT_PAD), y1 + TEXT_PAD]);
      }
      const chromeBoxes: number[][] = [];
      for (const el of chrome) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > h) continue;
        if (getComputedStyle(el).opacity === '0') continue;
        chromeBoxes.push([r.left - CHROME_PAD, r.top - CHROME_PAD, r.right + CHROME_PAD, r.bottom + CHROME_PAD]);
      }
      storyObstacles.text = text;
      storyObstacles.chrome = chromeBoxes;

      // The 10 largest pools, device px, bottom-left origin.
      const pools = [...text, ...chromeBoxes].sort(
        (p, q) => (q[2] - q[0]) * (q[3] - q[1]) - (p[2] - p[0]) * (p[3] - p[1]),
      );
      const n = Math.min(MAX_RECTS, pools.length);
      const canvas = document.querySelector<HTMLCanvasElement>('[data-story-stage] canvas, .stage-canvas canvas');
      const dpr = canvas && canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : Math.min(window.devicePixelRatio || 1, 1.25);
      rects.fill(0);
      for (let i = 0; i < n; i += 1) {
        const [x0, y0, x1, y1] = pools[i];
        rects[i * 4] = x0 * dpr;
        rects[i * 4 + 1] = (h - y1) * dpr;
        rects[i * 4 + 2] = x1 * dpr;
        rects[i * 4 + 3] = (h - y0) * dpr;
      }
      const mobile = w <= MOBILE_MAX_WIDTH;
      setSceneParam(SCENE_ID, STORY_PARAM.rects, rects);
      setSceneParam(SCENE_ID, STORY_PARAM.rectN, n);
      setSceneParam(SCENE_ID, STORY_PARAM.feather, mobile ? 64 : 112);
      setSceneParam(SCENE_ID, STORY_PARAM.radius, 26);
      setSceneParam(SCENE_ID, STORY_PARAM.mobile, mobile);
      setSceneParam(SCENE_ID, STORY_PARAM.reduced, isReduced());
    };

    gsap.ticker.add(tick);
    tick();
    return () => {
      gsap.ticker.remove(tick);
      resize.disconnect();
      window.removeEventListener('resize', markDirty);
      storyObstacles.text = [];
      storyObstacles.chrome = [];
      setSceneParam(SCENE_ID, STORY_PARAM.rectN, 0);
      resetPhase();
      setChromeDimmed(false);
    };
  }, [enabled]);
}
