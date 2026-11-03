import { ChapterHeader } from '@/shared/ui/chapter-header';
import { JournalGrid, Spread } from '@/shared/ui/journal';
import { isMediaSlotShown, MediaSlot } from '@/shared/ui/media-slot';
import { RIDES, ROAD_CLIP_SLOT, ROAD_COPY, ROAD_PHOTO_SLOTS } from '../../config/content';
import { RoadSheet } from '../plates';

/**
 * "Two wheels, open road." ([S-LIFE-ROAD]): the G-10 road sheet, then the road photos. Pending album frames
 * collapse in production (C-05); the album row is skipped when none of its frames would show.
 */
export function RoadSpread() {
  const albumShown = [...ROAD_PHOTO_SLOTS, ROAD_CLIP_SLOT].some((id) => isMediaSlotShown(id, 'album'));
  return (
    <div className="mt-section">
      <Spread
        as="article"
        labelledBy="road-title"
        plateSpan="wide"
        heading={
          <ChapterHeader as="h3" id="road-title" size="h3">
            {ROAD_COPY.title}
          </ChapterHeader>
        }
        plate={
          <MediaSlot
            id="M-ROAD-MAP"
            layout="wide"
            fill={<RoadSheet rides={RIDES} className="absolute inset-0 h-full w-full" />}
          />
        }
      >
        <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{ROAD_COPY.body}</p>
      </Spread>
      {albumShown ? (
        <JournalGrid className="mt-block">
          <div className="col-[content-start/content-end] grid gap-item empty:hidden md:grid-cols-2 lg:col-[5/span_9]">
            {ROAD_PHOTO_SLOTS.map((id) => (
              <MediaSlot key={id} id={id} layout="album" />
            ))}
            <MediaSlot id={ROAD_CLIP_SLOT} layout="album" />
          </div>
        </JournalGrid>
      ) : null}
    </div>
  );
}
