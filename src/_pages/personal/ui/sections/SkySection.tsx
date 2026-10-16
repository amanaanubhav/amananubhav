'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { getMotionTier, useMotionTier } from '@/shared/lib/motion-tier';
import { Button } from '@/shared/ui/button';
import { setSceneParam, StageSlot } from '@/shared/ui/stage';
import { useSkyProgress, type SkyReadoutRefs } from '../../lib/sky-progress';
import { SkyClockLog } from './SkyClockLog';

/** Module-level loader (§C.5): the lazy scene is created once and never remounts. */
const loadSky = () => import('../scenes/SkyScene');

export interface SkySectionProps {
  /** Heading and body, rendered on the server. */
  copy: ReactNode;
  /** The SSR poster (G-04b `SKY_POSTER` star chart), visible until the scene goes live and in the static layout. */
  poster: ReactNode;
  /** The astrophotograph plates after the track, rendered on the server. */
  photos: ReactNode;
  /** Visually hidden slot description. */
  description: string;
  /** Legend under the clock log while the live sky scrubs ("... tonight"). */
  legend: string;
  /** Legend in the static layout, where the poster is a fixed January night. */
  staticLegend: string;
  logLabel: string;
  /** "5,416 m · Thorong La": the highest point he has stood, from `entities/expedition`. */
  highest: string;
  /** False when the star data carries no constellation lines (the toggle is then hidden). */
  hasConstellations: boolean;
}

/*
 * Layout (§G.2, §C.4). Text never sits on the slot's box (the stage canvas paints behind the page).
 *
 * >= 1024 px: a 250svh track in one grid row. The slot is 100svh, sticky, in cols 5-12 bleeding right; the text
 * column (copy, clock log, toggle) sticks in cols 1-4 on the ground.
 *
 * < 1024 px: four rows, `copy | band | panel | scrub run`. The copy scrolls past first; then the band (the slot)
 * sticks at the top and the panel (clock log and toggle, on `surface`) sticks right under it, so the sky and its
 * readout are on screen together for the whole run. The text column is `display: contents` here, so copy and
 * panel are grid items of the track. Both sticky boxes release at the same scroll: the band's grid area runs to
 * the end of the track like the panel's, and its bottom margin equals the panel's height (`--sky-panel-h`,
 * measured). The band is `min(60svh, 100svh - panel)` tall, so band and panel always fit the viewport.
 *
 * Static layout (`data-motion='off'` or `data-lite='1'`, chosen before paint): nothing sticks. The slot is
 * `position: relative` (it must stay the poster's containing block, or the absolute poster spreads over the whole
 * track and under the text), 16:10, in normal flow: beside the text in cols 5-12 (>= 1024 px), or between the
 * copy and the clock log (< 1024 px).
 *
 * Tailwind cannot build class names at runtime, so every static override is spelled out for both attributes.
 */
const TRACK =
  'journal-grid relative max-lg:grid-rows-[auto_var(--sky-band)_auto_150svh] lg:h-[250svh] lg:grid-rows-[minmax(0,1fr)] ' +
  '[html[data-motion=off]_&]:h-auto [html[data-motion=off]_&]:grid-rows-none ' +
  "[html[data-lite='1']_&]:h-auto [html[data-lite='1']_&]:grid-rows-none";

/** The scrub range (the ScrollTrigger's trigger): from where the band sticks to the end of the track. */
const RANGE =
  'pointer-events-none invisible col-[full-start/full-end] max-lg:row-[2/5] lg:row-start-1 ' +
  "[html[data-motion=off]_&]:hidden [html[data-lite='1']_&]:hidden";

const SLOT =
  'col-[full-start/full-end] self-start sticky top-0 overflow-hidden ' +
  'max-lg:row-[2/5] max-lg:h-[var(--sky-band)] max-lg:mb-[var(--sky-panel-h,18rem)] ' +
  'lg:col-[6/full-end] lg:row-start-1 lg:h-svh ' +
  '[html[data-motion=off]_&]:relative [html[data-motion=off]_&]:h-auto [html[data-motion=off]_&]:mb-0 [html[data-motion=off]_&]:aspect-[16/10] ' +
  "[html[data-lite='1']_&]:relative [html[data-lite='1']_&]:h-auto [html[data-lite='1']_&]:mb-0 [html[data-lite='1']_&]:aspect-[16/10] " +
  "max-lg:[html[data-motion=off]_&]:row-[2] max-lg:[html[data-lite='1']_&]:row-[2]";

const TEXT =
  'max-lg:contents lg:sticky lg:top-0 lg:col-[2/span_4] lg:row-start-1 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:pr-4 ' +
  '[html[data-motion=off]_&]:static [html[data-motion=off]_&]:h-auto ' +
  "[html[data-lite='1']_&]:static [html[data-lite='1']_&]:h-auto";

const COPY = 'max-lg:col-[content-start/content-end] max-lg:row-start-1 max-lg:pb-12';

