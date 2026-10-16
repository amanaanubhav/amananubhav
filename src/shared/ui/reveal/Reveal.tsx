'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

/**
 * Legacy preset names, kept so current pages compile. Every preset is now the same quiet 150 ms opacity fade
 * (no translate, no tilt); the per-page motion lives in the page designs, not here.
 */
export type RevealPreset = 'archive' | 'section' | 'timeline' | 'hero' | 'tilt';

export interface RevealProps {
  children: ReactNode;
  preset: RevealPreset;
  /** Stagger in ms; capped at 240 ms. */
  delay?: number;
  className?: string;
}

const FADE_MS = 150;
const MAX_DELAY_MS = 240;

/**
 * Visible by default (§C.4): the server HTML is the final state. After mount, and only when motion is allowed,
 * an element that starts below the fold is faded out and fades back in (150 ms) when it scrolls into view.
 * Elements already in view at mount are never hidden. No layout shift: opacity only.
 */
export function Reveal({ children, preset, delay, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const wait = Math.min(Math.max(delay ?? 0, 0), MAX_DELAY_MS);
    el.style.opacity = '0';
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        el.style.transition = `opacity ${FADE_MS}ms var(--ease-settle, ease-out) ${wait}ms`;
        el.style.opacity = '1';
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.style.opacity = '';
      el.style.transition = '';
    };
  }, [motionAllowed, delay]);

  return (
    <div ref={ref} data-reveal={preset} className={className}>
      {children}
    </div>
  );
}
