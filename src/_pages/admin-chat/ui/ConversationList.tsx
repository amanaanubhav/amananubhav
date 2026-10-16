'use client';

import type { JSX } from 'react';
import { Ban, LogOut } from 'lucide-react';

import { formatMessageTime, type ChatThread } from '@/entities/chat-thread';
import { cn } from '@/shared/lib/cn';
import { SearchField } from '@/shared/ui/archive';
import { Button } from '@/shared/ui/button';

import { conversationCountLabel, INBOX_COPY, threadEmail, threadName, toDateTime } from './thread-display';

export interface ConversationListProps {
  /** Every conversation (for the empty state and the count). */
  total: number;
  /** Conversations matching the search. */
  chats: readonly ChatThread[];
  query: string;
  onQueryChange: (value: string) => void;
  activeChatId: string | undefined;
  onSelect: (chat: ChatThread) => void;
  onLogout: () => void;
  className?: string;
}

/** Stable DOM id of a conversation row, so focus can return to it from the thread view. */
export function conversationRowId(chatId: string): string {
  return `inbox-row-${chatId}`;
}

function ConversationRow({ chat, active, onSelect }: { chat: ChatThread; active: boolean; onSelect: () => void }) {
  const unread = chat.unreadCount ?? 0;
  const email = threadEmail(chat);
  const time = formatMessageTime(chat.lastActive);

  return (
    <li className="border-b border-line">
      <button
        id={conversationRowId(chat.id)}
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'block w-full px-4 py-3 text-left transition-colors duration-micro hover:bg-surface-2',
          'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal',
          'aria-[current=true]:bg-surface-2 aria-[current=true]:shadow-[inset_2px_0_0_rgb(var(--c-signal))]',
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-ui min-w-0 truncate font-display font-semibold text-ink">{threadName(chat)}</span>
          {time ? (
            <time
              dateTime={toDateTime(chat.lastActive)}
              className="text-caption shrink-0 font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]"
            >
              {time}
            </time>
          ) : null}
        </span>
        {email ? <span className="text-caption block truncate font-body text-ink-muted">{email}</span> : null}
        {chat.lastMessage ? (
          <span className={cn('text-ui mt-1 block truncate font-body text-ink', unread > 0 && 'font-semibold')}>
            {chat.lastMessage}
          </span>
        ) : null}
        {unread > 0 || chat.isBlocked ? (
          <span className="text-caption mt-1 flex flex-wrap gap-x-4 font-body">
            {unread > 0 ? (
              <span className="font-data text-ink [font-variant-numeric:tabular-nums_slashed-zero]">{unread} unread</span>
            ) : null}
            {chat.isBlocked ? (
              <span className="inline-flex items-center gap-1 text-error">
                <Ban aria-hidden="true" focusable="false" className="size-3.5" strokeWidth={1.75} />
                {INBOX_COPY.blocked}
              </span>
            ) : null}
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** Left pane (§G.7): title, log out, search, then the conversations. */
export function ConversationList({
  total,
  chats,
  query,
  onQueryChange,
  activeChatId,
  onSelect,
  onLogout,
  className,
}: ConversationListProps): JSX.Element {
  return (
    <section
      aria-labelledby="inbox-title"
      className={cn('flex min-h-0 w-full flex-col border-line lg:w-80 lg:shrink-0 lg:border-r', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h1 id="inbox-title" className="text-title m-0 font-display font-semibold text-ink">
            {INBOX_COPY.title}
          </h1>
          <p className="text-caption m-0 font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
            {conversationCountLabel(total)}
          </p>
        </div>
        <Button variant="secondary" icon={LogOut} onClick={onLogout} className="duration-micro">
          {INBOX_COPY.logout}
        </Button>
      </div>

      <div className="border-b border-line p-4 [&>div]:w-full">
        <SearchField
          value={query}
          onChange={onQueryChange}
          label={INBOX_COPY.searchLabel}
          placeholder={INBOX_COPY.searchLabel}
          className="w-full flex-1"
        />
      </div>

      <div data-lenis-prevent className="scroll-pane min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {chats.length > 0 ? (
          <ul aria-label={INBOX_COPY.title} className="m-0 list-none p-0">
            {chats.map((chat) => (
              <ConversationRow
                key={chat.id}
                chat={chat}
                active={activeChatId === chat.id}
                onSelect={() => onSelect(chat)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-ui m-0 px-4 py-8 font-body text-ink-muted">
            {total === 0 ? INBOX_COPY.empty : INBOX_COPY.noMatch(query)}
          </p>
        )}
      </div>
    </section>
  );
}
