import { Mail } from 'lucide-react';

import { formatAltitude, getExpedition } from '@/entities/expedition';
import { PROFILE } from '@/entities/profile';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { OverlapBand } from '@/shared/ui/charts';
import { Log, Trail } from '@/shared/ui/journal';
import { ContourSheet } from '@/shared/ui/map';

import { NEXT_COPY } from '../../config/copy';
import { GARHWAL_SHEET } from '../../config/garhwal-sheet.generated';
import { NEXT_TRAIL } from '../../config/trail';
import { OpenTerminalButton, SecureContactButton } from './HomeActions';

/**
 * `#next`, the next base camp (§G.1, [S-EPILOGUE]): home's one full remote ask. The Garhwal sheet plays
 * the alpine start once at 50% in view (the tent light fades, a headlamp climbs the dashed route); reduced
 * motion shows the final frame. After the trip (`status === 'done'`) the headline turns into
 * "Last seen", the alpine start stops and the field note links in.
 *
 * Grid (≥ 1024 px; content col n is grid track n + 1): log cols 1-2, copy cols 3-6, plate cols 8-12 at 1:1
 * (§G.1; plates may run under the fixed rail, §B.5), then the actions and the overlap band across cols 3-10,
 * so the rail never covers the band's rows. The h2 keeps the default width: thin air is for the route
 * entries only (§B.4.4).
 */
export function NextSection() {
  const dodital = getExpedition('dodital');
  const done = dodital.status === 'done';
  const high = dodital.highPoint;
  const headline = done
    ? NEXT_COPY.headlineAfter(high.name, high.altitudeM !== undefined ? formatAltitude(high.altitudeM, high.approx) : undefined)
    : NEXT_COPY.headline;

  return (
    <section
      id="next"
      aria-labelledby="next-title"
      className="journal-grid border-t border-line pb-[calc(8rem+72px)] pt-32 lg:pb-48 lg:pt-48"
    >
      <div className="col-[content-start/content-end] lg:col-[4/span_4] lg:row-start-1">
        <ChapterHeader as="h2" id="next-title">
          {headline}
        </ChapterHeader>
      </div>

      <div className="col-[content-start/content-end] mt-4 lg:col-[2/span_2] lg:row-[1/span_2] lg:mt-0 lg:self-start lg:pt-2">
        <Log
          label="Field log: next"
          items={[
            { key: 'next', value: dodital.name, mono: false },
            { key: 'region', value: dodital.region, mono: false },
            { key: 'status', value: done ? 'done' : 'planned', mono: false },
            { key: 'then', value: NEXT_COPY.then, mono: false },
          ]}
        />
        <Trail items={NEXT_TRAIL} label="Trail: next" className="mt-6" />
      </div>

      <div className="col-[content-start/content-end] mt-6 lg:col-[4/span_4] lg:row-start-2 lg:mt-8">
        <p className="text-body m-0 max-w-[60ch] text-ink [text-wrap:pretty]">{NEXT_COPY.body}</p>
        <p className="text-body m-0 mt-4 max-w-[60ch] text-ink-muted [text-wrap:pretty]">{NEXT_COPY.remote}</p>
      </div>

      {/* One row (§G.1): under the copy and the plate, cols 3-10, so the three actions never wrap from 1024 px. */}
      <div className="col-[content-start/content-end] mt-8 lg:col-[4/span_8] lg:row-start-3 lg:mt-10">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          <OpenTerminalButton label={NEXT_COPY.terminal} />
          <SecureContactButton label={NEXT_COPY.vault} />
          <Button variant="secondary" icon={Mail} href={`mailto:${PROFILE.links.email}`}>
            {NEXT_COPY.email}
          </Button>
        </div>
        {done && dodital.storyId ? (
          <Button variant="text" href={`/stories#${dodital.id}`} className="mt-6">
            {NEXT_COPY.storyLink}
          </Button>
        ) : null}
      </div>

      <div className="col-[content-start/content-end] mt-12 lg:col-[9/span_5] lg:row-[1/span_2] lg:mt-0 lg:self-start">
        <ContourSheet
          data={GARHWAL_SHEET}
          mode="define"
          alpineStart={!done}
          labels="all"
          title={NEXT_COPY.plateTitle}
          desc={NEXT_COPY.plateDesc}
        />
      </div>

      <div className="col-[content-start/content-end] mt-16 lg:col-[4/span_8] lg:row-start-4 lg:mt-20">
        <OverlapBand workWindowIST={PROFILE.availability?.workWindowIST} caption={NEXT_COPY.overlapCaption} />
      </div>
    </section>
  );
}
