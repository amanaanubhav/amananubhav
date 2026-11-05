'use client';

import type { MouseEvent, ReactNode } from 'react';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';

export interface JumpLinkProps {
  /** Id of the element on this page to jump to. */
  targetId: string;
  children: ReactNode;
  className?: string;
}

/**
 * Where focus lands for an in-page jump (BUILD-PLAN §2.3): the element named by the target's `data-focus`
 * (`#sky-live` → `#sky-h`), else a section's own heading (its `aria-labelledby`), else the target itself.
 */
function focusTargetOf(target: HTMLElement): HTMLElement {
  const named = target.dataset.focus ?? (target.tagName === 'SECTION' ? target.getAttribute('aria-labelledby') : null);
  return (named ? document.getElementById(named) : null) ?? target;
}

/**
 * An in-page link (§2.3): a plain `href="#id"` without JS; with JS it lands through `scrollToTarget` (never native
 * smooth scrolling, which fights Lenis) and moves focus to the target's heading, so keyboard and screen-reader users
 * land there too. Modified clicks keep the browser's own behaviour.
 */
export function JumpLink({ targetId, children, className }: JumpLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
    const focusEl = focusTargetOf(target);
    if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
    focusEl.focus({ preventScroll: true });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
