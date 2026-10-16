import Link from 'next/link';
import type { ReactNode } from 'react';
import { ACTIVITIES, type Activity, type ActivityId } from '@/entities/activity';
import { formatAltitude, getExpedition, getWaypoint } from '@/entities/expedition';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { DISCIPLINE_INTRO, MOUNTAIN_PLATES, type MountainPlate } from '../config/content';
import { DisciplineGlyph } from './plates';
import { AltitudeStrip } from './sections/AltitudeStrip';
import { DisciplinePlate } from './sections/DisciplinePlate';
import { JumpLink } from './sections/JumpLink';
import { TrainingLog, type TrainingRow } from './sections/TrainingLog';

const LINK =
  'rounded-control text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2';

const DISCIPLINES: readonly Activity[] = ACTIVITIES.filter((activity) => activity.group === 'discipline');

function toRow(activity: Activity): TrainingRow {
  return {
    id: activity.id,
    name: activity.name,
    line: activity.line,
    fact: activity.fact,
    soon: activity.status === 'soon',
    href: activity.href,
    glyph: <DisciplineGlyph id={activity.id} size={24} />,
  };
}

/** Spot height of a mountain plate, read from `entities/expedition` (hidden where the waypoint says so, Q-52). */
function spotHeight(plate: MountainPlate): { text: string; approx: boolean } | null {
  if (!plate.spot) return null;
  const waypoint = getWaypoint(getExpedition(plate.spot.expedition), plate.spot.waypoint);
  if (!waypoint || waypoint.altitudeM === undefined || waypoint.showAltitude === false) return null;
  return { text: formatAltitude(waypoint.altitudeM), approx: Boolean(waypoint.approx) };
}

/** A small survey triangle before a spot height (§B.4.3). */
function SurveyTriangle() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 10 9" className="mr-1.5 inline-block size-2.5 align-baseline">
      <path d="M5 0.8 9.2 8.2H0.8Z" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
}

function MountainCard({ plate }: { plate: MountainPlate }) {
  const spot = spotHeight(plate);
  const samePage = plate.href.startsWith('#');
  const title = samePage ? (
    <JumpLink targetId={plate.href.slice(1)} className={LINK}>
      {plate.title}
    </JumpLink>
  ) : (
    <Link href={plate.href} className={LINK}>
      {plate.title}
    </Link>
  );
  return (
    <li className="w-[min(320px,80vw)] shrink-0 snap-start">
      <MediaSlot id={plate.slotId} ratio="3:2" caption="none" sizes="320px" />
      <div className="mt-3 flex flex-col gap-1">
        <h3 className="m-0 font-display text-title font-semibold text-ink [text-wrap:balance]">{title}</h3>
        {spot ? (
          <p className="m-0 font-display text-ui font-semibold text-ink [--wdth:75] [font-variant-numeric:tabular-nums_lining-nums]">
            <SurveyTriangle />
            {spot.approx ? (
              <>
                <span aria-hidden="true">~</span>
                <VisuallyHidden>about </VisuallyHidden>
              </>
            ) : null}
            {spot.text}
          </p>
        ) : null}
        <p className="m-0 font-body text-ui text-ink-muted [text-wrap:pretty]">{plate.line}</p>
        {/* The deck's category is a log value after the caption, never an eyebrow above the title (§A.4). */}
        <p className="m-0 font-body text-caption italic text-ink-muted">{plate.category}</p>
      </div>
    </li>
  );
}

/** Mobile training list: each row carries its own 160 px plate beside the text; no sticky plate. */
function TrainingListCompact({ plates }: { plates: Readonly<Partial<Record<ActivityId, ReactNode>>> }) {
  return (
    <div className="journal-grid mt-16">
      <ul
        aria-label={DISCIPLINE_INTRO.logLabel}
        className="col-[content-start/content-end] m-0 flex list-none flex-col border-t border-line p-0"
      >
        {DISCIPLINES.map((activity) => (
          <li
            key={activity.id}
            className="grid grid-cols-[minmax(0,1fr)_10rem] items-start gap-4 border-b border-line py-5"
          >
            <div className="flex flex-col gap-1">
              <span aria-hidden="true" className="text-ink-muted">
                <DisciplineGlyph id={activity.id} size={24} />
              </span>
              <h3 className="m-0 font-display text-title font-semibold text-ink">
                {activity.name}
                {activity.status === 'soon' ? ' ' : null}
                {activity.status === 'soon' ? (
                  <span className="ml-1 font-body text-caption font-normal italic text-ink-muted">
                    {DISCIPLINE_INTRO.soonLabel}
                  </span>
                ) : null}
              </h3>
              <p className="m-0 font-body text-ui text-ink-muted [text-wrap:pretty]">{activity.line}</p>
              {activity.fact ? <p className="m-0 font-data text-caption text-ink">{activity.fact}</p> : null}
              {activity.href ? (
                <Link href={activity.href} className={`${LINK} mt-1 self-start font-body text-ui`}>
                  {DISCIPLINE_INTRO.trekLinkLabel}
                </Link>
              ) : null}
            </div>
            {plates[activity.id]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * `#athletics`: Discipline (§G.2, [S-CH5-LIFE], [S-LIFE-DISCIPLINE]). Intro spread, the training log (a sticky
 * plate on desktop, a plate per row on mobile) and the altitude strip of mountain plates.
 */
export function AthleticsSection() {
  const stickyPlates: Partial<Record<ActivityId, ReactNode>> = {};
  const rowPlates: Partial<Record<ActivityId, ReactNode>> = {};
  for (const activity of DISCIPLINES) {
    stickyPlates[activity.id] = <DisciplinePlate activity={activity} variant="sticky" />;
    rowPlates[activity.id] = <DisciplinePlate activity={activity} variant="row" />;
  }

  return (
    <section id="athletics" aria-labelledby="athletics-title" className="pt-32 lg:pt-48">
      <Spread
        as="div"
        plateSpan="none"
        heading={
          <ChapterHeader as="h2" id="athletics-title">
            {DISCIPLINE_INTRO.title}
          </ChapterHeader>
        }
      >
        <div className="flex max-w-measure flex-col gap-4 font-body text-body text-ink">
          {DISCIPLINE_INTRO.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="m-0 [text-wrap:pretty]">
              {paragraph}
            </p>
          ))}
        </div>
      </Spread>

      <div className="hidden lg:block">
        <TrainingLog
          rows={DISCIPLINES.map(toRow)}
          plates={stickyPlates}
          label={DISCIPLINE_INTRO.logLabel}
          soonLabel={DISCIPLINE_INTRO.soonLabel}
          linkLabel={DISCIPLINE_INTRO.trekLinkLabel}
        />
      </div>
      <div className="lg:hidden">
        <TrainingListCompact plates={rowPlates} />
      </div>

      <div className="mt-24 lg:mt-32">
        <AltitudeStrip label={DISCIPLINE_INTRO.stripLabel}>
          {MOUNTAIN_PLATES.map((plate) => (
            <MountainCard key={plate.id} plate={plate} />
          ))}
        </AltitudeStrip>
      </div>
    </section>
  );
}
