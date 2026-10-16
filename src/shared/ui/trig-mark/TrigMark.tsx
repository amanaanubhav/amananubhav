export interface TrigMarkProps {
  /** Rendered size in CSS px (the drawing is a 16-unit triangle). Default 16. */
  size?: number;
  className?: string;
  /** Accessible name; without it the mark is decorative (`aria-hidden`). */
  title?: string;
}

/**
 * The brand mark (G-11): a survey trig point, an equilateral triangle of side 16 with a centre dot,
 * drawn in `currentColor` (callers color it, usually `text-signal`).
 */
export function TrigMark({ size = 16, className, title }: TrigMarkProps) {
  const labelled = Boolean(title);
  return (
    <svg
      width={size}
      height={size}
      viewBox="-1 -1 18 18"
      fill="none"
      className={className}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {labelled ? <title>{title}</title> : null}
      <path
        d="M8 1.07 16 14.93H0Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx={8} cy={10.31} r={1.7} fill="currentColor" />
    </svg>
  );
}
