import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { ContourSheet } from '@/shared/ui/map';
import { ResumeLink } from '@/shared/ui/resume-link';
import { StatusChip } from '@/shared/ui/status-chip';

import { HERO_COPY, HERO_LOG } from '../config/copy';
import { PLAN_SHEET } from '../config/plan-sheet.generated';
import { HeroPlateDrift } from './chapters/HeroPlateDrift';
import { ReadStoryButton } from './chapters/HomeActions';

/**
 * `#home`, base camp (§G.1). Server-rendered and never animated from hidden (the h1 is the LCP): the
 * only motion is the plate's route draw after the preloader (inside `ContourSheet`) and, on desktop
 * tier 2, a 12 px contour drift. The plate defines the Annapurna `<symbol>` that the stage poster and
 * the static entry plates reference.
 *
 * Layout (§G.1; content col n is grid track n + 1): ≥ 1280 log cols 1-3, text cols 4-7, plate bleeding from
 * col 8 to the right edge (bleed plates may run under the fixed rail, §B.5, §J.3); 1024-1279 log 1-3, text 4-8,
 * plate 9-12; below 1024 h1, body, actions, log strip, then the plate full width at 4:5 with the priority
 * labels only (`labels="responsive"`: every label and the furniture from 1024 px, priority-1 labels only below it).
 *
 * The h1 stays under `text-display` from 1024 px (deviation from §G.1, §J.3): at 96 px "Everything" is
 * about 480 px wide, wider than the four-column text column (≈ 376-425 px), so the full size would overflow.
 */
export function HeroSection() {
  // Rows are centred from 1024 px only: below it the stacked text and 4:5 plate always exceed the minimum height,
  // and centring there moved the text up when a frame painted before the plate was parsed (CLS, §J.2).
  return (
    <section
      id="home"
      aria-labelledby="home-title"
      className="journal-grid min-h-[max(100svh,720px)] pb-16 lg:content-center pt-[calc(56px+3rem)] lg:pb-12 xl:pb-0 xl:pt-14"
    >
      <div className="col-[content-start/content-end] lg:col-[2/span_8] lg:row-start-1 xl:col-[2/span_7] lg:grid lg:grid-cols-subgrid lg:self-center">
        <div className="lg:col-[4/span_5] lg:row-start-1 xl:col-[4/span_4]">
          <ChapterHeader
            as="h1"
            id="home-title"
            srPrefix={HERO_COPY.srPrefix}
            className="lg:text-[clamp(2.75rem,0.25rem+4vw,4rem)]"
          >
            {HERO_COPY.headline}
          </ChapterHeader>
          <p className="text-lead m-0 mt-6 max-w-[34ch] font-body text-ink [text-wrap:pretty]">{HERO_COPY.body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ReadStoryButton label={HERO_COPY.readStory} />
            <ResumeLink variant="secondary" />
          </div>
        </div>

        <div className="mt-10 lg:col-[1/span_3] lg:row-start-1 lg:mt-0 lg:pt-[0.55rem]">
          <Log
            label="Field log"
            items={[
              ...HERO_LOG,
              {
                key: 'status',
                mono: false,
                value: (
                  <StatusChip tone="success" href={HERO_COPY.statusHref}>
                    {HERO_COPY.status}
                  </StatusChip>
                ),
              },
            ]}
          />
        </div>
      </div>

      <HeroPlateDrift className="col-[content-start/content-end] mt-10 lg:col-[10/span_4] lg:row-start-1 lg:mt-0 lg:self-center xl:col-[9/full-end]">
        <ContourSheet
          data={PLAN_SHEET}
          mode="define"
          routeState="solid"
          drawRoute="once"
          labels="responsive"
          aspect="slice"
          title={HERO_COPY.plateTitle}
          desc={HERO_COPY.plateDesc}
          className="aspect-[4/5] w-full lg:max-h-[calc(100svh-56px)]"
        />
      </HeroPlateDrift>
    </section>
  );
}
