'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';

import { ACHIEVEMENTS, type Achievement } from '@/entities/achievement';
import type { MediaSlotId } from '@/shared/config';
import { useScrollToTopOnMount } from '@/shared/lib/dom';
import { SearchField } from '@/shared/ui/archive';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Stamp } from '@/shared/ui/journal';
import { Reveal } from '@/shared/ui/reveal';

import { filterAchievements } from '../lib/filter-achievements';
import { groupAchievements, honorCountLabel, isTopRank } from '../lib/group-achievements';
import { HONORS_COPY, emptyHonorsMessage } from '../config/copy';

export interface AchievementsArchiveViewProps {
  /** Server-rendered 1:1 proof plates by slot id; optional slots render nothing until a photo exists. */
  plates?: Partial<Record<MediaSlotId, ReactNode>>;
}

const FULL = 'col-[content-start/content-end]';

function RegisterEntry({ item, plate }: { item: Achievement; plate?: ReactNode }) {
  return (
    <li className="journal-grid pb-10">
      <div aria-hidden="true" className={`${FULL} h-px bg-line lg:col-[2/span_11]`} />

      <div className={`${FULL} pt-8 lg:col-[5/span_5] lg:row-start-2`}>
        <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
          <h3 className="text-title m-0 min-w-0 flex-[1_1_16rem] font-display font-semibold text-ink [text-wrap:balance]">
            {item.title}
          </h3>
          {item.rank ? (
            <span className="shrink-0 pt-1">
              <Stamp rotate tone={isTopRank(item.rank) ? 'signal' : 'ink'}>
                {item.rank}
              </Stamp>
            </span>
          ) : null}
        </div>
      </div>

      <div className={`${FULL} mt-3 lg:col-[2/span_3] lg:row-[2/span_2] lg:mt-0 lg:self-start lg:pt-9`}>
        <Log
          label={HONORS_COPY.entryLogLabel}
          items={[
            { key: 'year', value: item.year ? <time dateTime={item.year}>{item.year}</time> : undefined },
            { key: 'organisation', value: item.org, mono: false },
          ]}
        />
      </div>

      {item.desc ? (
        <div className={`${FULL} mt-3 lg:col-[5/span_5] lg:row-start-3`}>
          <p className="text-body m-0 max-w-measure font-body text-ink [text-wrap:pretty]">{item.desc}</p>
        </div>
      ) : null}

      {plate ? (
        <div className={`${FULL} mt-6 empty:hidden lg:col-[10/span_3] lg:row-[2/span_2] lg:mt-0 lg:pt-8`}>{plate}</div>
      ) : null}
    </li>
  );
}

/**
 * The summit register (§G.6): honors by group, each an `<ol>` of entries with the year and organisation in the
 * log column, a rotated rank stamp and the proof photo when one exists. Search runs through `filterAchievements`.
 */
export function AchievementsArchiveView({ plates }: AchievementsArchiveViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchId = useId();

  useScrollToTopOnMount();

  // Normalize and Filter
  const allAchievements = useMemo(() => filterAchievements(ACHIEVEMENTS, searchQuery), [searchQuery]);
  const sections = useMemo(() => groupAchievements(allAchievements), [allAchievements]);

  const clearSearch = () => {
    setSearchQuery('');
    document.getElementById(searchId)?.focus();
  };

  return (
    <div className="mt-16 md:mt-20">
      <div className="journal-grid">
        <div className={`${FULL} flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-[5/span_8]`}>
          <div className="min-w-0 flex-1 sm:flex-none [&>div]:w-full">
            <SearchField
              id={searchId}
              value={searchQuery}
              onChange={setSearchQuery}
              label={HONORS_COPY.searchLabel}
              placeholder={HONORS_COPY.searchPlaceholder}
              className="w-full flex-1 sm:w-64"
            />
          </div>
          <p
            role="status"
            aria-live="polite"
            className="text-caption m-0 font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]"
          >
            {honorCountLabel(allAchievements.length)}
          </p>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-20 md:mt-20 md:gap-24">
        {sections.map(({ group, items }) => {
          const name = group ?? HONORS_COPY.ungrouped;
          const headingId = `honors-${name.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <Reveal key={name} preset="section">
              <section aria-labelledby={headingId}>
                <div className="journal-grid">
                  <div className={`${FULL} flex flex-wrap items-baseline gap-x-4 gap-y-1 pb-2 lg:col-[2/span_11]`}>
                    <ChapterHeader as="h2" id={headingId} size="h3" reveal="none">
                      {name}
                    </ChapterHeader>
                    <span className="text-caption font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
                      {honorCountLabel(items.length)}
                    </span>
                  </div>
                </div>
                <ol className="m-0 list-none p-0">
                  {items.map((item) => (
                    <RegisterEntry
                      key={item.title}
                      item={item}
                      plate={item.slotId ? plates?.[item.slotId] : undefined}
                    />
                  ))}
                </ol>
              </section>
            </Reveal>
          );
        })}

        {allAchievements.length === 0 ? (
          <div className="journal-grid">
            <div className={`${FULL} flex flex-col items-start gap-6 lg:col-[5/span_8]`}>
              <p className="text-body m-0 font-body text-ink">{emptyHonorsMessage(searchQuery)}</p>
              <Button variant="secondary" onClick={clearSearch}>
                {HONORS_COPY.clearSearch}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
