'use client';

import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { SplitText } from 'gsap/SplitText';
import { MOTION } from '@/shared/config';
import { gsap, loadSplitText, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

export interface RevealTextProps {
  as: 'h2' | 'h3' | 'p';
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Rendered as `data-wdth-compact` (thin-air headings, §B.4.4). */
  wdthCompact?: number;
}

/** The reveal plays once, on its own clock, as the heading's top passes 75% of the viewport (7a5ed17's trigger). */
const START = 'top 75%';

/** Only a heading wholly below the fold is split; one in view or above it stays exactly as the server sent it. */
function belowFold(el: HTMLElement): boolean {
  return el.getBoundingClientRect().top >= window.innerHeight;
}

/**
 * Line-mask reveal (§D.3, C-04): GSAP SplitText (`lines`, masked, `linesClass: 'line'`, so every mask wrapper is a
 * `.line-mask`: a clip 0.14 em beyond the line box that never cuts ascenders, descenders or accents, and takes no
 * layout), loaded on demand after `document.fonts.ready`. The lines wait at `yPercent 125` (below the mask's
 * overhang) and rise to 0 with a 70 ms stagger over `--dur-reveal` (expo out), once, when the heading's top passes
 * 75% of the viewport. On completion the split is reverted: the original markup comes back, so no mask, clip or
 * aria-label outlives the reveal. `data-revealing` marks the element while it is split.
 * Visible by default: never split when the heading is in view or above it at mount (or when fonts arrive), when
 * motion is off (OS setting, `html[data-motion=off]`, tier 0), or on a `.trim-cap` heading (a trimmed box would
 * let the clip cut ink). Turning motion off mid-way reverts at once. The server HTML is always the final state.
 */
export function RevealText({ as: Tag, children, className, id, style, wdthCompact }: RevealTextProps) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  const motionAllowed = useMotionAllowed();

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !motionAllowed || !contextSafe) return;
      if (!belowFold(el) || el.classList.contains('trim-cap')) return;

      let split: SplitText | null = null;
      let cancelled = false;

      const run = contextSafe((Split: typeof SplitText) => {
        if (cancelled || !ref.current || !belowFold(el)) return;
        split = Split.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'line',
          autoSplit: true,
          onSplit: (self: SplitText) => {
            el.setAttribute('data-revealing', '');
            // autoSplit re-splits on resize and font load: returning the tween lets SplitText revert it and carry
            // its progress into the new split.
            return gsap.fromTo(
              self.lines,
              { yPercent: 125 },
              {
                yPercent: 0,
                duration: MOTION.dur.reveal,
                ease: MOTION.ease.settle,
                stagger: MOTION.stagger.lines,
                scrollTrigger: { trigger: el, start: START, once: true },
                onComplete: () => {
                  self.revert();
                },
              },
            );
          },
          onRevert: () => {
            el.removeAttribute('data-revealing');
          },
        });
      });

      void Promise.all([loadSplitText(), document.fonts.ready])
        .then(([Split]) => run(Split))
        .catch(() => undefined);

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    // revertOnUpdate: turning motion off (the footer switch) restores the text at once instead of at unmount.
    { scope: ref, dependencies: [motionAllowed], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} id={id} style={style} data-wdth-compact={wdthCompact} className={className}>
      {children}
    </Tag>
  );
}
