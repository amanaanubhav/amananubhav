import { DAILY_STACK, SKILLS } from '@/entities/skill';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { STACK_COPY } from '../config/copy';
import { splitDaily } from '../lib/select';
import { KeepHyphenated } from './StackList';

const TITLE_ID = 'techstack-title';

/**
 * §G.3 #techstack: the kit list ([S-SKILLS]). Five headed lists in two columns (cols 4-12); in each, the tools I
 * use every day come first in Archivo 600, the rest in Literata. Each group's item count sits in its log.
 * No logos, bars or percentages.
 */
export function TechStackSection() {
  const groups = STACK_COPY.groupOrder.map((key) => {
    const items = SKILLS[key];
    return { key, label: STACK_COPY.groups[key], count: items.length, ...splitDaily(items, DAILY_STACK) };
  });
  const total = groups.reduce((sum, group) => sum + group.count, 0);

  return (
    <section id="techstack" aria-labelledby={TITLE_ID} className="journal-grid mt-32 lg:mt-48">
      <div className="col-[content-start/content-end] lg:col-[5/span_5]">
        <ChapterHeader as="h2" id={TITLE_ID}>
          {STACK_COPY.title}
        </ChapterHeader>
      </div>
      <div className="col-[content-start/content-end] mt-3 lg:col-[2/span_3] lg:row-[1/span_2] lg:mt-0 lg:pt-2">
        <Log
          label={STACK_COPY.logLabel}
          items={[
            { key: 'groups', value: groups.length },
            { key: 'in all', value: total, unit: 'items' },
            { key: STACK_COPY.dailyLabel.toLowerCase(), value: DAILY_STACK.length, unit: 'items' },
          ]}
        />
      </div>

      <div className="col-[content-start/content-end] mt-10 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:col-[5/span_9] lg:row-start-2 lg:mt-12 lg:pr-24">
        {groups.map((group) => {
          const headingId = `stack-${group.key}`;
          return (
            <section key={group.key} aria-labelledby={headingId} className="min-w-0 border-t border-line-strong pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <ChapterHeader as="h3" id={headingId}>
                  {group.label}
                </ChapterHeader>
                <Log layout="strip" items={[{ key: 'count', value: group.count, unit: 'items' }]} />
              </div>
              {group.daily.length > 0 ? (
                <ul
                  aria-label={`${STACK_COPY.dailyLabel}, ${group.label}`}
                  className="m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-1 p-0"
                >
                  {group.daily.map((item) => (
                    <li key={item} className="whitespace-nowrap font-display text-title font-semibold text-ink">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {group.rest.length > 0 ? (
                // The dot sits in the gap before each item and is clipped at the start of a line, so no line ends
                // (or starts) with a stray separator.
                <ul
                  aria-label={group.daily.length > 0 ? `Also in ${group.label}` : group.label}
                  className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 overflow-x-clip p-0 font-body text-body text-ink"
                >
                  {group.rest.map((item) => (
                    <li
                      key={item}
                      className="relative min-w-0 before:absolute before:right-full before:mr-[0.3rem] before:text-ink-muted before:content-['·'] first:before:content-none"
                    >
                      <KeepHyphenated text={item} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}
