import { useEffect, useState, type FormEvent } from 'react';

import { getDb } from '@/shared/api';
import {
  subscribeToMessages,
  subscribeToThread,
  toChatId,
  type ChatMessage,
} from '@/entities/chat-thread';

import { sendVisitorMessage, startThread } from '../api/visitor-chat-api';
import { useVisitorSession } from './use-visitor-session';

export function useVisitorChat() {
  const session = useVisitorSession();
  const { visitor, name, email, phone, chatId, setChatId, saveSession, resetSession } = session;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!chatId || !getDb()) return;

    const unsubscribeMsgs = subscribeToMessages(chatId, setMessages);

    const unsubscribeDoc = subscribeToThread(chatId, (state) => {
      if (state.exists) {
        setIsBlocked(state.isBlocked);
      } else {
        resetSession();
        setIsBlocked(false);
        setMessages([]);
      }
    });

    return () => {
      unsubscribeMsgs();
      unsubscribeDoc();
    };
  }, [chatId, resetSession]);

  const handleStartChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    const id = toChatId(email);
    setChatId(id);

    try {
      await startThread(id, { name, email, phone });
    } catch (error) {
      console.error('Error starting chat:', error);
    }

    saveSession({ name, email, phone }, id);
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !getDb() || isBlocked || !visitor) return;

    const text = newMessage;
    setNewMessage('');

    // Optimistic UI update for instant rendering
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, { id: tempId, text: text, sender: 'visitor', timestamp: null }]);

    try {
      await sendVisitorMessage(chatId, text, visitor);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    ...session,
    messages,
    newMessage,
    setNewMessage,
    isBlocked,
    handleStartChat,
    handleSendMessage,
  };
}

export type VisitorChatState = ReturnType<typeof useVisitorChat>;
