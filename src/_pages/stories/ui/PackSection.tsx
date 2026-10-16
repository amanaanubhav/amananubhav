import { getExpedition } from '@/entities/expedition';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { PACK_COPY } from '../config/treks';
import { isSlotShown } from '../lib/media';
import { PackPlate } from './PackPlate';

const PLATE_SIZES = '(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 100vw';

/** `#pack` (§G.4): [S-EXP-GEAR], with the G-08 diagram beside the flat-lay photo slot (callouts once supplied). */
export function PackSection() {
  const packKg = getExpedition('annapurna').packKg;
  const showPhoto = isSlotShown(PACK_COPY.photoSlot);

  return (
    <section id="pack" aria-labelledby="pack-title" tabIndex={-1} className="focus:outline-none">
      <Spread
        as="div"
        plateSpan="wide"
        heading={
          <ChapterHeader as="h2" id="pack-title">
            {PACK_COPY.headline}
          </ChapterHeader>
        }
        log={
          <Log
            label="Pack log"
            items={[
              { key: 'pack', value: packKg, unit: 'kg' },
              { key: 'categories', value: PACK_COPY.categories.length },
              { key: 'trek', value: 'Annapurna Circuit', mono: false },
            ]}
          />
        }
        plate={
          <div className="grid items-start gap-8 md:grid-cols-2">
            <PackPlate />
            {showPhoto ? <MediaSlot id={PACK_COPY.photoSlot} layout="wide" sizes={PLATE_SIZES} callouts /> : null}
          </div>
        }
      >
        <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{PACK_COPY.body}</p>
      </Spread>
    </section>
  );
}
