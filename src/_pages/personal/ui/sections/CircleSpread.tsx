import { ChapterHeader } from '@/shared/ui/chapter-header';
import { JournalGrid, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { CIRCLE_COPY, CIRCLE_SLOTS } from '../../config/content';

/** "The people who say yes." ([S-LIFE-CIRCLE]): first names only; friends' photos only with consent (Q-60). */
export function CircleSpread() {
  return (
    <div className="mt-32 lg:mt-48">
      <Spread
        as="article"
        labelledBy="circle-title"
        heading={
          <ChapterHeader as="h3" id="circle-title" size="h3">
            {CIRCLE_COPY.title}
          </ChapterHeader>
        }
        plate={<MediaSlot id="M-CIRCLE-G5" ratio="4:5" className="max-w-[420px]" />}
      >
        <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{CIRCLE_COPY.body}</p>
      </Spread>
      <JournalGrid className="mt-12 empty:hidden">
        {CIRCLE_SLOTS.map((id) => (
          <MediaSlot key={id} id={id} className="col-[content-start/content-end] lg:col-[5/span_5]" />
        ))}
      </JournalGrid>
    </div>
  );
}
