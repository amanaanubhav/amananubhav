import type { Ref } from 'react';

import { cn } from '@/shared/lib/cn';
import type { CSSVars } from '@/shared/lib/css';

const NUMBER = new Intl.NumberFormat('en');

export interface SummitNumeralProps {
  altitudeM: number;
  place: string;
  valueRef?: Ref<HTMLSpanElement>;
  /**
   * default: `text-display` with a caption-size place (the stage band and the tier-0 plate).
   * hold: the summit hold in the entries column, at the top of `text-display` (96 px) from 1024 px,
   * with the place in Literata italic at title size under it.
   */
  size?: 'default' | 'hold';
  className?: string;
}

/**
 * The summit readout numeral (§G.1): Archivo 750 at `wdth` 75, display size, tabular, unit muted.
 * Shared by the live `SummitReadout` (which counts the value through `valueRef`) and the tier-0 plate.
 */
export function SummitNumeral({ altitudeM, place, valueRef, size = 'default', className }: SummitNumeralProps) {
  const style: CSSVars = { '--wdth': 75 };
  const hold = size === 'hold';
  return (
    <p className={cn('m-0', className)}>
      <span
        style={style}
        className={cn(
          "text-display block font-display font-[750] leading-[0.98] text-ink tabular [font-variation-settings:'wdth'_var(--wdth,100)]",
          hold && 'lg:text-[6rem]',
        )}
      >
        <span ref={valueRef}>{NUMBER.format(altitudeM)}</span>
        <span className="ml-[0.12em] text-[0.4em] font-semibold text-ink-muted">m</span>
      </span>
      <span
        className={cn(
          'block font-body italic text-ink-muted',
          hold ? 'mt-2 text-title' : 'mt-1 text-caption',
        )}
      >
        {place}
      </span>
    </p>
  );
}
