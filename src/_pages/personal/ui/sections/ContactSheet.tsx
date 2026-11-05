import type { CSSProperties } from 'react';
import { getMedia, mediaRatioValue, type MediaSlotId } from '@/shared/config';
import { PlateFrame } from '@/shared/ui/journal';
import { isMediaSlotShown, MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { ALBUM_UI } from '../../config/content';
import { AlbumClip, ContactSheetReveal } from './ContactSheetReveal';

export interface ContactSheetProps {
  frames: readonly MediaSlotId[];
  /** Id of the heading that names the sheet. */
  labelledBy?: string;
}

/** The registry writes a clip's caption as "Clip: …"; the play button adds its own "clip". */
const clipName = (caption: string) => caption.replace(/^Clip:\s*/, '');

/** One frame's picture: a photo through the media registry, or a clip that plays only when pressed. */
function FramePicture({ id }: { id: MediaSlotId }) {
  const entry = getMedia(id);
  if (entry.kind === 'video' && entry.status === 'existing') {
    return (
      <PlateFrame as="div" ratio={entry.ratio} tone="pending" boxClassName="plate-photo-lit">
        <AlbumClip src={entry.src ?? entry.path} name={clipName(entry.caption ?? entry.alt)} />
      </PlateFrame>
    );
  }
  return <MediaSlot id={id} layout="album" caption="none" reveal="none" className="max-w-none" />;
}

/**
 * The field album's contact sheet (FINAL-DESIGN §4.6). From 768 px: justified rows about 220 px tall, each frame as
 * wide as its true ratio (every frame grows in proportion to its ratio, so a row keeps one height; the trailing spacer
 * stops the last row from stretching, and `--row-max` stops a lone frame from blowing up). Phones: a two-column grid of
 * 4:5 crops, the first `ALBUM_UI.phoneVisible` shown, then **Show all** (`ContactSheetReveal`). Frame numbers are the
 * real sequence; a caption shows only where the registry has one (drafts until Q-09), in Literata italic. A frame
 * that would render nothing (a pending album slot in production) is left out before numbering.
 */
export function ContactSheet({ frames: allFrames, labelledBy }: ContactSheetProps) {
  const frames = allFrames.filter((id) => isMediaSlotShown(id, 'album'));
  if (frames.length === 0) return null;
  return (
    <ContactSheetReveal total={frames.length}>
      <ol
        aria-labelledby={labelledBy}
        className={
          'm-0 grid list-none grid-cols-2 gap-x-2.5 gap-y-4 p-0 ' +
          'md:flex md:flex-wrap md:items-start md:gap-x-3 md:gap-y-5 md:[--row-h:210px] md:[--row-max:290px] ' +
          "md:after:grow-[999] md:after:basis-0 md:after:content-['']"
        }
      >
        {frames.map((id, index) => {
          const entry = getMedia(id);
          const style = { '--r': mediaRatioValue(entry.ratio) } as CSSProperties;
          const number = String(index + 1).padStart(2, '0');
          return (
            <li
              key={id}
              data-frame
              data-extra={index >= ALBUM_UI.phoneVisible ? '' : undefined}
              style={style}
              className={
                'min-w-0 rounded-control ' +
                'md:max-w-[calc(var(--r)*var(--row-max))] md:[flex:var(--r)_1_calc(var(--r)*var(--row-h))] ' +
                // Phones: 4:5 crops (the plate box carries its ratio inline, hence the important flag).
                'max-md:[&_.plate]:!aspect-[4/5] [&_.plate]:rounded-control ' +
                (index >= ALBUM_UI.phoneVisible ? 'max-md:group-data-[collapsed]/sheet:hidden' : '')
              }
            >
              <FramePicture id={id} />
              <p className="m-0 mt-1.5 flex items-baseline gap-2">
                <span className="shrink-0 font-data text-[0.75rem] leading-none text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
                  <VisuallyHidden>Frame </VisuallyHidden>
                  {number}
                </span>
                {entry.caption ? (
                  <span className="min-w-0 font-body text-caption italic text-ink-muted [text-wrap:pretty]">
                    {entry.caption}
                  </span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </ContactSheetReveal>
  );
}
