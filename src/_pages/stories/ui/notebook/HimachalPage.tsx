import { getExpedition } from '@/entities/expedition';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { HIMACHAL_COPY, NOTEBOOK_COPY } from '../../config/treks';
import { entryHeadingId, pageHeadingId } from '../../lib/notebook-pages';
import { locatorSketch } from '../../lib/route-sketch';
import { highPointValue } from '../trek-log';
import { RouteSketch } from './RouteSketch';
import { StopList } from './StopList';
import styles from './notebook.module.css';

const PAGE_ID = 'himachal';

/**
 * The Himachal page (NOTEBOOK-DESIGN §2.5): the left page is the `locator` (the three trailheads as marks 1 to 3) and
 * a list of the three treks with their high points; the right page is the h3, the Himachal log and three entries,
 * each an `<article id>` (the old `#triund` anchors) with an h4, its region and, once Q-55 is answered, its one-line
 * note (undefined renders nothing). Photos collapse while pending.
 */
export function HimachalPage() {
  const high = getExpedition(HIMACHAL_COPY.highPointExpedition).highPoint;
  const treks = HIMACHAL_COPY.treks.map((item) => ({ ...item, exp: getExpedition(item.expeditionId) }));
  const geometry = locatorSketch(treks.map(({ exp }) => exp));

  return (
    <>
      <header className={styles.head}>
        <ChapterHeader
          as="h3"
          size="h3"
          id={pageHeadingId(PAGE_ID)}
          altitudeM={high.altitudeM}
          className="focus:outline-none"
        >
          {HIMACHAL_COPY.headline}
        </ChapterHeader>
        <Log
          layout="strip"
          label="Himachal field log"
          items={[
            { key: 'region', value: 'Himachal Pradesh, India', mono: false },
            { key: 'treks', value: treks.length },
            { key: 'high point', value: highPointValue(high.altitudeM, high.name), approx: high.approx },
          ]}
        />
      </header>

      <div className={styles.route}>
        <figure className={styles.figure}>
          <RouteSketch
            geometry={geometry}
            idPrefix={`nb-${PAGE_ID}-sketch`}
            title={NOTEBOOK_COPY.locatorTitle}
            desc={`The trailheads of ${treks
              .map(({ exp }) => exp.shortName)
              .join(', ')
              .replace(/, ([^,]*)$/, ' and $1')}, numbered 1 to ${treks.length} and placed approximately.`}
          />
          <figcaption className="m-0 mt-3 font-body text-caption italic text-ink-muted">
            {NOTEBOOK_COPY.caption.locator}
          </figcaption>
        </figure>
        <StopList
          label={NOTEBOOK_COPY.himachalStopsLabel}
          rows={treks.map(({ exp }, i) => ({
            number: i + 1,
            name: exp.shortName,
            altitudeM: exp.highPoint.altitudeM,
            approx: exp.highPoint.approx,
          }))}
        />
      </div>

      <ul role="list" className={styles.entries}>
        {treks.map(({ exp, slot, note }) => {
          const headingId = entryHeadingId(exp.id);
          return (
            <li key={exp.id}>
              <article id={exp.id} aria-labelledby={headingId} className={styles.entry}>
                <div className="w-24 shrink-0 sm:w-36">
                  <MediaSlot
                    id={slot}
                    layout="thumb"
                    caption="none"
                    sizes="(min-width: 640px) 144px, 96px"
                    className="max-w-24 sm:max-w-36"
                  />
                </div>
                <div className="min-w-0">
                  <h4
                    id={headingId}
                    tabIndex={-1}
                    className={`${styles.entryHeading} m-0 font-display text-lead font-semibold text-ink`}
                  >
                    {exp.shortName}
                  </h4>
                  <Log
                    className="mt-1"
                    layout="strip"
                    label={`${exp.shortName} field log`}
                    items={[
                      { key: 'region', value: exp.region, mono: false },
                      { key: 'when', value: exp.when },
                    ]}
                  />
                  {note ? <p className="m-0 mt-2 font-body text-ui text-ink">{note}</p> : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}
