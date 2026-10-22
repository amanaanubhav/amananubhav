
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

import { toChatId, type ChatMessage, type VisitorProfile } from '@/entities/chat-thread';
import { lazyModule } from '@/shared/lib/lazy';

import { CHAT_WAIT_LIMIT_MS } from '../config/visitor-chat';
import { useVisitorSession } from './use-visitor-session';

type ChatApi = typeof import('../api/visitor-chat-api');

/**
 * Firestore + EmailJS for the chat, fetched with `import()` on first need (a stored session, Start chat, Send), so
 * the shell's initial JS carries neither (§J.2). The module also starts the anonymous session before it writes.
 * Browser tests stub it at the network level (block or fulfil the Firestore and EmailJS hosts), not in the page.
 */
const chatApi = lazyModule<ChatApi>(() => import('../api/visitor-chat-api'));

/**
 * A visitor message on its way: shown until the server acknowledges it, or kept as failed (rejected, or not
 * acknowledged within the time limit while online). `createdAt` is the send (or Retry) time.
 */
export type OutgoingMessage = { id: string; text: string; createdAt: number; status: 'sending' | 'failed' };

/** Start chat: waiting for the thread write, or stopped by an error or the time limit (online or offline). */
export type StartState = 'idle' | 'starting' | 'failed' | 'offline';

/** True once `promise` fulfils, false when `ms` pass first (the work itself carries on); rejects with its error. */
function settlesWithin(promise: Promise<unknown>, ms: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(false), ms);
    promise.then(
      () => {
        window.clearTimeout(timer);
        resolve(true);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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
  const [startState, setStartState] = useState<StartState>('idle');
  /** Counts Start chat attempts, so a superseded one (or one already past its time limit) changes nothing. */
  const startRunRef = useRef(0);
  /** When the browser last came online: an offline wait is queued, so a send's time limit counts from here. */
  const onlineAtRef = useRef(0);

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
      // The thread shows what it has instead of a skeleton that never ends; Send loads the api again.
      if (!cancelled) setLoadedFor(chatId);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [chatId, resetSession]);

  /**
   * Opens the thread once the server has the thread document. Offline it stops at once; a rejected write, or no
   * acknowledgement within the time limit, lands in the failed state with the fields kept, and submitting again
   * retries (the write is a merge, so one that lands late is harmless). A late result of an attempt is ignored.
   */
  const handleStartChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || startState === 'starting') return;
    if (!navigator.onLine) {
      setStartState('offline');
      return;
    }

    const profile = { name, email, phone };
    const id = toChatId(email);
    const run = ++startRunRef.current;
    setStartState('starting');
    setChatId(id);

    // `written` is wrapped so the issued write is not awaited here (its server ack comes later).
    const issued = chatApi.load().then(async (api) => {
      await api.ensureAnonymousSession();
      return { written: api.startThread(id, profile) };
    });
    startingRef.current = issued.then(
      () => undefined,
      () => undefined,
    );

    let started = false;
    try {
      started = await settlesWithin(issued.then(({ written }) => written), CHAT_WAIT_LIMIT_MS);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
    if (run !== startRunRef.current) return;

    if (started) {
      setStartState('idle');
      saveSession(profile, id);
    } else {
      // No session yet: drop the chat id so its listener stops (a server "no thread" would clear the fields).
      setStartState(navigator.onLine ? 'failed' : 'offline');
      setChatId(null);
    }
  };

  /**
   * Writes the bubble already in the outbox. Offline, Firestore queues the write and the bubble stays "Sending";
   * a rejected write marks it failed, with its text, for Retry. The api shares one write per message id, so a
   * Retry after the time limit waits on the same write and an acknowledgement that comes late still clears it.
   */
  const deliver = useCallback((api: ChatApi, id: string, text: string, profile: VisitorProfile, messageId: string) => {
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

    const messageId = api.newMessageId(chatId);
    setNewMessage('');
    setOutbox((prev) => [...prev, { id: messageId, text, createdAt: Date.now(), status: 'sending' }]);
    deliver(api, chatId, text, visitor, messageId);
  };

  /** Sends a failed message again under the same id, as the newest bubble (the composer's draft is left alone). */
  const retry = (messageId: string) => {
    const api = chatApi.get();
    const failed = outbox.find((m) => m.id === messageId && m.status === 'failed');
    if (!api || !failed || !chatId || !visitor || isBlocked) return;
    setOutbox((prev) => [
      ...prev.filter((m) => m.id !== messageId),
      { ...failed, createdAt: Date.now(), status: 'sending' },
    ]);
    deliver(api, chatId, failed.text, visitor, messageId);
  };

  // Restart every send's time limit when the browser comes back online (declared before the timer, so it runs first).
  useEffect(() => {
    if (isOnline) onlineAtRef.current = Date.now();
  }, [isOnline]);

  // A message still "Sending" after the time limit, while online, shows "Not sent." with Retry. Offline the banner
  // covers it (the write is queued) and no limit runs.
  useEffect(() => {
    if (!isOnline) return;
    const deadline = (m: OutgoingMessage) => Math.max(m.createdAt, onlineAtRef.current) + CHAT_WAIT_LIMIT_MS;
    const sending = outbox.filter((m) => m.status === 'sending');
    if (sending.length === 0) return;
    const next = Math.min(...sending.map(deadline));
    const timer = window.setTimeout(
      () => {
        const now = Date.now();
        setOutbox((prev) =>
          prev.map((m) => (m.status === 'sending' && deadline(m) <= now ? { ...m, status: 'failed' } : m)),
        );
      },
      Math.max(0, next - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [outbox, isOnline]);

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
    startState,
    handleStartChat,
    handleSendMessage,
    retry,
  };
}

export type VisitorChatState = ReturnType<typeof useVisitorChat>;
