import { JournalGrid } from '@/shared/ui/journal';
import { ALBUM_COPY, ALBUM_FRAMES, SECTION_STATEMENTS } from '../config/content';
import { sectionLabel } from '../config/sections';
import { CircleSpread } from './sections/CircleSpread';
import { ContactSheet } from './sections/ContactSheet';
import { RoadSpread } from './sections/RoadSpread';

/**
 * `#gallery`: Field album (FINAL-DESIGN §4.6). h2 (the rail label) and the statement, the contact sheet of the twelve
 * existing frames (visually hidden h3), then the band: the road (with the road sheet) and the people, two columns
 * from 1024 px (7 / 5), stacked below. Motion: frames develop once and the road sheet draws once; both static under
 * reduced motion.
 */
export function GallerySection() {
  return (
    <section id="gallery" aria-labelledby="gallery-h" className="scroll-mt-[calc(var(--nav-clear)+16px)]">
      <JournalGrid>
        <div className="col-[content-start/content-end] min-w-0">
          <h2 id="gallery-h" tabIndex={-1} className="m-0 font-display text-h2 font-bold text-ink [text-wrap:balance] focus:outline-none">
            {sectionLabel('gallery')}
          </h2>
          <p className="m-0 mt-4 max-w-[30em] font-body text-lead text-ink [text-wrap:pretty]">
            {SECTION_STATEMENTS.gallery}
          </p>

          <h3 id="gallery-sheet-h" className="sr-only">
            {ALBUM_COPY.sheetLabel}
          </h3>
          <div className="mt-8 lg:mt-12">
            <ContactSheet frames={ALBUM_FRAMES} labelledBy="gallery-sheet-h" />
          </div>

          <div className="mt-16 grid gap-12 lg:mt-[72px] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12">
            <RoadSpread />
            <CircleSpread />
          </div>
        </div>
      </JournalGrid>
    </section>
  );
}
