import { PROFILE } from '@/entities/profile';
import { SKY_OBSERVER } from '@/shared/lib/astro';
import { StarChart } from '@/shared/ui/map';
import { MediaSlot } from '@/shared/ui/media-slot';
import {
  LONG_VERSION,
  ORIGIN,
  ORIGIN_FACTS,
  ORIGIN_OPTIONAL_SLOTS,
  SIKAHAR_READOUT,
} from '../config/content';
import { WINTER_SKY } from '../config/sky-charts.generated';
import { LongVersion } from './origin/LongVersion';
import { OpenThisSky } from './origin/OpenThisSky';
import { RouteMap } from './origin/RouteMap';
import { SikaharReadout } from './origin/SikaharReadout';

/** Reading time of the long version: words at about 200 a minute, at least one minute. */
const LONG_MINUTES = Math.max(1, Math.round(ORIGIN.paragraphs.join(' ').split(/\s+/).length / 200));

/**
 * The thesis as its two sentences. From 1200 px each sentence is its own line (P1-4), so the break falls between them,
 * never inside one; below that the words wrap freely (three lines on phones is the documented exception).
 */
function TitleSentences({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.map((sentence, i) => (
    <span key={sentence}>
      <span className="min-[1200px]:block">{sentence}</span>
      {i < sentences.length - 1 ? ' ' : null}
    </span>
  ));
}

/** North-east arrow after an external link (drawn, not a glyph). */
function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 flex-none fill-none stroke-current"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

const FACT_KEY = 'font-body text-caption italic leading-[1.4] text-accent-2';
const FACT_VALUE = 'm-0 font-display text-ui font-semibold leading-[1.35] text-ink';

/**
 * `#about`: Origin, the title block (FINAL-DESIGN §4.1). The page's one h1, the portrait (first phone screen), three
 * facts, the one-sentence statement, the live Sikahar readout, "Read the long version" (the three original paragraphs
 * and the winter chart, find-in-page reachable) and the route map as the page's contents.
 *
 * Grid: the section is a journal grid; the block spans its content tracks and lays out its own 12 columns with the
 * same gutter (so it aligns with every section below). Phones: facts (left) beside the portrait (40 %), then the
 * statement, the button and the readout. Markup order puts the facts before the statement (P1-8): the tab order then
 * follows the phone layout.
 */
export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-h"
      className="journal-grid scroll-mt-[calc(var(--nav-clear)+16px)] pt-[calc(var(--nav-clear)+clamp(12px,1.6vw,24px))]"
    >
      <div className="col-[content] grid grid-cols-[minmax(0,1fr)_40%] items-start gap-x-4 gap-y-5 md:grid-cols-12 md:gap-x-[var(--gutter)] md:gap-y-5">
        <h1
          id="about-h"
          tabIndex={-1}
          className="col-span-full m-0 font-display text-display font-bold leading-[1.04] tracking-[-0.02em] text-ink outline-none [--step-6:clamp(2.75rem,1.6rem+3.9vw,4.5rem)] [text-wrap:balance] md:col-[1/10] md:row-start-1 lg:tracking-[-0.03em]"
        >
          <TitleSentences text={ORIGIN.title} />
        </h1>

        <div className="col-start-2 row-start-2 min-w-0 md:col-[10/13] md:row-[1/6] [&_.plate]:rounded-panel">
          <MediaSlot
            id="M-ORIGIN-01"
            ratio="4:5"
            caption="none"
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 25vw, 40vw"
            priority
          />
        </div>

        <dl className="col-start-1 row-start-2 m-0 grid content-start gap-3.5 md:col-[1/10] md:row-start-4 md:flex md:flex-wrap md:gap-x-10 md:gap-y-3">
          <div className="grid gap-px">
            <dt className={FACT_KEY}>{ORIGIN_FACTS.bornInKey}</dt>
            <dd className={FACT_VALUE}>{ORIGIN.bornIn}</dd>
          </div>
          <div className="grid gap-px">
            <dt className={FACT_KEY}>{ORIGIN_FACTS.nowKey}</dt>
            <dd className={FACT_VALUE}>{ORIGIN.now}</dd>
          </div>
          <div className="grid gap-px">
            <dt className={FACT_KEY}>{ORIGIN_FACTS.featuredInKey}</dt>
            <dd className={FACT_VALUE}>
              <a
                href={PROFILE.links.news}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ORIGIN_FACTS.featuredInLinkName}
                className="prose-link -my-3 inline-flex min-h-11 items-center gap-1"
              >
                {ORIGIN.featuredIn}
                <ExternalArrow />
              </a>
            </dd>
          </div>
        </dl>

        <p className="col-span-full m-0 max-w-[30em] font-body text-lead text-ink [text-wrap:pretty] md:col-[1/8] md:row-start-2 lg:col-[1/7]">
          {ORIGIN.statement}
        </p>

        <LongVersion
          id="about-long"
          label={LONG_VERSION.button}
          minutes={LONG_VERSION.minutes(LONG_MINUTES)}
          buttonClassName="col-span-full md:col-[1/8] md:row-start-3 md:justify-self-start"
          regionClassName="col-span-full md:row-start-6"
          afterButton={
            <div className="col-span-full min-w-0 justify-self-start md:col-[1/10] md:row-start-5">
              <SikaharReadout copy={SIKAHAR_READOUT} observer={SKY_OBSERVER} />
            </div>
          }
        >
          <div className="grid gap-8 pb-1 pt-2 md:grid-cols-[minmax(0,64ch)_280px] md:items-start md:justify-between md:gap-6">
            <div className="grid max-w-[64ch] gap-4 font-body text-body text-ink">
              {ORIGIN.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="m-0 [text-wrap:pretty]">
                  {paragraph}
                </p>
              ))}
              <div className="grid gap-6 empty:hidden sm:grid-cols-2">
                {ORIGIN_OPTIONAL_SLOTS.map((id) => (
                  <MediaSlot key={id} id={id} />
                ))}
              </div>
            </div>
            <figure className="m-0 grid w-full max-w-[280px] gap-3">
              {/* A night window in both themes: the chart is the sky at night, so it keeps the Night palette. */}
              <div
                data-palette-scope="night"
                className="overflow-hidden rounded-full bg-ground-sky outline outline-1 -outline-offset-1 outline-line-strong forced-colors:outline-[CanvasText]"
              >
                <StarChart data={WINTER_SKY} title={ORIGIN.insetTitle} desc={ORIGIN.insetDesc} />
              </div>
              <figcaption className="max-w-[36em] font-body text-caption italic text-ink-muted">
                {ORIGIN.insetCaption}
              </figcaption>
              <OpenThisSky label={LONG_VERSION.openThisSky} href={SIKAHAR_READOUT.href} />
            </figure>
          </div>
        </LongVersion>
      </div>

      <RouteMap className="col-[content] mt-7 md:mt-8" />
    </section>
  );
}
