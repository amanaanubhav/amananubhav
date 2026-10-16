import { PROJECTS } from '@/entities/project';
import { BackButton } from '@/shared/ui/archive';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';

import { ARCHIVE_COPY } from '../config/copy';
import { earliestProjectYear } from '../lib/ledger-format';
import { ProjectArchiveView } from './ProjectArchiveView';

/**
 * Optional row plates (§G.5). Both slots are optional placeholders today, so MediaSlot renders nothing until a
 * file exists; rendered here on the server so the registry stays out of the client bundle. The Mario-RL clip
 * plays on hover or tap, never on scroll (reduced motion: its button only).
 */
const ROW_MEDIA = {
  'mario-rl': <MediaSlot id="M-PROJ-MARIO-01" layout="inset" caption="short" play="interaction" className="mt-4" />,
  site: <MediaSlot id="M-PROJ-SITE-01" layout="inset" caption="short" className="mt-4" />,
} as const;

/** /project-archive: the full record of builds as a ledger (§G.5). Server page; the ledger is a client island. */
export function ProjectArchivePage() {
  const since = earliestProjectYear(PROJECTS);

  return (
    <div className="pb-32 pt-24 md:pt-28">
      <header className="journal-grid">
        <div className="col-[content-start/content-end] lg:col-[2/span_3] lg:row-start-1">
          <BackButton />
        </div>
        <div className="col-[content-start/content-end] lg:col-[5/span_8] lg:row-start-2">
          <ChapterHeader as="h1" className="[overflow-wrap:break-word] max-[359px]:hyphens-auto">
            {ARCHIVE_COPY.headline}
          </ChapterHeader>
        </div>
        <div className="col-[content-start/content-end] mt-4 lg:col-[2/span_3] lg:row-[2/span_2] lg:mt-0 lg:self-start lg:pt-4">
          <Log
            label={ARCHIVE_COPY.logLabel}
            items={[
              { key: 'builds', value: PROJECTS.length },
              { key: 'since', value: since },
            ]}
          />
        </div>
        <div className="col-[content-start/content-end] mt-6 lg:col-[5/span_6] lg:row-start-3 lg:mt-8">
          <p className="text-lead m-0 max-w-measure font-body text-ink [text-wrap:pretty]">{ARCHIVE_COPY.body}</p>
        </div>
      </header>

      <ProjectArchiveView media={ROW_MEDIA} />
    </div>
  );
}
