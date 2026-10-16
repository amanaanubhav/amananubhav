'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, SlidersHorizontal } from 'lucide-react';

import { PROJECTS, type ProjectId } from '@/entities/project';
import { useScrollToTopOnMount } from '@/shared/lib/dom';
import { SearchField } from '@/shared/ui/archive';
import { Button } from '@/shared/ui/button';
import { Reveal } from '@/shared/ui/reveal';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import {
  filterProjects,
  getProjectTypes,
  groupProjectsByType,
  type ProjectSortOrder,
} from '../lib/filter-projects';
import { buildCountLabel } from '../lib/ledger-format';
import { ARCHIVE_COPY, emptyMessage } from '../config/copy';
import { ProjectLedgerTable } from './ProjectLedgerTable';

// Extract unique domains/types for filter
const ALL_TYPES = getProjectTypes(PROJECTS);

/** Extra room between the sticky control row and a focused row (px). */
const FOCUS_GAP_PX = 12;

export interface ProjectArchiveViewProps {
  /** Server-rendered plates for particular rows (M-PROJ-MARIO-01, M-PROJ-SITE-01); optional slots render nothing. */
  media?: Partial<Record<ProjectId, ReactNode>>;
}

/**
 * The ledger (§G.5): a sticky control row (search, type, sort, live count) over one table per project type.
 * Filtering, sorting and grouping run through `filterProjects` and `groupProjectsByType`, unchanged.
 */
export function ProjectArchiveView({ media }: ProjectArchiveViewProps) {
  const [sortBy, setSortBy] = useState<ProjectSortOrder>('newest');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchId = useId();
  const typeId = useId();
  const filtersId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);

  useScrollToTopOnMount();

  const filteredProjects = useMemo(
    () => filterProjects(PROJECTS, { filterType, searchQuery, sortBy }),
    [filterType, sortBy, searchQuery],
  );

  // Grouping Logic
  const groupedProjects = useMemo(() => groupProjectsByType(filteredProjects), [filteredProjects]);

  // Rows and row links scroll to just below the sticky control row (its height changes with the Filters panel).
  useEffect(() => {
    const bar = barRef.current;
    const ledger = ledgerRef.current;
    if (!bar || !ledger || typeof ResizeObserver === 'undefined') return;
    const sync = () => ledger.style.setProperty('--archive-offset', `${Math.ceil(bar.offsetHeight) + FOCUS_GAP_PX}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    document.getElementById(searchId)?.focus();
  };

  const sortLabel = sortBy === 'newest' ? ARCHIVE_COPY.sortNewest : ARCHIVE_COPY.sortOldest;
  const groups = Array.from(groupedProjects);

  return (
    <div ref={ledgerRef} className="relative mt-16 md:mt-20">
      {/* Control row: sits under the navbar's 56 px strip once it sticks. */}
      <div ref={barRef} className="sticky top-0 z-content border-b border-line bg-ground pt-14">
        <div className="journal-grid">
          <div className="col-[content-start/content-end] flex flex-wrap items-center gap-3 py-3">
            {/* Fixed width at md+: the clear button takes room from the input instead of pushing the row. */}
            <div className="min-w-0 flex-1 md:w-80 md:flex-none [&>div]:w-full">
              <SearchField
                id={searchId}
                value={searchQuery}
                onChange={setSearchQuery}
                label={ARCHIVE_COPY.searchLabel}
                placeholder={ARCHIVE_COPY.searchPlaceholder}
                className="w-full flex-1"
              />
            </div>

            <Button
              variant="secondary"
              icon={SlidersHorizontal}
              aria-expanded={filtersOpen}
              aria-controls={filtersId}
              onClick={() => setFiltersOpen((open) => !open)}
              className="md:hidden"
            >
              {ARCHIVE_COPY.filters}
            </Button>

            <div
              id={filtersId}
              className={`${filtersOpen ? 'flex' : 'hidden'} w-full flex-wrap items-center gap-3 md:flex md:w-auto`}
            >
              <div className="relative min-w-0 flex-1 md:flex-none">
                <label htmlFor={typeId} className="sr-only">
                  {ARCHIVE_COPY.typeLabel}
                </label>
                <select
                  id={typeId}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-ui h-11 w-full max-w-full cursor-pointer appearance-none truncate rounded-control border border-line-strong bg-surface-2 pl-3 pr-10 font-body text-ink transition-[border-color] duration-hover hover:border-ink-muted focus-visible:border-signal focus-visible:outline-offset-0 md:w-auto md:max-w-[16rem]"
                >
                  {ALL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? ARCHIVE_COPY.allTypes : t}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  focusable="false"
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                  strokeWidth={1.75}
                />
              </div>

              <Button
                variant="secondary"
                icon={sortBy === 'newest' ? ArrowDownWideNarrow : ArrowUpNarrowWide}
                onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              >
                <VisuallyHidden>Sort: </VisuallyHidden>
                {sortLabel}
              </Button>
            </div>

            <p
              role="status"
              aria-live="polite"
              className="text-caption m-0 w-full font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero] md:ml-auto md:w-auto"
            >
              {buildCountLabel(filteredProjects.length)}
            </p>
          </div>
        </div>
      </div>

      <div className="journal-grid pt-12 md:pt-16">
        <div className="col-[content-start/content-end] flex flex-col gap-16 md:gap-20">
          {groups.map(([type, projects], index) => (
            <Reveal key={type} preset="archive">
              <ProjectLedgerTable type={type} projects={projects} showHead={index === 0} media={media} />
            </Reveal>
          ))}

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-start gap-6 py-8">
              <p className="text-body m-0 font-body text-ink">{emptyMessage(searchQuery)}</p>
              {searchQuery ? (
                <Button variant="secondary" onClick={clearSearch}>
                  {ARCHIVE_COPY.clearSearch}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
