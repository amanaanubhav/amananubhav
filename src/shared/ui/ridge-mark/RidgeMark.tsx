import { cn } from '@/shared/lib/cn';
import {
  MARK_VIEWBOX,
  RIDGE_OFFSET_Y,
  RIDGE_PATH,
  TREKKER_TRANSFORM,
  ridgeStroke,
  trekkerFor,
  type TrekkerFigure,
} from './geometry';

export interface RidgeMarkProps {
  /** Rendered height in CSS px; the mark is 2:1, so it is twice as wide. Default 20. */
  size?: number;
  /** The trekker catches the alpenglow (signal); otherwise he is drawn in `currentColor` like the ridge. */
  lit?: boolean;
  className?: string;
  /** Accessible name; without it the mark is decorative (`aria-hidden`). */
  title?: string;
}

/** The summit trekker alone, as a group in the mark's 48 × 24 box (fill and stroke follow `currentColor`). */
export function Trekker({ figure, className }: { figure: TrekkerFigure; className?: string }) {
  const { head, body, limbs } = figure;
  return (
    <g transform={TREKKER_TRANSFORM} fill="currentColor" className={className}>
      <circle cx={head.cx} cy={head.cy} r={head.r} />
      <path d={body} />
      {limbs ? (
        <path d={limbs.d} fill="none" stroke="currentColor" strokeWidth={limbs.width} strokeLinecap="round" />
      ) : null}
    </g>
  );
}

/**
 * Aman's signature mark: the Alpenglow ridge (the AI terminal's altitude profile) with a trekker standing on
 * its summit. Ridge in `currentColor`; `lit` turns the trekker to the signal color. Below 28 px a simplified
 * trekker is drawn and the ridge stroke thickens, so the mark reads from 20 px to 96 px.
 */
export function RidgeMark({ size = 20, lit = false, className, title }: RidgeMarkProps) {
  const labelled = Boolean(title);
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox={MARK_VIEWBOX}
      fill="none"
      // Forced colors keep authored SVG colors (preserve-parent-color), so the mark opts into system colors.
      className={cn(className, 'forced-colors:text-[CanvasText]')}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {labelled ? <title>{title}</title> : null}
      <path
        d={RIDGE_PATH}
        transform={`translate(0 ${RIDGE_OFFSET_Y})`}
        stroke="currentColor"
        strokeWidth={ridgeStroke(size)}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Trekker figure={trekkerFor(size)} className={lit ? 'text-signal forced-colors:text-[Highlight]' : undefined} />
    </svg>
  );
}
