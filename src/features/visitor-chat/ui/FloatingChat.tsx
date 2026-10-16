'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';

import { cn } from '@/shared/lib/cn';
import { useBodyScrollLock, useMediaQuery } from '@/shared/lib/dom';
import { useIdlePreload } from '@/shared/lib/lazy';

import { useVisitorChat } from '../model/use-visitor-chat';
import { CHAT_WINDOW_MIN_HEIGHT, CHAT_WINDOW_SIZE, CHAT_WINDOW_TOP_MIN } from './chat-window-size';

/** The window (intro form, thread, owner photo) is its own chunk, warmed when idle, so it stays off the initial JS (§J.2). */
const loadChatWindow = () => import('./ChatWindow');
const ChatWindow = dynamic(() => loadChatWindow().then((m) => m.ChatWindow), { ssr: false });

export interface FloatingChatProps {
  onOpenTerminal: () => void;
  onOpenVault: () => void;
}

type Placement = { top: number; right: number; height: number };

const EDGE = 16;
const GAP = 12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Where the desktop window sits for a launcher at `rect`: right edges aligned, above the launcher when there
 * is room, else below it. Its top never rises above the navbar strip (CHAT_WINDOW_TOP_MIN), so the header
 * buttons stay reachable, and on short viewports the height shrinks to the free space (the body scrolls
 * inside) instead of covering the launcher. The launcher can be dragged anywhere, so this is measured on
 * open, after each drag and on resize.
 */
function placeBeside(rect: DOMRect): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const full = CHAT_WINDOW_SIZE.height;
  const width = Math.min(CHAT_WINDOW_SIZE.width, vw - 2 * EDGE);
  const right = Math.round(clamp(vw - rect.right, EDGE, vw - width - EDGE));
  const bottomLimit = vh - EDGE;

  const aboveSpace = rect.top - GAP - CHAT_WINDOW_TOP_MIN;
  const belowTop = Math.max(rect.bottom + GAP, CHAT_WINDOW_TOP_MIN);
  const belowSpace = bottomLimit - belowTop;

  let top: number;
  let height: number;
  if (aboveSpace >= full) {
    height = full;
    top = rect.top - GAP - full;
  } else if (belowSpace >= full) {
    height = full;
    top = belowTop;
  } else if (Math.max(aboveSpace, belowSpace) >= CHAT_WINDOW_MIN_HEIGHT) {
    // Short viewport: the larger free side, never over the launcher.
    const above = aboveSpace >= belowSpace;
    height = above ? aboveSpace : belowSpace;
    top = above ? CHAT_WINDOW_TOP_MIN : belowTop;
  } else {
    // Too short to avoid the launcher: the whole column under the navbar (Close and Escape still work).
    height = Math.max(Math.min(full, bottomLimit - CHAT_WINDOW_TOP_MIN), 0);
    top = CHAT_WINDOW_TOP_MIN;
  }
  return { top: Math.round(top), right, height: Math.floor(height) };
}

/**
 * The visitor chat (§H.6): a draggable "Say hello" launcher and its window. Kept from before: `useVisitorChat`,
 * drag with `dragMomentum={false}` and the click-versus-drag guard. The shell hides the whole thing while
 * booting and while the terminal or the vault is open.
 */
export function FloatingChat({ onOpenTerminal, onOpenVault }: FloatingChatProps) {
  const chat = useVisitorChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const windowId = useId();
  const isCompact = useMediaQuery('(max-width: 639px)');
  useIdlePreload(loadChatWindow, true);

  // Below 640 px the window is a bottom sheet and holds the page still; on desktop the page keeps scrolling.
  useBodyScrollLock(isOpen && isCompact);

  const measure = useCallback(() => {
    const rect = launcherRef.current?.getBoundingClientRect();
    if (rect) setPlacement(placeBeside(rect));
  }, []);

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

  /** Close and hand focus back to the launcher (X, Escape). */
  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }, []);

  /** Close without moving focus: the overlay that opens next takes it (and returns it via `data-return-focus`). */
  const openTerminal = useCallback(() => {
    setIsOpen(false);
    onOpenTerminal();
  }, [onOpenTerminal]);

  const openVault = useCallback(() => {
    setIsOpen(false);
    onOpenVault();
  }, [onOpenVault]);

  return (
    <>
      {/* `data-chrome` sits on the wrapper: the button's own transition list would drop the dim's opacity fade (§C.8). */}
      <motion.div
        data-chrome=""
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setTimeout(() => setIsDragging(false), 150);
          if (isOpen) measure();
        }}
        className={cn(
          'fixed z-chat',
          'bottom-[calc(16px+env(safe-area-inset-bottom))] right-[calc(16px+env(safe-area-inset-right))]',
          'sm:bottom-6 sm:right-6',
        )}
      >
        <button
          ref={launcherRef}
          type="button"
          data-return-focus="chat-launcher"
          aria-label={isOpen ? 'Hide chat' : 'Say hello: chat with Aman'}
          aria-expanded={isOpen}
          aria-controls={isOpen ? windowId : undefined}
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return;
            }
            if (isOpen) {
              setIsOpen(false);
              return;
            }
            if (!isCompact) measure();
            setIsOpen(true);
          }}
          className={cn(
            'inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-control border px-0 shadow-float sm:px-4',
            'select-none font-display text-ui font-semibold',
            'transition-[background-color,border-color,color,filter,transform] duration-hover ease-settle',
            'active:scale-[0.98] active:duration-micro',
            'focus-visible:[outline-style:solid] focus-visible:outline-2',
            isOpen
              ? 'btn-primary border-signal bg-signal text-on-signal hover:brightness-[1.06] focus-visible:outline-offset-2 focus-visible:outline-ink [html[data-theme=day]_&]:hover:brightness-[0.94]'
              : 'border-line-strong bg-surface text-ink hover:bg-surface-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal',
          )}
        >
          {isOpen ? (
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          ) : (
            <MessageCircle aria-hidden="true" className="size-5" strokeWidth={1.75} />
          )}
          <span aria-hidden="true" className="hidden sm:inline">
            {isOpen ? 'Hide chat' : 'Say hello'}
          </span>
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            key="chat-window"
            id={windowId}
            chat={chat}
            isCompact={isCompact}
            placement={placement}
            onClose={close}
            onOpenTerminal={openTerminal}
            onOpenVault={openVault}
          />
        )}
      </AnimatePresence>
    </>
  );
}
