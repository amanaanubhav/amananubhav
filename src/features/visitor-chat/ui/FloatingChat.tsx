'use client';

import { useCallback, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { animate, AnimatePresence, motion, useMotionValue, type MotionStyle } from 'motion/react';

import { MOTION } from '@/shared/config';
import { useBootPhase } from '@/shared/lib/boot';
import { useBodyScrollLock, useMediaQuery } from '@/shared/lib/dom';
import { useIdlePreload } from '@/shared/lib/lazy';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

import { useUnread } from '../model/use-unread';
import { useVisitorChat } from '../model/use-visitor-chat';
import { ChatLauncher } from './ChatLauncher';
import styles from './chat-launcher.module.css';
import type { ChatWindow as ChatWindowComponent } from './ChatWindow';
import { CHAT_WINDOW_GAP, CHAT_WINDOW_MIN_HEIGHT, CHAT_WINDOW_SIZE, CHAT_WINDOW_TOP_MIN } from './chat-window-size';

/**
 * The window (intro form, thread, owner photo) is its own chunk, warmed when idle, so it stays off the initial JS
 * (§J.2). It is held in state rather than `next/dynamic`: a lazy component suspends on its first render, and a
 * close in that gap left AnimatePresence an exiting child whose motion never ran its exit, so the window stuck open.
 */
const loadChatWindow = () => import('./ChatWindow');

export interface FloatingChatProps {
  onOpenTerminal: () => void;
  onOpenVault: () => void;
}

export type DockSide = 'left' | 'right';

/** Where the desktop window sits, and the bead's centre in its box (the origin of the clip reveal). */
export type Placement = {
  top: number;
  left: number;
  height: number;
  width: number;
  originX: number;
  originY: number;
};

type Dock = { side: DockSide; bottom: number | null };

/** sessionStorage key for the bead's side and height after a drag: remembered for the tab, reset in a new one. */
const DOCK_STORAGE_KEY = 'portfolio_chat_dock';
const EDGE = 16;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * The width of the box fixed elements lay out in, read off the dock itself (its right edge plus its resolved
 * `right`, without the drag offset): `scrollbar-gutter: stable` keeps a classic scrollbar out of it, and neither
 * `innerWidth` nor `clientWidth` says so.
 */
function layoutWidth(dock: HTMLElement, offsetX: number): number {
  return dock.getBoundingClientRect().right - offsetX + parseFloat(getComputedStyle(dock).right);
}

function readDock(): Dock | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DOCK_STORAGE_KEY) ?? 'null') as Partial<Dock> | null;
    if (parsed && (parsed.side === 'left' || parsed.side === 'right') && typeof parsed.bottom === 'number') {
      return { side: parsed.side, bottom: parsed.bottom };
    }
  } catch {
    // storage unavailable or corrupt: the default corner
  }
  return null;
}

function writeDock(dock: Dock): void {
  try {
    sessionStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(dock));
  } catch {
    // storage unavailable
  }
}

/**
 * Whether the chat window is the topmost layer, so Escape is its to take: not while the preloader runs, not while
 * the shell holds it inert under the story reader, and not while any other dialog is on screen (the reader, the
 * terminal or the vault, also during their exit animation).
 */
function chatIsTopmost(win: HTMLElement | null): boolean {
  if (document.documentElement.dataset.boot === 'run') return false;
  if (win?.closest('[inert]')) return false;
  for (const dialog of document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]')) {
    if (win?.contains(dialog)) continue;
    if (dialog.getClientRects().length > 0) return false;
  }
  return true;
}

/**
 * Where the desktop window sits for a bead at `rect`: its outer edge aligned with the bead's, above it when there
 * is room, else below it. Its top never rises above the navbar strip (CHAT_WINDOW_TOP_MIN), so the header buttons
 * stay reachable, and on short viewports the height shrinks to the free space (the body scrolls inside) instead
 * of covering the bead. Measured on open, after each drag and on resize.
 */
