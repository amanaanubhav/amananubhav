import { ChapterHeader } from '@/shared/ui/chapter-header';
import { JournalGrid, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { RIDES, ROAD_CLIP_SLOT, ROAD_COPY, ROAD_PHOTO_SLOTS } from '../../config/content';
import { RoadSheet } from '../plates';

/** "Two wheels, open road." ([S-LIFE-ROAD]): the G-10 road sheet, then the road photos. */
export function RoadSpread() {
  return (
    <div className="mt-32 lg:mt-48">
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
      <JournalGrid className="mt-12">
        <div className="col-[content-start/content-end] grid gap-8 md:grid-cols-2 lg:col-[5/span_9]">
          {ROAD_PHOTO_SLOTS.map((id) => (
            <MediaSlot key={id} id={id} layout="album" />
          ))}
          <MediaSlot id={ROAD_CLIP_SLOT} layout="album" />
        </div>
      </JournalGrid>
    </div>
  );
}
