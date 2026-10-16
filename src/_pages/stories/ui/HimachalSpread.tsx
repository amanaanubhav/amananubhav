import { getExpedition } from '@/entities/expedition';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { HIMACHAL_COPY } from '../config/treks';
import { isSlotShown } from '../lib/media';
import { highPointValue } from './trek-log';

const CARD_SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw';

/**
 * `#himachal` (§G.4): one spread with three short entries (Triund, Kheerganga, Yulla Kanda), each an h3
 * with its name, region and high point. The deck's one-line notes are [TBD Q-55] and stay hidden.
 */
export function HimachalSpread() {
  const titleId = `${HIMACHAL_COPY.id}-title`;
  const high = getExpedition(HIMACHAL_COPY.highPointExpedition).highPoint;
  const treks = HIMACHAL_COPY.treks.map((item) => ({ ...item, exp: getExpedition(item.expeditionId) }));

  return (
    <section id={HIMACHAL_COPY.id} aria-labelledby={titleId} tabIndex={-1} className="focus:outline-none">
      <Spread
        as="div"
        plateSpan="none"
        heading={
          <ChapterHeader as="h2" id={titleId} altitudeM={high.altitudeM}>
            {HIMACHAL_COPY.headline}
          </ChapterHeader>
        }
        log={
          <Log
            label="Himachal field log"
            items={[
              { key: 'region', value: 'Himachal Pradesh, India', mono: false },
              { key: 'treks', value: treks.length },
              { key: 'high point', value: highPointValue(high.altitudeM, high.name), approx: high.approx },
            ]}
          />
        }
      />

      <div className="journal-grid mt-12 lg:mt-16">
        <ul
          role="list"
          className="col-[content-start/content-end] m-0 grid list-none grid-cols-1 gap-x-6 gap-y-12 p-0 sm:grid-cols-3 lg:col-[5/span_9] lg:pr-24"
        >
          {treks.map(({ exp, slot }) => {
            const headingId = `himachal-${exp.id}`;
            return (
              <li key={exp.id} className="flex min-w-0 flex-col">
                <article aria-labelledby={headingId} className="flex flex-col">
                  {isSlotShown(slot) ? (
                    <MediaSlot id={slot} layout="standard" sizes={CARD_SIZES} caption="short" className="mb-5" />
                  ) : null}
                  <ChapterHeader as="h3" id={headingId}>
                    {exp.shortName}
                  </ChapterHeader>
                  <Log
                    className="mt-2"
                    layout="strip"
                    label={`${exp.shortName} field log`}
                    items={[
                      { key: 'region', value: exp.region, mono: false },
                      {
                        key: 'high point',
                        value: highPointValue(exp.highPoint.altitudeM, ''),
                        approx: exp.highPoint.approx,
                      },
                      { key: 'when', value: exp.when },
                    ]}
                  />
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
