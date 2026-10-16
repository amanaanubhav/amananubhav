import { ChapterHeader } from '@/shared/ui/chapter-header';
import { JournalGrid, Spread } from '@/shared/ui/journal';
import { ALBUM_COPY, ALBUM_FRAMES } from '../config/content';
import { CircleSpread } from './sections/CircleSpread';
import { ContactSheet } from './sections/ContactSheet';
import { RoadSpread } from './sections/RoadSpread';

/**
 * `#gallery`: Field album (§G.2, [S-LIFE-GALLERY]): the contact sheet of existing frames, then two
 * sub-spreads (road, circle) under the same id.
 */
export function GallerySection() {
  return (
    <section id="gallery" aria-labelledby="gallery-title" className="pb-32 pt-32 lg:pb-48 lg:pt-48">
      <Spread
        as="div"
        plateSpan="none"
        heading={
          <ChapterHeader as="h2" id="gallery-title">
            {ALBUM_COPY.title}
          </ChapterHeader>
        }
      >
        <p className="m-0 max-w-measure font-body text-lead text-ink [text-wrap:pretty]">{ALBUM_COPY.lead}</p>
      </Spread>

      <JournalGrid className="mt-16 lg:mt-24">
        <div className="col-[content-start/content-end] lg:col-[2/span_11]">
          <ContactSheet frames={ALBUM_FRAMES} label={ALBUM_COPY.sheetLabel} />
        </div>
      </JournalGrid>

      <RoadSpread />
      <CircleSpread />
    </section>
  );
}
