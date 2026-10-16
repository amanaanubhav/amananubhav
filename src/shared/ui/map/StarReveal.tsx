'use client';

import { useLayoutEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { MOTION } from '@/shared/config';
import type { CSSVars } from '@/shared/lib/css';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

const EASE_SETTLE = `cubic-bezier(${MOTION.bezier.settle.join(', ')})`;

/**
 * Client island for `StarChart reveal="magnitude"`: the brightest stars first, then two fainter
 * groups 200 ms apart, once at 30% in view. Charts already in view at mount, or with motion off,
 * stay on the server-rendered final frame.
 */
export function StarReveal({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSVars;
  children: ReactNode;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = useMotionAllowed();
  const done = useRef(false);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !allowed || done.current) return;
    const rect = root.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      done.current = true;
      return;
    }
    const groups = Array.from(root.querySelectorAll<SVGGElement>('[data-mag-group]'));
    const anims: Animation[] = [];
    groups.forEach((g) => {
      g.style.opacity = '0';
    });
    const reset = () => {
      anims.splice(0).forEach((a) => a.cancel());
      groups.forEach((g) => {
        g.style.opacity = '';
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.3)) return;
        io.disconnect();
        groups.forEach((g, i) => {
          anims.push(g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: i * 200, easing: EASE_SETTLE, fill: 'forwards' }));
        });
        const last = anims[anims.length - 1];
        last?.finished.then(() => {
          done.current = true;
          reset();
        }, () => {});
      },
      { threshold: [0.3] },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      reset();
    };
  }, [allowed]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
