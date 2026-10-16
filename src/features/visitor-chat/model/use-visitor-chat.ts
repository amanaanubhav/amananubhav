import { useEffect, useRef, useState, type FormEvent } from 'react';

import { toChatId, type ChatMessage } from '@/entities/chat-thread';
import { lazyModule } from '@/shared/lib/lazy';

import { useVisitorSession } from './use-visitor-session';

/**
 * Firestore + EmailJS for the chat, fetched with `import()` on first need (a stored session, Start chat, Send), so
 * the shell's initial JS carries neither (§J.2). The module also starts the anonymous session before it writes.
 */
const chatApi = lazyModule(() => import('../api/visitor-chat-api'));

export function useVisitorChat() {
  const session = useVisitorSession();
  const { visitor, name, email, phone, chatId, setChatId, saveSession, resetSession } = session;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  // Settles once Start chat has issued its thread write, so the listener attaches after it and a new thread reads
  // as existing (legacy: the write was issued before the listener's effect ran).
  const startingRef = useRef<Promise<void> | null>(null);

  // Live thread + messages for a stored or new session. The api loads on demand; a re-run or unmount before
  // it resolves cancels the pending subscription, and one made earlier is torn down as before.
  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;
    let unsubscribe = () => {};

    const subscribe = async () => {
      const api = await chatApi.load();
      await api.ensureAnonymousSession();
      await startingRef.current;
      if (cancelled || !api.hasChatDb()) return;

      const unsubscribeMsgs = api.subscribeToMessages(chatId, setMessages);

      const unsubscribeDoc = api.subscribeToThread(chatId, (state) => {
        if (state.exists) {
          setIsBlocked(state.isBlocked);
        } else {
          resetSession();
          setIsBlocked(false);
          setMessages([]);
        }
      });

      unsubscribe = () => {
        unsubscribeMsgs();
        unsubscribeDoc();
      };
    };

    subscribe().catch((error: unknown) => {
      console.error('Error loading chat:', error);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [chatId, resetSession]);

  const handleStartChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    const id = toChatId(email);
    setChatId(id);

    // `written` is wrapped so the issued write is not awaited here (its server ack comes later).
    const issued = chatApi.load().then(async (api) => {
      await api.ensureAnonymousSession();
      return { written: api.startThread(id, { name, email, phone }) };
    });
    startingRef.current = issued.then(
      () => undefined,
      () => undefined,
    );

    try {
      await (await issued).written;
    } catch (error) {
      console.error('Error starting chat:', error);
    }

    saveSession({ name, email, phone }, id);
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isBlocked || !visitor) return;

    // Already loaded by the thread listener in practice; otherwise fetched now.
    let api = chatApi.get();
    if (!api) {
      try {
        api = await chatApi.load();
      } catch (error) {
        console.error('Error sending message:', error);
        return;
      }
    }
    if (!api.hasChatDb()) return;

    const text = newMessage;
    setNewMessage('');

    // Optimistic UI update for instant rendering
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, { id: tempId, text: text, sender: 'visitor', timestamp: null }]);

    try {
      await api.sendVisitorMessage(chatId, text, visitor);
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
