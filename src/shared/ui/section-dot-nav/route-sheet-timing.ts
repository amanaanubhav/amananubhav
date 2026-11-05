/** Exit durations (ms) of the route rail's contents sheet: 180 on the depart curve, 150 cross-fade under reduced motion
 * (route-sheet.module.css). Kept apart from `RouteSheet` so the rail can time its jump without loading the sheet. */
export function routeSheetExitMs(): number {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 180;
}
