import { formatAltitude, type Expedition } from '@/entities/expedition';
import type { ProfilePoint } from '@/shared/ui/charts';

/**
 * Profile points in walking order (the story reader mirrors this list, `read-story` `routeProfilePoints`, so the
 * cover morph lands on the same line). Altitudes the registry withholds (`showAltitude: false`, Ice Lake
 * until Q-52) are dropped so the chart never prints them; unknown altitudes are skipped by the chart.
 */
export function trekProfilePoints(exp: Expedition): ProfilePoint[] {
  return exp.waypoints.map((wp) => ({
    name: wp.name,
    altitudeM: wp.showAltitude === false ? undefined : wp.altitudeM,
    approx: wp.approx,
    distanceKm: wp.distanceKm,
    kind: wp.kind,
  }));
}

/** Waypoints that will actually be plotted (the chart needs two to draw a line). */
export function plottedCount(points: readonly ProfilePoint[]): number {
  return points.filter((p) => typeof p.altitudeM === 'number' && Number.isFinite(p.altitudeM)).length;
}

/** Title and description for the profile's <title>/<desc>, built from the data (§J.1 media). */
export function trekProfileText(exp: Expedition): { title: string; desc: string } {
  const points = trekProfilePoints(exp).filter((p) => typeof p.altitudeM === 'number');
  const first = points[0];
  const last = points[points.length - 1];
  const { highPoint } = exp;
  const high =
    typeof highPoint.altitudeM === 'number'
      ? `${highPoint.name} at ${formatAltitude(highPoint.altitudeM, highPoint.approx)}`
      : highPoint.name;
  const span =
    first && last && first !== last
      ? `From ${first.name} (${formatAltitude(first.altitudeM as number, first.approx)}) to ${last.name} (${formatAltitude(last.altitudeM as number, last.approx)}), `
      : '';
  return {
    title: `Elevation profile of the ${exp.shortName} trek`,
    desc: `${span}high point ${high}. Altitudes are commonly cited figures until a GPS track arrives.`,
  };
}
