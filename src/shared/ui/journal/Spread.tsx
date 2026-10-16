import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type PlateSpan = 'standard' | 'wide' | 'bleed' | 'none';

export interface SpreadProps {
  id?: string;
  as?: 'section' | 'article' | 'div' | 'li';
  /** Usually a <ChapterHeader/>. */
  heading: ReactNode;
  /** Usually a <Log/>: a column at >= 1024 px, a strip after the heading below. */
  log?: ReactNode;
  /** Body copy and actions. */
  children?: ReactNode;
  /** Usually a <MediaSlot/> or a generated plate. */
  plate?: ReactNode;
  /** standard = cols 9-12 beside the text | wide = cols 4-12 under the text | bleed = col 8 to the right edge. */
  plateSpan?: PlateSpan;
  /** Sticky log column at >= 1280 px (top 96 px). Default true. */
  logSticky?: boolean;
  /** aria-labelledby (pass the heading id). */
  labelledBy?: string;
  className?: string;
}

/*
 * Placements (§B.5). At >= 1024 px explicit grid lines: log `2 / span 3`, text `5 / span 5`,
 * plate `10 / span 4`, wide plate `5 / span 9` under the text, bleed plate `9 / full-end` (the text then
 * narrows to `5 / span 4`, cols 4-7, as in the home hero).
 * Below 1024 px every part spans `content-start / content-end` in DOM order (heading, log strip, body,
 * plate) and bleed plates span `full-start / full-end`. The log is never above the heading.
 * Rows at >= 1024 px are `auto 1fr` (a wide plate adds an implicit auto row 3): the plate and log span rows 1-2,
 * and the extra height they need goes to the 1fr body row, so the heading row stays as tall as the heading and
 * the body sits right under it.
 */
const FULL_CONTENT = 'col-[content-start/content-end]';

/*
 * Standard and wide plates end at content-end, `--margin` from the window edge, under the fixed rail from 1024 px.
 * The plate may run under it (§B.5), but its caption text may not (§J.3: the rail reserves 96 px), so these
 * placements publish `--caption-reserve` (96 px less the margin) for PlateFrame captions and other plate text.
 */
const RAIL_CAPTION_RESERVE = 'lg:[--caption-reserve:calc(96px_-_var(--margin))]';

const PLATE_CLASSES: Record<Exclude<PlateSpan, 'none'>, string> = {
  standard: cn(FULL_CONTENT, 'mt-8 lg:col-[10/span_4] lg:row-[1/span_2] lg:mt-0 lg:self-start', RAIL_CAPTION_RESERVE),
  wide: cn(FULL_CONTENT, 'mt-8 lg:col-[5/span_9] lg:row-start-3 lg:mt-12', RAIL_CAPTION_RESERVE),
  bleed: cn('col-[full-start/full-end] mt-8 lg:col-[9/full-end] lg:row-[1/span_2] lg:mt-0 lg:self-start'),
};

/** One journal spread: heading, log, story column and plate on the journal grid (§D.1). */
export function Spread({
  id,
  as: Tag = 'section',
  heading,
  log,
  children,
  plate,
  plateSpan = 'standard',
  logSticky = true,
  labelledBy,
  className,
}: SpreadProps) {
  const showPlate = plate != null && plateSpan !== 'none';
  // A bleed plate starts at content column 8, so the text column narrows to cols 4-7 beside it.
  const textCols = showPlate && plateSpan === 'bleed' ? 'lg:col-[5/span_4]' : 'lg:col-[5/span_5]';
  return (
    <Tag id={id} aria-labelledby={labelledBy} className={cn('journal-grid lg:grid-rows-[auto_1fr]', className)}>
      <div className={cn(FULL_CONTENT, textCols, 'lg:row-start-1')}>{heading}</div>
      {log != null ? (
        <div
          className={cn(
            FULL_CONTENT,
            'mt-3 lg:col-[2/span_3] lg:row-[1/span_2] lg:mt-0 lg:self-start lg:pt-2',
            logSticky && 'xl:sticky xl:top-24',
          )}
        >
          {log}
        </div>
      ) : null}
      {children != null ? (
        <div className={cn(FULL_CONTENT, textCols, 'mt-4 lg:row-start-2 lg:self-start')}>{children}</div>
      ) : null}
      {showPlate ? <div className={PLATE_CLASSES[plateSpan]}>{plate}</div> : null}
    </Tag>
  );
}
