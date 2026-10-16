'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform, type MotionStyle } from 'motion/react';
import { ANNAPURNA_ROUTE } from '@/entities/expedition';
import { ElevationProfile } from '@/shared/ui/charts';
import { TrigMark } from '@/shared/ui/trig-mark';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { headlampAt, PRELOADER_TARGET } from '../lib/route-line';

export interface PreloaderProps {
  onComplete: () => void;
}

const nf = new Intl.NumberFormat('en');
const TARGET_TEXT = nf.format(PRELOADER_TARGET.altitudeM);

/** The readout and the drawing jump to their final state under reduced motion (OS or the footer switch). */
const LIVE_ONLY = '[html[data-motion=off]_&]:hidden';
const STATIC_ONLY = 'hidden [html[data-motion=off]_&]:inline';

/**
 * Base camp (§H.4). Timing is unchanged from the original boot screen: the count runs 0 to 100 over
 * 1.5 s (easeInOut), holds 200 ms, the panel slides up (1,000 ms), and `onComplete` fires 800 ms after
 * the slide starts. The count drives an altimeter (0 m to 5,416 m) and the Annapurna profile through
 * `--profile-progress`, with no React render per frame. Server-rendered as the first paint.
 */
export function Preloader({ onComplete }: PreloaderProps) {
  const count = useMotionValue(0);
  const progress = useTransform(count, (value) => Math.min(1, Math.max(0, value / 100)));
  const readout = useTransform(count, (value) => nf.format(Math.round((value / 100) * PRELOADER_TARGET.altitudeM)));
  const lampLeft = useTransform(progress, (p) => `${headlampAt(p).xPct}%`);
  const lampTop = useTransform(progress, (p) => `${headlampAt(p).yPct}%`);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let slideTimer: ReturnType<typeof setTimeout> | undefined;
    let completeTimer: ReturnType<typeof setTimeout> | undefined;

    // Animate count from 0 to 100
    const controls = animate(count, 100, {
      duration: 1.5,
      ease: 'easeInOut',
      onComplete: () => {
        // Wait a small moment after hitting 100 before sliding out
        slideTimer = setTimeout(() => {
          setIsFinished(true);
          completeTimer = setTimeout(onComplete, 800); // Wait for slide animation to finish
        }, 200);
      },
    });

    return () => {
      controls.stop();
      clearTimeout(slideTimer);
      clearTimeout(completeTimer);
    };
  }, [count, onComplete]);

  const profileStyle = { '--profile-progress': progress } as MotionStyle;

  return (
    <div
      role="status"
      className={
        'fixed inset-0 z-preloader flex flex-col justify-between bg-ground px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7 ' +
        'transition-transform duration-1000 ease-glide ' +
        (isFinished ? '-translate-y-full' : 'translate-y-0')
      }
    >
      <VisuallyHidden>Loading</VisuallyHidden>

      <div aria-hidden="true" className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 font-body text-ui italic text-ink-muted">
          <TrigMark size={18} className="shrink-0 text-signal" />
          Base camp
        </span>
        <span className="font-data text-caption text-ink-muted tabular">
          {PRELOADER_TARGET.name}, {TARGET_TEXT} m
        </span>
      </div>

      <p
        aria-hidden="true"
        className="m-0 flex items-baseline gap-2 font-display font-[750] leading-none text-ink tabular [font-variation-settings:'wdth'_75]"
        style={{ fontSize: 'clamp(64px, 15vw, 96px)' }}
      >
        <motion.span className={LIVE_ONLY}>{readout}</motion.span>
        <span className={STATIC_ONLY}>{TARGET_TEXT}</span>
        <span className="font-data text-[0.3em] font-normal text-ink-muted [font-variation-settings:normal]">m</span>
      </p>

      <motion.div
        aria-hidden="true"
        className="relative h-[120px] w-full [html[data-motion=off]_&]:![--profile-progress:1]"
        style={profileStyle}
      >
        <ElevationProfile
          points={ANNAPURNA_ROUTE}
          variant="preloader"
          title="Annapurna Circuit elevation profile"
          desc="The route from Besisahar over Thorong La to Muktinath, drawn as the page loads."
          className="h-[120px] w-full"
        />
        <motion.span
          className={`absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal forced-colors:bg-[CanvasText] ${LIVE_ONLY}`}
          style={{ left: lampLeft, top: lampTop }}
        />
        <span
          className={`absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal forced-colors:bg-[CanvasText] ${STATIC_ONLY}`}
          style={{ left: `${headlampAt(1).xPct}%`, top: `${headlampAt(1).yPct}%` }}
        />
      </motion.div>

      {/* The theme-sweep edge: the panel's bottom edge carries the signal line as it leaves. */}
      <span
        aria-hidden="true"
        className={
          'absolute inset-x-0 bottom-0 h-0.5 bg-signal transition-opacity duration-micro ' +
          (isFinished ? 'opacity-100' : 'opacity-0')
        }
      />
    </div>
  );
}
