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
 * Two layouts, chosen before paint by the same signals as the rest of the site (§C.4): the staged stack
 * (a pinned 100vh track, cards absolutely stacked, revealed by the scrubbed timeline) and a static list
 * (reduced motion, the footer switch, lite devices). The base rules are the static list; the staged rules
 * apply only when motion is on. Cards are never hidden by CSS: the first card rests in place and the
 * timeline's fromTo moves the others below the track on hydration (the section sits far below the fold), so
 * nothing waits for JavaScript to become readable. The track clips (`overflow: clip`, not a scroll container),
 * so focusing a card below its edge can never scroll the track itself.
 * The CTA rests at opacity 0 until the end of the scrub but stays in the tab order, so it shows whenever it
 * holds focus (`!important` beats the inline styles GSAP writes): keyboard focus never lands on an invisible control.
 */
const STAGED = "html:not([data-motion='off']):not([data-lite='1'])";
const STACK_CSS = `
.fn-track{position:relative;display:flex;flex-direction:column;padding-bottom:96px}
.fn-cards{position:relative;display:grid;gap:48px;margin-top:40px;padding-inline:16px}
.fn-cta{display:flex;justify-content:center;margin-top:48px;padding-inline:16px}
@media (min-width:768px){.fn-cards,.fn-cta{padding-inline:32px}}
@media (prefers-reduced-motion:no-preference){
${STAGED} .fn-track{height:100vh;overflow:hidden;overflow:clip;padding-bottom:0}
${STAGED} .fn-cards{display:block;flex:1 1 auto;min-height:0;margin-top:24px}
${STAGED} .fn-card{position:absolute;left:16px;right:16px;top:calc(var(--card-index,0) * 20px);will-change:transform}
${STAGED} .fn-cta{position:absolute;left:0;right:0;bottom:80px;margin:0;opacity:0;pointer-events:none;transform:translateY(20px)}
${STAGED} .fn-cta:focus-within{opacity:1!important;pointer-events:auto!important}
}
@media (prefers-reduced-motion:no-preference) and (min-width:768px){
${STAGED} .fn-card{left:32px;right:32px}
${STAGED} .fn-cta{bottom:32px}
}
@media (prefers-reduced-motion:no-preference) and (max-width:767px) and (max-height:740px){
${STAGED} .fn-sub{display:none}
}`;

/**
 * `#adventures` (§G.4): the stacked field-note cards (pin, scrub and end unchanged), then the inline
 * field-notes index. Covers arrive as server-rendered nodes keyed by story id.
 */
export function StoriesShowcase({ covers }: { covers: Readonly<Record<string, ReactNode>> }) {
  useScrollToTopOnMount();

  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const archiveRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);

  const [showArchive, setShowArchive] = useState(false);
  const filters = useStoryFilters();

  useStackedCardsTimeline(sectionRef, triggerRef, ctaRef);

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

      {/* ScrollTrigger track (pinned in the staged layout) */}
      <div ref={triggerRef} className="fn-track">
        <header className="journal-grid pt-20">
          <div className="col-[content-start/content-end] lg:col-[2/span_8]">
            <ChapterHeader as="h2" id="adventures-title" reveal="none">
              {FIELD_NOTES_COPY.headline}
            </ChapterHeader>
            <p className="m-0 mt-3 max-w-measure font-body text-lead text-ink-muted">{FIELD_NOTES_COPY.line}</p>
          </div>
        </header>

        <div className="fn-cards">
          {FEATURED_STORIES.map((story, index) => (
            <MechanicalCard key={story.id} story={story} index={index} cover={covers[story.id]} />
          ))}
        </div>

        {/* Scroll CTA: in the staged layout its CSS start state mirrors the GSAP fromTo, so it never flashes */}
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

      {/* Inline field-notes index */}
      <AnimatePresence>
        {showArchive && (
          <ArchiveDrawer ref={archiveRef} id={DRAWER_ID} filters={filters} onCollapse={handleCollapse} />
        )}
      </AnimatePresence>
    </section>
  );
}
