import { Mail } from 'lucide-react';
import { PROFILE } from '@/entities/profile';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { ResumeLink } from '@/shared/ui/resume-link';
import { StatusChip } from '@/shared/ui/status-chip';
import { HERO_COPY, PROOF_POINTS } from '../config/copy';
import { AgentLoop } from './blueprints';
import { BlueprintFigure } from './BlueprintFigure';
import { HeroPlateDraw } from './HeroPlateDraw';
import { RichLine } from './RichLine';
import { SecureContactButton } from './SecureContactButton';

const TITLE_ID = 'professional-title';

/**
 * §G.3 hero (no id): the h1 runs across the sheet; under it the log, the lead with its three actions, and the
 * agent-loop blueprint (Plate 1, cols 9-12 from 1280 px; between 1024 and 1279 px, where cols 10-12 are too narrow to
 * read, full width below the text, the §B.5 alternative); then the three proof points in a row (stacked below 1024 px).
 * First viewport (QA round 1): the h1 is capped at 76 px and set at width 100, so the lead and the actions sit
 * above the fold at 1440 × 900, 1280 × 800 and 390 × 844; the rest of the lead follows the actions.
 * Server component: the vault button and the plate's draw are the only client islands.
 */
export function ProfessionalHero() {
  const availability = PROFILE.availability;
  const log: LogEntry[] = [
    { key: 'role', value: HERO_COPY.log.role, mono: false },
    {
      key: 'status',
      value: availability?.openToRemote ? (
        <StatusChip tone="success" href={HERO_COPY.log.statusHref}>
          {HERO_COPY.log.status}
        </StatusChip>
      ) : undefined,
      mono: false,
    },
    { key: 'time zone', value: availability?.utcLabel },
    { key: 'education', value: HERO_COPY.log.education, mono: false },
  ];

  return (
    <section aria-labelledby={TITLE_ID} className="journal-grid pt-28 lg:pt-24">
      <div className="col-[content-start/content-end] lg:col-[5/span_9] lg:pr-24">
        <ChapterHeader
          as="h1"
          id={TITLE_ID}
          reveal="none"
          wdth={100}
          className="max-md:text-h2 lg:text-[clamp(3rem,1.5rem+3.2vw,4.75rem)]"
        >
          {HERO_COPY.title}
        </ChapterHeader>
      </div>

      <div className="col-[content-start/content-end] mt-5 lg:col-[2/span_3] lg:row-start-2 lg:mt-10 lg:pt-1">
        <Log items={log} label={HERO_COPY.logLabel} />
      </div>

      <div className="col-[content-start/content-end] mt-5 lg:col-[5/span_5] lg:row-start-2 lg:mt-10">
        <p className="m-0 max-w-measure font-body text-lead text-ink [text-wrap:pretty]">{HERO_COPY.lead}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ResumeLink variant="primary" />
          <Button variant="secondary" icon={Mail} href={`mailto:${PROFILE.links.email}`}>
            {HERO_COPY.actions.email}
          </Button>
          <SecureContactButton label={HERO_COPY.actions.vault} />
        </div>
        <p className="m-0 mt-8 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{HERO_COPY.more}</p>
      </div>

      {/* Plate 1 stops 96 px short of the window edge from 1024 px, clear of the waypoint rail (§J.3). */}
      <div className="col-[content-start/content-end] mt-12 lg:col-[5/span_9] lg:row-start-3 lg:mt-16 lg:pr-24 xl:col-[10/span_4] xl:row-start-2 xl:mt-10 xl:pr-[calc(96px_-_var(--margin))]">
        <BlueprintFigure
          id="M-PRO-AGENT-01"
          breakpoints="hero"
          number={1}
          captionText={HERO_COPY.plateCaption}
          render={(variant) => (
            <HeroPlateDraw>
              <AgentLoop variant={variant} />
            </HeroPlateDraw>
          )}
        />
      </div>

      <ul
        aria-label={HERO_COPY.proofLabel}
        className="col-[content-start/content-end] m-0 mt-16 grid list-none gap-10 p-0 lg:col-[5/span_9] lg:row-start-4 lg:mt-24 lg:grid-cols-3 lg:gap-6 lg:pr-24 xl:row-start-3"
      >
        {PROOF_POINTS.map((point) => (
          <li key={point.id} className="border-t border-line-strong pt-4">
            <p className="m-0 font-body text-body text-ink [text-wrap:pretty]">
              <strong className="mb-2 block font-display text-title font-semibold text-ink">{point.title}</strong>
              <RichLine parts={point.body} />
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
