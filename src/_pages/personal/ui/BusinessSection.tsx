import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { VENTURES, VENTURES_CAPTION, VENTURES_TITLE, type Venture } from '../config/content';

const LINK =
  'rounded-control text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2';

function VentureLinks({ venture }: { venture: Venture }) {
  if (venture.links.length === 0) return null;
  return (
    <ul aria-label={`${venture.title} links`} className="m-0 mt-4 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 font-body text-ui">
      {venture.links.map((link) => (
        <li key={link.url}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className={LINK}>
            {link.name}
            <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          </a>
        </li>
      ))}
    </ul>
  );
}

/*
 * The ledger is a real `<table>` with a caption (§J.1: ledgers are tables), laid out as journal spreads. Each
 * row is a journal grid with the same placements as `Spread` (§B.5): name (the row header, an h3) in cols 4-8,
 * log (role, years) in cols 1-3, story (subtitle, description, links) under the name, plate in cols 9-12; below
 * 1024 px every cell stacks in DOM order. The table parts carry their ARIA roles explicitly because some engines
 * drop table semantics once `display` is changed by CSS.
 */
const FULL_CONTENT = 'col-[content-start/content-end] p-0 text-left align-top font-normal';
const NAME_CELL = `${FULL_CONTENT} lg:col-[5/span_5] lg:row-start-1`;
const LOG_CELL = `${FULL_CONTENT} mt-3 lg:col-[2/span_3] lg:row-[1/span_2] lg:mt-0 lg:self-start lg:pt-2 xl:sticky xl:top-24`;
const STORY_CELL = `${FULL_CONTENT} mt-4 lg:col-[5/span_5] lg:row-start-2 lg:self-start`;
const PLATE_CELL = `${FULL_CONTENT} mt-8 lg:col-[10/span_4] lg:row-[1/span_2] lg:mt-0 lg:self-start`;

/**
 * `#business`: Ventures (§G.2, [S-VENTURES]). A ledger of four rows: log (role, years), name, subtitle,
 * description and text links, with a 16:10 plate whose pending fill is the venture's glyph.
 */
export function BusinessSection() {
  return (
    <section id="business" aria-labelledby="business-title" className="pt-24 lg:pt-36">
      <Spread
        as="div"
        plateSpan="none"
        heading={
          <ChapterHeader as="h2" id="business-title">
            {VENTURES_TITLE}
          </ChapterHeader>
        }
      />

      <table role="table" className="mt-16 block w-full border-collapse lg:mt-24">
        <caption className="sr-only">{VENTURES_CAPTION}</caption>
        <thead role="rowgroup" className="sr-only">
          <tr role="row">
            <th role="columnheader" scope="col">
              Venture
            </th>
            <th role="columnheader" scope="col">
              Role and years
            </th>
            <th role="columnheader" scope="col">
              What it is
            </th>
            <th role="columnheader" scope="col">
              Plate
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="flex flex-col gap-24 lg:gap-32">
          {VENTURES.map((venture) => (
            <tr key={venture.id} role="row" className="journal-grid lg:grid-rows-[auto_1fr]">
              <th role="rowheader" scope="row" className={NAME_CELL}>
                <ChapterHeader as="h3" size="h3">
                  {venture.title}
                </ChapterHeader>
              </th>
              <td role="cell" className={LOG_CELL}>
                <Log
                  label={`${venture.title} log`}
                  items={[
                    { key: 'role', value: venture.role, mono: false },
                    { key: 'years', value: venture.years },
                  ]}
                />
              </td>
              <td role="cell" className={STORY_CELL}>
                <p className="m-0 font-body text-lead italic text-ink-muted [text-wrap:pretty]">{venture.subtitle}</p>
                <p className="m-0 mt-3 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{venture.desc}</p>
                <VentureLinks venture={venture} />
              </td>
              <td role="cell" className={PLATE_CELL}>
                <MediaSlot id={venture.slotId} ratio="16:10" className="max-w-[280px]" sizes="280px" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
