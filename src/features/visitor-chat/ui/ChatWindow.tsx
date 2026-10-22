'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { Lock, SquareTerminal, X } from 'lucide-react';
import { motion, useDragControls, useIsPresent, type HTMLMotionProps, type PanInfo } from 'motion/react';

import { getMedia, MOTION } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { useFocusTrap } from '@/shared/lib/dom';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { RIDGE_PATH, RIDGE_START, RIDGE_SUMMIT } from '@/shared/ui/ridge-mark';

import type { VisitorChatState } from '../model/use-visitor-chat';
import { ChatIntroForm } from './ChatIntroForm';
import { ChatThread } from './ChatThread';
import type { Placement } from './FloatingChat';
import styles from './chat-window.module.css';
import { useInertOutside } from './use-inert-outside';

interface ChatWindowProps {
  id: string;
  chat: VisitorChatState;
  /** Below 640 px the window is a modal floating sheet. */
  isCompact: boolean;
  /** Desktop placement beside the (draggable) bead, height capped to the free space; ignored on the sheet. */
  placement: Placement | null;
  /** Aman's replies after this (epoch ms) get the NEW divider. */
  newSince: number | null;
  /** Closes and returns focus to the bead. */
  onClose: () => void;
  /** Close the window, then open the overlay (the shell hides the chat while it is open). */
  onOpenTerminal: () => void;
  onOpenVault: () => void;
}

/** The ridge mark's path, run out to both edges of the rule. */
const RULE_PATH = `M0 ${RIDGE_START.y} ${RIDGE_PATH.slice(1)}h1.5`;
const RULE_WIDTH = 45.5;
const SUMMIT_LEFT = `${((RIDGE_SUMMIT.x / RULE_WIDTH) * 100).toFixed(2)}%`;
/** A sheet dragged down this far, or flung this fast, closes. */
const SHEET_CLOSE_OFFSET = 120;
const SHEET_CLOSE_VELOCITY = 500;

function OwnerAvatar() {
  const avatar = getMedia('M-ORIGIN-01');
  const src = avatar.status === 'existing' ? (avatar.src ?? avatar.path) : undefined;
  return (
    <span className={styles.avatar}>
      {src ? (
        <Image
          src={src}
          alt=""
          width={36}
          height={36}
          sizes="36px"
          className="photo-grade"
          style={{ objectPosition: avatar.objectPosition }}
        />
      ) : (
        <span aria-hidden="true" className={styles.initials}>
          AA
        </span>
      )}
    </span>
  );
}

function HeaderButton({ label, onClick, className, children }: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // The overlays return focus here; this window is gone by then, so it lands on the bead.
      data-return-focus="chat-launcher"
      onClick={onClick}
      className={cn(styles.iconButton, className)}
    >
      {children}
    </button>
  );
}

/**
 * The chat window (chat design §4). Desktop: a non-modal 380 × 572 glass dialog that grows out of the bead as a
 * clip-path circle, its height capped so the top stays clear of the navbar and the bottom clear of the bead.
 * Below 640 px: a floating sheet on the visual viewport that holds the page still, so it is modal there:
 * `aria-modal`, a scrim, a focus trap and everything else inert. Focus moves in on open; FloatingChat owns Escape
 * (only when the window is the topmost layer) and hands focus back to the bead on close.
 */
