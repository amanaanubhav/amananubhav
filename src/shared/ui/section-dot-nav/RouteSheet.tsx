'use client';

import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { clsx } from 'clsx';

import type { SectionNavItem } from './SectionDotNav';
import styles from './route-sheet.module.css';
import { routeSheetExitMs } from './route-sheet-timing';

export interface RouteSheetProps {
  id: string;
  sections: readonly SectionNavItem[];
  /** Index of the current section (-1 above the first). */
  at: number;
  open: boolean;
  /** The sheet's heading and the dialog's name ("On this page"). */
  label: string;
  /** Asks the owner to close (Close, Esc, a press outside, a swipe); focus returns to the chip after the exit. */
  onRequestClose: () => void;
  /** A row was chosen: the owner closes the sheet and jumps once it has left. */
  onJump: (e: ReactMouseEvent<HTMLAnchorElement>, id: string) => void;
  chipRef: RefObject<HTMLButtonElement | null>;
}


/** A flick faster than this (px/ms) dismisses whatever the distance (Sonner / Vaul rule). */
const FLICK = 0.11;
/** Or a drag past this share of the sheet's height. */
const DISTANCE = 0.3;

/**
 * The contents sheet of the route rail (Life page FINAL-DESIGN §2.2): a modal `<dialog>` rising from the bottom with
 * every stop (label, tag, teaser), the current one marked (`aria-current="location"`, 2 px action bar). Dismissed by
 * Close, Esc, a tap outside or a swipe down; focus goes back to the dock chip.
 */
export function RouteSheet({ id, sections, at, open, label, onRequestClose, onJump, chipRef }: RouteSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef(true);

  // Open: showModal and focus the current row. Close: play the exit, then close and hand focus back.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      // Reopened during the exit: the exit timer was cleared, so drop its end state too (review P3-1).
      delete dialog.dataset.closing;
      dialog.style.transform = '';
      if (!dialog.open) {
        dialog.showModal();
        returnFocus.current = true;
        (dialog.querySelector<HTMLElement>('a[aria-current]') ?? dialog.querySelector<HTMLElement>('a'))?.focus();
      }
      return;
    }
    if (!dialog.open) return;
    dialog.dataset.closing = '';
    const timer = window.setTimeout(() => {
      delete dialog.dataset.closing;
      dialog.style.transform = '';
      dialog.close();
      if (returnFocus.current) chipRef.current?.focus({ preventScroll: true });
    }, routeSheetExitMs());
    return () => window.clearTimeout(timer);
  }, [open, chipRef]);

  // Unmount (route change) with the sheet open: close it so the page is not left inert.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  // Swipe down: 1:1 under the finger, friction upwards, dismiss past 30 % or on a flick.
  const drag = useRef<{ pid: number; y0: number; t0: number; dy: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (drag.current || (e.target as Element).closest('button, a')) return;
    drag.current = { pid: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const dialog = ref.current;
    if (!d || !dialog || e.pointerId !== d.pid) return;
    const raw = e.clientY - d.y0;
    d.dy = raw < 0 ? raw * 0.2 : raw;
    dialog.style.transform = `translateY(${d.dy}px)`;
  };
  const onPointerEnd = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const dialog = ref.current;
    if (!d || !dialog || e.pointerId !== d.pid) return;
    drag.current = null;
    const velocity = d.dy / Math.max(1, performance.now() - d.t0);
    if (d.dy > dialog.offsetHeight * DISTANCE || velocity > FLICK) {
      onRequestClose();
      return;
    }
    const from = dialog.style.transform;
    dialog.style.transform = '';
    if (from && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.animate([{ transform: from }, { transform: 'translateY(0)' }], {
        duration: 200,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      });
    }
  };
  const swipe = {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  };

  const headingId = `${id}-h`;

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={headingId}
      className={clsx('glass-chrome glass-sheet', styles.sheet)}
      onCancel={(e) => {
        e.preventDefault();
        onRequestClose();
      }}
      // A close the page did not ask for (the browser's close watcher): bring the owner's state along.
      onClose={() => {
        if (open) onRequestClose();
      }}
      onClick={(e) => {
        // A press on the backdrop lands on the dialog element itself.
        if (e.target === e.currentTarget) onRequestClose();
      }}
    >
      <div aria-hidden="true" className={styles.grab} {...swipe}>
        <span className={styles.grabBar} />
      </div>
      <header className={clsx('flex items-center justify-between pb-2 pl-5 pr-4', styles.head)} {...swipe}>
        <h2 id={headingId} className="font-display text-title font-semibold text-ink">
          {label}
        </h2>
        <button
          type="button"
          onClick={() => onRequestClose()}
          className="satin-steel inline-flex min-h-11 items-center rounded-control border px-4 font-display text-ui font-semibold text-ink transition-transform duration-micro ease-settle active:scale-[0.97]"
        >
          Close
        </button>
      </header>
      <ol className="grid px-3" data-lenis-prevent>
        {sections.map((s, i) => {
          const isActive = i === at;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => {
                  returnFocus.current = false;
                  onJump(e, s.id);
                }}
                className={clsx(
                  'grid min-h-14 gap-0.5 rounded-control px-3 py-2.5 no-underline [outline-offset:-2px]',
                  'transition-colors duration-hover',
                  isActive
                    ? clsx('bg-action-soft', styles.current)
                    : 'hover:bg-[var(--hover-wash)] active:bg-[var(--press-wash)]',
                )}
              >
                <span className="flex items-center gap-2.5 font-display text-ui font-semibold text-ink">
                  {s.label}
                  {s.tag && (
                    <em className="inline-flex items-center gap-1.5 font-body text-caption font-normal italic text-aqua">
                      {s.tag.live && (
                        <span aria-hidden="true" className="live-halo size-1.5 rounded-full bg-live forced-colors:bg-[Highlight]" />
                      )}
                      {s.tag.label}
                    </em>
                  )}
                </span>
                {s.teaser && <span className="font-body text-caption text-ink-muted">{s.teaser}</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </dialog>
  );
}
