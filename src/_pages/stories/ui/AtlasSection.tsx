import { EXPEDITIONS, getExpeditionStats } from '@/entities/expedition';
import { getMedia } from '@/shared/config';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, TrailMark, type LogEntry } from '@/shared/ui/journal';
import { ContourSheet } from '@/shared/ui/map';
import { MediaSlot } from '@/shared/ui/media-slot';
import { ATLAS_SHEET } from '../config/atlas.generated';
import { ATLAS_COPY } from '../config/treks';
import { buildAtlasPins, type AtlasPinData } from '../lib/atlas-pins';
import { AtlasPins } from './AtlasPins';
import { JumpLink } from './JumpLink';
import { highPointValue } from './trek-log';

const nf = new Intl.NumberFormat('en');
const PINS = buildAtlasPins(EXPEDITIONS);
const STATS = getExpeditionStats(EXPEDITIONS);
const ATLAS_ALT = getMedia('M-ALT-02').alt;

/** The atlas log (§G.4), computed from the data so it updates as the expeditions fill in. */
const ATLAS_LOG: LogEntry[] = [
  { key: 'high point', value: STATS.highestM > 0 ? highPointValue(STATS.highestM, STATS.highestName) : undefined },
  { key: 'longest', value: STATS.longestKm, unit: 'km' },
  { key: 'heaviest pack', value: STATS.heaviestPackKg, unit: 'kg' },
  { key: 'treks logged', value: STATS.treksLogged },
];

function altitudeText(pin: AtlasPinData): string {
  if (typeof pin.altitudeM !== 'number') return pin.highPointName;
  return `${pin.approx ? '~' : ''}${nf.format(pin.altitudeM)} m`;
}

const JOURNEY_LINK =
  'flex min-h-11 items-center gap-3 border-t border-line py-2 text-ink transition-colors duration-hover ' +
  'hover:bg-surface-2 focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal';

/** Below 768 px the primary path to each trek: the same data as the pins, as plain links (§G.4). */
function JourneysList() {
  return (
    <nav aria-labelledby="atlas-journeys" className="md:hidden">
      <h2 id="atlas-journeys" className="m-0 font-display text-title font-semibold text-ink">
        Journeys
      </h2>
      <ol role="list" className="m-0 mt-3 list-none border-b border-line p-0">
        {PINS.map((pin) => (
          <li key={pin.expeditionId}>
            <JumpLink targetId={pin.sectionId} className={JOURNEY_LINK}>
              <TrailMark lane={pin.status === 'upcoming' ? 'planned' : 'summit'} />
              <span className="min-w-0 flex-1 font-body text-ui">{pin.label}</span>
              <span className="font-data text-caption text-ink-muted tabular">
                {pin.status === 'upcoming' ? 'planned, ' : ''}
                {altitudeText(pin)}
              </span>
            </JumpLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** A small key for the pin shapes; shape carries the meaning, never color alone. */
function PinKey() {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-caption italic text-ink-muted">
      <span className="inline-flex items-center gap-2">
        <TrailMark lane="summit" /> done
      </span>
      <span className="inline-flex items-center gap-2">
        <TrailMark lane="planned" /> planned
      </span>
      <span className="hidden md:inline">Select a pin for its journal entry.</span>
    </p>
  );
}

/**
 * `#atlas`, the page hero (§G.4): the h1 and the two [S-CH4-ALTITUDE] paragraphs, the atlas log, and the
 * G-03 atlas with a pin per expedition (the whole 3:2 sheet at every width, so every trailhead from Himachal
 * to Sikkim stays on it; below 768 px the pins are plain marks and the Journeys list comes first).
 * The h1 is never animated (LCP).
 */
export function AtlasSection() {
  return (
    <section
      id="atlas"
      aria-labelledby="atlas-title"
      className="journal-grid gap-y-8 pt-24 md:pt-32 lg:gap-y-12"
    >
      <div className="col-[content-start/content-end] lg:col-[2/span_11]">
        <ChapterHeader as="h1" id="atlas-title">
          {ATLAS_COPY.headline}
        </ChapterHeader>
      </div>

      <div className="col-[content-start/content-end] flex flex-col gap-8 lg:col-[2/span_5] lg:row-start-2">
        <div className="flex max-w-measure flex-col gap-4">
          {ATLAS_COPY.paragraphs.map((text) => (
            <p key={text.slice(0, 24)} className="m-0 font-body text-body text-ink [text-wrap:pretty]">
              {text}
            </p>
          ))}
        </div>
        <Log items={ATLAS_LOG} label="Trek log" layout="auto" className="lg:max-w-[22rem]" />
        <MediaSlot id="M-EXP-SUMMIT-01" layout="standard" className="max-w-[280px]" sizes="280px" />
        <JourneysList />
      </div>

      <figure className="col-[content-start/content-end] m-0 min-w-0 lg:col-[7/span_7] lg:row-start-2 lg:self-start">
        <ContourSheet
          data={ATLAS_SHEET}
          title={ATLAS_ALT}
          desc={`Pins mark the trailheads, west to east: ${PINS.map((pin) => pin.label).join(', ')}.`}
          labels="all"
        >
          <AtlasPins pins={PINS} />
        </ContourSheet>
        <figcaption className="mt-3">
          <PinKey />
        </figcaption>
      </figure>
    </section>
  );
}
