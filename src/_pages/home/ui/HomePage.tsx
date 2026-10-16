import { getExpedition } from '@/entities/expedition';
import { sheetSourceNote } from '@/shared/ui/map';
import { SectionDotNav } from '@/shared/ui/section-dot-nav';

import { STAGE_COPY } from '../config/copy';
import { PLAN_SHEET } from '../config/plan-sheet.generated';
import { HOME_SECTIONS, HOME_TRACK, HOME_WAYPOINTS } from '../config/sections';
import { AnnapurnaProfile } from './chapters/AnnapurnaProfile';
import { MeanderEntries } from './chapters/MeanderEntries';
import { NextSection } from './chapters/NextSection';
import { RoutePoster } from './chapters/RoutePoster';
import { HeroSection } from './HeroSection';
import { Meander } from './meander/Meander';

/**
 * Home `/` (§G.1): base camp, the route (six entries along the Annapurna Circuit over a sticky relief),
 * and the next base camp. Server Component; the shell owns the single `<main>`. The client parts are
 * small islands: the rail, the stage and its overlays, the summit readout, the hero drift and the action buttons.
 *
 * Rail reservation (§B.5, §J.3): from 1024 px text columns stay clear of the fixed rail; plates (the hero's
 * bleed plate, the #next plate) and the canvas may run under it.
 */
export function HomePage() {
  const annapurna = getExpedition('annapurna');
  const pass = HOME_WAYPOINTS.pass;
  const summitAltitude = pass.altitudeM ?? annapurna.highPoint.altitudeM;

  return (
    <>
      <SectionDotNav sections={HOME_SECTIONS} track={HOME_TRACK} />
      <HeroSection />
      <Meander
        description={STAGE_COPY.description}
        poster={<RoutePoster />}
        profile={<AnnapurnaProfile />}
        summit={{ altitudeM: summitAltitude ?? 0, place: pass.name || STAGE_COPY.summitLabel }}
        sourceNote={sheetSourceNote(PLAN_SHEET)}
      >
        <MeanderEntries />
      </Meander>
      <NextSection />
    </>
  );
}
