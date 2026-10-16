'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { cn } from '@/shared/lib/cn';

export interface PlateImageProps {
  src: string;
  alt: string;
  sizes: string;
  objectPosition?: string;
  /** Pre-rendered toned variants; both render and CSS shows the current theme's one. */
  duotone?: { night: string; day: string };
  priority?: boolean;
  reveal?: 'develop' | 'none';
  callouts?: readonly { x: number; y: number; label: string }[];
  imgClassName?: string;
}

/** --ease-settle */
const EASE_SETTLE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const DEVELOP_MS = 800;
/** If the observer never reports the plate (scroll restore, odd layouts), develop it anyway once it is in view. */
const SAFETY_MS = 1500;
/** One grade for every ready photo (§C.7); duotones are already toned. */
const GRADE = 'photo-grade';

/**
 * A photo inside a plate (§C.7, §D.2). The pending fill sits underneath; the image "develops" over it on load
 * (clip from the bottom, scale 1.06 -> 1, blur 6 px -> 0, 800 ms) unless it was in view at mount, motion is off,
 * or it is a priority image. On error the image removes itself, so the pending fill and caption remain.
 *
 * The clip sits on the inner wrapper while the IntersectionObserver watches the unclipped outer one: Chrome
 * reports a fully clipped target as never intersecting, which would leave the photo hidden for good.
 */
export function PlateImage({
  src,
  alt,
  sizes,
  objectPosition,
  duotone,
  priority = false,
  reveal = 'develop',
  callouts,
  imgClassName,
}: PlateImageProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const onReadyRef = useRef<(() => void) | null>(null);
  const motionAllowed = useMotionAllowed();
  const [useOriginal, setUseOriginal] = useState(!duotone);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const el = wrapRef.current;
    if (!outer || !el || reveal === 'none' || !motionAllowed || priority) return;
    if (typeof el.animate !== 'function' || typeof IntersectionObserver === 'undefined') return;
    const isInView = () => {
      const rect = outer.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0;
    };
    // Visible at mount (or at hydration): never hidden, never animated.
    if (isInView()) return;

    el.style.clipPath = 'inset(100% 0 0 0)';
    let inView = false;
    let started = false;
    const animations: Animation[] = [];

    const timers: number[] = [];
    const start = () => {
      if (started || !inView || !loadedRef.current) return;
      started = true;
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      const options: KeyframeAnimationOptions = {
        duration: DEVELOP_MS,
        easing: EASE_SETTLE,
      };
      animations.push(
        el.animate(
          [
            { clipPath: 'inset(100% 0 0 0)', filter: 'blur(6px)' },
            { clipPath: 'inset(0% 0 0 0)', filter: 'blur(0px)' },
          ],
          options,
        ),
      );
      el.querySelectorAll('img').forEach((img) => {
        animations.push(img.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], options));
      });
      // The running animation holds the frames; when it ends the element rests unclipped.
      el.style.clipPath = '';
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          inView = true;
          start();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(outer);

    // Safety net: re-check in view a while after mount and after load; an image that decoded before
    // hydration (no onLoad) counts as loaded once complete.
    const safety = () => {
      if (started || !isInView()) return;
      inView = true;
      if (!loadedRef.current) {
        const imgs = Array.from(el.querySelectorAll('img'));
        if (imgs.length > 0 && imgs.some((img) => img.complete && img.naturalWidth > 0)) loadedRef.current = true;
      }
      start();
    };
    const armSafety = () => {
      if (!started) timers.push(window.setTimeout(safety, SAFETY_MS));
    };
    armSafety();
    onReadyRef.current = () => {
      start();
      armSafety();
    };

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      onReadyRef.current = null;
      animations.forEach((animation) => animation.cancel());
      el.style.clipPath = '';
    };
  }, [motionAllowed, priority, reveal]);

  const handleLoad = () => {
    loadedRef.current = true;
    setLoaded(true);
    onReadyRef.current?.();
  };

  if (failed) return null;

  const common = {
    sizes,
    fill: true,
    preload: priority,
    fetchPriority: priority ? ('high' as const) : undefined,
    placeholder: 'empty' as const,
    onLoad: handleLoad,
    style: objectPosition ? { objectPosition } : undefined,
  };

  return (
    <div ref={outerRef} className="absolute inset-0">
      <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
        {duotone && !useOriginal ? (
          <>
            <Image
              {...common}
              alt={alt}
              src={duotone.night}
              onError={() => setUseOriginal(true)}
              data-theme-only="night"
              className={cn('object-cover', imgClassName)}
            />
            <Image
              {...common}
              alt={alt}
              src={duotone.day}
              onError={() => setUseOriginal(true)}
              data-theme-only="day"
              className={cn('object-cover', imgClassName)}
            />
          </>
        ) : (
          <Image
            {...common}
            alt={alt}
            src={src}
            onError={() => setFailed(true)}
            className={cn('object-cover', GRADE, imgClassName)}
          />
        )}
        {loaded && callouts && callouts.length > 0 ? (
          <ul className="pointer-events-none absolute inset-0 m-0 hidden list-none p-0 md:block">
            {callouts.map((callout) => (
              <li
                key={`${callout.x}-${callout.y}-${callout.label}`}
                className="absolute flex -translate-x-[5px] -translate-y-1/2 items-center gap-2"
                style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
              >
                <span className="size-2.5 shrink-0 rounded-full border border-ink bg-surface" />
                <span className="rounded-control bg-surface px-1.5 py-0.5 font-body text-caption text-ink">
                  {callout.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
