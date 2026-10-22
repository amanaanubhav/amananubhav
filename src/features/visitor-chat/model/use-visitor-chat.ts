
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

import { toChatId, type ChatMessage, type VisitorProfile } from '@/entities/chat-thread';
import { lazyModule } from '@/shared/lib/lazy';

import { useVisitorSession } from './use-visitor-session';

type ChatApi = typeof import('../api/visitor-chat-api');

/**
 * Firestore + EmailJS for the chat, fetched with `import()` on first need (a stored session, Start chat, Send), so
 * the shell's initial JS carries neither (§J.2). The module also starts the anonymous session before it writes.
 * Browser tests stub it at the network level (block or fulfil the Firestore and EmailJS hosts), not in the page.
 */
const chatApi = lazyModule<ChatApi>(() => import('../api/visitor-chat-api'));

/** A visitor message on its way: shown until the listener's copy (same id) arrives, or kept as failed. */
export type OutgoingMessage = { id: string; text: string; createdAt: number; status: 'sending' | 'failed' };

function subscribeOnline(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}
const readOnline = () => navigator.onLine;
const serverOnline = () => true;

export function useVisitorChat() {
  const session = useVisitorSession();
  const { visitor, name, email, phone, chatId, setChatId, saveSession, resetSession } = session;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [outbox, setOutbox] = useState<OutgoingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  /** The chat whose first messages snapshot has arrived (the thread shows a skeleton until then). */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  /** `false` once the api has loaded and Firebase is not configured; `null` until known. */
  const [hasDb, setHasDb] = useState<boolean | null>(null);
  const isOnline = useSyncExternalStore(subscribeOnline, readOnline, serverOnline);
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
      if (cancelled) return;
      if (!api.hasChatDb()) {
        setHasDb(false);
        setLoadedFor(chatId);
        return;
      }
      setHasDb(true);

      const unsubscribeMsgs = api.subscribeToMessages(chatId, (next) => {
        setMessages(next);
        setLoadedFor(chatId);
      });

      const unsubscribeDoc = api.subscribeToThread(chatId, (state) => {
        if (state.exists) {
          setIsBlocked(state.isBlocked);
        } else if (state.confirmed && navigator.onLine) {
          // Deleted by the admin (server-confirmed). A cache-only miss (offline, blocked hosts) keeps the session.
          resetSession();
          setIsBlocked(false);
          setMessages([]);
          setOutbox([]);
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

  /**
   * Shows the bubble at once and writes it. Offline, Firestore queues the write and the listener's copy stays
   * "Sending"; a rejected write leaves this bubble as failed, with its text, for Retry.
   */
  const deliver = useCallback((api: ChatApi, id: string, text: string, profile: VisitorProfile) => {
    const messageId = api.newMessageId(id);
    setOutbox((prev) => [...prev, { id: messageId, text, createdAt: Date.now(), status: 'sending' }]);
    api.sendVisitorMessage(id, text, profile, messageId).then(
      () => setOutbox((prev) => prev.filter((m) => m.id !== messageId)),
      (error: unknown) => {
        console.error('Error sending message:', error);
        setOutbox((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: 'failed' } : m)));
      },
    );
  }, []);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = newMessage;
    if (!text.trim() || !chatId || isBlocked || !visitor) return;

    // Already loaded by the thread listener in practice; otherwise fetched now. A failed load keeps the draft.
    let api = chatApi.get();
    if (!api) {
      try {
        api = await chatApi.load();
      } catch (error) {
        console.error('Error sending message:', error);
        return;
      }
    }
    if (!api.hasChatDb()) {
      setHasDb(false);
      return;
    }

    setNewMessage('');
    deliver(api, chatId, text, visitor);
  };

  /** Sends a failed message's text again as a new message (the composer's draft is left alone). */
  const retry = (messageId: string) => {
    const api = chatApi.get();
    const failed = outbox.find((m) => m.id === messageId && m.status === 'failed');
    if (!api || !failed || !chatId || !visitor || isBlocked) return;
    setOutbox((prev) => prev.filter((m) => m.id !== messageId));
    deliver(api, chatId, failed.text, visitor);
  };

  return {
    ...session,
    messages,
    outbox,
    newMessage,
    setNewMessage,
    isBlocked,
    isOnline,
    hasDb,
    isLoading: chatId !== null && loadedFor !== chatId,
    handleStartChat,
    handleSendMessage,
    retry,
  };
}

export type VisitorChatState = ReturnType<typeof useVisitorChat>;
