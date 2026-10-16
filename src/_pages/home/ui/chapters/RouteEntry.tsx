import type { ReactNode } from 'react';

import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Trail, type LogEntry } from '@/shared/ui/journal';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import { ENTRY_LOGS, ENTRY_PLACE_KEY, getStoryPoint, type HomeEntryId } from '../../config/copy';
import { HOME_WAYPOINTS, type HomeWaypoint } from '../../config/sections';
import { ENTRY_TRAILS } from '../../config/trail';

export interface RouteEntryProps {
  id: HomeEntryId;
  /** Links, actions and G-21 extras under the body and trail. */
  extras?: ReactNode;
  /** The tier-0 plate (rendered inside `.motion-static`). */
  staticPlate?: ReactNode;
}

const NUMBER = new Intl.NumberFormat('en');

/** "Chame ~2,670 m": the place in the body face, the altitude in the data face, read "about" when approximate. */
function CampValue({ wp }: { wp: HomeWaypoint }) {
  return (
    <>
      {wp.name}
      {wp.altitudeM !== undefined ? (
        <>
          {' '}
          <span className="whitespace-nowrap font-data [font-variant-numeric:tabular-nums_slashed-zero]">
            {wp.approx ? <span aria-hidden="true">~</span> : null}
            {wp.approx ? <VisuallyHidden>about </VisuallyHidden> : null}
            {NUMBER.format(wp.altitudeM)}
            <span className="ml-[0.2em] text-[0.875em] text-ink-muted">m</span>
          </span>
        </>
      ) : null}
    </>
  );
}

/**
 * The one waypoint row entries 1 to 5 start their log with: the camp (or pass) and its altitude together
 * ("camp  Chame ~2,670 m"). The stage legend shows the place only and the rail's altimeter the number,
 * so each fact is stated once per layer.
 */
function placeRows(id: HomeEntryId): LogEntry[] {
  const key = ENTRY_PLACE_KEY[id];
  return key ? [{ key, value: <CampValue wp={HOME_WAYPOINTS[id]} />, mono: false }] : [];
}

/*
 * Two layouts are both in the SSR HTML (§C.4). Staged (`.motion-stage` visible): entries sit in content
 * cols 1-5 beside the sticky relief, each at least one viewport tall and vertically centred. Static
 * (`html[data-motion=off]` or `[data-lite='1']`): the list widens to 10 columns (content col 10 is the last
 * one clear of the fixed rail, §J.3) and each entry carries its own plate in cols 7-10. Below 1024 px both are one column: heading, log strip, body, trail, plate.
 */
const ARTICLE_GRID =
  "lg:grid lg:grid-cols-5 lg:gap-x-[var(--gutter)] lg:[html[data-motion=off]_&]:grid-cols-10 lg:[html[data-lite='1']_&]:grid-cols-10";

/**
 * One entry of `#meander`: an `<li>` segment (for the scroll progress) holding the `<article>` whose id is
 * the rail target. The h2 width comes from the waypoint altitude (thin air, §B.4.4); body and log never animate.
 */
export function RouteEntry({ id, extras, staticPlate }: RouteEntryProps) {
  const point = getStoryPoint(id);
  const wp = HOME_WAYPOINTS[id];
  const titleId = `${id}-title`;
  const trail = ENTRY_TRAILS[id];

  return (
    <li
      data-segment={id}
      className="py-16 md:py-24 lg:flex lg:min-h-svh lg:flex-col lg:justify-center lg:py-24 lg:[html[data-motion=off]_&]:min-h-0 lg:[html[data-lite='1']_&]:min-h-0"
    >
      <article id={id} aria-labelledby={titleId} className={`max-lg:scroll-mt-[42svh] [html[data-motion=off]_&]:scroll-mt-0 [html[data-lite='1']_&]:scroll-mt-0 ${ARTICLE_GRID}`}>
        <div className="lg:col-[1/span_5] lg:row-start-1">
          <ChapterHeader as="h2" id={titleId} altitudeM={wp.altitudeM}>
            {point.subtitle}
          </ChapterHeader>
        </div>

        <div className="mt-4 lg:col-[1/span_2] lg:row-start-2 lg:mt-8">
          <Log items={[...placeRows(id), ...ENTRY_LOGS[id]]} label={`Field log: ${point.title}`} />
        </div>

        <div className="mt-6 lg:col-[3/span_3] lg:row-start-2 lg:mt-8">
          <p className="text-body m-0 max-w-[42ch] text-ink [text-wrap:pretty]">{point.description}</p>
          {trail && trail.length > 0 ? (
            <Trail items={trail} label={`Trail: ${point.title}`} className="mt-6 max-w-[42ch]" />
          ) : null}
          {extras ? <div className="mt-8 flex flex-col items-start gap-6">{extras}</div> : null}
        </div>

        {staticPlate ? (
          <div className="motion-static mt-10 lg:col-[7/span_4] lg:row-[1/span_2] lg:mt-0 lg:self-center">
            {staticPlate}
          </div>
        ) : null}
      </article>
    </li>
  );
}
