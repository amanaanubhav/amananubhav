import { ContourSheet } from '@/shared/ui/map';

import { STAGE_COPY } from '../../config/copy';
import { PLAN_SHEET } from '../../config/plan-sheet.generated';

/**
 * SSR poster of the `#meander` stage slot: the plan sheet with the route hidden (the scene's first pose,
 * a printed sheet), cropped to fill the slot. It references the hero's `<symbol>`; it stays in place at
 * tier 0, on WebGL failure and while the terrain data is missing.
 */
export function RoutePoster() {
  return (
    <ContourSheet
      data={PLAN_SHEET}
      mode="reference"
      routeState="hidden"
      aspect="slice"
      labels="none"
      title={STAGE_COPY.posterTitle}
      desc={STAGE_COPY.description}
      className="size-full"
    />
  );
}
