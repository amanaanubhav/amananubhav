import { useEffect } from 'react';

import { acquireScrollLock } from '@/shared/lib/smooth-scroll';

/* Body overflow is ref-counted too, so overlapping overlays never restore it early. */
let bodyLocks = 0;
let previousOverflow = '';

function lockBody(): () => void {
  if (bodyLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    bodyLocks = Math.max(0, bodyLocks - 1);
    if (bodyLocks === 0) document.body.style.overflow = previousOverflow;
  };
}

/**
 * Locks page scroll while active (§C.3): `body { overflow: hidden }` (needed when Lenis is off)
 * plus the ref-counted Lenis lock. Both are released on cleanup. Signature unchanged.
 */
export function useBodyScrollLock(active: boolean = true): void {
  useEffect(() => {
    if (!active) return;
    const releaseBody = lockBody();
    const releaseLenis = acquireScrollLock();
    return () => {
      releaseLenis();
      releaseBody();
    };
  }, [active]);
}
