import type { ReactNode } from 'react';

export interface ProfileOverlayProps {
  /** True from t = 5.3 (after the section curtain has unrolled). */
  shown: boolean;
  /** The DOM `ElevationProfile` (server-rendered and passed in, so the chart code stays out of the client bundle). */
  children: ReactNode;
}

/**
 * The section cut's DOM half (§G.1): the full Annapurna profile cross-fades in over 300 ms at the bottom
 * of the stage slot, on an opaque `surface` panel. Phase 1 always uses this crossfade (no registered
 * handoff). While hidden it is `inert`, so its "Show data" control is never a hidden tab stop.
 *
 * It is a stage overlay, not an overlay pane (§C.3): no `data-lenis-prevent`, so the wheel over it keeps
 * scrolling the page. `overflow-y-auto` only matters once "Show data" outgrows the slot (keyboard, touch).
 *
 * Width: from 1024 px the chart stays clear of the fixed rail (§J.3; the rail is 160 px wide at 24 px from
 * the edge, so 200 px is reserved). The chart is capped so its SVG text stays near caption size: the narrow
 * profile box (340 units) up to 360 px, the wide box (720 units) from 1440 px, where the slot leaves at least
 * 660 px beside a 112 px reserve (the rail's labels sit beside the chart's end, not over it).
 */
export function ProfileOverlay({ shown, children }: ProfileOverlayProps) {
  return (
    <div
      data-shown={shown}
      inert={!shown}
      className="scroll-pane absolute inset-x-0 bottom-0 max-h-full overflow-y-auto border-t border-line bg-surface px-4 pb-4 pt-3 opacity-0 transition-opacity duration-[300ms] ease-settle data-[shown=true]:opacity-100 md:px-6 lg:pb-8 lg:pl-8 lg:pr-[200px] lg:pt-6 min-[1440px]:pr-[112px]"
    >
      <div className="max-w-[360px] min-[1440px]:max-w-[720px]">{children}</div>
    </div>
  );
}
