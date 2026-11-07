'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isHistoryTraversal } from '@/shared/lib/dom';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';
import { Button, buttonClassName } from '@/shared/ui/button';
import { NOTEBOOK_OPEN_EVENT, type NotebookOpenDetail } from '../../lib/notebook-bus';
import {
  aliasEntryId,
  NOTEBOOK_SECTION_ID,
  pageHeadingId,
  pageTabId,
  resolveNotebookPage,
  type NotebookPageId,
} from '../../lib/notebook-pages';
import styles from './notebook.module.css';

export interface NotebookControllerPage {
  readonly id: NotebookPageId;
  readonly tab: string;
  /** The page's content, rendered on the server. */
  readonly node: ReactNode;
}

export interface NotebookControllerLabels {
  readonly tablist: string;
  readonly previous: string;
  readonly next: string;
}

interface TurnOptions {
  /** A keyboard turn: no transition at all. */
  readonly instant?: boolean;
  /** Written to the URL with replaceState (no history entry); omitted when the hash already says it. */
  readonly hash?: string;
  /** Focus this heading after the turn (deep link, JumpLink, hashchange). */
  readonly focusId?: string | null;
  /** Bring the book into view (or the alias entry, see `landingFor`). */
  readonly scroll?: 'smooth' | 'immediate';
  /** The alias entry (`triund`) the turn opens, if any. */
  readonly entry?: string | null;
  /** Announce the turn in the live region. Not for tabs: a screen reader already says the selected tab. */
  readonly announce?: boolean;
  /** Previous / Next / swipe / foot: if the book's top is above the viewport, focus the new h3 and scroll to the book. */
  readonly fromBelow?: boolean;
  /** The control that turned is gone after the turn (the foot belongs to the page that left): focus the new h3. */
  readonly focusHeading?: boolean;
}

/** A turn by swipe needs this much horizontal travel, or a flick this fast (px per ms), and must be mostly horizontal. */
const SWIPE_MIN_PX = 56;
const FLICK_PX_PER_MS = 0.11;
const FLICK_MIN_PX = 16;
const SWIPE_RATIO = 1.5;
const SWIPE_IGNORE = 'a, button, input, select, textarea, summary, label, video, [role="tablist"], [role="slider"]';
const PHONE_QUERY = '(max-width: 1023.98px)';

function navClear(): number {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 72;
}

/** The element's own scroll-margin-top (a jump lands that far below the navbar band). */
function scrollMargin(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
}

/**
 * Where a turn to `entry` lands: the book, unless the entry would then end below the viewport (phones stack the
 * Himachal page's head, locator and stops above its entries); then the entry itself, so the focused h4 is in view.
 */
function landingFor(root: HTMLElement, entry: string | null | undefined): HTMLElement {
  const el = entry ? document.getElementById(entry) : null;
  if (!el || !root.contains(el)) return root;
  const bottomPad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) || 0;
  const bottomIfBook = el.getBoundingClientRect().bottom - root.getBoundingClientRect().top + navClear() + scrollMargin(root);
  return bottomIfBook <= window.innerHeight - bottomPad ? root : el;
}

/** Brings the selected tab into the tablist's view (narrow screens scroll the tabs) without scrolling the page. */
function revealTab(tab: HTMLElement | null | undefined): void {
  const list = tab?.parentElement;
  if (!tab || !list || list.scrollWidth <= list.clientWidth) return;
  const pad = parseFloat(getComputedStyle(list).paddingLeft) || 0;
  const left = tab.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
  const right = left + tab.offsetWidth;
  if (left - pad < list.scrollLeft) list.scrollLeft = left - pad;
  else if (right + pad > list.scrollLeft + list.clientWidth) list.scrollLeft = right + pad - list.clientWidth;
}

