/**
 * Thin-air width (§B.4.4, D1 graft): Archivo `wdth` from the waypoint altitude, computed on the server and
 * never animated. 760 m (Besisahar) -> 112, 5,416 m (Thorong La) -> 78; `compact` (below 768 px) caps at 100.
 */
export function thinAirWidth(altitudeM: number, opts: { compact?: boolean } = {}): number {
  const t = Math.min(1, Math.max(0, (altitudeM - 760) / (5416 - 760)));
  const w = Math.round(112 - 34 * t);
  return opts.compact ? Math.min(w, 100) : w;
}
