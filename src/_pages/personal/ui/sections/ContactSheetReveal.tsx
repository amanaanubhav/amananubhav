'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { MOTION } from '@/shared/config';
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { Button } from '@/shared/ui/button';
import { ALBUM_UI } from '../../config/content';

/** Frames per develop group, and the stagger inside a group (FINAL-DESIGN §3.4). */
const GROUP_MAX = MOTION.stagger.framesMax;
const STAGGER = MOTION.stagger.frames;
/** Album develop: opacity + 12 px rise, 400 ms, settle (§3.4). */
const DEVELOP_S = 0.4;
const RISE_PX = 12;

const noopSubscribe = () => () => undefined;
/** False in the server HTML and during hydration, true after: the sheet stays whole without script. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export interface ContactSheetRevealProps {
  /** Frames in the sheet; phones show the first `ALBUM_UI.phoneVisible`, then **Show all** (§4.6). */
  total: number;
  children: ReactNode;
}

/**
 * The contact sheet's client island (FINAL-DESIGN §4.6, §3.4).
 * - Develop: frames below the fold at mount rise into place once, in groups of at most six, 80 ms apart (opacity +
 *   12 px, 400 ms, settle). Only from script, only when motion is allowed (OS reduced motion and tier 0 keep the
 *   frames static), so the server HTML is always fully visible.
 * - Phones (< 768 px): once hydrated, frames after `ALBUM_UI.phoneVisible` collapse behind **Show all n frames**
 *   (`[data-extra]` + this root's `data-collapsed`); the button expands in place and moves focus to the next frame.
 *   Without script every frame shows and there is no button.
 */
export function ContactSheetReveal({ total, children }: ContactSheetRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();
  const hydrated = useHydrated();
  const [expanded, setExpanded] = useState(false);
  const collapsible = hydrated && !expanded && total > ALBUM_UI.phoneVisible;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !motionAllowed) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const below = gsap.utils
          .toArray<HTMLElement>(root.querySelectorAll('[data-frame]'))
          .filter((frame) => frame.offsetParent !== null && frame.getBoundingClientRect().top >= window.innerHeight);
        if (below.length === 0) return;
        gsap.set(below, { autoAlpha: 0, y: RISE_PX });
        ScrollTrigger.batch(below, {
          start: 'top 92%',
          once: true,
          batchMax: GROUP_MAX,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: DEVELOP_S,
              ease: MOTION.ease.settle,
              stagger: STAGGER,
              clearProps: 'opacity,visibility,transform',
            }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [motionAllowed], revertOnUpdate: true },
  );

  const showAll = () => {
    flushSync(() => setExpanded(true));
    const next = ref.current?.querySelectorAll<HTMLElement>('[data-frame]')[ALBUM_UI.phoneVisible];
    if (!next) return;
    if (!next.hasAttribute('tabindex')) next.setAttribute('tabindex', '-1');
    next.focus();
    ScrollTrigger.refresh();
  };

  return (
    <div ref={ref} data-collapsed={collapsible ? '' : undefined} className="group/sheet">
      {children}
      {collapsible ? (
        <Button variant="secondary" size="lg" onClick={showAll} className="mt-4 min-h-12 w-full md:hidden">
          {ALBUM_UI.showAll(total)}
        </Button>
      ) : null}
    </div>
  );
}

export interface AlbumClipProps {
  src: string;
  /** What the clip shows, without the "Clip: " prefix; names the button ("Play clip: …", WCAG 2.4.6). */
  name: string;
}

/**
 * An album clip, press to play (§4.6, §6.10): nothing autoplays. The poster is the clip's first frame (metadata
 * preload). A glass bead names the clip and shows Play / Pause; the clip pauses when it leaves the screen. The video
 * itself is hidden from assistive tech: the visible caption and the named button carry it.
 */
export function AlbumClip({ src, name }: AlbumClipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => !entry.isIntersecting) && !video.paused) video.pause();
      },
      { threshold: 0 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  const label = playing ? ALBUM_UI.pauseClip(name) : ALBUM_UI.playClip(name);
  const Icon = playing ? Pause : Play;

  return (
    <>
      <video
        ref={videoRef}
        // `#t=0.1` makes Safari paint the first frame as the poster.
        src={`${src}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className={
          'glass-chrome glass-bead absolute bottom-2 left-2 z-[1] inline-flex h-10 items-center gap-1.5 rounded-full ' +
          'pl-2.5 pr-3.5 font-display text-caption font-semibold text-ink ' +
          'transition-transform duration-micro active:scale-[0.97] [@media(pointer:coarse)]:h-11'
        }
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" fill="currentColor" strokeWidth={0} />
        <span>{playing ? ALBUM_UI.pause : ALBUM_UI.play}</span>
      </button>
    </>
  );
}