function focusHeading(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

const HOLD_MS = 2500;
const HOLD_CANCEL = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/**
 * Jumps to `target` now and again after each ScrollTrigger refresh for HOLD_MS (a refresh restores the scroll position
 * it cached before the jump), until the reader scrolls or presses a key. Returns the stop function.
 */
function holdPlace(target: () => HTMLElement | null): () => void {
  const until = Date.now() + HOLD_MS;
  const jump = () => {
    const el = target();
    if (!el) return;
    const off = el.getBoundingClientRect().top - navClear() - scrollMargin(el);
    if (Math.abs(off) > 1) scrollToTarget(el, { immediate: true });
  };
  const onRefresh = () => (Date.now() > until ? stop() : jump());
  function stop() {
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    for (const type of HOLD_CANCEL) window.removeEventListener(type, stop, true);
  }
  ScrollTrigger.addEventListener('refresh', onRefresh);
  for (const type of HOLD_CANCEL) window.addEventListener(type, stop, { capture: true, passive: true });
  jump();
  return stop;
}

function replaceHash(hash: string): void {
  if (window.location.hash === `#${hash}`) return;
  // null state, as the Next docs do it (single-page-applications.md): the App Router's patched replaceState then copies
  // its own entry state in and syncs its canonical URL. Passing history.state through (it carries __NA) skips that
  // sync, and the next router update (refresh, a server action, Fast Refresh) writes the arrival hash back.
  window.history.replaceState(null, '', `#${hash}`);
}

/**
 * The field notebook's controller (NOTEBOOK-DESIGN §2.6): the tabs, Previous / Next, the page counter and its live
 * announcement, swipe on phones, deep links (the hash on mount, `hashchange`, `aa:notebook-open` from JumpLink),
 * focus, `replaceState`, and the turn's attributes (`--nb-dir`, `data-instant`, `data-current`, `data-leaving`).
 * Server HTML is page 1; the pre-paint script and the pre-live CSS show the right page before hydration, and the mount
 * layout effect takes over from the same resolver before the first paint, then marks the root live.
 */
export function NotebookController({
  pages,
  labels,
}: {
  pages: readonly NotebookControllerPage[];
  labels: NotebookControllerLabels;
}) {
  const [{ current, leaving }, setTurn] = useState<{ current: number; leaving: number | null }>({
    current: 0,
    leaving: null,
  });
  const [live, setLive] = useState(false);
  const [announce, setAnnounce] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentRef = useRef(0);
  const arrival = useRef<{ focusId: string | null; section: boolean; entry: string | null } | null>(null);
  const swipe = useRef<{ id: number; x: number; y: number; t: number } | null>(null);
  const count = pages.length;

  const indexOf = useCallback(
    (pageId: NotebookPageId) => Math.max(0, pages.findIndex((page) => page.id === pageId)),
    [pages],
  );

  const turn = useCallback(
    (next: number, opts: TurnOptions = {}) => {
      const root = rootRef.current;
      const book = bookRef.current;
      if (!root || !book || next < 0 || next >= count) return;
      const from = currentRef.current;
      const above = book.getBoundingClientRect().top < navClear() - 1;
      const focusWasInside = root.contains(document.activeElement);

      if (opts.instant) book.setAttribute('data-instant', '');
      else book.removeAttribute('data-instant');
      if (next !== from) {
        book.style.setProperty('--nb-dir', next > from ? '1' : '-1');
        // A page that is still leaving restarts from its entry side, so turning straight back draws its route again.
        book.querySelector(`[data-nb-pg="${pages[next].id}"]`)?.removeAttribute('data-leaving');
        // Flush styles: the waiting page takes the new entry side before it becomes current (no transform transition
        // on waiting pages), so the turn always comes in from the side it is going.
        void book.offsetWidth;
        currentRef.current = next;
        flushSync(() => {
          setTurn({ current: next, leaving: from });
          if (opts.announce !== false) setAnnounce(`Page ${next + 1} of ${count}, ${pages[next].tab}`);
        });
      }
      document.documentElement.setAttribute('data-nb-page', pages[next].id);
      if (opts.hash) replaceHash(opts.hash);
      revealTab(tabRefs.current[next]);

      const heading = pageHeadingId(pages[next].id);
      if (opts.focusId) focusHeading(opts.focusId);
      else if (opts.focusHeading || (opts.fromBelow && above)) focusHeading(heading);
      else if (focusWasInside && (!document.activeElement || document.activeElement === document.body)) {
        // The pressed control is gone (Next on the last page): the reader lands on the new page.
        focusHeading(heading);
      }
      if (opts.scroll) scrollToTarget(landingFor(root, opts.entry), { immediate: opts.scroll === 'immediate' });
      else if (opts.fromBelow && above) scrollToTarget(root);
    },
    [count, pages],
  );

  // Before the first paint: take the page from the hash (the same resolver as the pre-paint script) and go live.
  useLayoutEffect(() => {
    const target = resolveNotebookPage(window.location.hash);
    const index = target ? indexOf(target.pageId) : 0;
    currentRef.current = index;
    document.documentElement.setAttribute('data-nb-page', pages[index].id);
    if (target) {
      arrival.current = {
        focusId: target.focusId,
        section: target.hash === NOTEBOOK_SECTION_ID,
        entry: aliasEntryId(target.hash),
      };
    }
    // The server renders page 1 and the hash is only readable here, before the first paint.
    /* eslint-disable react-hooks/set-state-in-effect */
    setTurn({ current: index, leaving: null });
    setLive(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [indexOf, pages]);

  // After hydration: a deep link lands on the book with focus on its heading. One frame later, so the route's own
  // mount effects have run; the place is then held across ScrollTrigger refreshes for a moment (a refresh restores the
  // scroll position it cached before the jump), until the reader scrolls or presses a key. A Back/Forward arrival
  // keeps the position the browser restores.
  useEffect(() => {
    const target = arrival.current;
    if (!target) return;
    let stop = () => {};
    const frame = requestAnimationFrame(() => {
      arrival.current = null;
      // Back / Forward: the browser restores the scroll, and focus stays put (no jump to an h3 that may be off-screen).
      if (isHistoryTraversal()) return;
      if (target.focusId) focusHeading(target.focusId);
      const root = rootRef.current;
      // Chosen once, so the hold never flips between the book and the entry while the page settles.
      const into = target.section ? document.getElementById(NOTEBOOK_SECTION_ID) : root && landingFor(root, target.entry);
      stop = holdPlace(() => into);
    });
    return () => {
      cancelAnimationFrame(frame);
      stop();
    };
  }, []);

  // Every other way in: a same-page `#dodital` link (hashchange) and JumpLink (aa:notebook-open).
  useEffect(() => {
    let frame = 0;
    const onHash = () => {
      const target = resolveNotebookPage(window.location.hash, pages[currentRef.current].id);
      if (!target || target.hash === NOTEBOOK_SECTION_ID) return;
      const entry = aliasEntryId(target.hash);
      turn(indexOf(target.pageId), { focusId: target.focusId });
      // The browser has already jumped to the anchor; settle on the book (or the alias entry) a frame later, at once,
      // like that jump (Lenis has not seen the native jump yet, so a smooth scroll now would start from a stale
      // position).
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (rootRef.current) scrollToTarget(landingFor(rootRef.current, entry), { immediate: true });
      });
    };
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<NotebookOpenDetail>).detail;
      if (!detail) return;
      turn(indexOf(detail.pageId), {
        hash: detail.hash,
        focusId: detail.focusId,
        entry: aliasEntryId(detail.hash),
        scroll: detail.scroll ? 'smooth' : undefined,
      });
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener(NOTEBOOK_OPEN_EVENT, onOpen);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener(NOTEBOOK_OPEN_EVENT, onOpen);
    };
  }, [indexOf, pages, turn]);

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: (current + 1) % count,
      ArrowLeft: (current - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    if (!(event.key in keys) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const next = keys[event.key];
    turn(next, { instant: true, hash: pages[next].id, announce: false });
    tabRefs.current[next]?.focus();
  };

  // Enter or Space on a button arrives as a click with detail 0: a keyboard turn, so it is instant.
  const onStep = (next: number, foot: boolean) => (event: MouseEvent<HTMLButtonElement>) =>
    turn(next, { instant: event.detail === 0, hash: pages[next].id, fromBelow: true, focusHeading: foot });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // A second finger is never primary. A primary pointer starts a fresh gesture, so a sequence whose up or cancel
    // never arrived cannot leave a stale start behind.
    if (event.pointerType === 'mouse' || !event.isPrimary) return;
    swipe.current = null;
    if (!window.matchMedia(PHONE_QUERY).matches) return;
    const target = event.target as Element;
    if (target.closest(SWIPE_IGNORE)) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.containsNode(target, true)) return;
    swipe.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp };
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    if (!start || event.pointerId !== start.id) return;
    swipe.current = null;
    if (window.getSelection()?.toString()) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const dt = Math.max(1, event.timeStamp - start.t);
    const horizontal = Math.abs(dx) > SWIPE_RATIO * Math.abs(dy);
    const far = Math.abs(dx) >= SWIPE_MIN_PX;
    const flick = Math.abs(dx) >= FLICK_MIN_PX && Math.abs(dx) / dt > FLICK_PX_PER_MS;
    if (!horizontal || !(far || flick)) return;
    const next = currentRef.current + (dx < 0 ? 1 : -1);
    if (next < 0 || next >= count) return;
    turn(next, { hash: pages[next].id, fromBelow: true });
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (swipe.current?.id === event.pointerId) swipe.current = null;
  };

  const prev = current > 0 ? pages[current - 1] : undefined;
  const next = current < count - 1 ? pages[current + 1] : undefined;
  const slotClass = `${buttonClassName({ variant: 'secondary' })} ${styles.slot}`;
  const icon = 'size-[18px] shrink-0';

  return (
    <div
      ref={rootRef}
      data-nb-root=""
      data-nb-live={live ? '' : undefined}
      className={live ? `${styles.root} ${styles.live}` : styles.root}
    >
      <div className={styles.bar}>
        {live ? (
          <div role="tablist" aria-label={labels.tablist} className={styles.tabs} onKeyDown={onTabKey}>
            {pages.map((page, i) => (
              <button
                key={page.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={pageTabId(page.id)}
                aria-controls={page.id}
                aria-selected={i === current}
                tabIndex={i === current ? 0 : -1}
                data-nb-tab={page.id}
                className={styles.tab}
                onClick={(event) => turn(i, { instant: event.detail === 0, hash: page.id, announce: false })}
              >
                {page.tab}
              </button>
            ))}
          </div>
        ) : (
          // Before hydration (and without JS) the tabs are plain anchors: with every page stacked they still jump.
          <nav aria-label={labels.tablist}>
            <ul role="list" className={styles.tabs}>
              {pages.map((page) => (
                <li key={page.id}>
                  <a href={`#${page.id}`} data-nb-tab={page.id} className={styles.tab}>
                    {page.tab}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className={styles.turns}>
          <p aria-hidden="true" className={`${styles.counter} font-body text-caption text-ink-muted`}>
            {current + 1} of {count}
          </p>
          {prev ? (
            <Button
              variant="secondary"
              icon={ChevronLeft}
              aria-label={`${labels.previous}: ${prev.tab}`}
              onClick={onStep(current - 1, false)}
            >
              {labels.previous}
            </Button>
          ) : (
            <span aria-hidden="true" className={slotClass}>
              <ChevronLeft aria-hidden="true" focusable="false" className={icon} strokeWidth={1.75} />
              <span>{labels.previous}</span>
            </span>
          )}
          {next ? (
            <Button
              variant="secondary"
              icon={ChevronRight}
              iconPosition="end"
              aria-label={`${labels.next}: ${next.tab}`}
              onClick={onStep(current + 1, false)}
            >
              {labels.next}
            </Button>
          ) : (
            <span aria-hidden="true" className={slotClass}>
              <span>{labels.next}</span>
              <ChevronRight aria-hidden="true" focusable="false" className={icon} strokeWidth={1.75} />
            </span>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>

      <div
        ref={bookRef}
        data-nb-book=""
        className={styles.book}
        onPointerDown={live ? onPointerDown : undefined}
        onPointerUp={live ? onPointerUp : undefined}
        onPointerCancel={live ? onPointerCancel : undefined}
      >
        {pages.map((page, i) => {
          const isCurrent = i === current;
          const before = i > 0 ? pages[i - 1] : undefined;
          const after = i < count - 1 ? pages[i + 1] : undefined;
          return (
            <div
              key={page.id}
              id={page.id}
              data-nb-pg={page.id}
              className={styles.page}
              role={live ? 'tabpanel' : undefined}
              aria-labelledby={live ? pageTabId(page.id) : undefined}
              tabIndex={live && isCurrent ? 0 : undefined}
              data-current={isCurrent ? '' : undefined}
              data-leaving={live && i === leaving ? '' : undefined}
              inert={live && !isCurrent}
            >
              {page.node}
              {/* Phones: Previous and Next again at the end of the page (each page owns its own, so the labels are
                  right before hydration too). */}
              <div className={styles.foot}>
                <div className={styles.footRow}>
                  {before ? (
                    <Button
                      variant="secondary"
                      icon={ChevronLeft}
                      className="w-full px-3"
                      aria-label={`${labels.previous}: ${before.tab}`}
                      onClick={onStep(i - 1, true)}
                    >
                      {before.tab}
                    </Button>
                  ) : null}
                  {after ? (
                    <Button
                      variant="secondary"
                      icon={ChevronRight}
                      iconPosition="end"
                      className={`${styles.footNext} w-full px-3`}
                      aria-label={`${labels.next}: ${after.tab}`}
                      onClick={onStep(i + 1, true)}
                    >
                      {after.tab}
                    </Button>
                  ) : null}
                </div>
                <p aria-hidden="true" className={`${styles.footPage} font-body text-caption text-ink-muted`}>
                  {i + 1} of {count}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
