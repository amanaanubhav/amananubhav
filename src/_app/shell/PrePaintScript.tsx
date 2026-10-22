'use client';

import { MOTION_GATE_SCRIPT } from '@/shared/lib/motion-tier';
import { BOOT_GATE_SCRIPT } from '@/widgets/preloader';

const GATE_SCRIPT = MOTION_GATE_SCRIPT + BOOT_GATE_SCRIPT;

/**
 * The pre-paint gates as the first child of the root `<head>`: motion (§C.4), then the boot curtain
 * (preloader design §4.1). In the server HTML it is an ordinary parser-blocking inline script, so
 * `html[data-motion]` / `html[data-lite]` / `html[data-boot]` are set before first paint (no flash, no CLS).
 *
 * It only ever needs to run that once, during the HTML parse. On the client React renders the same
 * node as an inert data block (`type="text/plain"`): hydration adopts the server node untouched (the
 * `type` difference is covered by suppressHydrationWarning), and if the client ever has to create it
 * (a root re-render, Fast Refresh) React 19 never builds an executable script it would not run anyway,
 * which is what its "Encountered a script tag while rendering React component" warning is about.
 */
export function PrePaintScript() {
  const onServer = typeof window === 'undefined';
  return (
    <script
      type={onServer ? undefined : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }}
    />
  );
}
