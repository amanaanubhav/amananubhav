/**
 * The 2 px signal horizon line of the theme sweep (§C.1), `z-theme-edge`. Hidden at rest;
 * `runThemeSweep` animates it along the clip edge with the Web Animations API and cancels the
 * animation when the view transition finishes.
 */
export function ThemeEdge() {
  return (
    <div
      data-theme-edge=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-theme-edge h-0.5 bg-signal opacity-0"
    />
  );
}
