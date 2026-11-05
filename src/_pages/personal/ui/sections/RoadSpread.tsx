import { ChapterHeader } from '@/shared/ui/chapter-header';
import { isMediaSlotShown, MediaSlot } from '@/shared/ui/media-slot';
import { RIDES, ROAD_CLIP_SLOT, ROAD_COPY, ROAD_PHOTO_SLOTS } from '../../config/content';
import { RoadSheet } from '../plates';

/**
 * "Two wheels, open road." (FINAL-DESIGN §4.6): the left column of the album's band. The road sheet (G-10, rides in
 * `accent-2`, drawn once on view) on a steel panel, then the road photos, which render nothing until supplied (the
 * registry's own pending rule; Q-59 names the bike and the favourite route).
 */
export function RoadSpread() {
  const photos = [...ROAD_PHOTO_SLOTS, ROAD_CLIP_SLOT];
  const photosShown = photos.some((id) => isMediaSlotShown(id, 'album'));
  return (
    <article aria-labelledby="road-h" className="grid min-w-0 content-start gap-4">
      <ChapterHeader as="h3" id="road-h">
        {ROAD_COPY.title}
      </ChapterHeader>
      <p className="m-0 max-w-[56ch] font-body text-body text-ink [text-wrap:pretty]">{ROAD_COPY.body}</p>
      <figure className="m-0 mt-2 overflow-hidden rounded-panel border bg-surface panel-steel">
        <RoadSheet rides={RIDES} />
      </figure>
      {photosShown ? (
        <div className="mt-2 grid gap-3 empty:hidden sm:grid-cols-2">
          {photos.map((id) => (
            <MediaSlot key={id} id={id} layout="album" />
          ))}
        </div>
      ) : null}
    </article>
  );
}
