'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { cn } from '@/shared/lib/cn';
import { IconButton } from '@/shared/ui/button';

/** 'inview' loops while at least half is in view; 'interaction' starts only on hover or tap. */
export type PlateVideoPlay = 'inview' | 'interaction';

export interface PlateVideoProps {
  src: string;
  /** Default 'inview'. */
  play?: PlateVideoPlay;
  /** Accessible description of the clip; empty for a decorative loop. */
  label?: string;
  objectPosition?: string;
  className?: string;
}

/**
 * A muted looping clip inside a plate (§C.7): `preload="none"`, plays only while at least half of it is in view
 * and motion is allowed, pauses off-screen, and always shows a pause/play button (WCAG 2.2.2). At tier 0 it never
 * starts on its own; the button still plays it. A pause by the visitor sticks until they press play again.
 * With `play="interaction"` it never starts on scroll: a mouse hover plays it and leaving pauses it, a tap
 * toggles it; at tier 0 hover and tap do nothing and only the button plays it (§G.5).
 */
export function PlateVideo({ src, play = 'inview', label, objectPosition, className }: PlateVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const motionAllowed = useMotionAllowed();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (entry.intersectionRatio >= 0.5) {
          if (play === 'inview' && motionAllowed && !userPausedRef.current && video.paused) {
            video.play().catch(() => undefined);
          }
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [motionAllowed, play]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      video.play().catch(() => undefined);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  const interactive = play === 'interaction' && motionAllowed;

  const onPointerEnter = (event: PointerEvent<HTMLVideoElement>) => {
    const video = videoRef.current;
    if (!interactive || event.pointerType !== 'mouse' || !video?.paused) return;
    userPausedRef.current = false;
    video.play().catch(() => undefined);
  };

  const onPointerLeave = (event: PointerEvent<HTMLVideoElement>) => {
    const video = videoRef.current;
    if (!interactive || event.pointerType !== 'mouse' || !video || video.paused) return;
    video.pause();
  };

  /** Touch and pen have no hover: a tap on the clip toggles it (the button stays the keyboard route). */
  const onPointerUp = (event: PointerEvent<HTMLVideoElement>) => {
    if (interactive && event.pointerType !== 'mouse') toggle();
  };

  if (failed) return null;

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onPointerEnter={interactive ? onPointerEnter : undefined}
        onPointerLeave={interactive ? onPointerLeave : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        style={objectPosition ? { objectPosition } : undefined}
      />
      <IconButton
        label={playing ? 'Pause clip' : 'Play clip'}
        icon={playing ? Pause : Play}
        onClick={toggle}
        size={40}
        variant="outline"
        className="absolute bottom-2 right-2 z-[1] bg-surface hover:bg-surface-2"
      />
    </>
  );
}
