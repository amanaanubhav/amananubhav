'use client';

import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { MOTION } from '@/shared/config';
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

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
}

type Stroke = SVGGeometryElement;

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

/**
 * Draws every descendant `[data-draw]` stroke once when `threshold` of the drawing is in view
 * (`stroke-dashoffset`, duration from the path length, `--ease-pen`), then fades `[data-draw-label]` in over
 * 200 ms (§D.2). Already in view at mount, or motion off: the final drawing, no animation. A stroke's own
 * dash pattern (e.g. a dashed graph route) is restored when the draw ends.
 */
export function DrawOnView({ children, threshold = 0.3, durationMs, delayMs = 0, onDone, className }: DrawOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useGSAP(
    (_context, contextSafe) => {
      const root = ref.current;
      if (!root || !motionAllowed || !contextSafe || typeof IntersectionObserver === 'undefined') return;
      const rect = root.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      // A drawing taller than the viewport can never be `threshold` in view; lower the bar so it still draws.
      const ratio = rect.height > 0 ? Math.min(threshold, (window.innerHeight / rect.height) * 0.9) : threshold;

      const strokes = Array.from(root.querySelectorAll<Stroke>('[data-draw]')).filter(
        (el) => typeof el.getTotalLength === 'function',
      );
      const labels = Array.from(root.querySelectorAll<SVGElement | HTMLElement>('[data-draw-label]'));
      if (strokes.length === 0 && labels.length === 0) return;

      const saved = strokes.map((el) => ({
        el,
        dasharray: el.style.strokeDasharray,
        dashoffset: el.style.strokeDashoffset,
        length: screenLength(el),
      }));
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

      const play = contextSafe(() => {
        const longest = saved.reduce((max, s) => Math.max(max, s.length), 0);
        const duration = durationMs !== undefined ? durationMs / 1000 : MOTION.drawDuration(longest);
        const tl = gsap.timeline({
          delay: delayMs / 1000,
          onComplete: () => {
            restore();
            onDoneRef.current?.();
          },
        });
        if (saved.length > 0) {
          tl.to(
            saved.map((s) => s.el),
            { strokeDashoffset: 0, duration, ease: MOTION.ease.pen },
          );
        }
        if (labels.length > 0) tl.to(labels, { opacity: 1, duration: 0.2, ease: MOTION.ease.settle });
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
        restore();
        labels.forEach((label) => {
          label.style.opacity = '';
        });
      };
    },
    { scope: ref, dependencies: [motionAllowed, threshold, durationMs, delayMs] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
