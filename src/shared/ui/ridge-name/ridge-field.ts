import { MOTION } from '@/shared/config';
import { RIDGE_SUMMIT_T, ridgeElevationAt } from '@/shared/ui/ridge-mark';

import { createRings } from './contour-rings';
import { RIDGE_SAMPLES, SUMMIT_DROP_EM, samplesBetween } from './ridge-path';

/*
 * The Survey Ridge engine (HERO-FOOTER-SPEC §2.2): the name is the terrain the ridge mark stands on. One elevation
 * field drives every effect: the letters lift, the ridge under them rises, contour rings spread, the summit letters
 * warm to signal and the trekker walks to the new summit.
 *
 * lift(i) = h · H · exp(−((xᵢ − cx) / σx)² − ((yᵢ − cy) / σy)²), σx 0.9 em, σy 1.1 em; the ridge is the same field
 * read at the last baseline, so the gap between letters and ridge never changes.
 *
 * One rAF loop that runs only while a spring moves. It writes `transform` on the letters, the trekker and the rings,
 * and rewrites one small SVG path while the ground is raised; never a CSS variable on a parent. Loaded with a dynamic
 * import only when motion is allowed (RidgeNameMotion); `destroy()` puts the server's rest frame back.
 */

/** Springs, mass 1, semi-implicit Euler in steps of at most 1/120 s: [stiffness, damping]. */
export const SPRING = {
  /** The summit's position: critically damped, about 0.45 s (`{ bounce: 0, duration: 0.45 }`). */
  pos: [170, 26],
  /** The ground's height 0 -> 1: ζ 0.68, 5.3 % overshoot (`{ bounce: 0.2, duration: 0.4 }`). */
  height: [260, 22],
  /** The trekker's walk: critically damped, about 0.65 s; he walks, never bounces. */
  trek: [90, 19],
} as const satisfies Record<string, readonly [number, number]>;

/** Field widths (em). */
export const SIGMA_X_EM = 0.9;
export const SIGMA_Y_EM = 1.1;
/** A letter warms to signal above this normalised lift and cools below the second (hysteresis). */
export const WARM_ON = 0.62;
export const WARM_OFF = 0.45;
/** The survey pass sweeps first letter to last on the site's glide curve. */
export const PASS_MS = 1500;
/** First light reaches the summit this long before the pass sets off. */
export const LIGHT_LEAD_MS = 260;
/** Rings: one per pass beat, at least this far apart, at most three alive, each 1200 ms. */
export const PASS_RING_MS = 480;
export const RING_GAP_MS = 200;
export const RINGS_ALIVE = 3;
export const RING_MS = 1200;
/** A touch release lets the summit sink after this long. */
export const TOUCH_RELEASE_MS = 700;
/** The bronze cue reaches half an em either side of the trekker. */
const CUE_HALF_EM = 0.5;

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Spring {
  x: number;
  v: number;
}

