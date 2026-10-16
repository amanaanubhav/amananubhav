import { ContourSheet } from '@/shared/ui/map';

import { PLAN_SHEET } from '../../config/plan-sheet.generated';
import { STAGE_COPY, STATIC_PLATE_DESC, STATIC_PLATE_STATE, type HomeEntryId } from '../../config/copy';

/**
 * Tier-0 static plate for entries 1 to 4 (§G.1): the plan sheet at the route state of that stage of the
 * climb (hidden, graph, graph, solid), 3:2 (4:5 below 768 px). The 4:5 sheet is fitted (`meet`), not cropped,
 * so the whole route, Besisahar to Muktinath over Thorong La, stays in frame. It references the hero's `<symbol>`, so the
 * contours are serialised once per page. Lives inside `.motion-static`: the staged layout never shows it.
 */
export function EntryStaticPlate({ id }: { id: HomeEntryId }) {
  const state = STATIC_PLATE_STATE[id];
  if (!state) return null;
  return (
    <ContourSheet
      data={PLAN_SHEET}
      mode="reference"
      routeState={state}
      aspect="meet"
      labels="priority"
      title={STAGE_COPY.posterTitle}
      desc={STATIC_PLATE_DESC[id] ?? STAGE_COPY.description}
      className="aspect-[4/5] w-full md:aspect-[3/2]"
    />
  );
}
