import { ContourSheet } from '@/shared/ui/map';
import { SectionDotNav } from '@/shared/ui/section-dot-nav';

import { MAP_COPY } from '../config/copy';
import { PLAN_SHEET } from '../config/plan-sheet.generated';
import { HOME_SECTIONS, HOME_TRACK } from '../config/sections';
import { NextSection } from './chapters/NextSection';
import { HeroSection } from './HeroSection';
import { Meander } from './meander/Meander';
import { PlanSheetLines, PlanSheetOverlay, PlanSheetUnderlay } from './story/PlanSheetLayers';
import { RouteList } from './story/RouteList';
import { StoryLegend } from './story/StoryLegend';
import { StoryStage } from './story/StoryStage';

/**
 * Home `/` (design §3): ONE story map, fixed and full-bleed behind the hero and every story section, and
 * the text in normal flow over it with no backgrounds. The map is the StoryStage: the relief scene, which
 * loads straight in 3D (it rises out of the ground; no plan sheet is painted first), or, under reduced
 * motion, on lite devices, without JavaScript or after a failed load, the server-rendered plan sheet alone
 * as the calm static map. Scrolling walks the route from the first pixel; the map recedes under each text
 * block and returns after it; it dissolves into the ground before `#next`. Server Component; the shell owns the single `<main>`.
 */
export function HomePage() {
  return (
    <>
      <SectionDotNav sections={HOME_SECTIONS} track={HOME_TRACK} />
      {/* The hero comes first in the document: its h1 (the LCP element) is parsed and painted before the
          stage's static SVG sheet, and it is the first thing a screen reader meets. The stage is fixed at
          z-0 and the hero sits above it at z-[1], so the order changes nothing on screen. */}
      <HeroSection />
      <StoryStage
        poster={
          <ContourSheet
            data={PLAN_SHEET}
            mode="define"
            routeState="solid"
            drawRoute="none"
            labels="responsive"
            aspect="slice"
            title={MAP_COPY.sheetTitle}
            desc={MAP_COPY.sheetDesc}
            className="size-full"
            underlay={<PlanSheetUnderlay data={PLAN_SHEET} />}
            lines={<PlanSheetLines data={PLAN_SHEET} />}
            overlay={<PlanSheetOverlay data={PLAN_SHEET} />}
          />
        }
      />
      <RouteList />
      <Meander />
      <NextSection />
      <StoryLegend />
    </>
  );
}
