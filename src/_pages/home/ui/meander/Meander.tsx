'use client';

import { useRef, type ReactNode } from 'react';

import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { StageSlot } from '@/shared/ui/stage';

import { useBandClip } from '../../lib/band-clip';
import { useMeanderPhase, useSegmentProgress, useSummitChromeDim } from '../../lib/segment-progress';
import { ProfileOverlay } from '../chapters/ProfileOverlay';
import { StageLegend } from '../chapters/StageLegend';
import { SummitReadout } from '../chapters/SummitReadout';

/** The relief scene module, resolved lazily inside the shared canvas (§C.5, §K.8). */
const loadRelief = () => import('../scenes/ReliefAnnapurnaScene');

export interface MeanderProps {
  /** Visually hidden description of the scene (what the relief shows, in words). */
  description: string;
  /** SSR poster of the slot (the plan sheet, route hidden), rendered on the server. */
  poster: ReactNode;
  /** The DOM elevation profile the stage cross-fades to (server-rendered). */
  profile: ReactNode;
  /** Pass altitude and name for the band's summit readout (below 1024 px). */
  summit: { altitudeM: number; place: string };
  /** The relief's honesty note ("Illustrative relief"), if any. */
  sourceNote?: string;
  /** The six entry `<li>`s and the hold spacer (server-rendered; the spacer carries the column readout). */
  children: ReactNode;
}

/**
 * `#meander`, the route (§G.1). Staged layout: a sticky stage slot (≥ 1024 px: beside the entries, full
 * viewport height, bleeding right; below: a 42svh band on top with the entries sliding under it on an
 * opaque panel). Per-segment ScrollTriggers drive the relief scene and the DOM overlays. Static layout
 * (`.motion-static`, chosen before paint): no stage, each entry shows its own plate; the list stops at
 * content column 10 so the plates stay clear of the fixed rail (§J.3).
 *
 * The section takes focus (tabindex -1, set by the hero's "Read my story") so the next Tab starts in the route.
 */
export function Meander({ description, poster, profile, summit, sourceNote, children }: MeanderProps) {
  const scope = useRef<HTMLElement>(null);
  const motionAllowed = useMotionAllowed();
  useSegmentProgress(scope, [motionAllowed]);
  useBandClip(scope, '[data-meander-stage] .stage-slot', '[data-meander-list]', [motionAllowed]);
  const phase = useMeanderPhase();
  useSummitChromeDim(phase.hold, motionAllowed);

  return (
    <section id="meander" ref={scope} aria-label="The route" className="journal-grid relative focus:outline-none">
      {/* Below 1024 px the band takes the top of the section; the entries start under it. */}
      <div aria-hidden="true" className="motion-stage col-[full-start/full-end] row-start-1 h-[42svh] lg:hidden" />

      <div
        data-meander-stage=""
        className="motion-stage col-[full-start/full-end] row-[1/span_2] lg:col-[7/full-end]"
      >
        <StageSlot
          sceneId="relief-annapurna"
          load={loadRelief}
          description={description}
          poster={poster}
          className="sticky top-0 h-[42svh] w-full overflow-hidden lg:h-svh"
        >
          {/* ≥ 1024 px the readout lives in the entries column (the #pass-hold spacer), not on the canvas. */}
          <SummitReadout variant="band" altitudeM={summit.altitudeM} place={summit.place} />
          <StageLegend
            place={phase.waypoint}
            sourceNote={sourceNote}
            hidden={phase.profile && !sourceNote}
            lifted={phase.profile}
          />
          <ProfileOverlay shown={phase.profile}>{profile}</ProfileOverlay>
        </StageSlot>
      </div>

      <ol
        data-meander-list=""
        className="relative col-[full-start/full-end] row-start-2 m-0 list-none border-t border-line bg-surface px-[var(--margin)] py-0 lg:col-[2/span_5] lg:border-t-0 lg:bg-transparent lg:px-0 lg:[html[data-motion=off]_&]:col-[2/span_10] lg:[html[data-lite='1']_&]:col-[2/span_10] max-lg:[&_a]:scroll-mt-[calc(42svh+1rem)] max-lg:[&_button]:scroll-mt-[calc(42svh+1rem)]"
      >
        {children}
      </ol>
    </section>
  );
}
