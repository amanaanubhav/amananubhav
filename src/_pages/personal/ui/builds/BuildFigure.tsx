import type { ComponentType } from 'react';
import { getMedia } from '@/shared/config';
import { MediaSlot } from '@/shared/ui/media-slot';
import {
  BUILD_NAV,
  BUILD_STAMPS,
  SPOT_THE_MOVER,
  WATCH_LABEL,
  WATCH_LINES,
  type EarlyBuild,
  type EarlyBuildId,
} from '../../config/content';
import { BlinkComparator, PavanaPlate, RakshakPlate, SchrodingerPlate, VyomagamiPlate } from '../plates';
import type { PlateDrawOptions } from '../plates/PlateDraw';
import { DrawAgainButton } from './DrawAgainButton';

type PlateComponent = ComponentType<{ className?: string } & PlateDrawOptions>;

/** The four drawn plates (the asteroid plate is the interactive blink comparator). */
const DIAGRAMS: Record<Exclude<EarlyBuildId, 'asteroids'>, PlateComponent> = {
  schrodinger: SchrodingerPlate,
  pavana: PavanaPlate,
  vyomagami: VyomagamiPlate,
  rakshak: RakshakPlate,
};

/** Award stamp (oxblood: an award). 14 px (P2-3). */
export const STAMP_CLASS =
  'inline-flex items-center rounded-[6px] border border-oxblood bg-oxblood-deep px-2.5 py-0.5 font-display text-[0.875rem] font-semibold leading-[1.35] text-on-oxblood glint-metal';

/** Forced colours: the drawn strokes take CanvasText (P2-7). */
const PLATE_CLASS =
  'plate-cyanotype relative isolate aspect-[3/2] overflow-hidden rounded-panel forced-colors:[&_[data-draw]]:![stroke:CanvasText]';

export interface BuildFigureProps {
  build: EarlyBuild;
  /** `'phone'`: in the article, draws at 30 % in view. `'viewer'`: in the desktop viewer, drawn on activation. */
  variant: 'phone' | 'viewer';
  /** The first viewer plate draws itself on view; the rest wait for their activation. */
  drawOnView?: boolean;
  /** Id of the build's h3. */
  headingId: string;
}

/**
 * One build's figure (FINAL §4.3.1): the 3:2 cyanotype plate, its caption (Literata italic, ink-muted), the Watch line
 * (Literata, ink) and the controls row (Draw again). The asteroid figure is the blink comparator with Spot the mover.
 * Photos show only once the registry marks them `existing`.
 */
export function BuildFigure({ build, variant, drawOnView = variant === 'phone', headingId }: BuildFigureProps) {
  const drawKey = `${build.id}:${variant}`;
  const stamp = BUILD_STAMPS[build.id];
  const watch = (
    <>
      <b className="font-display font-semibold">{WATCH_LABEL}</b> {WATCH_LINES[build.id]}
    </>
  );
  // Phones: caption and Watch line are one paragraph (italic caption, then the Watch sentence), with Draw again as a
  // round bead at the row's end, so each stacked article is about 90 px shorter (review UX P1-3).
  const phoneCaption = (
    <figcaption className="m-0 min-w-0 max-w-[60ch] flex-1 font-body text-caption leading-normal text-ink">
      {build.plateCaption ? <span className="italic text-ink-muted">{build.plateCaption} </span> : null}
      {watch}
    </figcaption>
  );
  const caption = (
    <>
      {build.plateCaption ? (
        <figcaption className="max-w-[36em] font-body text-caption italic text-ink-muted">{build.plateCaption}</figcaption>
      ) : null}
      <p className="m-0 max-w-[60ch] font-body text-caption leading-normal text-ink">{watch}</p>
    </>
  );

  if (build.id === 'asteroids') {
    return (
      <figure className="m-0 flex min-w-0 flex-col gap-2.5">
        <BlinkComparator copy={SPOT_THE_MOVER} caption={variant === 'phone' ? phoneCaption : caption} />
      </figure>
    );
  }

  const Diagram = DIAGRAMS[build.id];
  const photo = build.photoSlot && getMedia(build.photoSlot)?.status === 'existing' ? build.photoSlot : null;

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2.5">
      <div className={PLATE_CLASS} data-plate="">
        <Diagram className="absolute inset-0" trigger={drawOnView ? 'view' : 'manual'} drawKey={drawKey} />
        {/* The index row carries the stamp for screen readers; this corner copy is for the eye. */}
        {stamp ? (
          <span aria-hidden="true" className={`absolute right-2.5 top-2.5 z-[2] ${STAMP_CLASS}`}>
            {stamp}
          </span>
        ) : null}
      </div>
      {variant === 'phone' ? (
        <div className="flex items-start gap-3">
          {phoneCaption}
          <DrawAgainButton drawKey={drawKey} label={BUILD_NAV.drawAgain} describedBy={headingId} compact />
        </div>
      ) : (
        <>
          {caption}
          <div className="flex">
            <DrawAgainButton drawKey={drawKey} label={BUILD_NAV.drawAgain} describedBy={headingId} />
          </div>
        </>
      )}
      {photo ? <MediaSlot id={photo} ratio="3:2" /> : null}
    </figure>
  );
}
