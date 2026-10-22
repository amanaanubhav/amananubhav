'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { CheckCheck, WifiOff } from 'lucide-react';

import { clientEnv } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import { messageTime } from '../model/use-unread';
import type { VisitorChatState } from '../model/use-visitor-chat';
import { ChatPlane } from './ChatPlane';
import styles from './chat-window.module.css';

/** Messages from one sender this close together share one tail and one timestamp. */
const RUN_GAP_MS = 5 * 60 * 1000;
/** The skeleton only shows when a stored thread is slow to arrive. */
const SKELETON_DELAY_MS = 300;
const COMPOSER_MAX_HEIGHT = 128;
/** Firebase is configured for this build (known without loading it). */
const CHAT_CONFIGURED = Boolean(clientEnv.firebase.apiKey);

type Item = {
  id: string;
  text: string;
  fromVisitor: boolean;
  /** Server time, or the local send time while pending. */
  at: number;
  status: 'sent' | 'sending' | 'failed';
  isNew: boolean;
};

type Block =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'new'; key: string }
  | { kind: 'run'; key: string; items: Item[] };

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

function dayLabel(at: number): string {
  const now = Date.now();
  if (sameDay(at, now)) return 'Today';
  if (sameDay(at, now - 86_400_000)) return 'Yesterday';
  return new Date(at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

const timeOf = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Day separators, the NEW divider and runs (one sender, within five minutes, same delivery state). */
function toBlocks(items: Item[], newSince: number | null): Block[] {
  const blocks: Block[] = [];
  let run: Item[] | null = null;
  let prev: Item | null = null;
  let newPlaced = false;
  for (const item of items) {
    const newDay = !prev || !sameDay(prev.at, item.at);
    const firstUnread = !newPlaced && newSince !== null && !item.fromVisitor && item.at > newSince;
    if (newDay) blocks.push({ kind: 'day', key: `day-${item.id}`, label: dayLabel(item.at) });
    if (firstUnread) {
      newPlaced = true;
      blocks.push({ kind: 'new', key: 'new' });
    }
    const joins =
      run !== null &&
      prev !== null &&
      !newDay &&
      !firstUnread &&
      prev.fromVisitor === item.fromVisitor &&
      item.at - prev.at <= RUN_GAP_MS &&
      prev.status === item.status &&
      item.status !== 'failed';
    if (joins && run) run.push(item);
    else {
      run = [item];
      blocks.push({ kind: 'run', key: `run-${item.id}`, items: run });
    }
    prev = item;
  }
  return blocks;
}

interface ChatThreadProps {
  chat: VisitorChatState;
  newSince: number | null;
  onOpenVault: () => void;
}

/**
 * The open conversation (chat design §4): runs of bubbles with one tail and one time each, day separators, a NEW
 * divider over the first unread reply, the waiting note until Aman first answers, an offline banner, failed sends
 * with Retry, and the pill composer whose Send carries the Ridge Dart. Sending, blocking and the listener are the
 * model's.
 */
export function ChatThread({ chat, newSince, onOpenVault }: ChatThreadProps) {
  const { visitor, messages, outbox, newMessage, setNewMessage, isBlocked, isOnline, isLoading, handleSendMessage } =
    chat;
  const paneRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const hintId = useId();
  const [openedAt] = useState(() => Date.now());
  const [flights, setFlights] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const canSend = newMessage.trim().length > 0 && !isBlocked;
  const unavailable = !CHAT_CONFIGURED || chat.hasDb === false;

  const serverIds = new Set(messages.map((m) => m.id));
  // A pending message (no server time yet) is one of ours: it takes its local send time.
  const sentAt = new Map(outbox.map((m) => [m.id, m.createdAt]));
  const items: Item[] = [
    ...messages.map((m): Item => {
      const at = messageTime(m);
      return {
        id: m.id,
        text: m.text,
        fromVisitor: m.sender === 'visitor',
        at: at ?? sentAt.get(m.id) ?? openedAt,
        status: at === null ? 'sending' : 'sent',
        isNew: at === null || at > openedAt,
      };
    }),
    ...outbox
      .filter((m) => !serverIds.has(m.id))
      .map((m): Item => ({ id: m.id, text: m.text, fromVisitor: true, at: m.createdAt, status: m.status, isNew: true })),
  ];
  const blocks = toBlocks(items, newSince);
  const waiting = items.some((m) => m.fromVisitor) && !items.some((m) => !m.fromVisitor);

  // Keep the newest message in view, also when the offline banner shrinks the pane. The pane scrolls itself; the
  // page never moves.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    pane.scrollTo({ top: pane.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [messages.length, outbox.length, isOnline]);

  // Just after Start chat the submit button is gone and focus with it: the composer on desktop, the sheet on phones.
  useEffect(() => {
    if (document.activeElement && document.activeElement !== document.body) return;
    const desktop = window.matchMedia('(min-width: 640px)').matches;
    const target = desktop ? fieldRef.current : fieldRef.current?.closest<HTMLElement>('[role="dialog"]');
    target?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  // Older engines without `field-sizing: content`: grow the field to its content, up to the cap.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field || CSS.supports('field-sizing', 'content')) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [newMessage]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (canSend) setFlights((n) => n + 1);
    void handleSendMessage(event);
  };

  // Enter sends (as before); Shift+Enter adds a line; an IME composition is left alone.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) formRef.current?.requestSubmit();
  };

  return (
    <>
      <div
        ref={paneRef}
        role="log"
        aria-label="Messages"
        tabIndex={0}
        data-lenis-prevent
        className={styles.body}
      >
        <ol className={styles.log}>
          <li className={styles.run} data-from="aman">
            <div className={styles.bubble}>
              <VisuallyHidden>Aman: </VisuallyHidden>
              <p>
                Hi {visitor?.name}, glad you&apos;re here. Leave your message and I&apos;ll get back to you soon. You&apos;ll
                get an email when I reply.
              </p>
            </div>
            <p className={styles.auto}>Auto-reply</p>
          </li>
          {blocks.map((block) => {
            if (block.kind === 'day') {
              return (
                <li key={block.key} className={styles.separator}>
                  {block.label}
                </li>
              );
            }
            if (block.kind === 'new') {
              return (
                <li key={block.key} className={styles.separator} data-new="">
                  New
                </li>
              );
            }
            const last = block.items[block.items.length - 1];
            const fromVisitor = last.fromVisitor;
            return (
              <li
                key={block.key}
                className={styles.run}
                data-from={fromVisitor ? 'you' : 'aman'}
                data-failed={last.status === 'failed' ? '' : undefined}
              >
                {block.items.map((item) => (
                  <div key={item.id} className={styles.bubble} data-new={item.isNew ? '' : undefined}>
                    <VisuallyHidden>{fromVisitor ? 'You: ' : 'Aman: '}</VisuallyHidden>
                    <p>{item.text}</p>
                  </div>
                ))}
                {last.status === 'failed' ? (
                  <p className={styles.failed}>
                    <span role="status">Not sent.</span>
                    <button type="button" className={styles.retry} onClick={() => chat.retry(last.id)}>
                      Retry
                    </button>
                  </p>
                ) : (
                  <p className={styles.meta}>
                    {last.status === 'sending' ? (
                      <em>Sending</em>
                    ) : (
                      <time dateTime={new Date(last.at).toISOString()}>{timeOf(last.at)}</time>
                    )}
                    {fromVisitor && last.status === 'sent' ? (
                      <>
                        <CheckCheck aria-hidden="true" strokeWidth={1.75} />
                        <VisuallyHidden>Sent</VisuallyHidden>
                      </>
                    ) : null}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {isLoading && showSkeleton ? (
          <div aria-hidden="true" className={styles.skeleton}>
            <i />
            <i />
          </div>
        ) : null}
        {waiting ? (
          <p role="status" className={styles.note}>
            Aman gets an email now. You&apos;ll get one at {visitor?.email} when he replies.
          </p>
        ) : null}
      </div>

      <div role="status">
        {!isOnline ? (
          <p className={styles.banner}>
            <WifiOff aria-hidden="true" strokeWidth={1.75} />
            <span>You&apos;re offline. Your message will send when you&apos;re back.</span>
          </p>
        ) : null}
      </div>

      {unavailable ? (
        <p className={styles.unavailable}>
          Chat is unavailable right now.{' '}
          <button type="button" data-return-focus="chat-launcher" className={styles.link} onClick={onOpenVault}>
            Send it through the Vault instead.
          </button>
        </p>
      ) : (
        <form ref={formRef} onSubmit={onSubmit} className={styles.composer}>
          <div className={styles.pill}>
            <label htmlFor={inputId} className="sr-only">
              Message
            </label>
            <textarea
              ref={fieldRef}
              id={inputId}
              rows={1}
              data-autofocus=""
              data-lenis-prevent
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isBlocked}
              aria-describedby={hintId}
              placeholder={isBlocked ? "You can't send messages in this chat" : 'Write to Aman'}
              className={styles.textarea}
            />
            <button type="submit" aria-label="Send" disabled={!canSend} className={styles.send}>
              <ChatPlane key={flights} className={cn(flights > 0 && styles.fly)} />
            </button>
          </div>
          <p id={hintId} className={styles.hint}>
            Enter sends · Shift+Enter new line
          </p>
        </form>
      )}
    </>
  );
}
