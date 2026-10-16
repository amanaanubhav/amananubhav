import type { ReactNode } from 'react';
import { Mail } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { getMedia } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { OverlapBand } from '@/shared/ui/charts';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { ResumeLink } from '@/shared/ui/resume-link';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { REMOTE_COPY } from '../config/copy';
import { ASYNC_CHECKLIST } from '../config/remote';
import { confirmedChecklist } from '../lib/remote';
import { formatWindowIST } from '../lib/select';
import { SecureContactButton } from './SecureContactButton';

const TITLE_ID = 'remote-title';

/** Standard plates end at the content edge; from 1024 px this keeps them 96 px clear of the window edge (§J.3 rail). */
const RAIL_RESERVE = 'lg:pr-[calc(96px_-_var(--margin))]';
const CTA_ID = 'remote-cta-title';

/** A numbered or ticked row: the marker in the log column (cols 1-3), the text in cols 4-8. */
function LogRow({ marker, children }: { marker: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
      <div className="pt-1 lg:col-[1/span_3] lg:flex lg:justify-end">{marker}</div>
      <div className="lg:col-[4/span_5]">{children}</div>
    </li>
  );
}

/** A drawn, already-ticked square (static SVG) for a confirmed checklist line. */
function TickedSquare() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true" focusable="false" className="text-ink">
      <rect x={1.5} y={1.5} width={15} height={15} rx={1.5} fill="none" stroke="currentColor" strokeWidth={1.25} />
      <path d="M5 9.5L7.8 12.2L13 6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <ChapterHeader as="h3" size="h3" reveal="none">
      {children}
    </ChapterHeader>
  );
}

/**
 * §G.3 #remote, "How I work": the page's one full ask. Spread A ([S-REMOTE-LONG]), the overlap band, the measured
 * ledger ([S-REMOTE-PROOF]), the three principles ([S-REMOTE-VALUE]), the checklist ([S-REMOTE-ASYNC], only when a
 * line is confirmed, Q-23), what I'm looking for ([S-REMOTE-FIT]) and the call to action ([S-REMOTE-CTA]).
 * No motion here beyond the band's own layout: every heading has its reveal switched off.
 */
