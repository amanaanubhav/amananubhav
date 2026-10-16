import { flushSync } from 'react-dom';

import { MOTION } from '@/shared/config';
import { getMotionTier } from '@/shared/lib/motion-tier';

export interface ThemeSweepOptions {
  /** True when switching Night -> Day (sunrise, rises from the bottom); false for sunset (from the top). */
  toDay: boolean;
}

/** Attribute on `<html>` while a sweep runs: `sunrise` | `sunset` (a CSS hook, nothing depends on it). */
const SWEEP_ATTR = 'themeSweep';

/** The shell's ThemeEdge element: a fixed 2 px signal line, hidden at rest. */
const EDGE_SELECTOR = '[data-theme-edge]';

function sweepAllowed(): boolean {
  if (typeof document.startViewTransition !== 'function') return false;
  if (document.documentElement.dataset.motion === 'off') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return getMotionTier() > 0;
}

/**
 * The theme change, the one authored moment every page shares (§C.1). With View Transitions and
 * motion allowed, the new theme is revealed by a clip-path sweep over 700 ms (`--ease-glide`, CSS
 * in globals.css): sunrise from the bottom edge, sunset from the top, while the shell's ThemeEdge
 * line rides the clip edge (Web Animations API). Otherwise the theme switches instantly.
 * `toggle` is always called exactly once.
 */
export function runThemeSweep(toggle: () => void, opts: ThemeSweepOptions): void {
  if (typeof document === 'undefined' || !sweepAllowed()) {
    toggle();
    return;
  }

  const root = document.documentElement;
  const { toDay } = opts;
  const duration = MOTION.dur.theme * 1000;
  const easing = `cubic-bezier(${MOTION.bezier.glide.join(', ')})`;
  let edgeAnimation: Animation | null = null;

  root.dataset[SWEEP_ATTR] = toDay ? 'sunrise' : 'sunset';

  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(() => {
      flushSync(toggle);
    });
  } catch {
    delete root.dataset[SWEEP_ATTR];
    toggle();
    return;
  }

  // globals.css animates ::view-transition-new(root) (clip-path, keyed on the new data-theme);
  // the ThemeEdge line rides that clip edge here, in the live new view, with the same timing.
  transition.ready
    .then(() => {
      const edge = document.querySelector<HTMLElement>(EDGE_SELECTOR);
      if (!edge) return;
      const height = window.innerHeight;
      edgeAnimation = edge.animate(
        toDay
          ? [
              { opacity: 1, transform: `translateY(${height}px)` },
              { opacity: 1, transform: 'translateY(0px)' },
            ]
          : [
              { opacity: 1, transform: 'translateY(-2px)' },
              { opacity: 1, transform: `translateY(${height - 2}px)` },
            ],
        { duration, easing },
      );
    })
    .catch(() => {
      // Skipped transition (hidden tab, a newer sweep): the theme has already changed.
    });

  const cleanUp = () => {
    edgeAnimation?.cancel();
    if (root.dataset[SWEEP_ATTR] === (toDay ? 'sunrise' : 'sunset')) delete root.dataset[SWEEP_ATTR];
  };
  transition.finished.then(cleanUp, cleanUp);
}
