'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, Info, WifiOff, X } from 'lucide-react';

import { MOTION } from '@/shared/config';
import { useEscapeKey, useFocusTrap, useMediaQuery } from '@/shared/lib/dom';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

import {
  OFFLINE_NOTICE,
  RATE_LIMITED_NOTICE,
  TERMINAL_GREETING,
  TERMINAL_INPUT_MAX_CHARS,
  type TerminalLogEntry,
} from '../model/terminal-log';
import { useTerminalSession } from '../model/use-terminal-session';
import { LiveReply, Paragraphs, Ridge, ThinkingBlock, TypedReply } from './Alpenglow';
import { TERMINAL_CHIP_COMMANDS, TERMINAL_PROMPTS, TERMINAL_QUICK_LINKS } from './terminal-copy';
import { QuickLink, TerminalRail } from './TerminalRail';
import s from './TerminalOverlay.module.css';

export interface TerminalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Wait after the last log change before announcing, so a streamed reply is read out once, as final text.
 * (Offline replies land together with `isProcessing: false`; the settle is harmless for them.) */
const ANNOUNCE_SETTLE_MS = 650;

/** Notices the session prefixes to a reply (`${notice}\n\n${reply}`); the UI shows them as a notice pill. */
const REPLY_NOTICES = [OFFLINE_NOTICE, RATE_LIMITED_NOTICE];

interface Announcement {
  id: number;
  text: string;
}