const PANEL =
  'max-lg:col-[full-start/full-end] max-lg:row-[3/5] max-lg:self-start max-lg:sticky max-lg:top-[var(--sky-band)] ' +
  'max-lg:bg-surface max-lg:px-4 max-lg:pb-[calc(1rem+72px)] max-lg:pt-5 md:max-lg:px-8 ' +
  "[html[data-motion=off]_&]:static [html[data-lite='1']_&]:static " +
  "max-lg:[html[data-motion=off]_&]:row-[3] max-lg:[html[data-lite='1']_&]:row-[3] " +
  "max-lg:[html[data-motion=off]_&]:pb-8 max-lg:[html[data-lite='1']_&]:pb-8";

/** The stacked band-and-panel layout. */
const NARROW = '(max-width: 1023.98px)';

/** Compass letters pinned at the slot edges (DOM, not projected); shown only once the scene is live. */
const COMPASS = 'pointer-events-none absolute bg-ground px-1 font-display text-caption font-semibold text-ink-muted opacity-0 transition-opacity duration-ui [[data-stage-live]_&]:opacity-100';

/** The band never pushes the panel off a short phone: 60svh, or what the panel leaves of the viewport. */
const TRACK_STYLE = { '--sky-band': 'min(60svh, calc(100svh - var(--sky-panel-h, 18rem)))' } as CSSProperties;

/**
 * `/personal#sky` (§G.2): the one 3D moment of the Life page. A sticky stage slot renders the star dome over
 * Bihar; scrolling the track turns the sky from dusk to dawn, and the clock log's altitude stops counting metres
 * and starts counting star degrees (`ALT 90°`). Every fact is also in the DOM.
 */
export function SkySection({
  copy,
  poster,
  photos,
  description,
  legend,
  staticLegend,
  logLabel,
  highest,
  hasConstellations,
}: SkySectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<HTMLElement>(null);
  const metresRef = useRef<HTMLElement>(null);
  const starRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLElement>(null);
  const readout: SkyReadoutRefs = { time: timeRef, phase: phaseRef, metres: metresRef, star: starRef, label: labelRef };
  const [constellations, setConstellations] = useState(false);
  const tier = useMotionTier();

  useSkyProgress({ section: sectionRef, track: rangeRef, readout });

  useEffect(() => {
    setSceneParam('sky', 'constellations', constellations ? 1 : 0);
  }, [constellations]);

  // Tier 0 in the sticky layout (failed WebGL probe, runtime degrade): the poster is the whole design, so the
  // legend names the poster's January night and the constellations toggle, with no scene to act on, is hidden.
  // Read from the live store, not the hydration snapshot (0 on the server), so a capable device never flashes it.
  useEffect(() => {
    sectionRef.current?.toggleAttribute('data-sky-poster', getMotionTier() === 0);
  }, [tier]);

  // The mobile band's bottom margin and height follow the panel's real height (font load, text wrap, rotation).
  // Below 1024 px that moves the track, so the scrub range is re-measured (one frame later, batched).
  useEffect(() => {
    const track = trackRef.current;
    const panel = panelRef.current;
    if (!track || !panel || typeof ResizeObserver === 'undefined') return;
    const narrow = window.matchMedia(NARROW);
    let last = -1;
    let frame = 0;
    const measure = () => {
      const height = Math.ceil(panel.getBoundingClientRect().height);
      if (height === last) return;
      last = height;
      track.style.setProperty('--sky-panel-h', `${height}px`);
      if (!narrow.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} id="sky" aria-labelledby="sky-title" className="group/sky relative pt-32 lg:pt-48">
      <div ref={trackRef} className={TRACK} style={TRACK_STYLE}>
        <div ref={rangeRef} aria-hidden="true" className={RANGE} />

        <StageSlot sceneId="sky" load={loadSky} description={description} poster={poster} className={SLOT}>
          <span aria-hidden="true" className={`${COMPASS} bottom-3 left-1/2 -translate-x-1/2`}>
            S
          </span>
          <span aria-hidden="true" className={`${COMPASS} left-3 top-1/2 -translate-y-1/2`}>
            E
          </span>
          <span aria-hidden="true" className={`${COMPASS} right-3 top-1/2 -translate-y-1/2 lg:right-28`}>
            W
          </span>
        </StageSlot>

        <div className={TEXT}>
          <div className={COPY}>{copy}</div>
          <div ref={panelRef} className={PANEL}>
            <SkyClockLog
              timeRef={timeRef}
              phaseRef={phaseRef}
              metresRef={metresRef}
              starRef={starRef}
              labelRef={labelRef}
              highest={highest}
              legend={legend}
              staticLegend={staticLegend}
              label={logLabel}
            />
            {hasConstellations ? (
              // Hidden at tier 0 (no scene), and again if the scene had to fall back to an illustrative sky with no line data (data-stage-lines="0").
              <div className="motion-stage mt-4 lg:mt-6 group-has-[[data-stage-lines='0']]/sky:hidden group-data-[sky-poster]/sky:hidden">
                <Button
                  variant="secondary"
                  aria-pressed={constellations}
                  onClick={() => setConstellations((on) => !on)}
                >
                  {constellations ? 'Hide constellations' : 'Show constellations'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {photos}
    </section>
  );
}
