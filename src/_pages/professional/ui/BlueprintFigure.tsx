import type { ReactNode } from 'react';
import type { MediaSlotId } from '@/shared/config';
import { MediaSlot } from '@/shared/ui/media-slot';
import type { MediaLayout } from '@/shared/ui/media-slot';
import type { SheetVariant } from './blueprints';

/**
 * Where each layout of a G-05 blueprint shows. §G.3 asks for 4:3 plates; a 4:3 sheet narrower than about 460 px
 * would set its labels under G-05a's 13/14 px (§B.4.3, §J.1), so the narrowest plates take the 3:4 portrait layout.
 * - hero: Plate 1 is landscape from 640 to 1279 px (full width below the text from 1024 px, §B.5); portrait below
 *   640 px and in cols 9-12 from 1280 px (about 330 px wide).
 * - bleed: project plates are landscape from 640 to 1023 px and from 1440 px; portrait below 640 px and between
 *   1024 and 1439 px, where the column beside the text is narrowest.
 */
export type BlueprintBreakpoints = 'hero' | 'bleed';

const SHOW: Readonly<Record<BlueprintBreakpoints, Readonly<Record<SheetVariant, string>>>> = {
  hero: {
    portrait: 'sm:hidden xl:block',
    landscape: 'hidden sm:block xl:hidden',
  },
  bleed: {
    portrait: 'sm:hidden lg:block min-[1440px]:hidden',
    landscape: 'hidden sm:block lg:hidden min-[1440px]:block',
  },
};

export interface BlueprintFigureProps {
  /** A generated blueprint slot (M-PRO-AGENT-01, M-WORK-03). */
  id: MediaSlotId;
  breakpoints: BlueprintBreakpoints;
  /** The plate fill for one layout (the blueprint, usually inside its draw wrapper). */
  render: (variant: SheetVariant) => ReactNode;
  captionText?: string;
  number?: number;
  layout?: MediaLayout;
}

/**
 * One blueprint plate in two layouts, both server-rendered; CSS shows the one that suits the plate's width (the
 * other is display: none, so it is out of the accessibility tree and its draw never triggers). The ratio switches
 * with the layout, so the reserved box always matches what is drawn and nothing shifts.
 */
export function BlueprintFigure({ id, breakpoints, render, captionText, number, layout }: BlueprintFigureProps) {
  const show = SHOW[breakpoints];
  return (
    <>
      <MediaSlot
        id={id}
        ratio="3:4"
        layout={layout}
        number={number}
        captionText={captionText}
        fill={render('portrait')}
        className={show.portrait}
      />
      <MediaSlot
        id={id}
        ratio="4:3"
        layout={layout}
        number={number}
        captionText={captionText}
        fill={render('landscape')}
        className={show.landscape}
      />
    </>
  );
}
