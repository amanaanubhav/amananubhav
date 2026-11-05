import { ChapterHeader } from '@/shared/ui/chapter-header';
import { isMediaSlotShown, MediaSlot } from '@/shared/ui/media-slot';
import { CIRCLE_COPY, CIRCLE_SLOTS } from '../../config/content';

/**
 * "The people who say yes." (FINAL-DESIGN §4.6): the right column of the album's band. First names only; the circle
 * photos stay hidden until the friends consent (Q-60), so today this is the heading and the paragraph.
 */
export function CircleSpread() {
  const photosShown = CIRCLE_SLOTS.some((id) => isMediaSlotShown(id, 'album'));
  return (
    <article aria-labelledby="circle-h" className="grid min-w-0 content-start gap-4">
      <ChapterHeader as="h3" id="circle-h">
        {CIRCLE_COPY.title}
      </ChapterHeader>
      <p className="m-0 max-w-[56ch] font-body text-body text-ink [text-wrap:pretty]">{CIRCLE_COPY.body}</p>
      {photosShown ? (
        <div className="mt-2 grid gap-3 empty:hidden sm:grid-cols-2 lg:grid-cols-1">
          {CIRCLE_SLOTS.map((id) => (
            <MediaSlot key={id} id={id} layout="album" />
          ))}
        </div>
      ) : null}
    </article>
  );
}
