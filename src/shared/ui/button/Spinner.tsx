/**
 * 270° arc spinner (§D.3): signal on outline and text buttons, on-signal inside the primary fill.
 * Spins 1 s linear; static under reduced motion (OS setting or the footer switch).
 */
export function Spinner() {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="size-[18px] shrink-0 animate-spin text-signal motion-reduce:animate-none group-[.btn-primary]/button:text-current"
    >
      <circle
        cx={9}
        cy={9}
        r={7}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="32.99 43.98"
      />
    </svg>
  );
}
