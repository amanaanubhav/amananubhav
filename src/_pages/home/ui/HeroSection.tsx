import { ResumeLink } from '@/shared/ui/resume-link';
import { RidgeName } from '@/shared/ui/ridge-name';

import { HERO_COPY, HERO_FIELD } from '../config/copy';
import { HeroStatusChip, ReadStoryButton } from './chapters/HomeActions';

/**
 * `#home`, base camp: the first sheet of the survey (HERO-FOOTER-SPEC §2, Survey Ridge). Server-rendered and never
 * animated from hidden: the h1 is his name (the LCP text), drawn as the terrain his ridge mark stands on; only the
 * name's motion island is client code. "Everything I need, I carry." is the statement under it.
 *
 * Layout: one text column at the left (content cols 1-7 from 1024 px), clear of the map's subject at 63.5 % of the
 * width; the grid keeps symmetric margins under the rail (`data-rail-overlay`: no hero text reaches the right).
 * Phones anchor the copy to the bottom, clear of the dock bar and its scrim, and the map keeps the top band. No
 * background: the map recedes softly under each `data-recede` box, and muted ink is lifted to ink over the map.
 * One screen at 1440 x 900 with the column ending 48 px or more above the fold; short desktops (max-height 760)
 * drop the field line.
 *
 * Light (APPLICATION-V2 M9): the section's own background carries a violet dusk behind the name and a small aqua
 * light under it, both transparent before the body copy and left of the terrain; the field key is the violet
 * structure accent. Colour only: no box changes, and the scene behind is untouched.
 */
export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="home-title"
      data-rail-overlay=""
      className="journal-grid relative z-[1] min-h-svh content-end pb-[calc(var(--bar-h)+36px+env(safe-area-inset-bottom))] pt-[calc(var(--nav-clear)+2rem)] sm:content-center sm:pb-16 lg:[@media(max-height:760px)]:pb-8 lg:[@media(max-height:760px)]:pt-[calc(var(--nav-clear)+0.5rem)] [&_.text-ink-muted]:text-ink [background-image:radial-gradient(620px_300px_at_20%_32%,rgb(var(--c-accent-2)/var(--hero-violet)),transparent_70%),radial-gradient(380px_200px_at_8%_46%,rgb(var(--c-aqua)/var(--hero-aqua)),transparent_70%)] bg-no-repeat [--hero-aqua:var(--alpha-faint)] [--hero-violet:var(--alpha-wash)] [html:not([data-theme=day])_&]:[--hero-aqua:var(--alpha-spec)] [html:not([data-theme=day])_&]:[--hero-violet:var(--alpha-edge)]"
    >
      <div className="col-[content-start/content-end] min-w-0 lg:col-[2/span_7]">
        <div data-recede="" className="w-max max-w-full">
          <RidgeName as="h1" id="home-title" text={HERO_COPY.name} layout="stack" span="name" />
        </div>
        <p
          data-recede=""
          className="m-0 mt-2 max-w-[24ch] font-display text-[clamp(1.5rem,1.05rem+1.25vw,2.25rem)] font-[640] leading-[1.12] tracking-[-0.015em] text-ink [text-wrap:balance] sm:mt-3"
        >
          {HERO_COPY.statement}
        </p>
        <p
          data-recede=""
          className="m-0 mt-4 max-w-[38ch] font-body text-[clamp(1rem,0.9rem+0.42vw,1.3125rem)] leading-[1.55] text-ink [text-wrap:pretty] sm:mt-5"
        >
          {HERO_COPY.body}
        </p>
        <div
          data-recede=""
          className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 lg:[@media(max-height:760px)]:mt-6"
        >
          <ReadStoryButton label={HERO_COPY.readStory} className="h-12" />
          <ResumeLink size="lg" />
        </div>
        <p
          data-recede=""
          className="m-0 mt-4 flex flex-wrap items-center gap-x-[18px] gap-y-1.5 font-body text-caption text-ink sm:mt-6 lg:[@media(max-height:760px)]:hidden"
        >
          <span className="max-sm:hidden">
            <span className="italic text-accent-2">{HERO_FIELD.role.key}</span> {HERO_FIELD.role.value}
          </span>
          <HeroStatusChip href={HERO_COPY.statusHref} label={HERO_COPY.status} />
        </p>
      </div>
    </section>
  );
}