function stepSpring(s: Spring, target: number, [k, c]: readonly [number, number], dt: number): void {
  const a = -k * (s.x - target) - c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

/** A cubic-bezier easing (x1, y1, x2, y2) as a function of progress 0..1. */
function bezier([x1, y1, x2, y2]: readonly number[]): (p: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  return (p) => {
    let t = p;
    for (let i = 0; i < 6; i++) {
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= (sampleX(t) - p) / d;
    }
    t = Math.min(1, Math.max(0, t));
    return ((ay * t + by) * t + cy) * t;
  };
}

const GLIDE = bezier(MOTION.bezier.glide);
const RING_EASE = `cubic-bezier(${MOTION.bezier.settle.join(', ')})`;

export interface RidgeFieldOptions {
  /** The ground's lift under the pointer (em): 0.12 in the hero, 0.14 in the footer. */
  lift: number;
  /** The ridge's height from its feet to the summit (em): 0.28 in the hero, 0.24 in the footer. */
  amplitude: number;
}

interface LetterAt {
  x: number;
  y: number;
}

export class RidgeField {
  private readonly vis: HTMLElement;
  private readonly letters: HTMLElement[];
  private readonly words: HTMLElement[][];
  private readonly ridge: SVGSVGElement;
  private readonly base: SVGPathElement;
  private readonly cues: SVGPathElement[];
  private readonly trek: SVGSVGElement;
  private readonly rings: HTMLElement;
  private readonly liftEm: number;
  private readonly amplitudeEm: number;
  private readonly restFrame: { viewBox: string; base: string; cues: string[] };
  private readonly fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  private readonly ringPaths = createRings(7);
  private readonly resize: ResizeObserver;

  private readonly cx: Spring = { x: 0, v: 0 };
  private readonly cy: Spring = { x: 0, v: 0 };
  private readonly h: Spring = { x: 0, v: 0 };
  private readonly tx: Spring = { x: 0, v: 0 };
  private readonly target = { cx: 0, cy: 0, h: 0 };
  private raf = 0;
  private last = 0;
  private pass: { t0: number; y: number } | null = null;
  private pressed = false;
  private releaseTimer = 0;
  private lightTimer = 0;
  private ripples: SVGSVGElement[] = [];
  private lastRing = 0;
  private peak = -1;
  private destroyed = false;

  // Measured (px, in the name's own box).
  private pos: LetterAt[] | null = null;
  private fs = 0;
  private liftPx = 0;
  private sigmaX = 1;
  private sigmaY = 1;
  private amplitudePx = 0;
  private ridgeLeft = 0;
  private ridgeWidth = 1;
  private baseY = 0;
  private restX = 0;
  private ringLeft = 0;
  private ringTop = 0;

  constructor(vis: HTMLElement, { lift, amplitude }: RidgeFieldOptions) {
    this.vis = vis;
    this.letters = Array.from(vis.querySelectorAll<HTMLElement>('[data-rn-letter]'));
    this.words = Array.from(vis.querySelectorAll<HTMLElement>('[data-rn-word]')).map((word) =>
      Array.from(word.querySelectorAll<HTMLElement>('[data-rn-letter]')),
    );
    this.ridge = vis.querySelector<SVGSVGElement>('[data-rn-ridge]') as SVGSVGElement;
    this.base = this.ridge.querySelector<SVGPathElement>('[data-rn-base]') as SVGPathElement;
    this.cues = Array.from(this.ridge.querySelectorAll<SVGPathElement>('[data-rn-cue]'));
    this.trek = vis.querySelector<SVGSVGElement>('[data-rn-trek]') as SVGSVGElement;
    this.rings = vis.querySelector<HTMLElement>('[data-rn-rings]') as HTMLElement;
    this.liftEm = lift;
    this.amplitudeEm = amplitude;
    this.restFrame = {
      viewBox: this.ridge.getAttribute('viewBox') ?? '',
      base: this.base.getAttribute('d') ?? '',
      cues: this.cues.map((cue) => cue.getAttribute('d') ?? ''),
    };

    this.kern();
    this.measure();
    this.tx.x = this.restX;
    this.render();

    this.resize = new ResizeObserver(() => {
      this.measure();
      this.render();
    });
    this.resize.observe(vis);
    vis.addEventListener('pointerenter', this.onEnter);
    vis.addEventListener('pointermove', this.onMove);
    vis.addEventListener('pointerleave', this.onLeave);
    vis.addEventListener('pointerdown', this.onDown);
    vis.addEventListener('pointerup', this.onUp);
    vis.addEventListener('pointercancel', this.onUp);
  }

  /** Is the trekker lit (first light has reached the summit)? */
  get lit(): boolean {
    return this.vis.hasAttribute('data-summit');
  }

  /** First light: the trekker lights bronze and the cue appears (CSS: 500 ms ease). */
  light(on: boolean): void {
    this.vis.toggleAttribute('data-summit', on);
  }

  /** The survey pass: the summit sweeps the name once, first letter to last. Lights the summit first if it is dark. */
  survey(): void {
    if (this.destroyed || !this.pos) return;
    if (!this.lit) {
      this.light(true);
      window.clearTimeout(this.lightTimer);
      this.lightTimer = window.setTimeout(() => this.survey(), LIGHT_LEAD_MS);
      return;
    }
    const ys = this.pos.map((p) => p.y);
    this.pass = { t0: performance.now(), y: (Math.min(...ys) + Math.max(...ys)) / 2 };
    this.cx.x = this.pos[0].x - this.sigmaX;
    this.cx.v = 0;
    this.cy.x = this.pass.y;
    this.cy.v = 0;
    this.lastRing = 0;
    this.kick();
  }

  /** Raises the ground under a pointer (also used for the first pointer event that loaded the engine). */
  point(event: PointerEvent, enter: boolean): void {
    if (this.destroyed || !this.pos) return;
    if (!this.lit) this.light(true);
    const box = this.vis.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    this.pass = null;
    window.clearTimeout(this.releaseTimer);
    if (enter && this.h.x < 0.05) {
      this.cx.x = x;
      this.cy.x = y;
    }
    this.target.cx = x;
    this.target.cy = y;
    this.target.h = 1;
    if (enter) this.ring(x, y);
    this.kick();
  }

  /** A touch that began before the engine was listening (the one that loaded it): raise the summit, then sink it. */
  tap(event: PointerEvent): void {
    this.point(event, true);
    this.release(TOUCH_RELEASE_MS);
  }

  /** Puts the server's rest frame back and lets go of everything (motion turned off, unmount). */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.clearTimeout(this.releaseTimer);
    window.clearTimeout(this.lightTimer);
    this.resize.disconnect();
    this.vis.removeEventListener('pointerenter', this.onEnter);
    this.vis.removeEventListener('pointermove', this.onMove);
    this.vis.removeEventListener('pointerleave', this.onLeave);
    this.vis.removeEventListener('pointerdown', this.onDown);
    this.vis.removeEventListener('pointerup', this.onUp);
    this.vis.removeEventListener('pointercancel', this.onUp);
    this.ripples.forEach((ring) => ring.remove());
    this.ripples = [];
    this.letters.forEach((el) => {
      el.style.transform = '';
      el.style.marginRight = '';
      el.removeAttribute('data-lit');
    });
    this.vis.removeAttribute('data-engine');
    this.ridge.setAttribute('viewBox', this.restFrame.viewBox);
    this.base.setAttribute('d', this.restFrame.base);
    this.cues.forEach((cue, i) => cue.setAttribute('d', this.restFrame.cues[i]));
    this.trek.style.transform = '';
    this.light(true);
  }

  private readonly onEnter = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && this.fine.matches) this.point(e, true);
  };

  private readonly onMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' ? this.fine.matches : this.pressed) this.point(e, false);
  };

  private readonly onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') this.release(0);
  };

  private readonly onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    this.pressed = true;
    this.point(e, true);
  };

  private readonly onUp = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || !this.pressed) return;
    this.pressed = false;
    this.release(TOUCH_RELEASE_MS);
  };

  /** Sinks the ground from its current height and velocity (exit is faster than entry: a shorter distance). */
  private release(delay: number): void {
    window.clearTimeout(this.releaseTimer);
    const sink = () => {
      this.target.h = 0;
      this.kick();
    };
    if (delay) this.releaseTimer = window.setTimeout(sink, delay);
    else sink();
  }

  /**
   * Letters become inline-block cells (a cell can be transformed; an inline box cannot), which costs them their
   * kerning: each gets its kerned advance back as a right margin in em, measured once from the server's inline run,
   * so later font-size changes need no new measure.
   */
  private kern(): void {
    const fs = parseFloat(getComputedStyle(this.vis).fontSize) || 1;
    const kerned = this.words.map((word) => word.map((el) => el.getBoundingClientRect().left));
    this.vis.setAttribute('data-engine', '');
    this.words.forEach((word, w) => {
      word.forEach((el, i) => {
        if (i === word.length - 1) return;
        const advance = kerned[w][i + 1] - kerned[w][i];
        const delta = (advance - el.getBoundingClientRect().width) / fs;
        if (Math.abs(delta) > 0.001 && Math.abs(delta) < 0.2) el.style.marginRight = `${delta.toFixed(4)}em`;
      });
    });
  }

  private measure(): void {
    const first = this.letters[0];
    if (!first || !first.offsetWidth) {
      this.pos = null;
      return;
    }
    const fs = parseFloat(getComputedStyle(this.vis).fontSize);
    this.fs = fs;
    this.liftPx = this.liftEm * fs;
    this.sigmaX = SIGMA_X_EM * fs;
    this.sigmaY = SIGMA_Y_EM * fs;
    this.amplitudePx = this.amplitudeEm * fs;
    this.pos = this.letters.map((el) => ({ x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight * 0.55 }));
    const box = this.vis.getBoundingClientRect();
    const band = this.ridge.getBoundingClientRect();
    this.ridgeLeft = band.left - box.left;
    this.ridgeWidth = Math.max(1, band.width);
    this.baseY = band.top - box.top;
    this.restX = this.ridgeLeft + RIDGE_SUMMIT_T * this.ridgeWidth;
    this.ridge.setAttribute('viewBox', `0 0 ${band.width.toFixed(2)} ${band.height.toFixed(2)}`);
    this.ringLeft = this.rings.offsetLeft;
    this.ringTop = this.rings.offsetTop;
  }

  private field(x: number, y: number): number {
    const dx = (x - this.cx.x) / this.sigmaX;
    const dy = (y - this.cy.x) / this.sigmaY;
    return this.h.x * Math.exp(-dx * dx - dy * dy);
  }

  /** The ridge's depth under the baseline (px) at x (the name's box), with the raised ground taken off. */
  private ridgeDepth(x: number): number {
    const t = (x - this.ridgeLeft) / this.ridgeWidth;
    return SUMMIT_DROP_EM * this.fs + this.amplitudePx * (1 - ridgeElevationAt(t)) - this.field(x, this.baseY) * this.liftPx;
  }

  private nearest(x: number): number {
    let best = 0;
    let distance = Infinity;
    this.pos?.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  }

  private ring(x: number, y: number): void {
    const now = performance.now();
    if (now - this.lastRing < RING_GAP_MS) return;
    this.lastRing = now;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '-1.4 -1.4 2.8 2.8');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = this.ringPaths();
    this.rings.appendChild(svg);
    const tx = x - this.ringLeft;
    const ty = y - this.ringTop;
    const animation = svg.animate(
      [
        { transform: `translate(${tx}px, ${ty}px) scale(0.3)`, opacity: 0 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.55)`, opacity: 1, offset: 0.14 },
        { transform: `translate(${tx}px, ${ty}px) scale(1.2)`, opacity: 0 },
      ],
      { duration: RING_MS, easing: RING_EASE },
    );
    this.ripples.push(svg);
    animation.onfinish = () => {
      svg.remove();
      this.ripples = this.ripples.filter((r) => r !== svg);
    };
    while (this.ripples.length > RINGS_ALIVE) this.ripples.shift()?.remove();
  }

  private kick(): void {
    if (this.raf || this.destroyed) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number) => {
    this.raf = 0;
    if (!this.pos || this.destroyed) return;
    let dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.pass) {
      const progress = (now - this.pass.t0) / PASS_MS;
      if (progress >= 1) {
        this.pass = null;
        this.target.h = 0;
      } else {
        const span = this.pos[this.pos.length - 1].x - this.pos[0].x;
        this.target.cx = this.pos[0].x + GLIDE(progress) * span;
        this.target.cy = this.pass.y;
        this.target.h = 1;
        if (now - this.lastRing > PASS_RING_MS) this.ring(this.cx.x, this.pass.y);
      }
    }
    const left = this.ridgeLeft;
    const right = this.ridgeLeft + this.ridgeWidth;
    const trekTo = this.target.h > 0 ? Math.min(right, Math.max(left, this.target.cx)) : this.restX;
    while (dt > 0) {
      const s = Math.min(dt, 1 / 120);
      dt -= s;
      stepSpring(this.cx, this.target.cx, SPRING.pos, s);
      stepSpring(this.cy, this.target.cy, SPRING.pos, s);
      stepSpring(this.h, this.target.h, SPRING.height, s);
      stepSpring(this.tx, trekTo, SPRING.trek, s);
    }
    const peakNow = this.h.x > 0.5 ? this.nearest(this.cx.x) : -1;
    if (peakNow !== this.peak && peakNow >= 0 && !this.pass && this.target.h > 0) this.ring(this.cx.x, this.cy.x);
    this.peak = peakNow;
    this.render();
    const moving =
      Math.abs(this.h.v) > 0.002 ||
      Math.abs(this.h.x - this.target.h) > 0.002 ||
      Math.abs(this.cx.v) > 0.5 ||
      Math.abs(this.tx.v) > 0.5 ||
      Math.abs(this.tx.x - trekTo) > 0.3 ||
      this.pass !== null;
    if (moving) this.kick();
    else if (this.target.h === 0) {
      this.h.x = 0;
      this.h.v = 0;
      this.tx.x = this.restX;
      this.tx.v = 0;
      this.render();
    }
  };

  private render(): void {
    const pos = this.pos;
    if (!pos) return;
    this.letters.forEach((el, i) => {
      const g = this.field(pos[i].x, pos[i].y);
      const lift = g * this.liftPx;
      el.style.transform = lift > 0.05 ? `translate3d(0, ${(-lift).toFixed(2)}px, 0)` : '';
      if (g > WARM_ON) el.setAttribute('data-lit', '');
      else if (g < WARM_OFF) el.removeAttribute('data-lit');
    });

    const left = this.ridgeLeft;
    const width = this.ridgeWidth;
    const pathThrough = (ts: readonly number[]) =>
      ts.map((t, i) => `${i ? 'L' : 'M'}${(t * width).toFixed(1)} ${this.ridgeDepth(left + t * width).toFixed(1)}`).join('');
    this.base.setAttribute('d', pathThrough(RIDGE_SAMPLES));

    const half = (CUE_HALF_EM * this.fs) / width;
    const at = (this.tx.x - left) / width;
    const cue = pathThrough(samplesBetween(Math.max(0, at - half), Math.min(1, at + half)));
    this.cues.forEach((path) => path.setAttribute('d', cue));

    const dx = this.tx.x - this.restX;
    const dy = this.ridgeDepth(this.tx.x) - SUMMIT_DROP_EM * this.fs;
    this.trek.style.transform =
      Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 ? `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)` : '';
  }
}
