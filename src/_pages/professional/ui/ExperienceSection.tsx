import type { ExperienceEntry } from '@/entities/experience';
import type { Education } from '@/entities/profile';
import type { MediaSlotId } from '@/shared/config';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { EXPERIENCE_COPY } from '../config/copy';
import { educationDates, experienceDates } from '../lib/dates';
import type { DatePart } from '../lib/dates';
import { ExperienceTrack } from './ExperienceTrack';
import { StackList } from './StackList';

const TITLE_ID = 'experience-title';

/**
 * Optional plates (§G.3); they render nothing until supplied or permitted (§E.3). The lead plate sits at the top of
 * the entry, over its heading (M-WORK-01 on Atlys); the others sit beside it (M-PROOF-GDG beside GDG).
 */
const ENTRY_LEAD_PLATE: Readonly<Record<string, MediaSlotId>> = {
  atlys: 'M-WORK-01',
};
const ENTRY_PLATES: Readonly<Record<string, readonly MediaSlotId[]>> = {
  atlys: ['M-PRO-ATLYS-01'],
  'gdg-kiit': ['M-PROOF-GDG'],
};

interface TimelineRow {
  key: string;
  title: string;
  org: string;
  dates: readonly DatePart[];
  mode?: string;
  stack?: readonly string[];
  detail?: string;
  bullets?: readonly string[];
  leadPlate?: MediaSlotId;
  plates?: readonly MediaSlotId[];
}

function fromExperience(entry: ExperienceEntry, index: number): TimelineRow {
  const key = entry.id ?? `experience-${index}`;
  return {
    key,
    title: entry.role,
    org: entry.org,
    dates: experienceDates(entry.time, entry.start, entry.end),
    mode: entry.mode,
    stack: entry.stack,
    detail: entry.detail,
    bullets: entry.bullets,
    leadPlate: ENTRY_LEAD_PLATE[key],
    plates: ENTRY_PLATES[key],
  };
}

function fromEducation(entry: Education, index: number): TimelineRow {
  return {
    key: `education-${index}`,
    title: entry.degree,
    org: entry.institution,
    dates: educationDates(entry.year),
    detail: entry.focus ? `Focus: ${entry.focus}.` : undefined,
  };
}

function Dates({ parts }: { parts: readonly DatePart[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 ? ' to ' : null}
          {part.dateTime ? <time dateTime={part.dateTime}>{part.text}</time> : part.text}
        </span>
      ))}
    </>
  );
}

function TimelineEntry({ row }: { row: TimelineRow }) {
  const headingId = `entry-${row.key}`;
  const log: LogEntry[] = [
    { key: 'when', value: row.dates.length > 0 ? <Dates parts={row.dates} /> : undefined },
    { key: 'mode', value: row.mode },
    { key: 'stack', value: row.stack && row.stack.length > 0 ? <StackList items={row.stack} /> : undefined },
  ];
  const hasPlates = Boolean(row.plates && row.plates.length > 0);

  return (
    <li data-entry="">
      <article
        aria-labelledby={headingId}
        className="grid pl-6 lg:grid-cols-12 lg:gap-x-[var(--gutter)] lg:pl-0"
      >
        <div className="lg:col-[4/span_5] lg:row-start-1">
          {row.leadPlate ? (
            <div className="mb-6 empty:hidden">
              <MediaSlot id={row.leadPlate} />
            </div>
          ) : null}
          <header>
            <ChapterHeader as="h3" id={headingId}>
              <span data-entry-mark="">{row.title}</span>
            </ChapterHeader>
            <p className="m-0 mt-1 font-body text-body font-medium text-ink-muted">{row.org}</p>
          </header>
        </div>

        <div className="mt-3 lg:col-[1/span_3] lg:row-[1/span_2] lg:mt-0 lg:pt-1.5 lg:text-right">
          <Log items={log} />
        </div>

        <div className="mt-4 lg:col-[4/span_5] lg:row-start-2">
          {row.detail ? (
            <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{row.detail}</p>
          ) : null}
          {row.bullets && row.bullets.length > 0 ? (
            <ul className="m-0 mt-4 flex max-w-measure list-disc flex-col gap-2 pl-5 font-body text-body text-ink marker:text-ink-muted">
              {row.bullets.map((bullet) => (
                <li key={bullet} className="[text-wrap:pretty]">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {hasPlates ? (
          <div className="mt-6 flex flex-col gap-6 empty:hidden lg:col-[10/span_3] lg:row-[1/span_2] lg:mt-0">
            {row.plates?.map((id) => <MediaSlot key={id} id={id} />)}
          </div>
        ) : null}
      </article>
    </li>
  );
}

/**
 * §G.3 #experience: a logbook timeline, newest first, of EXPERIENCE then PROFILE.education ([S-PRO-EDU]).
 * Server-rendered; the spine fill and the signal tick are the only client parts (ExperienceTrack).
 */
export function ExperienceSection({
  experience,
  education,
}: {
  experience: readonly ExperienceEntry[];
  education: readonly Education[];
}) {
  const rows = [...experience.map(fromExperience), ...education.map(fromEducation)];

  return (
    <section id="experience" aria-labelledby={TITLE_ID} className="journal-grid mt-32 lg:mt-48">
      <div className="col-[content-start/content-end] lg:col-[5/span_7]">
        <ChapterHeader as="h2" id={TITLE_ID}>
          {EXPERIENCE_COPY.title}
        </ChapterHeader>
      </div>

      <div className="col-[content-start/content-end] mt-12 lg:mt-20">
        <ExperienceTrack>
          <ol aria-label={EXPERIENCE_COPY.listLabel} className="m-0 flex list-none flex-col gap-24 p-0 lg:gap-32">
            {rows.map((row) => (
              <TimelineEntry key={row.key} row={row} />
            ))}
          </ol>
        </ExperienceTrack>
      </div>
    </section>
  );
}
