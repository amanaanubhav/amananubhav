'use client';

import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, MotionConfig } from 'motion/react';

import { getExpedition } from '@/entities/expedition';
import { storyLayoutIds, type Story } from '@/entities/story';
import { getMedia, MOTION, type MediaRatio, type MediaSlotId } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import type { CSSVars } from '@/shared/lib/css';
import { useBodyScrollLock, useEscapeKey } from '@/shared/lib/dom';
import { useMotionAllowed, useReducedMotionPreference } from '@/shared/lib/motion-tier';
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { Button } from '@/shared/ui/button';
import { thinAirWidth } from '@/shared/ui/chapter-header';
import { ElevationProfile } from '@/shared/ui/charts';
import { Log, PlateFrame } from '@/shared/ui/journal';
import { MediaFill, MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import { prepareStoryHtml, routeProfileDesc, routeProfilePoints, storyLog } from './reader-content';

/** Scrubbed timelines run only when the OS allows motion (§C.4); `useMotionAllowed()` gates the rest. */
const PROGRESS_QUERY = '(prefers-reduced-motion: no-preference)';

type StoryReaderModalProps = {
  story: Story;
  onClose: () => void;
};

const FULL = 'col-[content-start/content-end]';
const TEXT_COLUMN = cn(FULL, 'lg:col-[5/span_7]');
const COVER_SIZES = '(min-width: 1280px) 880px, (min-width: 1024px) 66vw, 100vw';
const PLATE_SIZES = '(min-width: 1280px) 380px, (min-width: 640px) 50vw, 100vw';

/**
 * Story body headings are promoted to h2/h3 under the reader's h1 (`prepareStoryHtml`); these keep the look the
 * prose rules give the source h3/h4 (§B.4.5). Utilities load after `.prose-journal`, so they win at equal weight.
 */
const PROSE_HEADINGS =
  "[&_h2]:mb-[0.6em] [&_h2]:mt-[2.5em] [&_h2]:font-display [&_h2]:text-[length:var(--step-3)] [&_h2]:font-semibold [&_h2]:leading-[1.25] [&_h2]:tracking-[-0.01em] [&_h2]:[font-variation-settings:'wdth'_100] " +
  '[&_h3]:mb-[0.5em] [&_h3]:mt-[1.75em] [&_h3]:text-[length:var(--step-2)] [&_h3]:leading-[1.3] [&_h3]:tracking-[-0.005em] ' +
  '[&_h2+h3]:mt-[0.75em]';

/** The visible line under a pending cover ("Photo to come: ..."), as every other pending plate shows it. */
function pendingCoverCaption(id: MediaSlotId | undefined): string | undefined {
  if (!id) return undefined;
  const entry = getMedia(id);
  if (!entry || entry.status !== 'placeholder' || entry.optional || entry.hidden) return undefined;
  const label = entry.kind === 'video' ? 'Clip to come' : entry.kind === 'screen' ? 'Screens to come' : 'Photo to come';
  return `${label}: ${entry.short}`;
}

/** Slots that would render nothing (optional or hidden placeholders, data) never get a list item. */
function rendersPlate(id: MediaSlotId): boolean {
  const entry = getMedia(id);
  if (!entry || entry.kind === 'data') return false;
  return !(entry.status === 'placeholder' && (entry.optional || entry.hidden));
}

/** §H.8: reader plates are 3:2 standard plates (object-cover crop over the registry ratio); clips keep theirs (§C.7). */
function plateRatio(id: MediaSlotId): MediaRatio | undefined {
  return getMedia(id)?.kind === 'video' ? undefined : '3:2';
}

/**
 * The story reader (§H.8): a full-screen reading surface under the site navbar. Not a focus trap and not
 * `aria-modal`: the navbar above it stays operable (and closes the story), while the shell makes the page
 * behind it inert. Escape closes; focus goes to the title on open and back to the card on close. Close is
 * instant (no AnimatePresence); the cover and title morph from the card through `storyLayoutIds`.
 */
export function StoryReaderModal({ story, onClose }: StoryReaderModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const expedition = story.expeditionId ? getExpedition(story.expeditionId) : undefined;
  const profilePoints = useMemo(() => (expedition ? routeProfilePoints(expedition) : []), [expedition]);
  const hasProfile = profilePoints.filter((p) => p.altitudeM !== undefined).length > 1;
  const html = useMemo(() => prepareStoryHtml(story.content), [story.content]);
  const plates = (story.slotIds ?? []).filter(rendersPlate);
  const layoutIds = storyLayoutIds(story.id);
  // Tier 0 opens with a 150 ms fade (§C.4). `MotionConfig reducedMotion="user"` in Providers follows only the OS
  // setting, so the footer "Reduce motion" switch turns the shared-element morph off here as well.
  const motionOk = useMotionAllowed();
  const [motionForcedOff] = useReducedMotionPreference();

  // The page behind holds still (now also stops Lenis).
  useBodyScrollLock();
  useEscapeKey(() => onClose());

  // Focus: the title on open; on close, back to whatever opened the story (the card), unless the visitor
  // already moved focus on purpose (a navbar link that closes the story and navigates).
  useLayoutEffect(() => {
    const active = document.activeElement;
    const opener =
      active instanceof HTMLElement && active !== document.body && !containerRef.current?.contains(active)
        ? active
        : null;
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      requestAnimationFrame(() => {
        const current = document.activeElement;
        if (current instanceof HTMLElement && current !== document.body && current.isConnected) return;
        if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
      });
    };
  }, []);

  // Reading progress, scrubbed on the reader's own scroller: the trek profile's signal copy is revealed
  // through `--profile-progress` (no React render per frame); other stories grow a 2 px signal line.
  // Under reduced motion or tier 0 (§C.4) nothing scrubs: the strip stays a plain profile, the line stays hidden.
  useGSAP(
    () => {
      const scroller = containerRef.current;
      const article = articleRef.current;
      if (!scroller || !article || !motionOk) return;
      const mm = gsap.matchMedia();
      mm.add(PROGRESS_QUERY, () => {
        const scrollTrigger = {
          trigger: article,
          scroller,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
        };
        if (profileRef.current) {
          gsap.fromTo(
            profileRef.current,
            { '--profile-progress': 0 },
            { '--profile-progress': 1, ease: 'none', scrollTrigger },
          );
        } else if (lineRef.current) {
          gsap.fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger });
        }
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [story.id, motionOk], revertOnUpdate: true },
  );

  // Thin air (§B.4.4): trek titles narrow with the trek's high point; never animated.
  const highM = expedition?.highPoint.altitudeM;
  const titleStyle: CSSVars = {
    '--wdth-wide': highM !== undefined ? thinAirWidth(highM) : 112,
    '--wdth-compact': highM !== undefined ? thinAirWidth(highM, { compact: true }) : 100,
  };
  const profileStyle: CSSVars = { '--profile-progress': 0 };

  const coverFill =
    expedition && hasProfile ? (
      <ElevationProfile
        variant="cover"
        points={profilePoints}
        title={`Elevation profile of the ${expedition.shortName}`}
        desc={routeProfileDesc(expedition, profilePoints)}
        spacing="auto"
        className="size-full"
      />
    ) : undefined;

  const log = storyLog(story, expedition);
  const coverCaption = pendingCoverCaption(story.coverSlot);

  return (
    <MotionConfig reducedMotion={motionForcedOff ? 'always' : 'user'}>
      <motion.div
        ref={containerRef}
        role="dialog"
        aria-labelledby={titleId}
        data-lenis-prevent
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={motionOk ? { duration: MOTION.dur.ui, ease: MOTION.bezier.settle } : { duration: 0.15 }}
        className="scroll-pane fixed inset-0 z-reader overflow-y-auto overscroll-contain bg-ground text-ink"
      >
        {/* The site navbar (z-navbar) covers the first 56 px; the reader's own bar sits directly under it. */}
        <div className="sticky top-0 z-10 bg-ground pt-14">
          <div className="relative border-b border-line">
            <div className="journal-grid h-14">
              <div className={cn(FULL, 'flex min-w-0 items-center gap-4')}>
                <Button variant="secondary" icon={ArrowLeft} onClick={onClose} className="shrink-0 px-4">
                  Back to field notes
                </Button>
                {expedition && hasProfile ? (
                  <div
                    ref={profileRef}
                    aria-hidden="true"
                    className="h-7 min-w-0 flex-1 max-md:min-w-12"
                    style={profileStyle}
                  >
                    <ElevationProfile
                      variant="strip"
                      points={profilePoints}
                      title={`Reading progress along the ${expedition.shortName}`}
                      desc={routeProfileDesc(expedition, profilePoints)}
                      className="h-7 w-full"
                    />
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
                {/* Below 768 px the bar keeps the date only (the field log under the title repeats both facts). */}
                <Log
                  layout="strip"
                  label="Story"
                  items={[{ key: 'date', value: story.date }]}
                  className="min-w-0 text-right md:hidden [&_dt]:sr-only"
                />
                <Log
                  layout="strip"
                  label="Story"
                  items={[
                    { key: 'date', value: story.date },
                    { key: 'category', value: story.category, mono: false },
                  ]}
                  className="hidden shrink-0 md:flex"
                />
              </div>
            </div>
            {expedition && hasProfile ? null : (
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5">
                <div ref={lineRef} className="h-full origin-left scale-x-0 bg-signal" />
              </div>
            )}
          </div>
        </div>

        <div className="journal-grid pb-24 pt-8 lg:pb-32 lg:pt-12">
          {/* Cover: the exact shared-element structure of the story card (§G.4, §K.8). */}
          <div className={cn(FULL, 'lg:col-[5/span_8] lg:row-start-1')}>
            <motion.div layoutId={layoutIds.container} className="relative w-full">
              <motion.div layoutId={layoutIds.image} className="relative w-full">
                {story.coverSlot ? (
                  <MediaSlot
                    id={story.coverSlot}
                    ratio="3:2"
                    layout="wide"
                    sizes={COVER_SIZES}
                    caption="none"
                    reveal="none"
                    fill={coverFill}
                  />
                ) : (
                  <PlateFrame ratio="3:2" tone="pending" ticks grid>
                    {coverFill ?? <MediaFill kind="contour" seed={story.id} />}
                  </PlateFrame>
                )}
              </motion.div>
            </motion.div>
            {/* Outside the morph wrappers, so the card-to-reader morph keeps one box. The plate's own figcaption
                (visually hidden) already carries this text for screen readers. */}
            {coverCaption ? (
              <p
                aria-hidden="true"
                className="m-0 mt-3 max-w-measure font-body text-caption italic text-ink-muted [text-wrap:pretty]"
              >
                {coverCaption}
              </p>
            ) : null}
          </div>

          {/* A plain div, not <header>: inside the dialog it would read as a second banner landmark. */}
          <div className={cn(FULL, 'mt-8 lg:col-[5/span_8] lg:row-start-2 lg:mt-12')}>
            <motion.h1
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              layoutId={layoutIds.title}
              style={titleStyle}
              className={cn(
                "m-0 font-display text-display font-[750] text-ink [font-variation-settings:'wdth'_var(--wdth,100)] [text-wrap:balance]",
                '[--wdth:var(--wdth-wide)] max-md:[--wdth:var(--wdth-compact)] focus:outline-none',
              )}
            >
              {story.title}
            </motion.h1>
            <p className="m-0 mt-4 max-w-measure font-body text-lead text-ink-muted [text-wrap:pretty]">
              {story.subtitle}
            </p>
          </div>

          <div
            className={cn(
              FULL,
              'mt-6 lg:col-[2/span_3] lg:row-[2/span_2] lg:mt-12 lg:self-start lg:pt-2 xl:sticky xl:top-[136px]',
            )}
          >
            <Log items={log} label="Field log" />
          </div>

          <div className={cn(TEXT_COLUMN, 'mt-10 lg:row-start-3 lg:mt-12')}>
            <article
              ref={articleRef}
              className={`prose-journal ${PROSE_HEADINGS}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {story.links.length > 0 ? (
              <nav aria-labelledby={`${titleId}-links`} className="mt-12 max-w-measure">
                <h2 id={`${titleId}-links`} className="m-0 font-display text-title font-semibold text-ink">
                  Further reading
                </h2>
                <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 font-body text-body">
                  {story.links.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="prose-link">
                        {link.label}
                        <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {plates.length > 0 ? (
              <ul
                aria-label="Plates"
                className="m-0 mt-16 grid list-none items-start gap-x-6 gap-y-10 p-0 sm:grid-cols-2"
              >
                {plates.map((id) => (
                  <li key={id} className="min-w-0">
                    <MediaSlot id={id} layout="standard" ratio={plateRatio(id)} sizes={PLATE_SIZES} caption="short" />
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-16 flex flex-col items-start gap-6 border-t border-line pt-6">
              <Log layout="strip" items={[{ key: 'filed', value: story.date }]} />
              <Button variant="secondary" icon={ArrowLeft} onClick={onClose}>
                Back to field notes
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </MotionConfig>
  );
}

/**
 * Entry point of the reader's lazy chunk (`StoryReaderHost`): returns the element with the statically defined
 * `StoryReaderModal` as its type, keyed by story so a new story always opens at its top.
 */
export function renderStoryReader(story: Story, onClose: () => void) {
  return <StoryReaderModal key={story.id} story={story} onClose={onClose} />;
}
