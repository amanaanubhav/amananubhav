'use client';

import type { Ref } from 'react';

export interface SkyClockBeadProps {
  beadRef: Ref<HTMLParagraphElement>;
  timeRef: Ref<HTMLSpanElement>;
  zoneRef: Ref<HTMLSpanElement>;
  phaseRef: Ref<HTMLSpanElement>;
}

/**
 * The clock bead (FINAL-DESIGN §4.2.1): the one piece of glass on the desktop sky, top right, 44 px. A live dot
 * (`live` with its halo; `steel` once the time is scrubbed), the time and zone in Plex Mono (`aqua` live, `ink`
 * scrubbed) and the phase word in Literata italic. The engine writes the text through these refs only when it changes
 * (a minute, a phase): no React render per frame. Hidden from assistive tech: the slider's value and the summary carry
 * the time.
 */
export function SkyClockBead({ beadRef, timeRef, zoneRef, phaseRef }: SkyClockBeadProps) {
  return (
    <p
      ref={beadRef}
      aria-hidden="true"
      data-live="true"
      data-sky-reserve=""
      className="glass-chrome glass-bead group/bead pointer-events-none absolute right-3 top-3 z-[2] m-0 inline-flex h-11 items-center gap-2 rounded-full pl-3.5 pr-4"
    >
      <span className="live-halo size-2 shrink-0 rounded-full bg-live group-data-[live=false]/bead:bg-steel group-data-[live=false]/bead:shadow-none" />
      <span ref={timeRef} className="font-data text-ui font-medium leading-none tabular-nums text-aqua group-data-[live=false]/bead:text-ink" />
      <span ref={zoneRef} className="font-data text-ui leading-none text-ink empty:hidden" />
      <span ref={phaseRef} className="font-body text-caption italic leading-none text-ink-muted empty:hidden" />
    </p>
  );
}
