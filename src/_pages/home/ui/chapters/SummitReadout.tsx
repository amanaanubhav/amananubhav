'use client';

import { useEffect, useRef } from 'react';

import { MOTION } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { gsap } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

import { useMeanderPhase } from '../../lib/segment-progress';
import { SummitNumeral } from './SummitNumeral';

const NUMBER = new Intl.NumberFormat('en');
/** The count starts here and settles on the pass altitude, once (§G.1). */
const COUNT_FROM = 4850;

export interface SummitReadoutProps {
  /**
   * column (≥ 1024 px): inside the `#pass-hold` spacer in the entries column, sticky and vertically centred,
   * unboxed on `ground`, so the authored moment fills the column beside the relief instead of leaving it blank.
   * band (< 1024 px): inside the 42svh stage band, on a `ground/0.85` scrim the width of the numeral.
   */
  variant: 'column' | 'band';
  altitudeM: number;
  place: string;
}

const VARIANT_CLASS: Record<SummitReadoutProps['variant'], string> = {
  // Natural position: the top of the 60svh spacer; it sticks at the viewport's centre while the hold runs.
  column: 'sticky top-[calc(50svh-4.75rem)] hidden lg:block',
  band: 'absolute left-4 top-16 bg-ground/[0.85] px-3 py-2 md:left-6 lg:hidden',
};

/**
 * The summit hold readout (§G.1): "5,416 m" counts up once from 4,850 over 900 ms (`expo.out`) the first time
 * the hold is entered; afterwards, and whenever motion is off, it shows the final value. It reads the hold
 * from the segment-progress store itself, so the server-rendered `#pass-hold` spacer can host it.
 * Decorative (`aria-hidden`): the altitude is in entry 4's log. Text never sits on the canvas: the column
 * variant stands on the page ground, the band variant on its own scrim.
 */
export function SummitReadout({ variant, altitudeM, place }: SummitReadoutProps) {
  const { hold: active } = useMeanderPhase();
  const motionAllowed = useMotionAllowed();
  const valueRef = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = valueRef.current;
    if (!active || !el || counted.current) return;
    counted.current = true;
    // Only the displayed variant counts; the other one (display: none) just holds the final value.
    if (!motionAllowed || el.getClientRects().length === 0) {
      el.textContent = NUMBER.format(altitudeM);
      return;
    }
    const state = { v: COUNT_FROM };
    el.textContent = NUMBER.format(COUNT_FROM);
    const tween = gsap.to(state, {
      v: altitudeM,
      duration: 0.9,
      ease: MOTION.ease.settle,
      onUpdate: () => {
        el.textContent = NUMBER.format(Math.round(state.v));
      },
      onComplete: () => {
        el.textContent = NUMBER.format(altitudeM);
      },
    });
    return () => {
      tween.kill();
      el.textContent = NUMBER.format(altitudeM);
    };
  }, [active, motionAllowed, altitudeM]);

  return (
    <div
      aria-hidden="true"
      data-active={active}
      className={cn(
        'pointer-events-none opacity-0 transition-opacity duration-ui ease-settle data-[active=true]:opacity-100',
        VARIANT_CLASS[variant],
      )}
    >
      <SummitNumeral
        altitudeM={altitudeM}
        place={place}
        valueRef={valueRef}
        size={variant === 'column' ? 'hold' : 'default'}
      />
    </div>
  );
}
