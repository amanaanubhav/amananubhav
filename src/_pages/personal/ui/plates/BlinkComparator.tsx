'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { hashSeed, mulberry32 } from '@/shared/lib/random';
import { INK, NS, ROUTE, r1 } from './svg';

const W = 360;
const H = 240;
/** The star field stops above the instrument strip (the bottom 44 units hold the controls). */
const FIELD_BOTTOM = 190;
const STARS = 200;
const FRAMES = 3;
/** One frame change every 600 ms: under 2 changes a second, well below the 3-flash limit (WCAG 2.3.1). */
const BLINK_MS = 600;
const BLINK_CYCLES = 3;

export const BLINK_CAPTION = 'Illustration of how a moving asteroid is spotted between frames';

/** The moving object's position in each synthetic frame. */
const ASTEROID: ReadonlyArray<readonly [number, number]> = [
  [148, 70],
  [176, 86],
  [204, 102],
];

/**
 * About 200 seeded background stars, identical in every frame, kept clear of the asteroid's track.
 * Faint stars are zero-length segments (`h0`); bright ones small crosses, so round caps print a
 * bigger blob. All in one path per frame.
 */
function starField(): string {
  const rand = mulberry32(hashSeed('blink-comparator'));
  let d = '';
  let n = 0;
  while (n < STARS) {
    const x = r1(14 + rand() * (W - 28));
    const y = r1(12 + rand() * (FIELD_BOTTOM - 20));
    const bright = rand() < 0.14;
    if (ASTEROID.some(([ax, ay]) => (ax - x) ** 2 + (ay - y) ** 2 < 144)) continue;
    d += bright ? `M${r1(x - 1)} ${y}h2M${x} ${r1(y - 1)}v2` : `M${x} ${y}h0`;
    n += 1;
  }
  return d;
}

const FIELD = starField();
const FRAME_PATHS = ASTEROID.map(([x, y]) => `${FIELD}M${x} ${y}h0`);

/* Reduced motion: the OS setting or the footer switch (html[data-motion='off']). */
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener('change', onChange);
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  return () => {
    mq.removeEventListener('change', onChange);
    mo.disconnect();
  };
}

function getReduced(): boolean {
  return window.matchMedia(REDUCE_QUERY).matches || document.documentElement.dataset.motion === 'off';
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, getReduced, () => false);
}

const CONTROL =
  'inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-transparent px-2.5 ' +
  'font-display text-caption font-semibold text-ink transition-colors duration-hover ease-settle ' +
  'hover:bg-surface-2 aria-pressed:border-ink aria-pressed:bg-surface-2 ' +
  'aria-pressed:shadow-[inset_0_-2px_0_rgb(var(--c-signal))] aria-disabled:cursor-not-allowed ' +
  'aria-disabled:border-line aria-disabled:text-ink-muted aria-disabled:hover:bg-transparent';

export interface BlinkComparatorProps {
  className?: string;
}

/**
 * G-06 blink comparator (client): three synthetic exposures of the same star field in which one dot
 * moves. Previous and Next step frames; Blink steps them every 600 ms for three cycles or until it
 * is pressed again. It never runs on its own, and never runs under reduced motion (stepping still
 * works). Carries its own caption.
 */
export function BlinkComparator({ className }: BlinkComparatorProps) {
  const id = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const reduced = useReducedMotion();
  const running = blinking && !reduced;

  useEffect(() => {
    if (!running) return;
    let steps = 0;
    const timer = window.setInterval(() => {
      steps += 1;
      setFrame((f) => (f + 1) % FRAMES);
      if (steps >= FRAMES * BLINK_CYCLES) setBlinking(false);
    }, BLINK_MS);
    // Stop when the plate leaves the viewport: no loop runs off-screen.
    const root = rootRef.current;
    const observer =
      root && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            if (entries.some((entry) => !entry.isIntersecting)) setBlinking(false);
          })
        : null;
    if (root) observer?.observe(root);
    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [running]);

  const step = useCallback((delta: 1 | -1) => {
    setBlinking(false);
    setFrame((f) => (f + delta + FRAMES) % FRAMES);
  }, []);

  const toggleBlink = useCallback(() => {
    if (reduced) return;
    setBlinking((on) => !on);
  }, [reduced]);

  const [ax, ay] = ASTEROID[frame];
  const noteId = `${id}-note`;

  return (
    <figure ref={rootRef} className={cn('m-0', className)}>
      <div className="relative aspect-[3/2] w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-d`}
          className="absolute inset-0 block size-full text-ink"
        >
          <title id={`${id}-t`}>{`Blink comparator, frame ${frame + 1} of ${FRAMES}`}</title>
          <desc id={`${id}-d`}>
            {`${BLINK_CAPTION}. Three synthetic exposures of the same patch of sky, about 200 stars. The stars stay put; one dot shifts down and to the right from frame to frame, and a ring marks it. Synthetic, not survey data.`}
          </desc>
          <path d={FRAME_PATHS[frame]} style={{ ...INK, strokeWidth: 1.6, opacity: 0.8 }} vectorEffect={NS} />
          <circle
            cx={ax}
            cy={ay}
            r={8}
            style={{ ...ROUTE, strokeDasharray: '3 4' }}
            vectorEffect={NS}
          />
          <text x={16} y={FIELD_BOTTOM - 4} fontSize={13} className="font-display fill-ink-muted">
            Synthetic frames
          </text>
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex h-[18.4%] min-h-10 items-center gap-1.5 border-t border-line bg-surface px-2 lg:pr-[calc(var(--caption-reserve,0px)_+_0.5rem)]">
          <button
            type="button"
            className={CONTROL}
            aria-pressed={running}
            aria-disabled={reduced || undefined}
            aria-describedby={reduced ? noteId : undefined}
            onClick={toggleBlink}
          >
            Blink
          </button>
          <button type="button" className={CONTROL} aria-label="Previous frame" onClick={() => step(-1)}>
            <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} />
          </button>
          <button type="button" className={CONTROL} aria-label="Next frame" onClick={() => step(1)}>
            <ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} />
          </button>
          <p
            className="ml-auto font-data text-caption tabular text-ink-muted"
            aria-live={running ? 'off' : 'polite'}
            aria-atomic="true"
          >
            {/* 1024-1279 px: the bar is narrow once it clears the rail, so "Frame" is spoken but not shown. */}
            <span className="lg:max-xl:sr-only">Frame </span>
            {frame + 1} of {FRAMES}
          </p>
        </div>
      </div>
      {/* Shown by CSS before paint (no layout shift once the client knows the motion setting). */}
      <p
        id={noteId}
        className="m-0 mt-2 hidden font-body text-caption text-ink-muted motion-reduce:block lg:pr-[var(--caption-reserve,0px)] [html[data-motion=off]_&]:block"
      >
        Blinking is off while reduced motion is on. Step through the frames with Previous and Next.
      </p>
      <figcaption className="mt-2 font-body text-caption italic text-ink-muted lg:pr-[var(--caption-reserve,0px)]">{BLINK_CAPTION}</figcaption>
    </figure>
  );
}
