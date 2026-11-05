'use client';

import { useEffect, useImperativeHandle, useRef } from 'react';
import type { ReactElement, Ref } from 'react';
import { MOTION } from '@/shared/config';
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

/** Imperative handle for a drawing played on demand (the Life page's light table, "Draw again"). */
export interface DrawOnViewHandle {
  /**
   * Hides the strokes and labels and draws them again from the start. Cancels a draw in progress. Runs on press
   * even when motion is off: the person asked for it.
   */
  replay: () => void;
  /** Stops any draw in progress and shows the finished drawing. */
  finish: () => void;
}

export interface DrawOnViewProps {
  /** The drawing (usually an inline <svg>); strokes to draw carry `data-draw`, labels `data-draw-label`. */
  children: ReactElement;
  /** Share of the drawing in view before it draws. Default 0.3. */
  threshold?: number;
  /** Overrides the length-based duration (`MOTION.drawDuration`). */
  durationMs?: number;
  delayMs?: number;
  onDone?: () => void;
  className?: string;
  /**
   * `'view'` (default, today's behaviour): draws once when `threshold` of it is in view. `'manual'`: never draws on
   * its own; the drawing shows finished until `replay()` is called through `ref`.
   */
  trigger?: 'view' | 'manual';
  /** Optional handle: `replay()` and `finish()`. Additive; omitting it changes nothing. */
  ref?: Ref<DrawOnViewHandle>;
}

type Stroke = SVGGeometryElement;
type Label = SVGElement | HTMLElement;

/** On-screen length of a stroke; non-scaling strokes dash in screen pixels, so scale by the CTM. */
function screenLength(el: Stroke): number {
  let length = 0;
  try {
    length = el.getTotalLength();
  } catch {
    return 0;
  }
  if (getComputedStyle(el).vectorEffect === 'non-scaling-stroke') {
    const m = el.getScreenCTM();
    if (m) length *= Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
  }
  return Math.ceil(length) + 2;
}

interface Prepared {
  saved: { el: Stroke; dasharray: string; dashoffset: string; length: number }[];
  labels: Label[];
  restore: () => void;
}

/**
 * Collects the strokes and labels, records each stroke's own dash (once per element, so a replay never records a
 * half-drawn state) and hides them. Null when there is nothing to draw.
 */
function prepare(root: HTMLElement, originals: WeakMap<Element, { dasharray: string; dashoffset: string }>): Prepared | null {
  const strokes = Array.from(root.querySelectorAll<Stroke>('[data-draw]')).filter(
    (el) => typeof el.getTotalLength === 'function',
  );
  const labels = Array.from(root.querySelectorAll<Label>('[data-draw-label]'));
  if (strokes.length === 0 && labels.length === 0) return null;

  const saved = strokes.map((el) => {
    let original = originals.get(el);
    if (!original) {
      original = { dasharray: el.style.strokeDasharray, dashoffset: el.style.strokeDashoffset };
      originals.set(el, original);
    }
    return { el, ...original, length: screenLength(el) };
  });
  saved.forEach(({ el, length }) => {
    el.style.strokeDasharray = `${length} ${length}`;
    el.style.strokeDashoffset = `${length}`;
  });
  gsap.set(labels, { opacity: 0 });

  const restore = () => {
    saved.forEach(({ el, dasharray, dashoffset }) => {
      el.style.strokeDasharray = dasharray;
      el.style.strokeDashoffset = dashoffset;
    });
  };
  return { saved, labels, restore };
}

/** The draw itself: strokes on `--ease-pen` over their length-based duration, then the labels fade in. */
function drawTimeline(
  { saved, labels, restore }: Prepared,
  durationMs: number | undefined,
  delayMs: number,
  onComplete: () => void,
): gsap.core.Timeline {
  const longest = saved.reduce((max, s) => Math.max(max, s.length), 0);
  const duration = durationMs !== undefined ? durationMs / 1000 : MOTION.drawDuration(longest);
  const tl = gsap.timeline({
    delay: delayMs / 1000,
    onComplete: () => {
      restore();
      onComplete();
    },
  });
  if (saved.length > 0) {
    tl.to(
      saved.map((s) => s.el),
      { strokeDashoffset: 0, duration, ease: MOTION.ease.pen },
    );
  }
  if (labels.length > 0) tl.to(labels, { opacity: 1, duration: 0.2, ease: MOTION.ease.settle });
  return tl;
}

