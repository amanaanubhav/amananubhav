export interface StageLegendProps {
  /** Where the route head stands (from the segment phase). */
  place: string;
  /** "Illustrative relief" while the terrain is procedural (none for real Terrain Tiles data). */
  sourceNote?: string;
  /** Hidden while the DOM profile covers the bottom of the slot (unless it must carry the source note). */
  hidden?: boolean;
  /** Moves the legend to the slot's top-left while the profile covers the bottom, so the source note stays readable. */
  lifted?: boolean;
}

/**
 * One-line legend at the slot's bottom-left on a `surface` backing (§G.1): the current waypoint and the
 * relief's honesty note. Place only: the altitude belongs to the entry's log and the rail's altimeter, so
 * the legend does not repeat it a third time. Decorative for assistive tech: the same facts are in each entry's log.
 */
export function StageLegend({ place, sourceNote, hidden = false, lifted = false }: StageLegendProps) {
  return (
    <p
      aria-hidden="true"
      data-hidden={hidden}
      data-lifted={lifted}
      className="text-caption pointer-events-none absolute bottom-3 left-4 m-0 flex max-w-[calc(100%-2rem)] items-baseline gap-x-3 truncate bg-surface px-3 py-1.5 transition-opacity duration-ui ease-settle data-[hidden=true]:opacity-0 data-[lifted=true]:bottom-auto data-[lifted=true]:top-3 md:left-6 lg:bottom-6 lg:left-8 lg:data-[lifted=true]:bottom-auto lg:data-[lifted=true]:top-6"
    >
      <span className="font-display font-semibold text-ink">{place}</span>
      {sourceNote ? <span className="font-body italic text-ink-muted">{sourceNote}</span> : null}
    </p>
  );
}
