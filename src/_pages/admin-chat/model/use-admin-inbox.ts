'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import type { ChatMessage, ChatThread } from '@/entities/chat-thread';
import { isAdminPasscode } from '@/shared/config';
import { lazyModule } from '@/shared/lib/lazy';

/**
 * Firestore + EmailJS for the inbox, fetched with `import()` once the gate is passed (§J.2). Every action needs a
 * selected thread, which only arrives through the loaded listener, so the actions read it synchronously.
 */
const inboxApi = lazyModule(() => import('../api/admin-inbox-api'));
type InboxApi = NonNullable<ReturnType<typeof inboxApi.get>>;

/** Runs `attach` once the api is loaded and the anonymous session is ready; the returned cleanup cancels it. */
function subscribeWhenReady(attach: (api: InboxApi) => () => void): () => void {
  let cancelled = false;
  let detach = () => {};
  inboxApi
    .load()
    .then(async (api) => {
      await api.ensureAnonymousSession();
      if (!cancelled && api.hasInboxDb()) detach = attach(api);
    })
    .catch((error: unknown) => {
      console.error('Error loading inbox:', error);
    });
  return () => {
    cancelled = true;
    detach();
  };
}

type PreventableEvent = { preventDefault(): void };

export type AdminInbox = {
  isAuthenticated: boolean;
  authInput: string;
  setAuthInput: (value: string) => void;
  login: (e: PreventableEvent) => void;
  logout: () => void;
  chats: ChatThread[];
  activeChat: ChatThread | null;
  selectChat: (chat: ChatThread) => void;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendMessage: (e: PreventableEvent) => Promise<void>;
  clearChat: () => Promise<void>;
  deleteUser: () => Promise<void>;
  toggleBlock: () => Promise<void>;
};

/** Passcode gate plus realtime inbox state (in-memory; legacy AdminChat.jsx logic). */
export function useAdminInbox(): AdminInbox {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeChat, setActiveChat] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInput, setAuthInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Mock authentication for prototype
  const login = (e: PreventableEvent) => {
    e.preventDefault();
    if (isAdminPasscode(authInput)) {
      setIsAuthenticated(true);
    }
  };

  const logout = () => setIsAuthenticated(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch all active conversations
  useEffect(() => {
    if (!isAuthenticated) return;
    return subscribeWhenReady((api) => api.subscribeToThreads(setChats));
  }, [isAuthenticated]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    return subscribeWhenReady((api) => {
      const unsubscribe = api.subscribeToMessages(activeChat.id, setMessages);

      // Mark as read (mock implementation)
      if ((activeChat.unreadCount ?? 0) > 0) {
        void api.markThreadRead(activeChat.id);
      }

      return unsubscribe;
    });
  }, [activeChat]);

  const sendMessage = async (e: PreventableEvent) => {
    e.preventDefault();
    const api = inboxApi.get();
    if (!newMessage.trim() || !activeChat || !api?.hasInboxDb()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await api.sendAdminReply(activeChat, text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const clearChat = async () => {
    const api = inboxApi.get();
    if (!activeChat || !api?.hasInboxDb()) return;
    if (
      window.confirm(
        `Are you sure you want to clear this chat? This will erase all messages but keep the user.`,
      )
    ) {
      try {
        await api.clearThreadMessages(activeChat.id);
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  };

  const deleteUser = async () => {
    const api = inboxApi.get();
    if (!activeChat || !api?.hasInboxDb()) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete user ${activeChat.visitorName || activeChat.id}? This will erase all data and reset their chat.`,
      )
    ) {
      try {
        await api.deleteThread(activeChat.id);
        setActiveChat(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const toggleBlock = async () => {
    const api = inboxApi.get();
    if (!activeChat || !api?.hasInboxDb()) return;
    const newStatus = !activeChat.isBlocked;

    // Optimistically update the activeChat state so the UI button toggles instantly
    setActiveChat((prev) => (prev ? { ...prev, isBlocked: newStatus } : prev));

    try {
      await api.setThreadBlocked(activeChat.id, newStatus);
    } catch (error) {
      console.error('Error toggling block status:', error);
      // Revert on error
      setActiveChat((prev) => (prev ? { ...prev, isBlocked: !newStatus } : prev));
    }
  };

  return {
    isAuthenticated,
    authInput,
    setAuthInput,
    login,
    logout,
    chats,
    activeChat,
    selectChat: setActiveChat,
    messages,
    messagesEndRef,
    newMessage,
    setNewMessage,
    sendMessage,
    clearChat,
    deleteUser,
    toggleBlock,
  };
}