/** One polite announcement per finished reply, never token by token (§H.5, §J.1). */
function useReplyAnnouncement(logs: readonly TerminalLogEntry[], isProcessing: boolean): Announcement | null {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  // The entry already read out (or present on mount, like the greeting). Keyed on the entry itself rather
  // than on an isProcessing edge, because local commands (history, exit) finish within one render.
  const announcedEntry = useRef<TerminalLogEntry | undefined>(logs[logs.length - 1]);

  useEffect(() => {
    if (isProcessing) return;
    const last = logs[logs.length - 1];
    if (!last || last === announcedEntry.current || last.src !== 'AI' || last.msg.trim() === '') return;
    const text = last.msg;
    const timer = window.setTimeout(() => {
      announcedEntry.current = last;
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

/**
 * The log length when the dialog last opened (or the log was cleared): entries at or after it were added
 * while the visitor watched, so only they play entrance and reply motion. Reopening never replays the log.
 */
function useOpenMark(isOpen: boolean, length: number): number {
  const [mark, setMark] = useState({ open: isOpen, from: length });
  if (mark.open !== isOpen || length < mark.from) {
    setMark({ open: isOpen, from: length });
    return length;
  }
  return mark.from;
}

type Span = readonly [number, number];

/**
 * Index ranges of the log written in offline (CLI) mode. Each entry keeps the mode it was added in: a
 * stretch starts at the reply being answered when the terminal goes offline and ends when it is back.
 */
function useCliSpans(length: number, isOffline: boolean): readonly Span[] {
  const [state, setState] = useState<{ on: boolean; len: number; spans: readonly Span[] }>({
    on: isOffline,
    len: length,
    spans: isOffline ? [[0, Infinity]] : [],
  });
  if (state.on === isOffline && state.len === length) return state.spans;
  let spans = state.spans;
  if (length < state.len) spans = state.on ? [[0, Infinity]] : []; // `clear`
  if (isOffline && !state.on) spans = [...spans, [Math.max(0, length - 1), Infinity]];
  if (!isOffline && state.on) spans = spans.map(([from, to]): Span => [from, to === Infinity ? length : to]);
  setState({ on: isOffline, len: length, spans });
  return spans;
}

function splitNotice(msg: string): { notice?: string; body: string } {
  for (const notice of REPLY_NOTICES) {
    if (msg.startsWith(`${notice}\n\n`)) return { notice, body: msg.slice(notice.length + 2) };
  }
  return { body: msg };
}

function Notice({ text }: { text: string }) {
  const offline = text === OFFLINE_NOTICE;
  const Icon = offline ? WifiOff : Info;
  return (
    <p className={s.notice} data-tone={offline ? undefined : 'ok'}>
      <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />
      {text}
    </p>
  );
}

/**
 * The AI terminal, "Ask Aman" (§H.5): a modal dialog over everything but the vault. Always mounted so the
 * log survives close and navigation; only the dialog itself enters and leaves.
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
  const openFrom = useOpenMark(isOpen, logs.length);
  const cliSpans = useCliSpans(logs.length, isOffline);
  /** How far back ArrowUp has stepped through the visitor's questions (-1: not browsing). */
  const [recall, setRecall] = useState(-1);

  const setInputNode = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      focusTargetRef.current = node;
    },
    [inputRef],
  );

  const fillSuggestion = (text: string) => {
    setInput(text);
    setRecall(-1);
    inputRef.current?.focus();
  };

  /** ↑ / ↓ step through earlier questions when the caret is at the start (or already browsing). */
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey || event.altKey || event.metaKey || event.ctrlKey || event.nativeEvent.isComposing) return;
    if (event.key !== 'ArrowUp' && (event.key !== 'ArrowDown' || recall < 0)) return;
    const el = event.currentTarget;
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    if (event.key === 'ArrowUp' && input !== '' && recall < 0 && !atStart) return;
    const asked = logs.filter((entry) => entry.src === 'USR').map((entry) => entry.msg);
    const next = recall + (event.key === 'ArrowUp' ? 1 : -1);
    if (next >= asked.length) return;
    event.preventDefault();
    setRecall(next);
    setInput(next < 0 ? '' : (asked[asked.length - 1 - next] ?? ''));
  };

  const fade = { duration: 0.15 };
  const depart = { duration: MOTION.dur.overlayOut, ease: MOTION.bezier.depart };
  const panelMotion = !motionOk
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: fade }, exit: { opacity: 0, transition: fade } }
    : isCompact
      ? {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0, transition: MOTION.spring },
          exit: { opacity: 0, y: 12, transition: depart },
        }
      : {
          initial: { opacity: 0, y: 16, scale: 0.97 },
          animate: { opacity: 1, y: 0, scale: 1, transition: MOTION.spring },
          exit: { opacity: 0, y: 8, scale: 0.98, transition: depart },
        };
  const backdropMotion = motionOk
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: MOTION.dur.ui, ease: MOTION.bezier.settle } },
        exit: { opacity: 0, transition: depart },
      }
    : { initial: { opacity: 0 }, animate: { opacity: 1, transition: fade }, exit: { opacity: 0, transition: fade } };

  const lastIndex = logs.length - 1;
  const lastLog = logs[lastIndex];
  // Thinking shows until the reply's first text arrives, including the offline fallback's delay after
  // `isProcessing` has already turned false; a streamed reply replaces it as soon as text appears.
  const awaitingReply = lastLog?.src === 'AI' && lastLog.msg === '' && (isProcessing || isOffline);
  const busy = isProcessing || awaitingReply;
  const isFresh = !logs.some((entry) => entry.src === 'USR');
  const isCli = (i: number) => cliSpans.some(([from, to]) => i >= from && i < to);

  const renderEntry = (entry: TerminalLogEntry, i: number) => {
    const isNew = i >= openFrom ? '' : undefined;
    const cli = isCli(i);

    if (entry.src === 'SYS') return <Notice key={i} text={entry.msg} />;

    if (entry.src === 'USR') {
      return cli ? (
        <p key={i} className={s.cliYou} data-new={isNew}>
          <b aria-hidden="true">&gt;</b>
          <span className="sr-only">You: </span>
          {entry.msg}
        </p>
      ) : (
        <p key={i} className={s.you} data-new={isNew}>
          <span className="sr-only">You: </span>
          {entry.msg}
        </p>
      );
    }

    const latest = i === lastIndex && isNew !== undefined;
    if (entry.msg === '') {
      if (!(i === lastIndex && awaitingReply)) return null;
      return cli ? (
        <div key={i} className={s.cliRow} data-new={isNew} data-ag="offline-wait" aria-busy="true">
          <p className={s.cliOut} data-wait="">
            searching notes
            <span className={s.block} aria-hidden="true" />
          </p>
        </div>
      ) : (
        <article key={i} className={s.ai} data-new={isNew} data-ag="thinking" aria-busy="true">
          <div className={s.gutter}>
            <Ridge />
          </div>
          <ThinkingBlock motionOk={motionOk} />
        </article>
      );
    }

    const { notice, body } = splitNotice(entry.msg);
    const streaming = latest && isProcessing;
    return (
      <Fragment key={i}>
        {notice && <Notice text={notice} />}
        {cli ? (
          <div className={s.cliRow} data-new={isNew}>
            <span className="sr-only">Aman: </span>
            <TypedReply text={body} animate={latest && motionOk} />
          </div>
        ) : (
          <article
            className={s.ai}
            data-new={isNew}
            data-ag={latest ? (streaming ? 'streaming' : 'done') : undefined}
            aria-busy={streaming || undefined}
          >
            <div className={s.gutter}>
              <Ridge />
            </div>
            <div className={s.prose}>
              <span className="sr-only">Aman: </span>
              {latest ? <LiveReply text={body} streaming={streaming} /> : <Paragraphs text={body} />}
            </div>
          </article>
        )}
      </Fragment>
    );
  };

  const sendDisabled = busy || input.trim() === '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="terminal"
          // No wheel or touch scroll inside the terminal (rail, log, scrim) may reach Lenis: the open terminal scrolls
          // its own panes and the page behind stays still (§C.3 overlay scroll-stop).
          data-lenis-prevent=""
          className={`${s.overlay} z-terminal`}
          style={viewport ? { top: viewport.top, height: viewport.height, bottom: 'auto' } : undefined}
        >
          <motion.div aria-hidden="true" className={s.scrim} onClick={onClose} {...backdropMotion} />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={s.panel}
            {...panelMotion}
          >
            <header className={s.head}>
              <Ridge lit className={s.mark} />
              <h2 id={titleId} className={s.title}>
                Ask Aman
              </h2>
              <span role="status" className="contents">
                {isOffline && (
                  <span className={s.offline}>
                    <span>
                      Offline<span className={s.long}>, answering from saved notes</span>
                    </span>
                  </span>
                )}
              </span>
              <button type="button" className={s.close} aria-label="Close" title="Close" onClick={onClose}>
                <X aria-hidden="true" focusable="false" className="size-5" strokeWidth={1.75} />
              </button>
            </header>

            <div className={s.body}>
              <TerminalRail onFill={fillSuggestion} onNavigate={onClose} />

              <div className={s.main}>
                <div
                  role="log"
                  aria-live="off"
                  aria-label="Conversation"
                  aria-busy={busy}
                  data-lenis-prevent=""
                  tabIndex={0}
                  className={`scroll-pane ${s.log}`}
                >
                  <div className={s.col}>
                    {isFresh ? (
                      <div className={s.hello}>
                        <Ridge lit detailed />
                        <h3 className={s.helloTitle}>{TERMINAL_GREETING.title}</h3>
                        <p className={s.helloLine}>{TERMINAL_GREETING.line}</p>
                        <nav className={s.pills} aria-label="Go to">
                          {TERMINAL_QUICK_LINKS.map((link) => (
                            <QuickLink key={link.label} link={link} className={s.pill} onNavigate={onClose} />
                          ))}
                        </nav>
                      </div>
                    ) : (
                      logs.map(renderEntry)
                    )}
                    <div ref={endRef} />
                  </div>
                </div>

                <div aria-live="polite" className="sr-only">
                  {announcement && <p key={announcement.id}>{announcement.text}</p>}
                </div>

                <div className={s.dock}>
                  <div className={s.dockIn}>
                    <div className={s.chips} role="group" aria-label="Suggestions">
                      {TERMINAL_PROMPTS.map((prompt) => (
                        <button key={prompt.full} type="button" className={s.chip} onClick={() => fillSuggestion(prompt.full)}>
                          {prompt.short}
                        </button>
                      ))}
                      {TERMINAL_CHIP_COMMANDS.map((cmd) => (
                        <button key={cmd} type="button" className={s.chip} data-mono="" onClick={() => fillSuggestion(cmd)}>
                          {cmd}
                        </button>
                      ))}
                    </div>

                    <form
                      onSubmit={(event) => {
                        setRecall(-1);
                        void handleCommand(event);
                      }}
                      className={s.composer}
                    >
                      {isOffline && (
                        <span className={s.ps} aria-hidden="true">
                          &gt;
                        </span>
                      )}
                      <label htmlFor={inputId} className="sr-only">
                        Message Aman
                      </label>
                      <input
                        ref={setInputNode}
                        id={inputId}
                        type="text"
                        value={input}
                        onChange={(event) => {
                          setInput(event.target.value);
                          setRecall(-1);
                        }}
                        onKeyDown={onInputKeyDown}
                        placeholder={isOffline ? 'Offline. Type help or a topic' : 'Ask about my work, treks or the night sky'}
                        maxLength={TERMINAL_INPUT_MAX_CHARS}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        enterKeyHint="send"
                        className={s.input}
                        data-cli={isOffline ? '' : undefined}
                      />
                      <button
                        type="submit"
                        className={s.send}
                        aria-disabled={sendDisabled}
                        aria-label={busy ? 'Writing a reply' : 'Send'}
                        data-ag={busy ? 'thinking' : undefined}
                      >
                        {busy ? <Ridge /> : <ArrowUp aria-hidden="true" focusable="false" strokeWidth={2} />}
                      </button>
                    </form>

                    <p className={s.hints}>
                      <span className={s.hint}>
                        <kbd className={s.kbd}>Enter</kbd> send
                      </span>
                      <span className={s.hint}>
                        <kbd className={s.kbd}>↑</kbd> last question
                      </span>
                      <span className={s.hint}>
                        <kbd className={s.kbd}>Esc</kbd> close
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
