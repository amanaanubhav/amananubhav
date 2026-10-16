'use client';

import type { JSX, RefObject } from 'react';
import { ArrowLeft, Ban, Eraser, Inbox, Send, UserX } from 'lucide-react';

import { formatMessageTime, type ChatMessage, type ChatThread } from '@/entities/chat-thread';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Log } from '@/shared/ui/journal';

import { INBOX_COPY, threadEmail, threadName, threadPhone, toDateTime } from './thread-display';

type PreventableEvent = { preventDefault(): void };

export const THREAD_HEADING_ID = 'inbox-thread-title';

export interface ThreadPanelProps {
  activeChat: ChatThread;
  messages: readonly ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSend: (e: PreventableEvent) => void;
  onBlock: () => void;
  onClear: () => void;
  onDelete: () => void;
  /** Below 1024 px the thread is its own view; this returns to the list. */
  onBack: () => void;
  className?: string;
}

/** Destructive actions read in the error color, with a text label (§G.7, §B.1). */
const DESTRUCTIVE = 'text-error duration-micro';

/** Right pane (§G.7): who, the actions, the thread as log entries, the composer. */
export function ThreadPanel({
  activeChat,
  messages,
  messagesEndRef,
  newMessage,
  onNewMessageChange,
  onSend,
  onBlock,
  onClear,
  onDelete,
  onBack,
  className,
}: ThreadPanelProps): JSX.Element {
  const name = threadName(activeChat);
  const blocked = Boolean(activeChat.isBlocked);
  const replyId = `inbox-reply-${activeChat.id}`;
  const hintId = `${replyId}-hint`;

  return (
    <section aria-labelledby={THREAD_HEADING_ID} className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div className="border-b border-line px-4 py-3 md:px-6">
        <Button variant="text" icon={ArrowLeft} onClick={onBack} className="mb-2 duration-micro lg:hidden">
          {INBOX_COPY.backToList}
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2
              id={THREAD_HEADING_ID}
              tabIndex={-1}
              className="text-title m-0 truncate font-display font-semibold text-ink focus:outline-none focus-visible:[outline-style:solid]"
            >
              {name}
            </h2>
            <Log
              layout="strip"
              label="Visitor details"
              className="mt-1"
              items={[
                { key: 'email', value: threadEmail(activeChat) },
                { key: 'phone', value: threadPhone(activeChat) },
                { key: 'status', value: blocked ? INBOX_COPY.blocked : undefined, mono: false },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Ban} aria-pressed={blocked} onClick={onBlock} className="duration-micro">
              {blocked ? INBOX_COPY.unblock : INBOX_COPY.block}
            </Button>
            <Button variant="secondary" icon={Eraser} onClick={onClear} className={DESTRUCTIVE}>
              {INBOX_COPY.clear}
            </Button>
            <Button variant="secondary" icon={UserX} onClick={onDelete} className={DESTRUCTIVE}>
              {INBOX_COPY.remove}
            </Button>
          </div>
        </div>
      </div>

      <div data-lenis-prevent className="scroll-pane min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6">
        {messages.length > 0 ? (
          <ol aria-label={`Messages with ${name}`} className="m-0 list-none p-0">
            {messages.map((msg) => {
              const mine = msg.sender === 'admin';
              const time = formatMessageTime(msg.timestamp);
              return (
                <li
                  key={msg.id}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 border-b border-line py-3 last:border-b-0"
                >
                  <span className="text-caption pt-0.5 font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
                    {time ? <time dateTime={toDateTime(msg.timestamp)}>{time}</time> : null}
                  </span>
                  <div className="min-w-0">
                    <p className={cn('text-caption m-0 font-body italic', mine ? 'text-signal' : 'text-ink-muted')}>
                      {mine ? INBOX_COPY.you : name}
                    </p>
                    <p className="text-ui m-0 mt-0.5 whitespace-pre-wrap break-words font-body text-ink">{msg.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-ui m-0 py-6 font-body text-ink-muted">{INBOX_COPY.noMessages}</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-line px-4 py-4 md:px-6">
        <form onSubmit={onSend} className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor={replyId} className="sr-only">
              {INBOX_COPY.replyLabel}
            </label>
            <textarea
              id={replyId}
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e);
                }
              }}
              disabled={blocked}
              rows={2}
              aria-describedby={hintId}
              placeholder={blocked ? INBOX_COPY.blockedComposer : INBOX_COPY.replyPlaceholder}
              className="text-ui block min-h-14 w-full resize-none rounded-control border border-line-strong bg-surface-2 px-3 py-2.5 font-body text-ink transition-[border-color] duration-micro placeholder:text-ink-muted hover:border-ink-muted focus-visible:border-signal focus-visible:outline-offset-0 disabled:border-line disabled:text-ink-muted disabled:hover:border-line"
            />
          </div>
          <Button type="submit" icon={Send} disabled={!newMessage.trim() || blocked} className="duration-micro">
            {INBOX_COPY.send}
          </Button>
        </form>
        {blocked ? (
          <p id={hintId} className="text-caption m-0 mt-2 flex items-center gap-2 font-body text-error">
            <Ban aria-hidden="true" focusable="false" className="size-3.5 shrink-0" strokeWidth={1.75} />
            {INBOX_COPY.blockedComposer}
          </p>
        ) : (
          <p id={hintId} className="text-caption m-0 mt-2 font-body text-ink-muted">
            {INBOX_COPY.sendHint}
          </p>
        )}
      </div>
    </section>
  );
}

/** Right pane before a conversation is chosen (wide screens only; small screens show the list). */
export function ThreadPlaceholder({ className }: { className?: string }): JSX.Element {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col items-start justify-center gap-3 px-8', className)}>
      <Inbox aria-hidden="true" focusable="false" className="size-6 text-ink-muted" strokeWidth={1.5} />
      <p className="text-ui m-0 font-body text-ink-muted">{INBOX_COPY.selectPrompt}</p>
    </div>
  );
}
