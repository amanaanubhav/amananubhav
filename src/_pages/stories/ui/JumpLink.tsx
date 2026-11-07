'use client';

import type { MouseEvent, ReactNode } from 'react';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { isNotebookLive, openNotebookPage } from '../lib/notebook-bus';
import { resolveNotebookPage } from '../lib/notebook-pages';

interface JumpLinkProps {
  /** Id of the section (or field notebook page, or Himachal entry) to jump to. */
  targetId: string;
  children: ReactNode;
  className?: string;
  /** Runs before the jump (e.g. closing the atlas caption card). */
  onJump?: () => void;
}

/**
 * An in-page link that works without JS (`href="#id"`) and, with JS, jumps through `scrollToTarget`
 * (§C.2 rule 7) and moves focus to the section so keyboard and screen-reader users land there too.
 * A field notebook page or entry (`#dodital`, `#triund`) is opened through the notebook controller instead, which
 * turns to the page, scrolls to the book and focuses the page's heading (NOTEBOOK-DESIGN §1.5).
 */
export function JumpLink({ targetId, children, className, onJump }: JumpLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const notebook = resolveNotebookPage(targetId);
    if (notebook && isNotebookLive()) {
      event.preventDefault();
      onJump?.();
      openNotebookPage(notebook, { scroll: true });
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
