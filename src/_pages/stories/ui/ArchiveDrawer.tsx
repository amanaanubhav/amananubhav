'use client';

import type { MouseEvent, Ref } from 'react';
import { ArrowDownUp, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { openStory } from '@/features/read-story';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { SearchField } from '@/shared/ui/archive';
import { Button } from '@/shared/ui/button';
import { FIELD_NOTES_COPY } from '../config/treks';
import type { StoryFilters } from '../model/use-story-filters';
import { storyDateTime } from '../lib/story-date';

interface ArchiveDrawerProps {
  ref?: Ref<HTMLDivElement>;
  id: string;
  filters: StoryFilters;
  onCollapse: () => void;
}

const FILTER_CLASSES =
  'inline-flex min-h-11 items-center whitespace-nowrap rounded-control border-b-2 border-transparent px-0.5 font-body text-ui ' +
  'text-ink-muted transition-colors duration-hover hover:text-ink aria-pressed:border-signal aria-pressed:text-ink ' +
  'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal';

const ROW_BUTTON =
  'rounded-control text-left font-display font-semibold text-ink decoration-signal decoration-1 underline-offset-[0.22em] ' +
  'group-hover:underline focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal';

/**
 * The journal index (§G.4): the logbook as a `<table>` (date, title, category, place) with the search
 * and the category filters (text buttons with `aria-pressed`). Each row opens the story in the reader.
 * Filter state lives in the showcase, so it survives collapse and expand.
 */
export function ArchiveDrawer({ ref, id, filters, onCollapse }: ArchiveDrawerProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    toggleSortOrder,
    categories,
    filteredStories,
    totalCount,
  } = filters;
  const headingId = `${id}-title`;
  const countText = `${filteredStories.length} of ${totalCount} journal entries`;

  const openFromRow = (event: MouseEvent<HTMLTableRowElement>, index: number) => {
    // The title button handles its own clicks (and the keyboard); the rest of the row is a mouse target.
    if ((event.target as HTMLElement).closest('button, a')) return;
    const story = filteredStories[index];
    if (story) openStory(story);
  };

  return (
    <motion.div
      ref={ref}
      id={id}
      role="region"
      aria-labelledby={headingId}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onAnimationComplete={() => ScrollTrigger.refresh()}
      className="relative z-content w-full overflow-hidden border-t border-line bg-surface"
    >
      <div className="journal-grid py-24 max-lg:pb-32">
        <div className="col-[content-start/content-end] lg:col-[2/span_11]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 id={headingId} className="m-0 font-display text-h3 font-[650] text-ink [--wdth:104]">
                {FIELD_NOTES_COPY.indexHeading}
              </h3>
              <p aria-live="polite" className="m-0 mt-2 font-data text-caption text-ink-muted tabular">
                {countText}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                label={FIELD_NOTES_COPY.searchLabel}
                placeholder={FIELD_NOTES_COPY.searchPlaceholder}
                className="w-full sm:w-64"
              />
              <Button variant="secondary" icon={ArrowDownUp} onClick={toggleSortOrder}>
                {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
              </Button>
            </div>
          </div>

          <div
            role="group"
            aria-label="Filter by category"
            className="mt-10 flex flex-wrap gap-x-6 gap-y-1 border-b border-line"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                className={FILTER_CLASSES}
              >
                {category}
              </button>
            ))}
          </div>

          <table className="mt-8 w-full border-collapse text-left">
            <caption className="sr-only">
              {`Journal entries, ${sortOrder === 'newest' ? 'newest' : 'oldest'} first. Select a title to read it.`}
            </caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="py-3 pr-4 font-body text-caption font-normal italic text-ink-muted">
                  Date
                </th>
                <th scope="col" className="py-3 pr-4 font-body text-caption font-normal italic text-ink-muted">
                  Title
                </th>
                <th scope="col" className="hidden py-3 pr-4 font-body text-caption font-normal italic text-ink-muted sm:table-cell">
                  Category
                </th>
                <th scope="col" className="hidden py-3 font-body text-caption font-normal italic text-ink-muted md:table-cell">
                  Place
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStories.map((story, index) => {
                const dateTime = storyDateTime(story.date);
                return (
                  <tr
                    key={story.id}
                    onClick={(event) => openFromRow(event, index)}
                    className="group cursor-pointer border-b border-line align-baseline transition-colors duration-hover hover:bg-surface-2 has-[:focus-visible]:bg-surface-2"
                  >
                    <td className="whitespace-nowrap py-4 pr-4 font-data text-caption text-ink tabular">
                      {dateTime ? <time dateTime={dateTime}>{story.date}</time> : story.date}
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => openStory(story)}
                        className={`text-ui ${ROW_BUTTON}`}
                      >
                        {story.title}
                      </button>
                      <span className="mt-1 block font-body text-caption text-ink-muted sm:hidden">{story.category}</span>
                    </td>
                    <td className="hidden py-4 pr-4 font-body text-caption text-ink-muted sm:table-cell">{story.category}</td>
                    <td className="hidden py-4 font-body text-caption text-ink-muted md:table-cell">{story.place ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredStories.length === 0 ? (
            <div className="mt-8 flex flex-col items-start gap-3">
              <p className="m-0 font-body text-body text-ink">
                {searchQuery ? `No journal entries match "${searchQuery}".` : 'No journal entries in this category yet.'}
              </p>
              <Button
                variant="text"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Clear the search and filters
              </Button>
            </div>
          ) : null}

          <div className="mt-16 flex justify-center">
            <Button variant="text" icon={ChevronUp} onClick={onCollapse} aria-controls={id} aria-expanded>
              {FIELD_NOTES_COPY.close}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