function placeBeside(rect: DOMRect, side: DockSide, vw: number): Placement {
  const vh = window.innerHeight;
  const full = CHAT_WINDOW_SIZE.height;
  const width = Math.min(CHAT_WINDOW_SIZE.width, vw - 2 * EDGE);
  let left = Math.round(clamp(side === 'right' ? rect.right - width : rect.left, EDGE, vw - width - EDGE));
  const bottomLimit = vh - EDGE;

  const aboveSpace = rect.top - CHAT_WINDOW_GAP - CHAT_WINDOW_TOP_MIN;
  const belowTop = Math.max(rect.bottom + CHAT_WINDOW_GAP, CHAT_WINDOW_TOP_MIN);
  const belowSpace = bottomLimit - belowTop;

  let top: number;
  let height: number;
  if (aboveSpace >= full) {
    height = full;
    top = rect.top - CHAT_WINDOW_GAP - full;
  } else if (belowSpace >= full) {
    height = full;
    top = belowTop;
  } else if (Math.max(aboveSpace, belowSpace) >= CHAT_WINDOW_MIN_HEIGHT) {
    // Short viewport: the larger free side, never over the bead.
    const above = aboveSpace >= belowSpace;
    height = above ? aboveSpace : belowSpace;
    top = above ? CHAT_WINDOW_TOP_MIN : belowTop;
  } else {
    // Too short above and below (a bead dragged to mid-height): the whole column under the navbar, beside the
    // bead on its inner side when that fits, so it never covers it.
    height = Math.max(Math.min(full, bottomLimit - CHAT_WINDOW_TOP_MIN), 0);
    top = CHAT_WINDOW_TOP_MIN;
    const besideLeft = side === 'right' ? rect.left - CHAT_WINDOW_GAP - width : rect.right + CHAT_WINDOW_GAP;
    if (besideLeft >= EDGE && besideLeft + width <= vw - EDGE) left = Math.round(besideLeft);
  }
  return {
    top: Math.round(top),
    left,
    height: Math.floor(height),
    width,
    originX: Math.round(rect.left + rect.width / 2 - left),
    originY: Math.round(rect.top + rect.height / 2 - top),
  };
}

/**
 * The visitor chat (chat design §3 to §5): a draggable glass bead on every page and the window that grows out of
 * it. A drag glides the bead to the nearer side gutter (remembered for the tab); the window then opens from that
 * side. Kept from before: `useVisitorChat`, `dragMomentum={false}` and the click-versus-drag guard. The shell hides
 * the whole thing while booting and while the terminal or the vault is open.
 */
