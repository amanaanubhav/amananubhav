import { ArrowRight } from 'lucide-react';
import type { Achievement } from '@/entities/achievement';
import { ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Stamp } from '@/shared/ui/journal';
import { HONORS_COPY } from '../config/copy';
import { isWinningRank } from '../lib/select';

const TITLE_ID = 'achievements-title';

/**
 * §G.3 #achievements: the six starred honors as register rows: year (when known), title, one line, and the rank
 * as a stamp (not rotated here). Then the way into the full register. The old filler path and CometCard are gone.
 * Below 1024 px every cell is placed explicitly (year and org across the top, title left, stamp right), so the
 * stamp never auto-places into the title's cell.
 * `items` arrive selected from the server page, so the full list stays out of any client bundle.
 */
export function AchievementsSection({ items }: { items: readonly Achievement[] }) {
  if (items.length === 0) return null;
  return (
    <section id="achievements" aria-labelledby={TITLE_ID} className="journal-grid mt-32 pb-32 lg:mt-48 lg:pb-48">
      <div className="col-[content-start/content-end] lg:col-[5/span_5]">
        <ChapterHeader as="h2" id={TITLE_ID}>
          {HONORS_COPY.title}
        </ChapterHeader>
      </div>

      <ol
        aria-label={HONORS_COPY.listLabel}
        className="col-[content-start/content-end] m-0 mt-10 flex list-none flex-col p-0 lg:col-[2/span_11] lg:mt-14 lg:pr-24"
      >
        {items.map((item, index) => {
          const headingId = `honor-${index}`;
          return (
            <li key={item.title} className="border-t border-line-strong last:border-b">
              <article
                aria-labelledby={headingId}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-5 lg:grid-cols-11 lg:gap-x-[var(--gutter)]"
              >
                <p className="col-span-2 row-start-1 m-0 font-data text-caption text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero] lg:col-[1/span_3] lg:row-start-1 lg:pt-1 lg:text-right">
                  {item.year ? <time dateTime={item.year}>{item.year}</time> : null}
                  {item.year && item.org ? <span aria-hidden="true"> · </span> : null}
                  {item.org ? <span className="font-body italic">{item.org}</span> : null}
                </p>
                <div className="col-start-1 row-start-2 min-w-0 lg:col-[4/span_6] lg:row-start-1">
                  <ChapterHeader as="h3" id={headingId}>
                    {item.title}
                  </ChapterHeader>
                  {item.desc ? (
                    <p className="m-0 mt-1 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{item.desc}</p>
                  ) : null}
                </div>
                {item.rank ? (
                  <div className="col-start-2 row-start-2 self-start justify-self-end pt-1 lg:col-[10/span_2] lg:row-start-1 lg:justify-self-start">
                    <Stamp tone={isWinningRank(item.rank) ? 'signal' : 'ink'}>{item.rank}</Stamp>
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>

      <div className="col-[content-start/content-end] mt-10 lg:col-[5/span_5]">
        <Button variant="text" href={ROUTES.achievements} icon={ArrowRight} iconPosition="end">
          {HONORS_COPY.fullRegister}
        </Button>
      </div>
    </section>
  );
}
