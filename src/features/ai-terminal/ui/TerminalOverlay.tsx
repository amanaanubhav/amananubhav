'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Send, Wifi, WifiOff, X } from 'lucide-react';

import { MOTION } from '@/shared/config';
import { useEscapeKey, useFocusTrap, useMediaQuery } from '@/shared/lib/dom';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { IconButton } from '@/shared/ui/button';
import { StatusChip } from '@/shared/ui/status-chip';

import type { TerminalLogEntry, TerminalLogSource } from '../model/terminal-log';
import { useTerminalSession } from '../model/use-terminal-session';

export interface TerminalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_LABEL: Record<TerminalLogSource, string> = { USR: 'you', AI: 'aman', SYS: 'system' };

const MESSAGE_TONE: Record<TerminalLogSource, string> = {
  USR: 'text-[15px] text-ink-muted',
  AI: 'text-[15px] text-ink',
  SYS: 'text-caption text-ink-muted',
};

const SUGGESTIONS = ['projects', 'treks', 'remote', 'contact'] as const;

/** Wait after the last log change before announcing: the offline fallback rewrites the reply 600 ms
 * after `isProcessing` turns false, and only the final text should be read out. */
const ANNOUNCE_SETTLE_MS = 650;

interface Announcement {
  id: number;
  text: string;
}

/** One polite announcement per finished reply, never token by token (§H.5, §J.1). */
function useReplyAnnouncement(logs: readonly TerminalLogEntry[], isProcessing: boolean): Announcement | null {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const awaitingReply = useRef(false);

  useEffect(() => {
    if (isProcessing) {
      awaitingReply.current = true;
      return;
    }
    if (!awaitingReply.current) return;
    const last = logs[logs.length - 1];
    if (!last || last.src !== 'AI' || last.msg.trim() === '') return;
    const text = last.msg;
    const timer = window.setTimeout(() => {
      awaitingReply.current = false;
      setAnnouncement((prev) => ({ id: (prev?.id ?? 0) + 1, text }));
    }, ANNOUNCE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [logs, isProcessing]);

  return announcement;
}

interface ViewportBox {
  height: number;
  top: number;
}

/**
 * The visual viewport while the compact sheet is open, so the input row stays pinned above the
 * on-screen keyboard (§H.5). `null` when inactive or unsupported; the sheet then fills `100dvh`.
 */
function useKeyboardSafeViewport(active: boolean): ViewportBox | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const vv = active ? window.visualViewport : null;
      if (!vv) return () => {};
      vv.addEventListener('resize', onChange);
      vv.addEventListener('scroll', onChange);
      return () => {
        vv.removeEventListener('resize', onChange);
        vv.removeEventListener('scroll', onChange);
      };
    },
    [active],
  );
  const getSnapshot = useCallback(() => {
    const vv = active ? window.visualViewport : null;
    return vv ? `${Math.round(vv.height)} ${Math.round(vv.offsetTop)}` : '';
  }, [active]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '');
  if (!snapshot) return null;
  const [height = 0, top = 0] = snapshot.split(' ').map(Number);
  return height > 0 ? { height, top } : null;
}

function ThinkingLine({ animate }: { animate: boolean }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3">
      <span className="pt-0.5 font-body text-caption italic text-ink-muted">aman</span>
      <p className="font-data text-caption text-ink-muted">
        Thinking
        {animate ? (
          <span aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0.25 }}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: MOTION.bezier.breath, delay: i * 0.15 }}
              >
                .
              </motion.span>
            ))}
          </span>
        ) : (
          '...'
        )}
      </p>
    </div>
  );
}

/**
 * The AI terminal (§H.5): a modal dialog over everything but the vault. Always mounted so the log
 * survives close and navigation; only the dialog itself enters and leaves.
 */
