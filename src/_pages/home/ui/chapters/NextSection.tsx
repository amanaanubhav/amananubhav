import { Mail } from 'lucide-react';

import { getExpedition } from '@/entities/expedition';
import { PROFILE } from '@/entities/profile';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { OverlapBand } from '@/shared/ui/charts';
import { Log, Trail } from '@/shared/ui/journal';

import { NEXT_COPY } from '../../config/copy';
import { NEXT_TRAIL } from '../../config/trail';
import { OpenTerminalButton, SecureContactButton } from './HomeActions';

/**
 * `#next`, the next base camp (§G.1, [S-EPILOGUE]): home's one full remote ask, on plain ground. It
 * carries no map: the story map has dissolved into the ground before it arrives (one map per page; the dissolve
 * ends as its top reaches the viewport bottom, Meander's END).
 * The headline names the next trek; the log keeps the last one, whose journal entry links in once it exists.
 *
 * Spacing (SYS-4, M-05): the dissolve is the seam above it, so it opens with one block space; it is the last section
 * before the footer, so it has no bottom padding (the footer's seam is the only one).
 *
 * Ink: the log and the trail lift muted ink to ink, and both paragraphs are ink (running text never takes the muted
 * role).
 *
 * Grid (≥ 1024 px; content col n is grid track n + 1): log cols 1-2, copy cols 3-8, then the actions and
 * the overlap band across cols 3-10, so the rail never covers the band's rows. The h2 keeps the default
 * width: thin air is for the route entries only (§B.4.4).
 */
export function NextSection() {
  const last = getExpedition('dodital');
  const next = NEXT_COPY.nextTrek;

  return (
    <section
      id="next"
      aria-labelledby="next-title"
      className="journal-grid relative z-[1] pb-0 pt-block"
    >
      <div className="col-[content-start/content-end] lg:col-[4/span_6] lg:row-start-1">
        <ChapterHeader as="h2" id="next-title">
          {NEXT_COPY.headline}
        </ChapterHeader>
      </div>

      <div className="col-[content-start/content-end] mt-4 lg:col-[2/span_2] lg:row-[1/span_2] lg:mt-0 lg:self-start lg:pt-2 [&_.text-ink-muted]:text-ink">
        <Log
          label="Field log: next"
          items={[
            { key: 'last', value: last.when ? `${last.name}, ${last.when}` : last.name, mono: false },
            { key: 'next', value: `${next.name}, ${next.region}`, mono: false },
            { key: 'status', value: 'planned', mono: false },
            { key: 'then', value: NEXT_COPY.then, mono: false },
          ]}
        />
        <Trail items={NEXT_TRAIL} label="Trail: next" summitTone="bronze" className="mt-6" />
      </div>

      <div className="col-[content-start/content-end] mt-6 lg:col-[4/span_6] lg:row-start-2 lg:mt-8">
        <p className="text-body m-0 max-w-[60ch] text-ink [text-wrap:pretty]">{NEXT_COPY.body}</p>
        <p className="text-body m-0 mt-4 max-w-[60ch] text-ink [text-wrap:pretty]">{NEXT_COPY.remote}</p>
      </div>

      {/* One row (§G.1): under the copy, cols 3-10, so the three actions never wrap from 1024 px. */}
      <div className="col-[content-start/content-end] mt-8 lg:col-[4/span_8] lg:row-start-3 lg:mt-10">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          <OpenTerminalButton label={NEXT_COPY.terminal} />
          <SecureContactButton label={NEXT_COPY.vault} />
          <Button variant="secondary" icon={Mail} href={`mailto:${PROFILE.links.email}`}>
            {NEXT_COPY.email}
          </Button>
        </div>
        {last.status === 'done' && last.storyId ? (
          <Button variant="text" href={`/stories#${last.id}`} className="mt-6">
            {NEXT_COPY.storyLink}
          </Button>
        ) : null}
      </div>

      <div className="col-[content-start/content-end] mt-16 lg:col-[4/span_8] lg:row-start-4 lg:mt-20">
        <OverlapBand workWindowIST={PROFILE.availability?.workWindowIST} caption={NEXT_COPY.overlapCaption} />
      </div>
    </section>
  );
}
