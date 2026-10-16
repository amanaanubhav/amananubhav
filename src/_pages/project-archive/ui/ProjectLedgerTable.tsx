import { useId, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

import type { Project, ProjectId } from '@/entities/project';
import { cn } from '@/shared/lib/cn';
import { ArchiveTag } from '@/shared/ui/archive';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import { PROJECT_GLYPHS, PROJECT_GLYPH_STROKE } from '../config/glyphs';
import { buildCountLabel, formatLedgerYear, splitStack } from '../lib/ledger-format';
import { ARCHIVE_COPY } from '../config/copy';

export interface ProjectLedgerTableProps {
  type: string;
  projects: readonly Project[];
  /** The first table of the ledger shows the column heads; later tables keep them for assistive tech only. */
  showHead: boolean;
  /** Server-rendered plates for particular rows (optional clips and screens). */
  media?: Partial<Record<ProjectId, ReactNode>>;
}

/*
 * Column visibility (§G.5):
 *   >= 1280 px  glyph | year | build | what it is | stack | tag | links
 *   768-1279    year | build (+ tag and links under the name) | what it is | stack
 *   < 768       each row is an entry: glyph beside the name and year, then labelled fields
 * Explicit table roles keep the semantics when the small-screen layout changes the display of table parts.
 */
const WIDE_ONLY = 'hidden xl:table-cell';
const ENTRY_AND_WIDE = 'max-md:block md:hidden xl:table-cell';

/** Field label for the small-screen entry layout (`data-label`), in Literata italic. */
const ENTRY_LABEL =
  'max-md:before:font-body max-md:before:italic max-md:before:text-ink-muted max-md:before:content-[attr(data-label)]';
const ENTRY_LABEL_BLOCK = cn(ENTRY_LABEL, 'max-md:before:mb-1 max-md:before:block');
const ENTRY_LABEL_INLINE = cn(ENTRY_LABEL, 'max-md:before:mr-2');

const CELL = 'align-top max-md:p-0 md:py-5 md:pr-5 max-md:empty:hidden';
/** Rows and their links stop below the navbar and the sticky control row (WCAG 2.4.11). */
const SCROLL_MARGIN = 'scroll-mt-[var(--archive-offset,136px)]';

function HeadCell({ label, show, className }: { label: string; show: boolean; className?: string }) {
  return (
    <th
      role="columnheader"
      scope="col"
      className={cn(
        'text-left align-bottom font-body font-normal italic text-ink-muted',
        show ? 'border-b border-line-strong pb-3 pr-5' : 'h-0 p-0',
        className,
      )}
    >
      <span className={cn('text-caption', !show && 'sr-only')}>{label}</span>
    </th>
  );
}

function ProjectLinks({ project, className }: { project: Project; className?: string }) {
  const links = project.links ?? [];
  if (links.length === 0) return null;
  return (
    <ul className={cn('m-0 flex list-none flex-col gap-1 p-0', className)}>
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'prose-link text-ui inline-flex min-h-6 items-center gap-1 rounded-control font-body [@media(pointer:coarse)]:min-h-11',
              SCROLL_MARGIN,
            )}
          >
            <span className="break-all">{link.label}</span>
            <ArrowUpRight aria-hidden="true" focusable="false" className="size-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
            <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Stack({ tech }: { tech: readonly string[] }) {
  const { shown, rest } = splitStack(tech);
  return (
    <p className="text-caption m-0 font-data text-ink [font-variant-numeric:tabular-nums_slashed-zero]">
      {shown.join(', ')}
      {rest.length > 0 ? (
        <span title={rest.join(', ')} className="ml-1 text-ink-muted">
          <span aria-hidden="true">+{rest.length}</span>
          <VisuallyHidden>, and {rest.join(', ')}</VisuallyHidden>
        </span>
      ) : null}
    </p>
  );
}

function LedgerRow({ project, media }: { project: Project; media?: ReactNode }) {
  const Glyph = PROJECT_GLYPHS[project.id];
  const year = formatLedgerYear(project.year);
  const oneLiner = project.oneLiner ?? project.desc;
  const hasLinks = (project.links?.length ?? 0) > 0;

  return (
    <tr
      role="row"
      className={cn(
        'border-b border-line max-md:grid max-md:grid-cols-[3rem_minmax(0,1fr)] max-md:gap-x-4 max-md:gap-y-3 max-md:py-6',
        SCROLL_MARGIN,
      )}
    >
      <td role="cell" className={cn(CELL, ENTRY_AND_WIDE, 'max-md:row-span-2')}>
        <span aria-hidden="true" className="inline-flex size-12 items-center justify-center text-ink">
          <Glyph aria-hidden="true" focusable="false" className="size-12" strokeWidth={PROJECT_GLYPH_STROKE} />
        </span>
      </td>

      <td role="cell" data-label={ARCHIVE_COPY.columns.year} className={cn(CELL, ENTRY_LABEL_INLINE, 'max-md:col-start-2 max-md:row-start-2 md:pt-[1.625rem] md:text-right')}>
        {year.label ? (
          <time
            dateTime={year.dateTime}
            className="text-caption font-data text-ink [font-variant-numeric:tabular-nums_slashed-zero]"
          >
            {year.label}
          </time>
        ) : null}
      </td>

      <th role="rowheader" scope="row" className={cn(CELL, 'text-left font-normal max-md:col-start-2 max-md:row-start-1 max-md:self-center')}>
        {/* Long unbroken names (amananubhav.com) wrap inside the Build column instead of running into the next cell. */}
        <span className="text-title block font-display font-semibold text-ink [overflow-wrap:anywhere] [text-wrap:balance]">
          {project.title}
        </span>
        {project.tag || hasLinks ? (
          <span className="mt-2 hidden flex-col items-start gap-2 md:flex xl:hidden">
            {project.tag ? <ArchiveTag>{project.tag}</ArchiveTag> : null}
            <ProjectLinks project={project} />
          </span>
        ) : null}
      </th>

      <td role="cell" data-label={ARCHIVE_COPY.columns.what} className={cn(CELL, ENTRY_LABEL_BLOCK, 'max-md:col-span-2 md:pt-[1.5rem]')}>
        <p className="text-ui m-0 max-w-measure font-body text-ink [text-wrap:pretty]">{oneLiner}</p>
        {media}
      </td>

      <td role="cell" data-label={ARCHIVE_COPY.columns.stack} className={cn(CELL, ENTRY_LABEL_BLOCK, 'max-md:col-span-2 md:pt-[1.625rem]')}>
        <Stack tech={project.tech} />
      </td>

      <td role="cell" data-label={ARCHIVE_COPY.columns.tag} className={cn(CELL, ENTRY_AND_WIDE, ENTRY_LABEL_INLINE, 'max-md:col-span-2 xl:pt-[1.5rem]')}>
        {project.tag ? <ArchiveTag>{project.tag}</ArchiveTag> : null}
      </td>

      <td role="cell" data-label={ARCHIVE_COPY.columns.links} className={cn(CELL, ENTRY_AND_WIDE, ENTRY_LABEL_BLOCK, 'max-md:col-span-2 xl:pr-0 xl:pt-[1.375rem]')}>
        {hasLinks ? <ProjectLinks project={project} /> : null}
      </td>
    </tr>
  );
}

/**
 * One type of the ledger (§G.5): a visible h2 (type and count) followed by its `<table>`. The heading sits
 * outside the table so no heading role ends up among the table's children (axe aria-required-children);
 * the table keeps a plain-text `<caption>`, visually hidden because the heading already shows it.
 */
export function ProjectLedgerTable({ type, projects, showHead, media }: ProjectLedgerTableProps) {
  const headingId = useId();
  const columns = ARCHIVE_COPY.columns;
  const countLabel = buildCountLabel(projects.length);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-4">
        <h2 id={headingId} className="text-title m-0 font-display font-semibold text-ink [text-wrap:balance]">
          {type}
        </h2>
        <span className="text-caption font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
          {countLabel}
        </span>
      </div>
      <table role="table" aria-labelledby={headingId} className="w-full border-collapse max-md:block md:table-fixed">
        <caption className="sr-only">
          {type}, {countLabel}
        </caption>
        <thead role="rowgroup" className="max-md:sr-only">
          <tr role="row">
            <HeadCell label={columns.glyph} show={showHead} className={cn(WIDE_ONLY, 'w-[4.5rem]')} />
            <HeadCell label={columns.year} show={showHead} className="w-24 text-right xl:w-[7rem]" />
            <HeadCell label={columns.build} show={showHead} className="w-[12.5rem] xl:w-[12rem]" />
            <HeadCell label={columns.what} show={showHead} />
            <HeadCell label={columns.stack} show={showHead} className="w-[10rem] xl:w-[11rem]" />
            <HeadCell label={columns.tag} show={showHead} className={cn(WIDE_ONLY, 'w-[8.5rem]')} />
            <HeadCell label={columns.links} show={showHead} className={cn(WIDE_ONLY, 'w-[11rem] pr-0')} />
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-md:block">
          {projects.map((project) => (
            <LedgerRow key={project.id} project={project} media={media?.[project.id]} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
