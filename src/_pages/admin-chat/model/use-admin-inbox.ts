'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import {
  subscribeToMessages,
  subscribeToThreads,
  type ChatMessage,
  type ChatThread,
} from '@/entities/chat-thread';
import { getDb } from '@/shared/api';
import { isAdminPasscode } from '@/shared/config';

import {
  clearThreadMessages,
  deleteThread,
  markThreadRead,
  sendAdminReply,
  setThreadBlocked,
} from '../api/admin-chat-actions';

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
    if (!isAuthenticated || !getDb()) return;
    const unsubscribe = subscribeToThreads(setChats);
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat || !getDb()) return;

    const unsubscribe = subscribeToMessages(activeChat.id, setMessages);

    // Mark as read (mock implementation)
    if ((activeChat.unreadCount ?? 0) > 0) {
      void markThreadRead(activeChat.id);
    }

    return () => unsubscribe();
  }, [activeChat]);

  const sendMessage = async (e: PreventableEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !getDb()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await sendAdminReply(activeChat, text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const clearChat = async () => {
    if (!activeChat || !getDb()) return;
    if (
      window.confirm(
        `Are you sure you want to clear this chat? This will erase all messages but keep the user.`,
      )
    ) {
      try {
        await clearThreadMessages(activeChat.id);
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  };

  const deleteUser = async () => {
    if (!activeChat || !getDb()) return;
    if (
      window.confirm(
        `Are you sure you want to permanently delete user ${activeChat.visitorName || activeChat.id}? This will erase all data and reset their chat.`,
      )
    ) {
      try {
        await deleteThread(activeChat.id);
        setActiveChat(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const toggleBlock = async () => {
    if (!activeChat || !getDb()) return;
    const newStatus = !activeChat.isBlocked;

    // Optimistically update the activeChat state so the UI button toggles instantly
    setActiveChat((prev) => (prev ? { ...prev, isBlocked: newStatus } : prev));

    try {
      await setThreadBlocked(activeChat.id, newStatus);
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
