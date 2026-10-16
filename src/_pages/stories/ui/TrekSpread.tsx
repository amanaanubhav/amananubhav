import { getExpedition } from '@/entities/expedition';
import { STORIES } from '@/entities/story';
import { ElevationProfile } from '@/shared/ui/charts';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import type { TrekCopy } from '../config/treks';
import { isSlotShown } from '../lib/media';
import { plottedCount, trekProfilePoints, trekProfileText } from '../lib/trek-profile';
import { ReadFieldNoteButton } from './ReadFieldNoteButton';
import { trekLog } from './trek-log';

/** Row plates sit under the text at >= 1024 px (cols 4-12); up to four across on wide screens. */
const ROW_SIZES = '(min-width: 1280px) 22vw, (min-width: 640px) 50vw, 100vw';
/** Wide-screen column count by how many plates the row holds (two stay in two columns). */
const ROW_COLUMNS: Readonly<Record<number, string>> = { 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4' };

/**
 * One trek spread (§G.4): thin-air h2 from the high point, the field log, the story beat's first
 * paragraph, "Read the journal entry" when the story is published, the compact elevation profile, the
 * lead plates beside the text, then the trek's other plates and clips in a row.
 */
export function TrekSpread({ trek }: { trek: TrekCopy }) {
  const exp = getExpedition(trek.expeditionId);
  const story = exp.storyId ? STORIES.find((item) => item.id === exp.storyId) : undefined;
  const titleId = `${trek.id}-title`;
  const leadSlots = trek.leadSlots.filter(isSlotShown);
  const rowSlots = trek.rowSlots.filter(isSlotShown);
  const points = trekProfilePoints(exp);
  const profile = plottedCount(points) > 1 ? trekProfileText(exp) : null;
  const callouts = new Set(trek.calloutSlots ?? []);

  return (
    <section id={trek.id} aria-labelledby={titleId} tabIndex={-1} className="focus:outline-none">
      <Spread
        as="div"
        heading={
          <ChapterHeader as="h2" id={titleId} altitudeM={exp.highPoint.altitudeM}>
            {trek.headline}
          </ChapterHeader>
        }
        log={<Log items={trekLog(exp)} label={`${exp.shortName} field log`} />}
        plateSpan={leadSlots.length > 0 ? 'standard' : 'none'}
        plate={
          leadSlots.length > 0 ? (
            <div className="flex flex-col gap-8">
              {leadSlots.map((id) => (
                <MediaSlot key={id} id={id} layout="standard" ratio="3:2" callouts={callouts.has(id)} />
              ))}
            </div>
          ) : undefined
        }
      >
        <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{trek.lead}</p>
        {story ? (
          <div className="mt-6">
            <ReadFieldNoteButton storyId={story.id} />
          </div>
        ) : trek.noteComing ? (
          <p className="mb-0 mt-6 font-body text-caption italic text-ink-muted">{trek.noteComing}</p>
        ) : null}
        {profile ? (
          <ElevationProfile
            className="mt-12"
            variant="compact"
            draw="once"
            showData
            points={points}
            title={profile.title}
            desc={profile.desc}
          />
        ) : null}
      </Spread>

      {rowSlots.length > 0 ? (
        <div className="journal-grid mt-12 lg:mt-16">
          <ul
            role="list"
            className={`col-[content-start/content-end] m-0 grid list-none grid-cols-1 items-start gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:col-[5/span_9] lg:pr-24 ${ROW_COLUMNS[Math.min(rowSlots.length, 4)] ?? ''}`}
          >
            {rowSlots.map((id) => (
              <li key={id} className="min-w-0">
                <MediaSlot id={id} layout="standard" sizes={ROW_SIZES} callouts={callouts.has(id)} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
