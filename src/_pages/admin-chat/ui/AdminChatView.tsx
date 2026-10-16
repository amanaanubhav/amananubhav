'use client';

import { useMemo, useState, type JSX } from 'react';

import type { ChatThread } from '@/entities/chat-thread';
import { cn } from '@/shared/lib/cn';

import { useAdminInbox } from '../model/use-admin-inbox';
import { AdminGate } from './AdminGate';
import { ConversationList, conversationRowId } from './ConversationList';
import { matchesConversation } from './thread-display';
import { THREAD_HEADING_ID, ThreadPanel, ThreadPlaceholder } from './ThreadPanel';

const NARROW_QUERY = '(max-width: 1023px)';

function focusLater(id: string): void {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/**
 * /admin-chat (§G.7): the passcode gate, then two panes (conversations, thread). Below 1024 px the panes are two
 * views with a back button. A tool page: tokens and type only, no reveals, 120 ms state changes. All data and
 * actions come from `useAdminInbox`, unchanged; clear and delete keep the confirmation that hook already asks.
 */
export function AdminChatView(): JSX.Element {
  const inbox = useAdminInbox();
  const [query, setQuery] = useState('');
  const [threadView, setThreadView] = useState(false);

  const visibleChats = useMemo(
    () => inbox.chats.filter((chat) => matchesConversation(chat, query)),
    [inbox.chats, query],
  );

  if (!inbox.isAuthenticated) {
    return <AdminGate authInput={inbox.authInput} onAuthInputChange={inbox.setAuthInput} onLogin={inbox.login} />;
  }

  const { activeChat } = inbox;
  const showThread = threadView && activeChat !== null;
  const narrow = () => window.matchMedia(NARROW_QUERY).matches;

  const select = (chat: ChatThread) => {
    inbox.selectChat(chat);
    setThreadView(true);
    if (narrow()) focusLater(THREAD_HEADING_ID);
  };

  const back = () => {
    setThreadView(false);
    if (activeChat) focusLater(conversationRowId(activeChat.id));
  };

  return (
    <div className="flex flex-col px-4 pb-6 pt-20 md:px-8">
      <div className="mx-auto flex h-[calc(100svh-6.5rem)] min-h-[30rem] w-full max-w-content overflow-hidden rounded-panel border border-line bg-surface">
        <ConversationList
          total={inbox.chats.length}
          chats={visibleChats}
          query={query}
          onQueryChange={setQuery}
          activeChatId={activeChat?.id}
          onSelect={select}
          onLogout={inbox.logout}
          className={cn(showThread && 'max-lg:hidden')}
        />

        {activeChat ? (
          <ThreadPanel
            activeChat={activeChat}
            messages={inbox.messages}
            messagesEndRef={inbox.messagesEndRef}
            newMessage={inbox.newMessage}
            onNewMessageChange={inbox.setNewMessage}
            onSend={inbox.sendMessage}
            onBlock={inbox.toggleBlock}
            onClear={inbox.clearChat}
            onDelete={inbox.deleteUser}
            onBack={back}
            className={cn(!showThread && 'max-lg:hidden')}
          />
        ) : (
          <ThreadPlaceholder className="max-lg:hidden" />
        )}
      </div>
    </div>
  );
}
