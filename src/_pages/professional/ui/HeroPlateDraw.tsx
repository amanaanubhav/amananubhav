'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { MOTION } from '@/shared/config';
import { useBootDone } from '@/shared/lib/boot';
import { cn } from '@/shared/lib/cn';
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

type Stroke = SVGGeometryElement;
type Phase = 'idle' | 'armed' | 'done';

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

const PASSES = [
  { name: 'frame', duration: 0.5 },
  { name: 'node', duration: 0.5 },
  { name: 'signal', duration: 0.6 },
] as const;

/**
 * The hero plate's draw (§G.3): once after load, in three passes (frames, nodes, signal path; 1,600 ms in all).
 * On the first load the start state is set under the preloader and the draw starts when it leaves; on a client
 * navigation it is set before paint. Motion off: the finished drawing, untouched (it is complete server markup).
 */
export function HeroPlateDraw({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const phase = useRef<Phase>('idle');
  const motionAllowed = useMotionAllowed();
  const bootDone = useBootDone();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || phase.current === 'done') return;
      if (!motionAllowed) {
        // Motion switched off while the drawing waited for the preloader: show it finished.
        if (phase.current === 'armed') {
          gsap.set(root.querySelectorAll('[data-draw]'), { clearProps: 'strokeDasharray,strokeDashoffset' });
          gsap.set(root.querySelectorAll('[data-draw-label]'), { opacity: 1 });
          phase.current = 'done';
        }
        return;
      }

      const groups = PASSES.map(({ name, duration }) => {
        const strokes = Array.from(root.querySelectorAll<Stroke>(`[data-pass="${name}"][data-draw]`)).filter(
          (el) => typeof el.getTotalLength === 'function',
        );
        const labels = Array.from(root.querySelectorAll<SVGElement>(`[data-pass="${name}"][data-draw-label]`));
        return { strokes, labels, duration, lengths: strokes.map(screenLength) };
      });

      if (phase.current === 'idle') {
        groups.forEach(({ strokes, labels, lengths }) => {
          strokes.forEach((el, i) => {
            const length = lengths[i] ?? 0;
            gsap.set(el, { strokeDasharray: `${length} ${length}`, strokeDashoffset: length });
          });
          gsap.set(labels, { opacity: 0 });
        });
        phase.current = 'armed';
      }
      if (!bootDone || phase.current !== 'armed') return;

      phase.current = 'done';
      const tl = gsap.timeline({
        onComplete: () => {
          // Restore authored dash patterns (dashed edges) once every stroke is drawn.
          groups.forEach(({ strokes }) => gsap.set(strokes, { clearProps: 'strokeDasharray,strokeDashoffset' }));
        },
      });
      groups.forEach(({ strokes, labels, duration }) => {
        const at = tl.duration();
        if (strokes.length > 0) tl.to(strokes, { strokeDashoffset: 0, duration, ease: MOTION.ease.pen }, at);
        if (labels.length > 0) tl.to(labels, { opacity: 1, duration: Math.min(0.3, duration), ease: MOTION.ease.settle }, at + duration * 0.4);
      });
    },
    { scope: ref, dependencies: [motionAllowed, bootDone] },
  );

  return (
    <div ref={ref} className={cn('absolute inset-0', className)}>
      {children}
    </div>
  );
}
