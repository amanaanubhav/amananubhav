import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getMedia } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { JournalGrid, Stamp } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import {
  SECTION_STATEMENTS,
  VENTURE_LEDGER,
  VENTURE_LEDGER_COPY,
  VENTURES,
  VENTURES_CAPTION,
  type Venture,
} from '../config/content';
import { sectionLabel } from '../config/sections';
import { JumpLink } from './sections/JumpLink';

/*
 * `#business`: Ventures (FINAL-DESIGN §4.4): one row per venture in a real `<table>`. From 900 px it is a steel panel
 * with steel rules between rows (a table, so the rules are honest); below 900 px each row is its own card. The table
 * parts keep explicit ARIA roles on purpose: the card layout sets `display: block`, which drops native table
 * semantics in Safari (REVIEW-UX P1-3, kept). No motion beyond press feedback on the links.
 *
 * `.panel-steel` (steel rim + glass top light) is written out per breakpoint below: the material class has no
 * responsive variant, and it belongs on the table from 900 px but on each card under it.
 */

/**
 * Row cells: stacked in the card below 900 px; from 900 px padded table cells with a steel rule above every row but
 * the first (`.rule-steel` is a border-image, so it draws only where the cell has a top border).
 */
const CELL =
  'rule-steel block p-0 text-left align-top font-normal ' +
  'min-[900px]:table-cell min-[900px]:px-5 min-[900px]:py-5 min-[900px]:[tr:not(:first-child)>&]:border-t';

/** Component link (`.prose-link`: action-line underline, action on hover and focus), a 44 px target, pressable. */
const LINK =
  'prose-link inline-flex min-h-11 items-center gap-1 rounded-control font-body text-caption ' +
  'transition-transform duration-micro active:scale-[0.97]';

function subtitleOf(venture: Venture): string | null {
  const row = VENTURE_LEDGER[venture.id];
  if (row && row.subtitle !== undefined) return row.subtitle;
  return venture.subtitle;
}

/** A screen thumbnail at the row's left edge, only once the venture's screen exists (§3.5: nothing until then). */
function VentureThumb({ venture }: { venture: Venture }) {
  if (getMedia(venture.slotId).status !== 'existing') return null;
  return (
    <MediaSlot
      id={venture.slotId}
      layout="thumb"
      caption="none"
      ratio="1:1"
      sizes="72px"
      className="w-[72px] shrink-0 overflow-hidden rounded-control"
    />
  );
}

