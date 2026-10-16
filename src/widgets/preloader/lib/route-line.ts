import { ANNAPURNA_ROUTE } from '@/entities/expedition';
import { PROFILE_BOX, plottedPoints, profileMapping } from '@/shared/ui/charts';

const BOX = PROFILE_BOX.preloader;
const PLOTTED = plottedPoints(ANNAPURNA_ROUTE);
const MAP = profileMapping(ANNAPURNA_ROUTE, BOX);
const XS = PLOTTED.map((_, i) => MAP.x(i));
const YS = PLOTTED.map((p) => MAP.y(p.altitudeM as number));

/** The route's high point, the preloader's target ("Thorong La, 5,416 m"); falls back to the spec's facts. */
export const PRELOADER_TARGET: { readonly name: string; readonly altitudeM: number } = (() => {
  const high = PLOTTED.reduce<(typeof PLOTTED)[number] | undefined>(
    (best, p) => (best === undefined || (p.altitudeM as number) > (best.altitudeM as number) ? p : best),
    undefined,
  );
  return high ? { name: high.name, altitudeM: high.altitudeM as number } : { name: 'Thorong La', altitudeM: 5416 };
})();

/**
 * Where the headlamp sits when `progress` (0..1) of the line is revealed, in percent of the preloader
 * profile's box. The profile's signal copy is clipped to its own bounding box (x from the first to the
 * last waypoint), so the lamp rides that clip edge and follows the line's altitude between waypoints.
 */
export function headlampAt(progress: number): { xPct: number; yPct: number } {
  if (XS.length === 0) return { xPct: 0, yPct: 50 };
  const p = Math.min(1, Math.max(0, progress));
  const x = XS[0] + p * (XS[XS.length - 1] - XS[0]);
  let y = YS[0];
  for (let i = 1; i < XS.length; i += 1) {
    if (x <= XS[i]) {
      const span = XS[i] - XS[i - 1];
      const t = span > 0 ? (x - XS[i - 1]) / span : 1;
      y = YS[i - 1] + t * (YS[i] - YS[i - 1]);
      break;
    }
    y = YS[i];
  }
  return { xPct: (x / BOX.width) * 100, yPct: (y / BOX.height) * 100 };
}
