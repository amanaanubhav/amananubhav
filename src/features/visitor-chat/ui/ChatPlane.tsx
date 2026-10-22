/**
 * The "Ridge Dart" (chat design §2): a paper plane taking off from the climbing half of the Alpenglow ridge, drawn
 * as its contrail. Lucide grid, 1.75 stroke, `currentColor`. `.plane` and `.trail` are separate groups, so the
 * launcher's hover and the Send flight can move the plane while the trail holds.
 */
export function ChatPlane({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g className="plane">
        <path d="M20.5 3.5 4 10l5.6 2.3 2.3 5.7Z" />
        <path d="m20.5 3.5-10.9 8.8" />
      </g>
      <path className="trail" d="M2.75 20.75 5 18.5l1.75 1.25L9 17.25" />
    </svg>
  );
}