export function FloatingChat({ onOpenTerminal, onOpenVault }: FloatingChatProps) {
  const chat = useVisitorChat();
  const unread = useUnread(chat.chatId, chat.messages);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [dock, setDock] = useState<Dock>({ side: 'right', bottom: null });
  /** Aman's replies newer than this get the NEW divider; captured when the window opens. */
  const [newSince, setNewSince] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const windowId = useId();
  const isCompact = useMediaQuery('(max-width: 639px)');
  const motionOk = useMotionAllowed();
  // Mounted under the first-load curtain: the window's chunk waits until it has gone (and for the stage hold).
  useIdlePreload(loadChatWindow, useBootPhase() === 'done');
  const [ChatWindow, setChatWindow] = useState<typeof ChatWindowComponent | null>(null);

  // The window mounts only once its chunk is here, so a close before then simply never shows it.
  useEffect(() => {
    if (!isOpen || ChatWindow) return;
    let live = true;
    loadChatWindow().then(
      (m) => live && setChatWindow(() => m.ChatWindow),
      (error: unknown) => {
        console.error('Error loading chat:', error);
        if (live) setIsOpen(false);
      },
    );
    return () => {
      live = false;
    };
  }, [isOpen, ChatWindow]);

  // Below 640 px the window is a modal sheet and holds the page still; on desktop the page keeps scrolling.
  useBodyScrollLock(isOpen && isCompact);

  // The tab's remembered side, read after mount (sessionStorage is client-only; the server renders the default).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = readDock();
    if (saved) setDock(saved);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // From the dock, not the bead: the bead's hover lift must not move the window.
  const measure = useCallback(() => {
    const dockEl = dockRef.current;
    if (!dockEl) return;
    const side = dockEl.dataset.side === 'left' ? 'left' : 'right';
    setPlacement(placeBeside(dockEl.getBoundingClientRect(), side, layoutWidth(dockEl, x.get())));
  }, [x]);

  useEffect(() => {
    if (!isOpen || isCompact) return;
    // Also on entering the desktop layout while open (a sheet opened below 640 px has no placement yet).
    const frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, isCompact, measure]);

  /** Every open and close marks the thread read, so replies seen in the window never count as new later. */
  const setOpen = useCallback(
    (next: boolean) => {
      if (next) setNewSince(unread.count > 0 ? unread.since : null);
      unread.markRead();
      setIsOpen(next);
    },
    [unread],
  );

  /** Close and hand focus back to the bead (X, Escape, scrim, grabber). */
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }, [setOpen]);

  /*
   * Escape closes one layer, the topmost. Captured on the document, ahead of the shared Escape stack and the
   * section nav, and taken only when the window is topmost and, on desktop (non-modal), when focus is in the
   * window or on the bead; then it stops there, so an Atlas card behind stays open. Elsewhere it passes through.
   */
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return;
    const win = document.getElementById(windowId);
    if (!chatIsTopmost(win)) return;
    if (!isCompact) {
      const target = event.target instanceof Node ? event.target : null;
      if (!target || !(win?.contains(target) || launcherRef.current?.contains(target))) return;
    }
    event.stopPropagation();
    close();
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => onEscape(event);
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [isOpen]);

  /** Close without moving focus: the overlay that opens next takes it (and returns it via `data-return-focus`). */
  const openTerminal = useCallback(() => {
    setOpen(false);
    onOpenTerminal();
  }, [setOpen, onOpenTerminal]);

  const openVault = useCallback(() => {
    setOpen(false);
    onOpenVault();
  }, [setOpen, onOpenVault]);

  /** Release: glide to the nearer side gutter, keeping the height the bead was dropped at (CSS clamps it). */
  const onDragEnd = () => {
    setTimeout(() => setIsDragging(false), 150);
    const el = dockRef.current;
    if (!el) return;
    const before = el.getBoundingClientRect();
    const vw = layoutWidth(el, x.get());
    const next: Dock = {
      side: before.left + before.width / 2 < vw / 2 ? 'left' : 'right',
      bottom: Math.round(window.innerHeight - before.bottom),
    };
    flushSync(() => setDock(next));
    writeDock(next);
    // The new anchor with the drag offset still applied; the offset that keeps the bead where it was dropped.
    const after = el.getBoundingClientRect();
    const dx = before.left - (after.left - x.get());
    const dy = before.top - (after.top - y.get());
    if (!motionOk) {
      x.set(0);
      y.set(0);
      if (isOpen) measure();
      return;
    }
    x.set(dx);
    y.set(dy);
    animate(x, 0, MOTION.spring);
    void animate(y, 0, MOTION.spring).then(() => {
      if (isOpen) measure();
    });
  };

  const count = isOpen ? 0 : unread.count;
  const label = isOpen
    ? 'Hide chat'
    : count > 0
      ? `Chat with Aman, ${count} new ${count === 1 ? 'reply' : 'replies'}`
      : 'Chat with Aman';
  // A changed text is a new announcement: the trailing space differs between consecutive counts.
  const announcement = count > 0 ? `New reply from Aman${count % 2 === 0 ? ' ' : ''}` : '';

  return (
    <>
      {/* `data-chrome` sits on the wrapper: the button's own transition list would drop the dim's opacity fade (§C.8). */}
      <motion.div
        ref={dockRef}
        data-chrome=""
        data-side={dock.side}
        data-dragging={isDragging ? '' : undefined}
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={onDragEnd}
        className={styles.dock}
        style={{ x, y, '--drag-bottom': dock.bottom === null ? undefined : `${dock.bottom}px` } as MotionStyle}
      >
        <ChatLauncher
          ref={launcherRef}
          isOpen={isOpen}
          label={label}
          hasUnread={count > 0}
          controls={isOpen ? windowId : undefined}
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return;
            }
            if (isOpen) {
              setOpen(false);
              return;
            }
            if (!isCompact) measure();
            setOpen(true);
          }}
        />
      </motion.div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <AnimatePresence>
        {isOpen && ChatWindow && (
          <ChatWindow
            key="chat-window"
            id={windowId}
            chat={chat}
            isCompact={isCompact}
            placement={placement}
            newSince={newSince}
            onClose={close}
            onOpenTerminal={openTerminal}
            onOpenVault={openVault}
          />
        )}
      </AnimatePresence>
    </>
  );
}
