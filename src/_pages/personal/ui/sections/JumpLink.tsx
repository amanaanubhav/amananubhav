'use client';

import type { MouseEvent, ReactNode } from 'react';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';

export interface JumpLinkProps {
  /** Id of the section on this page to jump to. */
  targetId: string;
  children: ReactNode;
  className?: string;
}

/**
 * An in-page link (§C.2 rule 7): a plain `href="#id"` without JS; with JS it jumps through `scrollToTarget`
 * (never native smooth scrolling, which fights Lenis) and moves focus to the section so keyboard and
 * screen-reader users land there too.
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
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
