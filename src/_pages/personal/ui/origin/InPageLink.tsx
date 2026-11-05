'use client';

import type { ReactNode } from 'react';
import { prefetchSky } from '../../lib/sky-commands';
import { isPlainClick, landOn } from './land';

export interface InPageLinkProps {
  /** `#id` of a section (or of `#sky-live`, which focuses `#sky-h`). */
  href: string;
  className?: string;
  /** Warm the sky's lazy chunk on hover or focus (the links that land on the sky). */
  prefetch?: boolean;
  children: ReactNode;
}

/**
 * A real `#hash` anchor (it works without script) that lands per BUILD-PLAN §2.3 once hydrated: Lenis-aware scroll and
 * focus on the target's heading. A modified click keeps the browser's own behaviour.
 */
export function InPageLink({ href, className, prefetch = false, children }: InPageLinkProps) {
  const warm = prefetch ? prefetchSky : undefined;
  return (
    <a
      href={href}
      className={className}
      onPointerEnter={warm}
      onFocus={warm}
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        if (landOn(href)) e.preventDefault();
      }}
    >
      {children}
    </a>
  );
}
