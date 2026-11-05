'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { dropSkyCommand } from '../../lib/sky-commands';
import type { SkyPlaceOption } from '../../lib/sky-place';
import type { SkyLiveProps, SkySlots } from './SkyLive';

/*
 * The one module loader of the live sky: the UI, the engine and the star catalogue arrive in one lazy chunk, fetched
 * when the plate comes within 200 px of the viewport, or earlier when Origin's "Look up" is hovered or focused
 * (`prefetchSky()` -> `personal:sky-prefetch`). Created once per page load; it never refetches.
 */
let chunk: Promise<typeof import('./SkyLive')> | null = null;
function loadSky() {
  chunk ??= import('./SkyLive').catch((error: unknown) => {
    chunk = null; // a failed fetch may be retried on the next intersection
    throw error;
  });
  return chunk;
}

export interface SkyViewProps {
  /** The SSR star chart (`SkyPoster`): the plate until the first live frame, and the whole plate without script. */
  poster: ReactNode;
  /** Legend under the plate while it shows the poster ("… on a January night."). */
  posterLegend: string;
  /** The places the sky can stand at, built on the server (`getSkyPlaces`). */
  places: readonly SkyPlaceOption[];
}

/**
 * The sky plate (FINAL-DESIGN §4.2). Server render and no JS: the poster inside the plate with its legend; no
 * controls, so nothing on the page is dead. Once the lazy chunk arrives, `SkyLive` draws the live sky into the same
 * plate (the poster cross-fades away after the first frame) and fills the control strip and the side column, which
 * are laid out here so the plate never moves when it goes live.
 */
export function SkyView({ poster, posterLegend, places }: SkyViewProps) {
  const [Live, setLive] = useState<ComponentType<SkyLiveProps> | null>(null);
  const [plate, setPlate] = useState<HTMLDivElement | null>(null);
  const [controls, setControls] = useState<HTMLDivElement | null>(null);
  const [side, setSide] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!plate) return;
    const el: HTMLDivElement = plate;
    let mounted = false;
    let alive = true;
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && mount(), { rootMargin: '200px 0px' });
    const stopEarly = () => {
      window.removeEventListener('keydown', onKey);
      document.getElementById('about')?.removeEventListener('focusin', mount);
    };
    function mount() {
      if (mounted) return;
      mounted = true;
      io?.disconnect();
      stopEarly();
      loadSky().then(
        (m) => alive && setLive(() => m.SkyLive),
        () => {
          // The poster stays; watch the plate again so the next time it comes into view retries the fetch.
          mounted = false;
          if (alive) io?.observe(el);
        },
      );
    }
    // Keyboard users reach the sky from the route map long before the plate is near the viewport: the first Tab (or
    // focus anywhere in Origin) loads it, so the live controls exist when the tab order arrives there (UX P1-1).
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Tab') mount();
    }
    io?.observe(plate);
    window.addEventListener('keydown', onKey);
    document.getElementById('about')?.addEventListener('focusin', mount);
    if (!io) mount();
    const warm = () => void loadSky().catch(() => undefined);
    window.addEventListener('personal:sky-prefetch', warm);
    return () => {
      alive = false;
      io?.disconnect();
      stopEarly();
      window.removeEventListener('personal:sky-prefetch', warm);
      dropSkyCommand();
    };
  }, [plate]);

  const slots: SkySlots | null = plate && controls && side ? { plate, controls, side } : null;

  return (
    <div
      id="sky-live"
      data-focus="sky-h"
      data-land-clear="sky-statement"
      // "Look up", the route stop and "Open this sky" land here: the plate and its time control share the screen
      // (P0-1). The root already pads scrolling by --nav-clear.
      className="journal-grid scroll-mt-4 gap-y-6 lg:items-start"
    >
      <div className="col-[full-start/full-end] grid min-w-0 gap-2 md:col-[content] lg:col-[content-start/span_8] lg:row-start-1">
        <div
          ref={setPlate}
          id="sky-plate"
          data-palette-scope="night"
          data-dock-avoid="cover"
          className="group/plate relative isolate h-[64svh] min-h-[360px] overflow-hidden bg-ground-sky text-ink md:h-[min(560px,calc(100svh-var(--nav-clear)-232px))] md:rounded-panel md:steel-frame"
        >
          <div
            aria-hidden={Live ? true : undefined}
            className="absolute inset-0 z-[1] transition-[opacity,visibility] duration-[200ms] ease-out group-data-[sky-drawn]/plate:invisible group-data-[sky-drawn]/plate:opacity-0"
          >
            {poster}
          </div>
        </div>
        {Live ? null : (
          <p className="m-0 px-4 font-body text-caption italic text-ink-muted md:px-0">{posterLegend}</p>
        )}
        <div ref={setControls} className="contents" />
      </div>
      <div ref={setSide} className="col-[content] min-w-0 lg:col-[span_4/content-end] lg:row-start-1" />
      {Live && slots ? <Live slots={slots} places={places} /> : null}
    </div>
  );
}
