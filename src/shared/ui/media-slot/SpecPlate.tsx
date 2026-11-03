'use client';

import type { FillGlyph, MediaRatio, PendingFill } from '@/shared/config';
import { PlateFrame } from '@/shared/ui/journal';
import { MediaFill } from './MediaFill';
import { SpecOverlay } from './SpecOverlay';

export interface SpecPlateProps {
  id: string;
  status: string;
  ratio: MediaRatio;
  minPx?: { w: number; h: number };
  /** "Photo to come: {short}". */
  caption: string;
  captionHidden?: boolean;
  number?: number;
  fill: PendingFill;
  glyph?: FillGlyph;
  className?: string;
}

/**
 * The full pending plate of a slot that production collapses (a strip, nothing, or a generated cover), shown only
 * with `?media=spec`. Its own lazy chunk: production pages never download it unless the flag is set. Plain props
 * only, so the media registry stays on the server.
 */
export default function SpecPlate({
  id,
  status,
  ratio,
  minPx,
  caption,
  captionHidden,
  number,
  fill,
  glyph,
  className,
}: SpecPlateProps) {
  return (
    <PlateFrame
      ratio={ratio}
      number={number}
      caption={caption}
      captionHidden={captionHidden}
      tone="pending"
      ticks
      grid
      className={className}
    >
      <MediaFill kind={fill} seed={id} glyph={glyph} />
      <SpecOverlay id={id} status={status} ratio={ratio} minPx={minPx} />
    </PlateFrame>
  );
}
