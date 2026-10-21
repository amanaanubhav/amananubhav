'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import { Lock, SquareTerminal, X } from 'lucide-react';
import { motion, useIsPresent } from 'motion/react';

import { getMedia, MOTION } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { useEscapeKey, useFocusTrap } from '@/shared/lib/dom';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { IconButton } from '@/shared/ui/button';

import type { VisitorChatState } from '../model/use-visitor-chat';
import { ChatIntroForm } from './ChatIntroForm';
import { ChatThread } from './ChatThread';
import { useInertOutside } from './use-inert-outside';

interface ChatWindowProps {
  id: string;
  chat: VisitorChatState;
  /** Below 640 px the window is a bottom sheet. */
  isCompact: boolean;
  /** Desktop placement next to the (draggable) launcher, height capped to the free space; ignored on the sheet. */
  placement: { top: number; right: number; height: number } | null;
  /** Closes and returns focus to the launcher. */
  onClose: () => void;
  /** Close the window, then open the overlay (the shell hides the chat while it is open). */
  onOpenTerminal: () => void;
  onOpenVault: () => void;
}

function OwnerAvatar() {
  const avatar = getMedia('M-ORIGIN-01');
  const src = avatar.status === 'existing' ? (avatar.src ?? avatar.path) : undefined;
  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-control border border-line bg-surface-2">
      {src ? (
        <Image
          src={src}
          alt=""
          width={40}
          height={40}
          sizes="40px"
          className="photo-grade size-full object-cover"
          style={{ objectPosition: avatar.objectPosition }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-full items-center justify-center font-display text-caption font-semibold text-ink-muted"
        >
          AA
        </span>
      )}
    </span>
  );
}

/**
 * Fallback height cap before the launcher is measured: the top at 72 px (CHAT_WINDOW_TOP_MIN), the bottom above
 * the launcher (88 px). A literal so Tailwind sees it; the measured placement sets an exact height.
 */
const DESKTOP_MAX_H = 'max-h-[calc(100dvh-160px)]';

/**
 * The chat window (§H.6). Desktop: a non-modal 384 × 520 dialog beside the launcher, its height capped so the
 * top stays clear of the navbar and the bottom clear of the launcher. Below 640 px: an 80dvh bottom sheet that
 * holds the page still (the launcher takes the scroll lock), so it is modal there: `aria-modal`, a scrim, a
 * focus trap and everything else inert, or Tab would walk into the hidden page. Focus moves in on open,
 * Escape closes, and focus goes back to the launcher on close (the launcher handles that).
 */
export function ChatWindow({ id, chat, isCompact, placement, onClose, onOpenTerminal, onOpenVault }: ChatWindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const compactAtOpen = useRef(isCompact);
  // While the exit animation runs the window is on its way out: no trap, no inert page, no Escape.
  const isPresent = useIsPresent();
  const isModal = isCompact && isPresent;
  const hasVisitor = chat.visitor !== null;
  // Tier 0 (OS setting, footer switch, lite devices): a 150 ms opacity fade instead of the spring (§C.4).
  const motionOk = useMotionAllowed();
  const fade = { duration: 0.15 };
  const panelMotion = motionOk
    ? {
        initial: { opacity: 0, y: isCompact ? 24 : 12 },
        animate: { opacity: 1, y: 0, transition: MOTION.spring },
        exit: {
          opacity: 0,
          y: isCompact ? 16 : 8,
          transition: {
            duration: MOTION.dur.overlayOut * 0.65,
            ease: MOTION.bezier.depart,
          },
        },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: fade },
        exit: { opacity: 0, transition: fade },
      };

  useEscapeKey(() => onClose(), isPresent);
  // The sheet: Tab stays inside and the page behind is inert. The launcher returns focus itself.
  useFocusTrap(rootRef, isModal, { initialFocus: rootRef, returnFocus: false });
  useInertOutside(rootRef, isModal);

  // Focus moves into the dialog on open: the first field on desktop; the dialog itself on the sheet,
  // so the phone keyboard does not cover half the sheet before the visitor has read it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const frame = requestAnimationFrame(() => {
      if (root.contains(document.activeElement)) return;
      const field = compactAtOpen.current ? null : root.querySelector<HTMLElement>('[data-autofocus]:not(:disabled)');
      (field ?? root).focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const placementStyle: CSSProperties | undefined =
    !isCompact && placement
      ? { top: placement.top, right: placement.right, bottom: 'auto', height: placement.height, maxHeight: 'none' }
      : undefined;

  return (
    <>
      {isCompact ? (
        <motion.div
          aria-hidden="true"
          data-modal-keep=""
          className="fixed inset-0 z-chat-window bg-ground/80"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: fade }}
          exit={{ opacity: 0, transition: fade }}
        />
      ) : null}
      <motion.div
        ref={rootRef}
        id={id}
        role="dialog"
        aria-label="Chat with Aman"
        aria-modal={isModal ? true : undefined}
        tabIndex={-1}
        {...panelMotion}
        style={placementStyle}
        className={cn(
          'fixed z-chat-window flex flex-col overflow-hidden border border-line bg-surface text-ink shadow-float focus:outline-none',
          isCompact
            ? 'inset-x-0 bottom-0 h-[80dvh] rounded-t-panel border-b-0 pb-[env(safe-area-inset-bottom)]'
            : cn(
                'bottom-[88px] right-6 h-[520px] w-[384px] max-w-[calc(100vw-32px)] origin-bottom-right rounded-panel',
                DESKTOP_MAX_H,
              ),
        )}
      >
        {/* A plain div, not <header>: inside the dialog it would read as a second banner landmark. */}
        <div className="flex shrink-0 items-start gap-2.5 border-b border-line py-3 pl-3 pr-1">
          <OwnerAvatar />
          <div className="min-w-0 flex-1 pt-px">
            <h2 className="m-0 font-display text-ui font-semibold leading-5 text-ink">Aman Anubhav</h2>
            <p className="m-0 mt-0.5 truncate font-body text-[13px] leading-[18px] text-ink-muted">
              I usually reply within a day.
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <IconButton
              label="Open the AI terminal"
              icon={SquareTerminal}
              size={40}
              data-return-focus="chat-terminal"
              onClick={onOpenTerminal}
            />
            <IconButton
              label="Open the Vault"
              icon={Lock}
              size={40}
              data-return-focus="chat-vault"
              onClick={onOpenVault}
            />
            <IconButton label="Close chat" icon={X} size={40} onClick={onClose} />
          </div>
        </div>

        {hasVisitor ? <ChatThread chat={chat} /> : <ChatIntroForm chat={chat} />}
      </motion.div>
    </>
  );
}

