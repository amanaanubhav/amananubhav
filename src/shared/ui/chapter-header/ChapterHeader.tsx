import type { ReactNode } from 'react';
import type { CSSVars } from '@/shared/lib/css';
import { cn } from '@/shared/lib/cn';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { RevealText } from './RevealText';
import { thinAirWidth } from './thin-air';

export type ChapterHeaderSize = 'display' | 'h2' | 'h3' | 'title';

export interface ChapterHeaderProps {
  as: 'h1' | 'h2' | 'h3';
  id?: string;
  children: ReactNode;
  /** Default: h1 display, h2 h2, h3 title. */
  size?: ChapterHeaderSize;
  /** Thin-air width from the waypoint altitude (§B.4.4); narrower below 768 px. */
  altitudeM?: number;
  /** Explicit width (default 112 display, 108 h2, 104 h3, 100 title). */
  wdth?: number;
  /** Default 'lines' for h2, 'none' for h1 and h3. The h1 is never split. */
  reveal?: 'lines' | 'none';
  /** Visually hidden prefix, e.g. 'Aman Anubhav: '. */
  srPrefix?: string;
  className?: string;
}

const DEFAULT_SIZE: Record<ChapterHeaderProps['as'], ChapterHeaderSize> = { h1: 'display', h2: 'h2', h3: 'title' };

/** Type scale step, Archivo weight and default width per size (§B.4.2). */
const SIZE_STYLE: Record<ChapterHeaderSize, { size: string; weight: string; wdth: number }> = {
  display: { size: 'text-display', weight: 'font-[750]', wdth: 112 },
  h2: { size: 'text-h2', weight: 'font-[650]', wdth: 108 },
  h3: { size: 'text-h3', weight: 'font-[650]', wdth: 104 },
  title: { size: 'text-title', weight: 'font-semibold', wdth: 100 },
};

/**
 * Chapter heading (§D.3): Archivo with a width axis, balanced wrapping, sentence case. Width is fixed on the
 * server (thin air from `altitudeM`, never animated): `--wdth` is set from `--wdth-wide`, and below 768 px from
 * `--wdth-compact` (also exposed as `data-wdth-compact`). h2s get the line-mask reveal by default.
 */
export function ChapterHeader({
  as,
  id,
  children,
  size,
  altitudeM,
  wdth,
  reveal,
  srPrefix,
  className,
}: ChapterHeaderProps) {
  const step = SIZE_STYLE[size ?? DEFAULT_SIZE[as]];
  const wide = altitudeM !== undefined ? thinAirWidth(altitudeM) : (wdth ?? step.wdth);
  const compact = altitudeM !== undefined ? thinAirWidth(altitudeM, { compact: true }) : wide;
  const style: CSSVars = { '--wdth-wide': wide, '--wdth-compact': compact };
  // The type-scale class stays outside cn(): tailwind-merge would read `text-h2` as a color and drop `text-ink`.
  const classes = `${step.size} ${cn(
    "m-0 font-display text-ink [font-variation-settings:'wdth'_var(--wdth,100)] [text-wrap:balance]",
    '[--wdth:var(--wdth-wide)] max-md:[--wdth:var(--wdth-compact)]',
    step.weight,
    className,
  )}`;
  const content = (
    <>
      {srPrefix ? <VisuallyHidden>{srPrefix}</VisuallyHidden> : null}
      {children}
    </>
  );

  const splits = as !== 'h1' && (reveal ?? (as === 'h2' ? 'lines' : 'none')) === 'lines';
  if (splits) {
    return (
      <RevealText as={as} id={id} style={style} wdthCompact={compact} className={classes}>
        {content}
      </RevealText>
    );
  }

  const Tag = as;
  return (
    <Tag id={id} style={style} data-wdth-compact={compact} className={classes}>
      {content}
    </Tag>
  );
}