export function ChatWindow({
  id,
  chat,
  isCompact,
  placement,
  newSince,
  onClose,
  onOpenTerminal,
  onOpenVault,
}: ChatWindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const compactAtOpen = useRef(isCompact);
  const dragControls = useDragControls();
  // While the exit animation runs the window is on its way out: no trap, no inert page.
  const isPresent = useIsPresent();
  const isModal = isCompact && isPresent;
  const hasVisitor = chat.visitor !== null;
  // Tier 0 (OS setting, footer switch, lite devices): a 150 ms cross-fade instead of the reveal (§C.4).
  const motionOk = useMotionAllowed();
  const fade = { duration: 0.15, ease: 'linear' } as const;

  // The sheet: Tab stays inside and the page behind is inert. The bead returns focus itself.
  useFocusTrap(rootRef, isModal, { initialFocus: rootRef, returnFocus: false });
  useInertOutside(rootRef, isModal);

  // Focus moves in once the content has arrived: the first field or the composer on desktop; the dialog itself
  // on the sheet, so the phone keyboard does not cover half of it before the visitor has read it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const timer = window.setTimeout(
      () => {
        if (root.contains(document.activeElement)) return;
        const field = compactAtOpen.current ? null : root.querySelector<HTMLElement>('[data-autofocus]:not(:disabled)');
        (field ?? root).focus({ preventScroll: true });
      },
      motionOk ? 180 : 0,
    );
    return () => window.clearTimeout(timer);
    // Once, on open: later steps (intro to thread) move focus themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The sheet sits on the visual viewport: its height follows it and its bottom rides on the phone keyboard.
  useEffect(() => {
    const root = rootRef.current;
    const viewport = window.visualViewport;
    if (!isCompact || !root || !viewport) return;
    const sync = () => {
      root.style.setProperty('--vvh', `${viewport.height}px`);
      root.style.setProperty('--kb', `${Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)}px`);
    };
    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
    };
  }, [isCompact]);

  const desktop = !isCompact && placement !== null ? placement : null;
  const placementStyle: CSSProperties | undefined = desktop
    ? {
        top: desktop.top,
        left: desktop.left,
        height: desktop.height,
        width: desktop.width,
        right: 'auto',
        bottom: 'auto',
        maxHeight: 'none',
      }
    : undefined;

  let shellMotion: Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'>;
  let contentMotion: Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'> | undefined;
  if (!motionOk) {
    shellMotion = {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: fade },
      exit: { opacity: 0, transition: fade },
    };
  } else if (isCompact || !desktop) {
    shellMotion = {
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0, transition: MOTION.spring },
      exit: { opacity: 0, y: 24, transition: { duration: 0.22, ease: MOTION.bezier.depart } },
    };
  } else {
    // A circle grown from the bead's centre; `none` once open, so the float shadow is not clipped.
    const { originX: ox, originY: oy, width: w, height: h } = desktop;
    const radius = Math.ceil(Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy))) + 4;
    const small = `circle(26px at ${ox}px ${oy}px)`;
    const large = `circle(${radius}px at ${ox}px ${oy}px)`;
    shellMotion = {
      initial: { clipPath: small, opacity: 0 },
      animate: {
        clipPath: large,
        opacity: 1,
        transition: { clipPath: MOTION.spring, opacity: { duration: 0.12, ease: 'linear' } },
        transitionEnd: { clipPath: 'none' },
      },
      exit: {
        clipPath: [large, small],
        opacity: 0,
        transition: { duration: 0.24, ease: MOTION.bezier.depart },
      },
    };
    contentMotion = {
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.2, delay: 0.14, ease: MOTION.bezier.settle } },
      exit: { opacity: 0, transition: { duration: 0.1, ease: 'linear' } },
    };
  }

  const onSheetDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > SHEET_CLOSE_OFFSET || info.velocity.y > SHEET_CLOSE_VELOCITY) onClose();
  };

  return (
    <>
      {isCompact ? (
        <motion.div
          aria-hidden="true"
          data-modal-keep=""
          className={styles.scrim}
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
        data-step={hasVisitor ? 'thread' : 'intro'}
        {...shellMotion}
        drag={isCompact ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={onSheetDragEnd}
        style={placementStyle}
        className={cn(styles.window, isCompact ? styles.sheet : styles.panel)}
      >
        <motion.div className={styles.inner} {...contentMotion}>
          {isCompact ? (
            <div aria-hidden="true" className={styles.grab} onPointerDown={(e) => dragControls.start(e)} />
          ) : null}
          {/* A plain div, not <header>: inside the dialog it would read as a second banner landmark. */}
          <div className={styles.header}>
            <OwnerAvatar />
            <div className={styles.who}>
              <h2 className={styles.name}>Aman Anubhav</h2>
              <p className={styles.sub}>I usually reply within a day.</p>
            </div>
            <div className={styles.actions}>
              <HeaderButton label="Open the AI terminal" onClick={onOpenTerminal} className={styles.external}>
                <SquareTerminal aria-hidden="true" strokeWidth={1.75} />
              </HeaderButton>
              <HeaderButton label="Open the Vault" onClick={onOpenVault} className={styles.external}>
                <Lock aria-hidden="true" strokeWidth={1.75} />
              </HeaderButton>
              <HeaderButton label="Close chat" onClick={onClose}>
                <X aria-hidden="true" strokeWidth={1.75} />
              </HeaderButton>
            </div>
          </div>
          <div aria-hidden="true" className={styles.rule}>
            <svg viewBox={`0 0 ${RULE_WIDTH} 16`} preserveAspectRatio="none" focusable="false">
              <path d={RULE_PATH} />
            </svg>
            <i className={styles.summit} style={{ left: SUMMIT_LEFT }} />
          </div>

          {hasVisitor ? (
            <ChatThread chat={chat} newSince={newSince} onOpenVault={onOpenVault} />
          ) : (
            <ChatIntroForm chat={chat} onOpenTerminal={onOpenTerminal} onOpenVault={onOpenVault} />
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
