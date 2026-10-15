'use client';

import type { JSX } from 'react';

import { useTheme } from '@/shared/lib/theme';

import { useAdminInbox } from '../model/use-admin-inbox';
import { ActiveChatPanel, AdminGate, AwaitingConnectionPanel, ChatListPanel } from './AdminPanels';

/** Legacy AdminChat.jsx: passcode gate, then the two-panel inbox. */
export function AdminChatView(): JSX.Element {
  const { isDark } = useTheme();
  const inbox = useAdminInbox();

  if (!inbox.isAuthenticated) {
    return (
      <AdminGate
        isDark={isDark}
        authInput={inbox.authInput}
        onAuthInputChange={inbox.setAuthInput}
        onLogin={inbox.login}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col pt-32 pb-12 px-6 font-mono ${isDark ? 'bg-black text-white' : 'bg-[#fafafa] text-black'}`}>
      <div className={`w-full max-w-7xl mx-auto flex-1 flex h-[80vh] border shadow-2xl ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-gray-300 bg-white'}`}>
        {/* LEFT PANEL: Chat List */}
        <ChatListPanel
          isDark={isDark}
          chats={inbox.chats}
          activeChatId={inbox.activeChat?.id}
          onSelect={inbox.selectChat}
          onLogout={inbox.logout}
        />

        {/* RIGHT PANEL: Active Chat */}
        {inbox.activeChat ? (
          <ActiveChatPanel
            isDark={isDark}
            activeChat={inbox.activeChat}
            messages={inbox.messages}
            messagesEndRef={inbox.messagesEndRef}
            newMessage={inbox.newMessage}
            onNewMessageChange={inbox.setNewMessage}
            onSend={inbox.sendMessage}
            onBlock={inbox.toggleBlock}
            onClear={inbox.clearChat}
            onDelete={inbox.deleteUser}
          />
        ) : (
          <AwaitingConnectionPanel isDark={isDark} />
        )}
      </div>
    </div>
  );
}