function VentureRow({ venture }: { venture: Venture }) {
  const row = VENTURE_LEDGER[venture.id];
  const subtitle = subtitleOf(venture);
  const recognition = row?.stamp ?? row?.qualifier;
  return (
    <tr
      role="row"
      className={
        'block rounded-panel border border-[var(--steel-rim)] bg-surface px-4 pb-2 pt-4 ' +
        'shadow-[inset_0_1px_0_var(--glass-highlight)] ' +
        'min-[900px]:table-row min-[900px]:rounded-none min-[900px]:border-0 min-[900px]:bg-transparent ' +
        'min-[900px]:p-0 min-[900px]:shadow-none'
      }
    >
      <th role="rowheader" scope="row" className={cn(CELL, 'mb-1.5 min-[900px]:mb-0 min-[900px]:w-[31%]')}>
        <div className="flex items-start gap-4">
          <VentureThumb venture={venture} />
          <div className="min-w-0">
            <span className="block font-display text-title font-semibold text-ink [text-wrap:balance]">
              {venture.title}
            </span>
            {subtitle || row?.crossLink ? (
              <span className="mt-1 block font-body text-caption text-ink-muted [text-wrap:pretty]">
                {subtitle}
                {row?.crossLink ? (
                  <>
                    {subtitle ? ' ' : null}
                    <JumpLink
                      targetId={row.crossLink.href.slice(1)}
                      // Inline in the sentence for a mouse (a 24 px box, WCAG 2.5.8); its own 44 px line on touch screens.
                      className={cn(
                        LINK,
                        'inline-block min-h-6 align-baseline [@media(pointer:coarse)]:flex [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:w-fit',
                      )}
                    >
                      {row.crossLink.label}
                    </JumpLink>
                  </>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
      </th>
      <td
        role="cell"
        className={cn(
          CELL,
          'inline font-display text-ui font-semibold text-ink',
          "after:font-body after:font-normal after:text-ink-muted after:content-['_·_']",
          'min-[900px]:w-[13%] min-[900px]:after:content-none',
        )}
      >
        {venture.role}
      </td>
      <td
        role="cell"
        className={cn(
          CELL,
          'inline font-data text-caption text-ink [font-variant-numeric:tabular-nums]',
          'min-[900px]:w-[17%] min-[900px]:whitespace-nowrap',
        )}
      >
        {venture.years}
      </td>
      <td role="cell" className={cn(CELL, 'mt-3 empty:hidden min-[900px]:mt-0 min-[900px]:w-[21%] min-[900px]:empty:table-cell')}>
        {recognition ? (
          <Stamp tone={row?.stamp ? 'signal' : 'placed'} className="whitespace-normal text-left">
            {recognition}
          </Stamp>
        ) : null}
      </td>
      <td role="cell" className={cn(CELL, 'mt-1 empty:hidden min-[900px]:mt-0 min-[900px]:py-2 min-[900px]:empty:table-cell')}>
        {venture.links.length > 0 ? (
          <ul aria-label={`${venture.title} links`} className="m-0 flex list-none flex-wrap gap-x-4 p-0">
            {venture.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                  {link.name}
                  <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} />
                  <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </td>
    </tr>
  );
}

/**
 * `#business`: Ventures. h2 (the rail label), the statement, the four-row ledger from `VENTURES` + `VENTURE_LEDGER`
 * (name, subtitle, cross link, role, years, stamp or qualifier, links), then the line to the Work page (same tab).
 */
export function BusinessSection() {
  return (
    <section id="business" aria-labelledby="business-h" className="scroll-mt-[calc(var(--nav-clear)+16px)]">
      <JournalGrid>
        <div className="col-[content-start/content-end] min-w-0">
          <h2 id="business-h" tabIndex={-1} className="m-0 font-display text-h2 font-bold text-ink [text-wrap:balance] focus:outline-none">
            {sectionLabel('business')}
          </h2>
          <p className="m-0 mt-4 max-w-[30em] font-body text-lead text-ink [text-wrap:pretty]">
            {SECTION_STATEMENTS.business}
          </p>

          <table
            role="table"
            className={
              'mt-8 block w-full lg:mt-12 ' +
              'min-[900px]:table min-[900px]:border-separate min-[900px]:border-spacing-0 min-[900px]:overflow-hidden ' +
              'min-[900px]:rounded-panel min-[900px]:border min-[900px]:border-[var(--steel-rim)] min-[900px]:bg-surface ' +
              'min-[900px]:shadow-[inset_0_1px_0_var(--glass-highlight)]'
            }
          >
            <caption className="sr-only">{VENTURES_CAPTION}</caption>
            <thead role="rowgroup" className="sr-only">
              <tr role="row">
                {VENTURE_LEDGER_COPY.headers.map((label) => (
                  <th key={label} role="columnheader" scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup" className="grid gap-4 min-[900px]:table-row-group">
              {VENTURES.map((venture) => (
                <VentureRow key={venture.id} venture={venture} />
              ))}
            </tbody>
          </table>

          <p className="m-0 mt-4 font-body text-caption text-ink-muted">
            {VENTURE_LEDGER_COPY.after}
            <Link
              href={VENTURE_LEDGER_COPY.afterLink.href}
              className="prose-link inline-flex min-h-11 items-center rounded-control transition-transform duration-micro active:scale-[0.97]"
            >
              {VENTURE_LEDGER_COPY.afterLink.label}
            </Link>
          </p>
        </div>
      </JournalGrid>
    </section>
  );
}
