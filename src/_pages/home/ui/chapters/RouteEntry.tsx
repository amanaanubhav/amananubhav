import type { ReactNode } from 'react';

import type { CSSVars } from '@/shared/lib/css';

import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Trail, type LogEntry } from '@/shared/ui/journal';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import { ENTRY_LOGS, ENTRY_PLACE_KEY, getStoryPoint, type HomeEntryId } from '../../config/copy';
import { HOME_WAYPOINTS, type HomeWaypoint } from '../../config/sections';
import { ENTRY_TRAILS } from '../../config/trail';
import styles from '../story/story.module.css';

export interface RouteEntryProps {
  id: HomeEntryId;
  /** Links, actions and G-21 extras under the body and trail. */
  extras?: ReactNode;
  /** The story slot: anchor `at` (s, vh) and the slot's minimum height (vh). */
  slot: StorySlot;
}

export interface StorySlot {
  readonly at: number;
  readonly vh: number;
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
 * Entries sit in content cols 1-5, left of the map's subject (the scene frames the walk at 63.5% of the
 * width). No background, border or panel at any breakpoint: the map recedes softly under each
 * `data-recede` box instead (§9). Over the map only ink is used (muted ink is lifted to ink here), so the
 * text holds 4.5:1 on the receded terrain. Below 1024 px: one column, heading, log, body, trail.
 */
const ARTICLE_GRID = 'lg:grid lg:grid-cols-5 lg:gap-x-[var(--gutter)] [&_.text-ink-muted]:text-ink';

/**
 * One entry of `#meander`: an `<li>` story slot (its height spaces the story, §15.3) holding the `<article>`
 * whose id is the rail target and whose centre is the story anchor (`data-story-at`, the s at which it sits
 * at the viewport centre). The h2 width comes from the waypoint altitude (thin air, §B.4.4); body and log
 * never animate.
 */
export function RouteEntry({ id, extras, slot }: RouteEntryProps) {
  const point = getStoryPoint(id);
  const wp = HOME_WAYPOINTS[id];
  const titleId = `${id}-title`;
  const trail = ENTRY_TRAILS[id];

  return (
    <li className={`${styles.slot} py-16 md:py-24`} style={{ '--slot-h': `${slot.vh}vh` } as CSSVars}>
      <article id={id} aria-labelledby={titleId} data-story-at={slot.at} className={ARTICLE_GRID}>
        <div data-recede="" className="lg:col-[1/span_5] lg:row-start-1">
          <ChapterHeader as="h2" id={titleId} altitudeM={wp.altitudeM}>
            {point.subtitle}
          </ChapterHeader>
        </div>

        <div data-recede="" className="mt-4 lg:col-[1/span_2] lg:row-start-2 lg:mt-8">
          <Log items={[...placeRows(id), ...ENTRY_LOGS[id]]} label={`Field log: ${point.title}`} />
        </div>

        <div data-recede="" className="mt-6 lg:col-[3/span_3] lg:row-start-2 lg:mt-8">
          <p className="text-body m-0 max-w-[42ch] text-ink [text-wrap:pretty]">{point.description}</p>
          {trail && trail.length > 0 ? (
            <Trail items={trail} label={`Trail: ${point.title}`} className="mt-6 max-w-[42ch]" />
          ) : null}
          {extras ? <div className="mt-8 flex flex-col items-start gap-6">{extras}</div> : null}
        </div>
      </article>
    </li>
  );
}
