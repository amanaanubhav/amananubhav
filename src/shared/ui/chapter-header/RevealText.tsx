'use client';

import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { MOTION } from '@/shared/config';
import { gsap, SplitText, useGSAP } from '@/shared/lib/gsap';
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

/**
 * Line-mask reveal (§D.3): GSAP SplitText (`lines`, masked, auto re-split on resize and font load) after
 * `document.fonts.ready`; lines rise `yPercent 100 -> 0` with a 70 ms stagger over `--dur-reveal`, once, at
 * `top 75%`. Visible by default: skipped when the element is in view at mount or motion is off, and reverted
 * on unmount, so the server HTML is always the final state.
 */
export function RevealText({ as: Tag, children, className, id, style, wdthCompact }: RevealTextProps) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  const motionAllowed = useMotionAllowed();

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !motionAllowed || !contextSafe) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;

      let split: SplitText | null = null;
      let cancelled = false;

      const run = contextSafe(() => {
        if (cancelled || !ref.current) return;
        split = SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self: SplitText) =>
            gsap.from(self.lines, {
              yPercent: 100,
              duration: MOTION.dur.reveal,
              ease: MOTION.ease.settle,
              stagger: MOTION.stagger.lines,
              scrollTrigger: { trigger: el, start: 'top 75%', once: true },
            }),
        });
      });

      void document.fonts.ready.then(run);

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: ref, dependencies: [motionAllowed] },
  );

  return (
    <Tag ref={ref} id={id} style={style} data-wdth-compact={wdthCompact} className={className}>
      {children}
    </Tag>
  );
}
