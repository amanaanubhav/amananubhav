'use client';

import { prefetchSky, requestSky } from '../../lib/sky-commands';
import { landOn } from './land';

/**
 * "Open this sky" under the winter chart: sets the live sky to the chart's moment (Sikahar, 15 Jan, 21:00 IST,
 * facing south: `SKY_PRESET`) and lands on the plate with the sky's heading focused (fix 19).
 */
export function OpenThisSky({ label, href }: { label: string; href: string }) {
  return (
    <button
      type="button"
      onPointerEnter={prefetchSky}
      onFocus={prefetchSky}
      onClick={() => {
        requestSky('preset');
        landOn(href);
      }}
      className="satin-steel inline-flex min-h-11 items-center justify-center justify-self-start rounded-control border px-4 font-display text-ui font-semibold leading-none text-ink transition-transform duration-micro active:scale-[0.97] [@media(pointer:fine)]:min-h-10"
    >
      {label}
    </button>
  );
}
