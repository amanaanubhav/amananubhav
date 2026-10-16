import type { Waypoint } from '@/entities/expedition';
import type { ProfilePoint } from '@/shared/ui/charts';

/**
 * Waypoints to profile points (the DOM `ElevationProfile` and the 3D section curtain share
 * `profileMapping`). Unknown altitudes stay undefined, so the chart skips them; never invented.
 */
export function toProfilePoints(waypoints: readonly Waypoint[]): ProfilePoint[] {
  return waypoints.map((wp) => ({
    name: wp.name,
    altitudeM: wp.altitudeM,
    distanceKm: wp.distanceKm,
    approx: wp.approx,
    kind: wp.sideTrip ? 'side-trip' : wp.kind,
  }));
}
