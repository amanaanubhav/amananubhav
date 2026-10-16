import type { CSSProperties, ReactNode } from 'react';
import type { MediaRatio } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { Log } from './Log';
import type { LogEntry } from './Log';

export interface PlateFrameProps {
  ratio: MediaRatio;
  as?: 'figure' | 'div';
  /** "Plate 4" (Plex Mono); only where the sequence is real. */
  number?: number;
  /** Literata italic 14 px. */
  caption?: ReactNode;
  /** Place, altitude, date under the caption. */
  log?: readonly LogEntry[];
  /** pending = surface-2 ground under the MediaFill (MediaSlot placeholders). */
  tone?: 'default' | 'pending';
  /** 10 px registration crosses at the corners (blueprints, pending plates). */
  ticks?: boolean;
  /** 24 px survey grid background (pending and blueprint plates only). */
  grid?: boolean;
  /** Visually hide the caption but keep it as the accessible description. */
  captionHidden?: boolean;
  className?: string;
  /** Classes for the fixed-ratio box itself (e.g. a max width). */
  boxClassName?: string;
  children: ReactNode;
}

/** '3:2' -> '3 / 2' for the CSS `aspect-ratio` property. */
export function aspectRatioCss(ratio: MediaRatio): string {
  const [w, h] = ratio.split(':');
  return `${w} / ${h}`;
}

/** 24 px survey grid in contour ink (§B.1: `--ink-contour` draws minor contours, the survey grid and ticks). */
const GRID_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, var(--ink-contour) 1px, transparent 1px), linear-gradient(to bottom, var(--ink-contour) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
  backgroundPosition: 'center center',
};

/**
 * The four 10 px crosses, 8 px in from each corner, drawn by one SVG (user units are CSS px; nested `<svg>`s
 * place the right and bottom crosses by percentage), so pages with many plates stay within the inline SVG
 * budget (§J.2).
 */
function RegistrationTicks() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className="pointer-events-none absolute left-2 top-2 z-[1] h-[calc(100%-1rem)] w-[calc(100%-1rem)] overflow-visible text-line-strong"
    >
      <path d="M5 0V10M0 5H10" />
      <svg x="100%" overflow="visible">
        <path d="M-5 0V10M-10 5H0" />
      </svg>
      <svg y="100%" overflow="visible">
        <path d="M5 0V-10M0-5H10" />
      </svg>
      <svg x="100%" y="100%" overflow="visible">
        <path d="M-5 0V-10M-10-5H0" />
      </svg>
    </svg>
  );
}

/**
 * A printed plate (§D.1, §B.6): a fixed aspect-ratio box (class "plate", radius 0, no border) with an optional
 * caption line ("Plate 4", the caption, a log strip). The fixed ratio reserves the space, so nothing shifts on load.
 */
export function PlateFrame({
  ratio,
  as = 'figure',
  number,
  caption,
  log,
  tone = 'default',
  ticks = false,
  grid = false,
  captionHidden = false,
  className,
  boxClassName,
  children,
}: PlateFrameProps) {
  const Outer = as;
  const CaptionTag = as === 'figure' ? 'figcaption' : 'div';
  const hasLog = Boolean(log && log.length > 0);
  const hasCaption = number !== undefined || caption != null || hasLog;

  return (
    <Outer className={cn('m-0 min-w-0', className)}>
      <div
        className={cn('plate relative w-full overflow-hidden', tone === 'pending' && 'bg-surface-2', boxClassName)}
        style={{ aspectRatio: aspectRatioCss(ratio), ...(grid ? GRID_STYLE : null) }}
      >
        {children}
        {ticks ? <RegistrationTicks /> : null}
      </div>
      {hasCaption ? (
        <CaptionTag
          className={cn(captionHidden ? 'sr-only' : 'mt-3 flex flex-col gap-1.5 lg:pr-[var(--caption-reserve,0px)]')}
        >
          {number !== undefined || caption != null ? (
            <p className="m-0 max-w-measure font-body text-caption italic text-ink-muted [text-wrap:pretty]">
              {number !== undefined ? (
                <span className="mr-2 font-data not-italic text-ink [font-variant-numeric:tabular-nums_slashed-zero]">
                  Plate {number}
                </span>
              ) : null}
              {caption}
            </p>
          ) : null}
          {hasLog && log ? <Log items={log} layout="strip" /> : null}
        </CaptionTag>
      ) : null}
    </Outer>
  );
}
