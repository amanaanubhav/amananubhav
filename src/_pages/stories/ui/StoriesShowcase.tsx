'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { STORIES, getFeaturedStories } from '@/entities/story';
import { useScrollToTopOnMount } from '@/shared/lib/dom';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { FIELD_NOTES_COPY } from '../config/treks';
import { useStackedCardsTimeline } from '../lib/use-stacked-cards-timeline';
import { useStoryFilters } from '../model/use-story-filters';
import { ArchiveDrawer } from './ArchiveDrawer';
import { MechanicalCard } from './MechanicalCard';

const FEATURED_STORIES = getFeaturedStories(STORIES, 3);
const DRAWER_ID = 'field-notes-index';

/*
 * Two layouts, chosen before paint by the same signals as the rest of the site (§C.4): the staged stack and a
 * static list (reduced motion, lite devices). The base rules are the static list; the staged
 * rules apply only when motion is on. Cards are never hidden by CSS: the first card rests in place and the
 * timeline's fromTo moves the others below the track on hydration (the section sits far below the fold), so
 * nothing waits for JavaScript to become readable.
 *
 * The staged track hugs its content: the cards and the index button (the section heading scrolls away above
 * it). It is pinned with CSS `position: sticky` inside `.fn-pin`, never by switching to `position: fixed`, so the
 * pin records no layout shift (CLS). The timeline sets `--fn-pin-len` (the scroll length of the pin, drawn as the
 * wrapper's `::after` spacer) and `--fn-h` (the track height); the sticky `top` centres the track in the band
 * between the navbar (`--nav-clear`) and the phone dock (`--dock-h`, 0 from 1024 px), never above the navbar band.
 * The cards share one grid cell (each offset 20 px down by its index), so the stack is as tall as its tallest card;
 * the button follows in normal flow, always visible and never over a cover. Covers shrink with the viewport
 * height, keeping their 3:2 ratio, so a whole card fits on short laptops and phones: from 768 px the cover column
 * is at most `min(360px, 100svh - 18rem)` tall (the text column takes the freed width), on phones the cover
 * narrows once the window is shorter than about 740 px. The subtitle drops on phones and below 820 px tall.
 * The track clips (`overflow: clip`, not a scroll container), so focusing a card can never scroll the track.
 */
const STAGED = "html:not([data-motion='off']):not([data-lite='1'])";
const STACK_CSS = `
.fn-track{position:relative;display:flex;flex-direction:column}
.fn-cards{position:relative;display:grid;gap:48px;margin-top:40px;padding-inline:16px}
.fn-cta{display:flex;justify-content:center;margin-top:48px;padding-inline:16px}
@media (min-width:768px){.fn-cards,.fn-cta{padding-inline:32px}}
@media (prefers-reduced-motion:no-preference){
${STAGED} .fn-pin{margin-top:40px}
${STAGED} .fn-pin::after{content:'';display:block;height:var(--fn-pin-len,0px)}
${STAGED} .fn-track{position:sticky;top:max(var(--nav-clear),calc((100svh + var(--nav-clear) - var(--dock-h,0px) - var(--fn-h,0px)) / 2));overflow:hidden;overflow:clip}
${STAGED} .fn-cards{display:grid;flex:0 1 auto;min-height:0;margin-top:0;gap:0}
${STAGED} .fn-card{position:relative;grid-area:1/1;align-self:start;margin-top:calc(var(--card-index,0) * 20px);will-change:transform}
${STAGED} .fn-cover{max-width:max(55%,calc((100svh - 30rem) * 1.5))}
${STAGED} .fn-cta{position:relative;flex:none;margin-block:16px 8px}
}
@media (prefers-reduced-motion:no-preference) and (min-width:768px){
${STAGED} .fn-card article{grid-template-columns:minmax(0,1fr) min(58%,calc(min(360px,100svh - 18rem) * 1.5))}
${STAGED} .fn-cover{max-width:none}
}
@media (prefers-reduced-motion:no-preference) and (max-height:820px),(prefers-reduced-motion:no-preference) and (max-width:767px){
${STAGED} .fn-sub{display:none}
}`;

/**
 * `#adventures` (§G.4): the heading, the stacked journal-entry cards, then the inline journal index. Covers
 * arrive as server-rendered nodes keyed by story id.
 */
export function StoriesShowcase({ covers }: { covers: Readonly<Record<string, ReactNode>> }) {
  useScrollToTopOnMount();

  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const archiveRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);

  const [showArchive, setShowArchive] = useState(false);
  const filters = useStoryFilters();

  useStackedCardsTimeline(sectionRef, pinRef, triggerRef);

  // Once the drawer has mounted: jump to it through Lenis (never scrollIntoView), then re-measure triggers.
  useEffect(() => {
    if (!showArchive || !pendingScroll.current) return;
    pendingScroll.current = false;
    const frame = requestAnimationFrame(() => {
      if (archiveRef.current) scrollToTarget(archiveRef.current);
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [showArchive]);

  const handleOpenArchive = (): void => {
    if (!showArchive) {
      pendingScroll.current = true;
      setShowArchive(true);
    } else {
      setShowArchive(false); // Toggle close
    }
  };

  const handleCollapse = (): void => {
    setShowArchive(false);
    // The collapse button unmounts with the drawer: hand focus back to the control that opened it.
    requestAnimationFrame(() => ctaRef.current?.querySelector('button')?.focus({ preventScroll: true }));
  };

  return (
    <section ref={sectionRef} id="adventures" aria-labelledby="adventures-title" tabIndex={-1} className="relative w-full focus:outline-none">
      <style href="aa-field-notes-stack" precedence="default">
        {STACK_CSS}
      </style>

      <header className="journal-grid">
        <div className="col-[content-start/content-end] lg:col-[2/span_8]">
          <ChapterHeader as="h2" id="adventures-title">
            {FIELD_NOTES_COPY.headline}
          </ChapterHeader>
          <p className="m-0 mt-3 max-w-measure font-body text-lead text-ink-muted [text-wrap:pretty]">
            {FIELD_NOTES_COPY.line}
          </p>
        </div>
      </header>

      {/* The pin wrapper (ScrollTrigger trigger) and the sticky track: the cards and the index button */}
      <div ref={pinRef} className="fn-pin">
        <div ref={triggerRef} className="fn-track">
          <div className="fn-cards">
            {FEATURED_STORIES.map((story, index) => (
              <MechanicalCard key={story.id} story={story} index={index} cover={covers[story.id]} />
            ))}
          </div>

          {/* The index button: in normal flow under the cards, visible through the whole stack */}
          <div ref={ctaRef} className="fn-cta z-10">
            <Button
              variant="secondary"
              size="lg"
              icon={ChevronDown}
              iconPosition="end"
              onClick={handleOpenArchive}
              aria-expanded={showArchive}
              aria-controls={showArchive ? DRAWER_ID : undefined}
              className={`bg-ground ${showArchive ? '[&_svg]:rotate-180' : ''} [&_svg]:transition-transform [&_svg]:duration-ui`}
            >
              {showArchive ? FIELD_NOTES_COPY.close : FIELD_NOTES_COPY.open}
            </Button>
          </div>
        </div>
      </div>

      {/* Inline journal index */}
      <AnimatePresence>
        {showArchive && (
          <ArchiveDrawer ref={archiveRef} id={DRAWER_ID} filters={filters} onCollapse={handleCollapse} />
        )}
      </AnimatePresence>
    </section>
  );
}