export function RemoteSection() {
  const availability = PROFILE.availability;
  const checklist = confirmedChecklist(ASYNC_CHECKLIST);
  const { proof, values, fit, cta } = REMOTE_COPY;

  const log: LogEntry[] = [
    { key: 'last remote role', value: REMOTE_COPY.log.lastRole, mono: false },
    { key: 'time zone', value: availability?.utcLabel },
    { key: 'overlap', value: formatWindowIST(availability?.workWindowIST) },
    { key: 'available from', value: availability?.availableFrom },
  ];

  const fitRows: { key: string; value?: string }[] = [
    { key: fit.keys.roles, value: availability?.roles?.join(', ') ?? fit.roles },
    { key: fit.keys.type, value: undefined },
    { key: fit.keys.start, value: availability?.availableFrom },
    { key: fit.keys.location, value: fit.location },
    { key: fit.keys.team, value: fit.team },
  ];

  return (
    <section id="remote" aria-labelledby={TITLE_ID} className="mt-32 lg:mt-48">
      {/* 1. Spread A. */}
      <Spread
        as="div"
        heading={
          <ChapterHeader as="h2" id={TITLE_ID} reveal="none">
            {REMOTE_COPY.title}
          </ChapterHeader>
        }
        log={<Log items={log} label={REMOTE_COPY.logLabel} />}
        plate={
          <div className={RAIL_RESERVE}>
            <MediaSlot id="M-HOW-01" reveal="none" />
          </div>
        }
      >
        <div className="flex max-w-measure flex-col gap-4 font-body text-body text-ink">
          {REMOTE_COPY.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="m-0 [text-wrap:pretty]">
              {paragraph}
            </p>
          ))}
        </div>
      </Spread>

      {/* 2. Overlap band (Q-20: no overlap claim until a window is set). */}
      <div className="journal-grid mt-16 lg:mt-24">
        <div className="col-[content-start/content-end] lg:col-[2/span_11] lg:pr-24">
          <OverlapBand workWindowIST={availability?.workWindowIST} caption={getMedia('M-HOW-02').alt} />
        </div>
      </div>

      {/* 3. The ledger. */}
      <Spread
        as="div"
        className="mt-24 lg:mt-32"
        heading={<SubHeading>{proof.title}</SubHeading>}
        log={<Log items={proof.log.map((row) => ({ ...row, mono: row.key === 'where' ? false : undefined }))} />}
        plate={
          <div className={RAIL_RESERVE}>
            <MediaSlot id="M-PRO-BRNDO-01" reveal="none" />
          </div>
        }
      >
        <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{proof.lead}</p>
        <table className="mt-8 w-full border-collapse text-left">
          <caption className="sr-only">{proof.caption}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{proof.columns.stat}</th>
              <th scope="col">{proof.columns.line}</th>
            </tr>
          </thead>
          <tbody>
            {proof.rows.map((row) => (
              <tr key={row.stat} className="border-t border-line-strong last:border-b">
                <th
                  scope="row"
                  className="w-[38%] py-3 pr-4 align-top font-data text-ui font-medium text-ink [font-variant-numeric:tabular-nums_slashed-zero] sm:w-[34%]"
                >
                  {row.stat}
                </th>
                <td className="py-3 align-top font-body text-body text-ink [text-wrap:pretty]">{row.line}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 mt-6 max-w-measure font-body text-lead italic text-ink">{proof.closing}</p>
      </Spread>

      {/* 4. What a remote team gets. */}
      <div className="journal-grid mt-24 lg:mt-32">
        <div className="col-[content-start/content-end] lg:col-[5/span_5]">
          <SubHeading>{values.title}</SubHeading>
        </div>
        <ol className="col-[content-start/content-end] m-0 mt-8 flex list-none flex-col gap-8 p-0 lg:mt-10 lg:gap-10">
          {values.items.map((item, index) => (
            <LogRow
              key={item.title}
              marker={
                <span aria-hidden="true" className="font-data text-caption text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
                  {index + 1}
                </span>
              }
            >
              <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">
                <strong className="mb-1 block font-display text-title font-semibold">{item.title}</strong>
                {item.body}
              </p>
            </LogRow>
          ))}
        </ol>
      </div>

      {/* 5. The checklist: omitted while no line is confirmed (Q-23). */}
      {checklist.length > 0 ? (
        <div className="journal-grid mt-24 lg:mt-32">
          <div className="col-[content-start/content-end] lg:col-[5/span_5]">
            <SubHeading>{REMOTE_COPY.checklist.title}</SubHeading>
          </div>
          <ul className="col-[content-start/content-end] m-0 mt-8 flex list-none flex-col gap-4 p-0">
            {checklist.map((line) => (
              <LogRow key={line} marker={<TickedSquare />}>
                <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">
                  <VisuallyHidden>{REMOTE_COPY.checklist.tickLabel}: </VisuallyHidden>
                  {line}
                </p>
              </LogRow>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 6. What I'm looking for, then the ask. */}
      <div className="journal-grid mt-24 lg:mt-32">
        <div className="col-[content-start/content-end] lg:col-[5/span_5]">
          <SubHeading>{fit.title}</SubHeading>
          <dl className="m-0 mt-6 flex flex-col">
            {fitRows
              .filter((row) => row.value)
              .map((row) => (
                <div
                  key={row.key}
                  className="grid gap-1 border-t border-line py-3 first:border-t-0 first:pt-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="font-body text-caption italic text-ink-muted sm:pt-1">{row.key}</dt>
                  <dd className="m-0 font-body text-body text-ink [text-wrap:pretty]">{row.value}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      <section aria-labelledby={CTA_ID} className="journal-grid pb-32 pt-24">
        <div className="col-[content-start/content-end] lg:col-[5/span_6]">
          <ChapterHeader as="h2" id={CTA_ID} reveal="none">
            {cta.title}
          </ChapterHeader>
          <p className="m-0 mt-4 font-body text-lead text-ink">{cta.line}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" icon={Mail} href={`mailto:${PROFILE.links.email}`}>
              {cta.email}
            </Button>
            <SecureContactButton label={cta.vault} />
            <ResumeLink variant="secondary" />
          </div>
        </div>
      </section>
    </section>
  );
}
