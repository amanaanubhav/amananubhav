'use client';

import { useRef, type ReactNode } from 'react';
import { MOTION } from '@/shared/config';
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

export interface ContactSheetRevealProps {
  children: ReactNode;
  className?: string;
}

/** Frames per develop group, and the stagger inside a group (§G.2, §B.8). */
const GROUP_MAX = MOTION.stagger.framesMax;
const STAGGER = MOTION.stagger.frames;

/**
 * Develops the contact sheet's frames in groups of at most six with an 80 ms stagger (§G.2): each plate box
 * opens from the bottom and comes into focus (clip-path and blur, 800 ms, settle). Only frames below the fold
 * at mount are hidden first, and only from JavaScript when motion is allowed, so the server HTML is always
 * fully visible (§C.4).
 */
export function ContactSheetReveal({ children, className }: ContactSheetRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !motionAllowed) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const below = gsap.utils
          .toArray<HTMLElement>(root.querySelectorAll('[data-frame] .plate'))
          .filter((plate) => plate.getBoundingClientRect().top >= window.innerHeight);
        if (below.length === 0) return;
        gsap.set(below, { clipPath: 'inset(100% 0% 0% 0%)', filter: 'blur(6px)' });
        ScrollTrigger.batch(below, {
          start: 'top 90%',
          once: true,
          batchMax: GROUP_MAX,
          onEnter: (batch) =>
            gsap.to(batch, {
              clipPath: 'inset(0% 0% 0% 0%)',
              filter: 'blur(0px)',
              duration: MOTION.dur.reveal,
              ease: MOTION.ease.settle,
              stagger: STAGGER,
              clearProps: 'clipPath,filter',
            }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [motionAllowed], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
