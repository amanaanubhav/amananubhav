'use client';

import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/shared/ui/button';

export interface AltitudeStripProps {
  /** Accessible name of the strip. */
  label: string;
  /** The `<li>` plates, rendered on the server. */
  children: ReactNode;
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/*
 * Wheel handling (§G.2, §C.3). The strip scrolls itself sideways, but it spans the full width, so it must never
 * swallow vertical wheel input meant for the page:
 * - `data-lenis-prevent-horizontal` (the gesture-scoped form of §C.3's `data-lenis-prevent`, Lenis >= 1.3):
 *   Lenis leaves horizontal wheel and trackpad gestures to the strip and keeps smooth-scrolling the page on
 *   vertical ones. A blanket `data-lenis-prevent` handed vertical wheels to the browser, where the strip trapped
 *   them (QA round 1).
 * - `overflow-y: hidden`: the strip is never a vertical scroller.
 * - Lenis's stylesheet gives every prevent-marked element `overscroll-behavior: contain` on both axes; the
 *   `html.lenis` override (more specific than `.lenis [data-lenis-prevent-horizontal]`) keeps the x axis
 *   contained and lets the y axis chain to the page.
 */
const STRIP =
  'scroll-pane relative m-0 flex list-none snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain p-0 px-4 pb-4 ' +
  '[html.lenis_&]:[overscroll-behavior:contain_auto] ' +
  'md:scroll-px-8 md:px-8 lg:mr-24 lg:scroll-px-[clamp(32px,4vw,72px)] lg:px-[clamp(32px,4vw,72px)]';

/**
 * The altitude strip (§G.2): 3:2 mountain plates in a native horizontal scroller with mandatory snap.
 * Previous and Next buttons step one plate on desktop and disable at the ends. Keyboard focus scrolls the
 * focused card to its snap start, so a card is never left half off-screen on phones (where the buttons hide and
 * mandatory snap can pull the browser's own focus scroll back to the previous card).
 */
export function AltitudeStrip({ label, children }: AltitudeStripProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setAtStart(list.scrollLeft <= 1);
    setAtEnd(list.scrollLeft + list.clientWidth >= list.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    measure();
    list.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(list);
    return () => {
      list.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [measure]);

  const step = (direction: -1 | 1) => {
    const list = listRef.current;
    const first = list?.querySelector('li');
    if (!list || !first) return;
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    list.scrollBy({
      left: direction * (first.getBoundingClientRect().width + gap),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const revealFocused = (event: FocusEvent<HTMLUListElement>) => {
    const list = event.currentTarget;
    const item = event.target instanceof Element ? event.target.closest('li') : null;
    if (!item || item.parentElement !== list) return;
    const style = getComputedStyle(list);
    const padStart = Number.parseFloat(style.scrollPaddingLeft) || 0;
    const padEnd = Number.parseFloat(style.scrollPaddingRight) || 0;
    const listBox = list.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    const fullyVisible =
      itemBox.left >= listBox.left + padStart - 1 && itemBox.right <= listBox.right - padEnd + 1;
    if (fullyVisible) return;
    list.scrollTo({
      left: list.scrollLeft + (itemBox.left - listBox.left) - padStart,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="relative">
      <ul ref={listRef} aria-label={label} data-lenis-prevent-horizontal className={STRIP} onFocus={revealFocused}>
        {children}
      </ul>
      <div className="mt-4 hidden justify-end gap-2 px-8 lg:flex lg:pr-28">
        <IconButton label="Previous plate" icon={ChevronLeft} variant="outline" disabled={atStart} onClick={() => step(-1)} />
        <IconButton label="Next plate" icon={ChevronRight} variant="outline" disabled={atEnd} onClick={() => step(1)} />
      </div>
    </div>
  );
}
