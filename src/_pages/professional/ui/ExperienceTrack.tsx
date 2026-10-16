'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
// ScrollTrigger re-measures when the web fonts arrive through the shell's RouteScrollSync (§C.3).
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

/**
 * The logbook spine (§G.3 #experience): a 1 px line-strong spine down the timeline that fills in ink with scroll
 * (scaleY, scrubbed, linear), and a signal tick on the spine at the entry nearest the viewport centre (it moves in
 * 280 ms; CSS makes it jump under reduced motion). Entries never fade in. The spine sits just left of the text
 * column at >= 1024 px (between content columns 3 and 4) and at the left edge below that.
 * Children: the server-rendered `<ol>`; each entry carries `data-entry`, and its `[data-entry-mark]` sets the tick's height.
 */
export function ExperienceTrack({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();

  // Spine fill: scrubbed with the page scroll; full and static when motion is off.
  useGSAP(
    () => {
      const root = rootRef.current;
      const fill = fillRef.current;
      if (!root || !fill) return;
      if (!motionAllowed) {
        gsap.set(fill, { scaleY: 1 });
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top 50%', end: 'bottom 50%', scrub: true },
          },
        );
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(fill, { scaleY: 1 });
      });
      return () => mm.revert();
    },
    // Revert on update: the footer's "Reduce motion" switch must kill the scrub, not leave it running.
    { scope: rootRef, dependencies: [motionAllowed], revertOnUpdate: true },
  );

  // Signal tick: follows the entry nearest the viewport centre (rAF-throttled, one listener).
  useEffect(() => {
    const root = rootRef.current;
    const tick = tickRef.current;
    if (!root || !tick) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const entries = Array.from(root.querySelectorAll<HTMLElement>('[data-entry]'));
      if (entries.length === 0) return;
      const rootTop = root.getBoundingClientRect().top;
      const centre = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let bestDistance = Infinity;
      for (const entry of entries) {
        const rect = entry.getBoundingClientRect();
        const distance = rect.bottom < centre ? centre - rect.bottom : rect.top > centre ? rect.top - centre : 0;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = entry;
        }
      }
      if (!best) return;
      const mark = best.querySelector<HTMLElement>('[data-entry-mark]') ?? best;
      const markRect = mark.getBoundingClientRect();
      const y = markRect.top - rootTop + Math.min(markRect.height / 2, 14);
      tick.style.transform = `translateY(${Math.round(y)}px)`;
      tick.style.opacity = '1';
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(root);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="experience-track relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-px lg:left-[calc((100%_-_11_*_var(--gutter))_*_3_/_12_+_2.5_*_var(--gutter))]"
      >
        <div className="absolute inset-0 bg-line-strong" />
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-[-0.5px] w-[2px] origin-top bg-ink forced-colors:bg-[CanvasText]"
        />
        <div
          ref={tickRef}
          className="signal-mark absolute -left-[7px] top-0 h-0.5 w-[15px] bg-signal-line opacity-0 transition-[transform,opacity] duration-ui ease-settle forced-colors:bg-[Highlight]"
        />
      </div>
      {children}
    </div>
  );
}
