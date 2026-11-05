'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface LongVersionProps {
  /** Id of the disclosed region (`aria-controls`). */
  id: string;
  /** `LONG_VERSION.button`. */
  label: string;
  /** `LONG_VERSION.minutes(n)`: "· 1 min". */
  minutes: string;
  /** Grid placement of the button inside the title block. */
  buttonClassName?: string;
  /** Grid placement of the region inside the title block. */
  regionClassName?: string;
  /** Rendered between the button and the region, so the DOM (and tab) order follows the phone layout (the readout). */
  afterButton?: ReactNode;
  /** The server-rendered long version: the three paragraphs and the winter chart. */
  children: ReactNode;
}

/** `MOTION.bezier.settle` / `.depart` (`--ease-settle` / `--ease-depart`), inlined so the island skips the config barrel. */
const EASE_SETTLE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_DEPART = 'cubic-bezier(0.55, 0, 1, 0.45)';
const OPEN_MS = 240;
const CLOSE_MS = 180;

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * "Read the long version": a disclosure button and the region it controls. The region is `hidden="until-found"`,
 * so find-in-page reaches the story and opens it (`beforematch`). React renders `hidden` as a boolean, so the server
 * sends a plain `hidden` and the client upgrades it on mount; from then on the attribute is managed here, never by
 * React (the prop never changes, so React never writes it again).
 * Motion (§3.4): rows 0fr → 1fr with opacity, 240 ms settle; close 180 ms depart; instant under reduced motion. The
 * clip is applied only while the rows animate, so focus rings inside are never cut.
 */
export function LongVersion({
  id,
  label,
  minutes,
  buttonClassName,
  regionClassName,
  afterButton,
  children,
}: LongVersionProps) {
  const [open, setOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    region.setAttribute('hidden', 'until-found');
    // The browser has already removed `hidden` when this fires.
    const onMatch = () => setOpen(true);
    region.addEventListener('beforematch', onMatch);
    return () => {
      region.removeEventListener('beforematch', onMatch);
      animation.current?.cancel();
    };
  }, []);

  const run = (region: HTMLDivElement, keyframes: Keyframe[], duration: number, easing: string, done?: () => void) => {
    region.dataset.animating = '';
    const a = region.animate(keyframes, { duration, easing, fill: 'forwards' });
    animation.current = a;
    a.onfinish = () => {
      delete region.dataset.animating;
      done?.();
      a.cancel();
    };
    a.oncancel = () => delete region.dataset.animating;
  };

  const toggle = () => {
    const region = regionRef.current;
    if (!region) return;
    const next = !open;
    setOpen(next);
    animation.current?.cancel();
    animation.current = null;
    const instant = reducedMotion();
    if (next) {
      region.removeAttribute('hidden');
      if (!instant) {
        run(region, [{ gridTemplateRows: '0fr', opacity: 0 }, { gridTemplateRows: '1fr', opacity: 1 }], OPEN_MS, EASE_SETTLE);
      }
      return;
    }
    const close = () => region.setAttribute('hidden', 'until-found');
    if (instant) close();
    else run(region, [{ gridTemplateRows: '1fr', opacity: 1 }, { gridTemplateRows: '0fr', opacity: 0 }], CLOSE_MS, EASE_DEPART, close);
  };

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        className={clsx(
          'satin-steel group inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-control border px-4',
          'font-display text-ui font-semibold leading-none text-ink transition-transform duration-micro active:scale-[0.97]',
          'md:w-auto md:[@media(pointer:fine)]:min-h-10',
          'aria-expanded:border-line-strong aria-expanded:bg-action-soft aria-expanded:shadow-[inset_0_-2px_0_var(--action-line)]',
          buttonClassName,
        )}
      >
        {label}
        <span className="font-data text-caption font-medium text-ink-muted">{minutes}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-[18px] flex-none fill-none stroke-current transition-transform duration-hover ease-settle group-aria-expanded:rotate-180 motion-reduce:transition-none"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {afterButton}
      <div
        ref={regionRef}
        id={id}
        hidden
        className={clsx(
          'grid-rows-[1fr] [&:not([hidden])]:grid [&[data-animating]>div]:overflow-hidden',
          regionClassName,
        )}
      >
        <div className="min-h-0">{children}</div>
      </div>
    </>
  );
}