export function TerminalOverlay({ isOpen, onClose }: TerminalOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const focusTargetRef = useRef<HTMLInputElement | null>(null);

  // The trap must activate before the session's own effect focuses the input: effects run in
  // declaration order, and the trap records `document.activeElement` as the opener. Declared after,
  // it took the input for the opener and refocused it while the panel was leaving, losing focus.
  useFocusTrap(panelRef, isOpen, { initialFocus: focusTargetRef });
  useEscapeKey(onClose, isOpen);

  const { input, setInput, logs, isProcessing, isOffline, endRef, inputRef, handleCommand } =
    useTerminalSession(isOpen);

  const titleId = useId();
  const inputId = useId();
  const motionOk = useMotionAllowed();
  const isCompact = useMediaQuery('(max-width: 639px)');
  const viewport = useKeyboardSafeViewport(isOpen && isCompact);
  const announcement = useReplyAnnouncement(logs, isProcessing);

  const setInputNode = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      focusTargetRef.current = node;
    },
    [inputRef],
  );

  const fillSuggestion = (word: string) => {
    setInput(word);
    inputRef.current?.focus();
  };

  const fade = { duration: 0.15 };
  const panelMotion = motionOk
    ? {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0, transition: MOTION.spring },
        exit: { opacity: 0, y: 12, transition: { duration: MOTION.dur.overlayOut, ease: MOTION.bezier.depart } },
      }
    : { initial: { opacity: 0 }, animate: { opacity: 1, transition: fade }, exit: { opacity: 0, transition: fade } };
  const backdropMotion = motionOk
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: MOTION.dur.ui, ease: MOTION.bezier.settle } },
        exit: { opacity: 0, transition: { duration: MOTION.dur.overlayOut, ease: MOTION.bezier.depart } },
      }
    : { initial: { opacity: 0 }, animate: { opacity: 1, transition: fade }, exit: { opacity: 0, transition: fade } };

  const visibleLogs = logs.filter((line) => !(line.src === 'AI' && line.msg === ''));
  // Thinking shows until the reply's first text arrives, including the offline fallback's delay after
  // `isProcessing` has already turned false; a streamed reply replaces it as soon as text appears.
  const lastLog = logs[logs.length - 1];
  const awaitingReply = lastLog?.src === 'AI' && lastLog.msg === '' && (isProcessing || isOffline);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="terminal"
          className="fixed inset-0 z-terminal flex items-stretch justify-center sm:items-center sm:p-6"
          style={viewport ? { top: viewport.top, height: viewport.height, bottom: 'auto' } : undefined}
        >
          <motion.div aria-hidden="true" className="absolute inset-0 bg-ground/80" onClick={onClose} {...backdropMotion} />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={
              'relative flex h-full w-full flex-col overflow-hidden bg-surface text-ink ' +
              'pt-[env(safe-area-inset-top)] sm:pt-0 ' +
              'sm:h-[72vh] sm:max-h-[calc(100dvh-48px)] sm:min-h-[min(420px,calc(100dvh-48px))] sm:max-w-[880px] ' +
              'sm:rounded-panel sm:border sm:border-line sm:shadow-float'
            }
            {...panelMotion}
          >
            <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line pl-4 pr-1 sm:gap-4 sm:pl-5 sm:pr-1.5">
              <h2 id={titleId} className="truncate font-data text-caption font-medium text-ink">
                aman@anubhav: ~
              </h2>
              <StatusChip tone={isOffline ? 'warning' : 'success'} icon={isOffline ? WifiOff : Wifi}>
                {isOffline ? 'Offline cache' : 'Live model'}
              </StatusChip>
              <IconButton label="Close terminal" icon={X} size={40} onClick={onClose} className="ml-auto" />
            </header>

            <div
              role="log"
              aria-live="off"
              aria-label="Conversation"
              data-lenis-prevent=""
              tabIndex={0}
              className="scroll-pane min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 focus-visible:outline-offset-[-2px] sm:px-6"
            >
              {visibleLogs.map((line, i) => (
                <div key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3">
                  <span className="select-none pt-0.5 font-body text-caption italic text-ink-muted">
                    {SOURCE_LABEL[line.src]}
                  </span>
                  <p className={`whitespace-pre-wrap break-words font-data leading-relaxed ${MESSAGE_TONE[line.src]}`}>
                    {line.msg}
                  </p>
                </div>
              ))}
              {awaitingReply && <ThinkingLine animate={motionOk} />}
              <div ref={endRef} />
            </div>

            <div aria-live="polite" className="sr-only">
              {announcement && <p key={announcement.id}>{announcement.text}</p>}
            </div>

            <div className="shrink-0 border-t border-line px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4">
              <div role="group" aria-label="Suggestions" className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-1">
                <span className="font-body text-caption italic text-ink-muted" aria-hidden="true">
                  Try
                </span>
                {SUGGESTIONS.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => fillSuggestion(word)}
                    className={
                      'min-h-6 rounded-control font-data text-caption text-ink underline decoration-signal decoration-1 ' +
                      'underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2 ' +
                      '[@media(pointer:coarse)]:min-h-11'
                    }
                  >
                    {word}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  void handleCommand(event);
                }}
                className="mt-2 flex items-center gap-2"
              >
                <label htmlFor={inputId} className="sr-only">
                  Message the terminal
                </label>
                <div className="relative min-w-0 flex-1">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-data text-[15px] text-signal"
                  >
                    &gt;
                  </span>
                  <input
                    ref={setInputNode}
                    id={inputId}
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={isOffline ? "Offline. Try 'help'" : 'Ask about my projects, treks or how I work'}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="send"
                    className={
                      'h-11 w-full rounded-control border border-line-strong bg-surface-2 pl-8 pr-3 font-data text-[16px] ' +
                      'text-ink caret-signal placeholder:text-ink-muted transition-colors duration-hover ' +
                      'hover:border-ink-muted focus:border-signal focus-visible:outline-offset-0 sm:text-[15px]'
                    }
                  />
                </div>
                <IconButton type="submit" label="Send" icon={Send} variant="outline" disabled={isProcessing} />
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
