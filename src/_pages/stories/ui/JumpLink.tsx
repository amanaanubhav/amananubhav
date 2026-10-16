'use client';

import type { MouseEvent, ReactNode } from 'react';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';

interface JumpLinkProps {
  /** Id of the section to jump to (the section carries tabIndex={-1} so it can take focus). */
  targetId: string;
  children: ReactNode;
  className?: string;
  /** Runs before the jump (e.g. closing the atlas caption card). */
  onJump?: () => void;
}

/**
 * An in-page link that works without JS (`href="#id"`) and, with JS, jumps through `scrollToTarget`
 * (§C.2 rule 7) and moves focus to the section so keyboard and screen-reader users land there too.
 */
export function JumpLink({ targetId, children, className, onJump }: JumpLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    onJump?.();
    scrollToTarget(target);
    target.focus({ preventScroll: true });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
