'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { MOTION } from '@/shared/config';
import { useBootDone } from '@/shared/lib/boot';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { getMotionTier } from '@/shared/lib/motion-tier';

const ENTER_MS = 360;
const ENTER_OFFSET_PX = 12;

/**
 * `app/template.tsx` (§C.6): remounts on every navigation. On client navigations only (the
 * preloader covers the first load) the page enters with opacity 0 -> 1 and 12 px of travel over
 * 360 ms (`--ease-settle`) when motion is allowed, and focus moves to the page's first h1 so the
 * keyboard starts at the top of the new page. No exit animation.
 *
 * The travel animates `top` on a relative wrapper rather than a transform, so fixed descendants
 * (the waypoint rail, its mobile chip) are never re-anchored to the wrapper mid-animation.
 */
export function PageTemplate({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const bootDoneAtMount = useBootDone();
  const [isClientNavigation] = useState(bootDoneAtMount);

  useLayoutEffect(() => {
    if (!isClientNavigation) return;
    const el = ref.current;
    if (!el) return;

    let animation: Animation | null = null;
    if (getMotionTier() > 0 && typeof el.animate === 'function') {
      animation = el.animate(
        [
          { opacity: 0, top: `${ENTER_OFFSET_PX}px` },
          { opacity: 1, top: '0px' },
        ],
        { duration: ENTER_MS, easing: `cubic-bezier(${MOTION.bezier.settle.join(', ')})` },
      );
      animation.finished.then(
        () => ScrollTrigger.refresh(),
        () => undefined,
      );
    }

    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('#content h1');
      if (!heading) return;
      if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(frame);
      animation?.cancel();
    };
  }, [isClientNavigation]);

  return (
    <div ref={ref} className="relative">
      {children}
    </div>
  );
}
