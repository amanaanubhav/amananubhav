'use client';

import { useMediaView } from './media-view';

export interface SpecOverlayProps {
  id: string;
  status: string;
  ratio: string;
  minPx?: { w: number; h: number };
}

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Media spec overlay (§D.2): slot id, status, ratio and minimum pixels in a corner of every plate.
 * On in development builds (off with `?media=live`, which previews production); in production only with
 * `?media=spec`. The flag is read on the client after hydration, so the server HTML never differs.
 * The outer span spans the plate width as an inline-size container: narrow plates drop the minimum-pixel
 * field below 340 px and the status word below 240 px, so the id and ratio fit on one line; below 150 px
 * (the narrowest album tiles) the id and ratio wrap instead of being cut.
 */
export function SpecOverlay({ id, status, ratio, minPx }: SpecOverlayProps) {
  const view = useMediaView();
  const visible = view === 'spec' || (IS_DEV && view !== 'live');

  if (!visible) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-1 top-1 z-[2] [container-type:inline-size]">
      <span className="block w-fit max-w-full truncate rounded-control border border-accent-2-line/line bg-accent-2-soft px-1.5 py-0.5 font-data text-[11px] leading-tight text-ink [@container(max-width:150px)]:whitespace-normal [@container(max-width:150px)]:[overflow-wrap:anywhere]">
        {id}
        <span className="[@container(max-width:240px)]:hidden"> · {status}</span> · {ratio}
        {minPx ? (
          <span className="[@container(max-width:340px)]:hidden">
            {' '}
            · ≥ {minPx.w}×{minPx.h}
          </span>
        ) : null}
      </span>
    </span>
  );
}