/** Shows the finished drawing: the strokes' own dash restored, labels at full opacity. */
function showFinished(prepared: Prepared | null): void {
  if (!prepared) return;
  prepared.restore();
  prepared.labels.forEach((label) => {
    label.style.opacity = '';
  });
}

/**
 * Draws every descendant `[data-draw]` stroke once when `threshold` of the drawing is in view
 * (`stroke-dashoffset`, duration from the path length, `--ease-pen`), then fades `[data-draw-label]` in over
 * 200 ms (§D.2). Already in view at mount, or motion off: the final drawing, no animation. A stroke's own
 * dash pattern (e.g. a dashed graph route) is restored when the draw ends.
 *
 * Opt-in additions (Life page light table): `trigger="manual"` keeps it from drawing on its own, and `ref` gives a
 * `replay()` / `finish()` handle. Without them it behaves exactly as before.
 */
export function DrawOnView({
  children,
  threshold = 0.3,
  durationMs,
  delayMs = 0,
  onDone,
  className,
  trigger = 'view',
  ref: handleRef,
}: DrawOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();
  const onDoneRef = useRef(onDone);
  /** Each stroke's own dash pattern, recorded the first time it is hidden. */
  const originals = useRef(new WeakMap<Element, { dasharray: string; dashoffset: string }>());
  /** The draw running now (from view or from `replay()`), and what it hid. */
  const active = useRef<{ tl: gsap.core.Timeline; prepared: Prepared } | null>(null);
  const timing = useRef({ durationMs, delayMs });
  useEffect(() => {
    onDoneRef.current = onDone;
    timing.current = { durationMs, delayMs };
  });

  useImperativeHandle(
    handleRef,
    () => ({
      replay() {
        const root = ref.current;
        if (!root) return;
        const running = active.current;
        if (running) {
          running.tl.kill();
          showFinished(running.prepared);
          active.current = null;
        }
        const prepared = prepare(root, originals.current);
        if (!prepared) return;
        const tl = drawTimeline(prepared, timing.current.durationMs, 0, () => {
          if (active.current?.tl === tl) active.current = null;
          onDoneRef.current?.();
        });
        active.current = { tl, prepared };
      },
      finish() {
        const running = active.current;
        if (!running) return;
        running.tl.kill();
        showFinished(running.prepared);
        active.current = null;
      },
    }),
    [],
  );

  // A replay in progress at unmount: stop it and leave the DOM as it was.
  useEffect(
    () => () => {
      const running = active.current;
      if (!running) return;
      running.tl.kill();
      showFinished(running.prepared);
      active.current = null;
    },
    [],
  );

  useGSAP(
    (_context, contextSafe) => {
      const root = ref.current;
      if (trigger !== 'view') return;
      if (!root || !motionAllowed || !contextSafe || typeof IntersectionObserver === 'undefined') return;
      const rect = root.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      // A drawing taller than the viewport can never be `threshold` in view; lower the bar so it still draws.
      const ratio = rect.height > 0 ? Math.min(threshold, (window.innerHeight / rect.height) * 0.9) : threshold;

      const prepared = prepare(root, originals.current);
      if (!prepared) return;

      const play = contextSafe(() => {
        // A replay already took over this drawing: leave it be.
        if (active.current) return;
        const tl = drawTimeline(prepared, durationMs, delayMs, () => {
          if (active.current?.tl === tl) active.current = null;
          onDoneRef.current?.();
        });
        active.current = { tl, prepared };
      });

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= ratio)) {
            observer.disconnect();
            play();
          }
        },
        { threshold: ratio },
      );
      observer.observe(root);

      return () => {
        observer.disconnect();
        if (active.current?.prepared === prepared) active.current = null;
        showFinished(prepared);
      };
    },
    { scope: ref, dependencies: [motionAllowed, threshold, durationMs, delayMs, trigger] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
