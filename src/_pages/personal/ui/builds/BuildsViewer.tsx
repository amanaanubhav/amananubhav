'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MOTION } from '@/shared/config';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { DrawRegistryContext, createDrawRegistry } from '../plates/draw-registry';

const WIDE_QUERY = '(min-width: 1024px)';
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const bezier = (points: readonly number[]): string => `cubic-bezier(${points.join(', ')})`;
const SETTLE = bezier(MOTION.bezier.settle);
const DEPART = bezier(MOTION.bezier.depart);

/** Plate labels read near 14 px at any plate width: 13 viewBox units at 360 px wide, fewer as the plate grows. */
function plateFontSize(width: number): string {
  return `${Math.min(13, Math.max(8.6, (14.5 * 360) / width)).toFixed(2)}px`;
}

export interface BuildsViewerProps {
  /** The server-rendered light table: chip index, the article list and the viewer's five figures. */
  children: ReactNode;
  className?: string;
}

/**
 * The light table's controller (FINAL §4.3.3), a client island over server-rendered markup. It works through data
 * attributes, so nothing re-renders:
 * - `[data-build="<id>"]` articles: the one crossing the viewport's centre band becomes active (desktop only); a press
 *   of its `[data-build-show]` button activates it at once without scrolling. Active sets `data-active` and
 *   `aria-current` on the button.
 * - `[data-viewer-fig="<id>"]` figures: one shown (`data-shown`). The first activation of a plate draws it (its
 *   `"<id>:viewer"` handle in the registry); later ones cross-fade (out 120 ms depart, in 180 ms settle with an 8 px
 *   rise; reduced motion: a 150 ms fade). Switching mid-draw finishes the old drawing.
 * - `a[data-build-chip]` (phones): lands on the article and focuses its h3.
 * - `[data-plate]`: label size follows the plate's width.
 * The first viewer plate draws itself on view (its own `DrawOnView`), so it counts as drawn from the start.
 */
