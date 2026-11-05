'use client';

import { useEffect, useMemo, useState } from 'react';
import { readSun } from '@/shared/lib/astro';
import { prefetchSky, requestSky } from '../../lib/sky-commands';
import type { SIKAHAR_READOUT } from '../../config/content';
import { isPlainClick, landOn } from './land';

export interface SikaharReadoutProps {
  /** `SIKAHAR_READOUT`, passed in by the server so this island ships no content module. */
  copy: typeof SIKAHAR_READOUT;
  /** `SKY_OBSERVER` (25° N 85° E, never finer: Q-06). */
  observer: { readonly latDeg: number; readonly lonDeg: number; readonly timeZone: string };
}

const MINUTE = 60_000;

/**
 * The time in Sikahar now, and the phase of its sky. Rendered on the server without a time (`serverLine`), so
 * hydration never mismatches; on mount it reads the Sun's altitude (`readSun`) and rewrites the text at each minute
 * boundary while the tab is visible. A text write, no animation, and not a live region (it would talk every minute).
 * The link lands on the sky plate (`#sky-live`, heading focused); in daylight it also asks the sky for tonight.
 */
export function SikaharReadout({ copy, observer }: SikaharReadoutProps) {
  const [now, setNow] = useState<number | null>(null);
  const { latDeg, lonDeg, timeZone } = observer;

  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      // Land a few ms after the boundary so the minute shown has already turned.
      timer = window.setTimeout(tick, MINUTE - (Date.now() % MINUTE) + 50);
    };
    const tick = () => {
      setNow(Date.now());
      schedule();
    };
    const onVisibility = () => (document.hidden ? window.clearTimeout(timer) : tick());
    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const fmt = useMemo(
    () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }),
    [timeZone],
  );
  const sun = useMemo(() => (now === null ? null : readSun(now, latDeg, lonDeg)), [now, latDeg, lonDeg]);
  const day = sun?.phase === 'day';

  return (
    <p className="glass-chrome glass-bead m-0 inline-flex min-h-11 max-w-full items-center gap-2 rounded-[22px] py-0 pl-3.5 pr-1">
      <span
        aria-hidden="true"
        className="live-halo size-2 flex-none rounded-full bg-live forced-colors:bg-[Highlight]"
      />
      <span className="min-w-0 py-2 font-body text-caption text-ink [text-wrap:pretty]">
        {now === null || sun === null ? (
          copy.serverLine
        ) : (
          <>
            <span className="font-data text-ui font-medium leading-none text-aqua [font-variant-numeric:tabular-nums]">
              {fmt.format(now)}
            </span>{' '}
            {copy.zone} {copy.inPlace}{' '}
            <span className="hidden md:inline">
              {sun.phase === 'night' && copy.night}
              {sun.phase === 'twilight' && copy.twilight}
              {day && (
                <>
                  {copy.dayBeforeSunset}
                  {sun.sunset !== null && (
                    <span className="font-data [font-variant-numeric:tabular-nums]">{fmt.format(sun.sunset)}</span>
                  )}
                  .
                </>
              )}
            </span>
            <span className="md:hidden">{copy.short[sun.phase]}</span>
          </>
        )}
      </span>
      <a
        href={copy.href}
        onPointerEnter={prefetchSky}
        onFocus={prefetchSky}
        onClick={(e) => {
          if (!isPlainClick(e)) return;
          if (day) requestSky('tonight');
          if (landOn(copy.href)) e.preventDefault();
        }}
        className="inline-flex min-h-11 flex-none items-center rounded-full px-2.5 font-display text-[0.9375rem] font-semibold leading-none text-link-ink underline decoration-action-line decoration-1 underline-offset-[0.22em] transition-[text-decoration-color,transform] duration-micro hover:decoration-action hover:decoration-2 active:scale-[0.97]"
      >
        {day ? copy.dayLink : copy.link}
      </a>
    </p>
  );
}
