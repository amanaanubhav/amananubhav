import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { ResumeLink } from '@/shared/ui/resume-link';

import { HERO_COPY, HERO_LOG } from '../config/copy';
import { HeroStatusChip, ReadStoryButton } from './chapters/HomeActions';

/**
 * `#home`, base camp (§G.1, design B0). Server-rendered and never animated from hidden: the h1 is the LCP
 * element. There is no map in the hero: the one story map (StoryStage, fixed and full-bleed) is already
 * moving behind it, and the first scroll pixel walks the route on from Besisahar.
 *
 * Layout: one text column at the left (content cols 1-6 from 1024 px), clear of the map's subject at 63.5%
 * of the width; on phones the copy sits in the lower part of the screen, under the circuit, and clear of
 * the legend bar (the log rows are hidden there; they repeat on /personal). No background: the map
 * recedes softly under each `data-recede` box. Muted ink is lifted to ink over the map.
 */
export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="home-title"
      className="journal-grid relative z-[1] min-h-svh content-end pb-[calc(12rem+env(safe-area-inset-bottom))] pt-[calc(56px+3rem)] md:content-center md:pb-16 [&_.text-ink-muted]:text-ink"
    >
      <div className="col-[content-start/content-end] lg:col-[2/span_6] xl:col-[2/span_5]">
        <div data-recede="">
          <ChapterHeader
            as="h1"
            id="home-title"
            srPrefix={HERO_COPY.srPrefix}
            className="max-w-[9.5ch] leading-[0.98] max-md:text-[3.375rem] md:text-[clamp(3.25rem,6.4vw,6.125rem)]"
          >
            {HERO_COPY.headline}
          </ChapterHeader>
        </div>
        <p
          data-recede=""
          className="text-lead m-0 mt-6 max-w-[34ch] font-body text-ink [text-wrap:pretty] max-md:text-[1rem] max-md:leading-[1.55]"
        >
          {HERO_COPY.body}
        </p>
        <div data-recede="" className="mt-8 flex flex-wrap items-center gap-3">
          <ReadStoryButton label={HERO_COPY.readStory} />
          <ResumeLink variant="secondary" />
          <span className="md:hidden">
            <HeroStatusChip href={HERO_COPY.statusHref} label={HERO_COPY.status} />
          </span>
        </div>

        <div data-recede="" className="mt-10 hidden md:block">
          <Log
            label="Field log"
            items={[
              ...HERO_LOG,
              {
                key: 'status',
                mono: false,
                value: <HeroStatusChip href={HERO_COPY.statusHref} label={HERO_COPY.status} />,
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
