'use client';

import type { MouseEvent, ReactNode } from 'react';
import { getLenis, scrollToTarget } from '@/shared/lib/smooth-scroll';

const px = (v: string) => Number.parseFloat(v) || 0;

/**
 * An in-page `#id` link: works without JS (native hash jump) and, with JS, jumps through `scrollToTarget`
 * (§C.2 rule 7) and moves focus to the target, the same way the section rail does (no focus ring on the section).
 */
export function HashLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    if (getLenis()) {
      // Lenis applies the target's scroll-margin-top and the root's scroll-padding-top itself.
      scrollToTarget(target);
    } else {
      const marginTop = px(getComputedStyle(target).scrollMarginTop);
      const paddingTop = px(getComputedStyle(document.documentElement).scrollPaddingTop);
      scrollToTarget(Math.max(0, target.getBoundingClientRect().top + window.scrollY - marginTop - paddingTop));
    }
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.style.outline = 'none';
    }
    target.focus({ preventScroll: true });
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