export function BuildsViewer({ children, className }: BuildsViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [registry] = useState(createDrawRegistry);
  const motionAllowed = useMotionAllowed();
  const motionRef = useRef(motionAllowed);
  useEffect(() => {
    motionRef.current = motionAllowed;
  }, [motionAllowed]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const wide = window.matchMedia(WIDE_QUERY);
    const reduce = window.matchMedia(REDUCE_QUERY);
    const articles = Array.from(root.querySelectorAll<HTMLElement>('[data-build]'));
    const order = articles.map((a) => a.dataset.build ?? '');
    const figs = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>('[data-viewer-fig]').forEach((f) => figs.set(f.dataset.viewerFig ?? '', f));

    const drawn = new Set<string>(order.slice(0, 1));
    let active: string | null = null;
    let seq = 0;
    let fadeOut: Animation | null = null;
    let fadeIn: Animation | null = null;

    const mark = (id: string) => {
      articles.forEach((a) => {
        const on = a.dataset.build === id;
        a.dataset.active = String(on);
        const button = a.querySelector('[data-build-show]');
        if (on) button?.setAttribute('aria-current', 'true');
        else button?.removeAttribute('aria-current');
      });
    };
    const show = (id: string) => figs.forEach((f, key) => (f.dataset.shown = String(key === id)));

    const enter = (id: string, token: number) => {
      if (token !== seq) return;
      show(id);
      const handle = registry.get(`${id}:viewer`);
      if (handle && !drawn.has(id) && motionRef.current) {
        drawn.add(id);
        handle.replay();
        return;
      }
      const fig = figs.get(id);
      if (!fig || typeof fig.animate !== 'function') return;
      fadeIn = fig.animate(
        reduce.matches
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'none' },
            ],
        { duration: reduce.matches ? 150 : 180, easing: SETTLE },
      );
    };

    const activate = (id: string | undefined) => {
      if (!id || !wide.matches || id === active) return;
      const prev = active;
      active = id;
      const token = ++seq;
      mark(id);
      fadeIn?.cancel();
      fadeIn = null;
      const interrupted = fadeOut !== null;
      fadeOut?.cancel();
      fadeOut = null;
      if (!prev) {
        show(id);
        return;
      }
      registry.get(`${prev}:viewer`)?.finish();
      const prevFig = figs.get(prev);
      // Mid-switch already: skip a second fade-out and bring the new plate straight in.
      if (interrupted || !prevFig || typeof prevFig.animate !== 'function' || prevFig.dataset.shown !== 'true') {
        enter(id, token);
        return;
      }
      const out = prevFig.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reduce.matches ? 75 : 120,
        easing: DEPART,
        fill: 'forwards',
      });
      fadeOut = out;
      out.onfinish = () => {
        if (fadeOut === out) fadeOut = null;
        enter(id, token);
        out.cancel();
      };
    };

    if (wide.matches) activate(order[0]);
    const onWide = () => {
      if (!wide.matches) return;
      active = null;
      activate(order[0]);
    };
    wide.addEventListener('change', onWide);

    // The article crossing the middle band becomes active; a press wins until the next crossing.
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) =>
              entries.forEach((entry) => {
                if (entry.isIntersecting) activate((entry.target as HTMLElement).dataset.build);
              }),
            { rootMargin: '-45% 0px -45% 0px' },
          )
        : null;
    articles.forEach((a) => io?.observe(a));

    // Phones and tablets: the strip (one article at a time), its counter and steps, and the chip index's current mark.
    const strip = root.querySelector<HTMLElement>('[data-build-strip]');
    const cards = strip ? Array.from(strip.querySelectorAll<HTMLElement>('[data-build-card]')) : [];
    const count = root.querySelector<HTMLElement>('[data-strip-count]');
    const steps = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-strip-step]'));
    const chips = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[data-build-chip]'));
    let index = -1;
    let stripFrame = 0;
    const snapLine = (): number =>
      strip ? strip.getBoundingClientRect().left + (parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0) : 0;
    /** The card whose left edge sits nearest the strip's snap line. */
    const nearest = (): number => {
      const line = snapLine();
      let best = 0;
      cards.forEach((card, i) => {
        if (Math.abs(card.getBoundingClientRect().left - line) < Math.abs(cards[best].getBoundingClientRect().left - line)) best = i;
      });
      return best;
    };
    const syncStrip = () => {
      stripFrame = 0;
      if (!strip || wide.matches || cards.length === 0) return;
      const i = nearest();
      if (i === index) return;
      index = i;
      const template = count?.dataset.template;
      if (count && template) count.textContent = template.replace('{n}', String(i + 1)).replace('{total}', String(cards.length));
      steps.forEach((step) => {
        step.disabled = Number(step.dataset.stripStep) < 0 ? i === 0 : i === cards.length - 1;
      });
      chips.forEach((chip) => {
        if (chip.dataset.buildChip === order[i]) chip.setAttribute('aria-current', 'true');
        else chip.removeAttribute('aria-current');
      });
    };
    const onStripScroll = () => {
      if (!stripFrame) stripFrame = requestAnimationFrame(syncStrip);
    };
    const goTo = (i: number) => {
      const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
      if (!strip || !card) return;
      strip.scrollTo({
        left: strip.scrollLeft + card.getBoundingClientRect().left - snapLine(),
        behavior: reduce.matches || !motionRef.current ? 'auto' : 'smooth',
      });
    };
    const onStep = (event: Event) => goTo(nearest() + Number((event.currentTarget as HTMLElement).dataset.stripStep));
    strip?.addEventListener('scroll', onStripScroll, { passive: true });
    steps.forEach((step) => step.addEventListener('click', onStep));
    syncStrip();

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLElement>('[data-build-show]');
      if (button) {
        activate(button.dataset.buildShow);
        return;
      }
      const chip = target?.closest<HTMLAnchorElement>('a[data-build-chip]');
      if (!chip || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const article = document.getElementById(`build-${chip.dataset.buildChip}`);
      if (!article) return;
      event.preventDefault();
      article.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true });
      if (strip && !wide.matches) {
        // The strip slides to the card; the page only moves if the strip is off screen.
        goTo(order.indexOf(chip.dataset.buildChip ?? ''));
        const top = strip.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.6) scrollToTarget(strip);
        return;
      }
      scrollToTarget(article);
    };
    root.addEventListener('click', onClick);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) =>
            entries.forEach((entry) => {
              const w = entry.contentRect.width;
              if (w > 0) (entry.target as HTMLElement).style.setProperty('--plate-fs', plateFontSize(w));
            }),
          )
        : null;
    root.querySelectorAll<HTMLElement>('[data-plate]').forEach((p) => ro?.observe(p));

    return () => {
      wide.removeEventListener('change', onWide);
      io?.disconnect();
      ro?.disconnect();
      root.removeEventListener('click', onClick);
      strip?.removeEventListener('scroll', onStripScroll);
      steps.forEach((step) => step.removeEventListener('click', onStep));
      if (stripFrame) cancelAnimationFrame(stripFrame);
      fadeIn?.cancel();
      fadeOut?.cancel();
    };
  }, [registry]);

  return (
    <DrawRegistryContext.Provider value={registry}>
      <div ref={rootRef} className={className}>
        {children}
      </div>
    </DrawRegistryContext.Provider>
  );
}
