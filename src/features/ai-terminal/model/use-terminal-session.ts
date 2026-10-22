'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { onIdle } from '@/shared/lib/lazy';

import { ChatUplinkError, streamChatReply } from '../api/stream-chat-reply';
import { loadOfflineKnowledge, preloadOfflineKnowledge } from '../lib/load-offline-knowledge';
import { formatHistory, matchLocalCommand, resolveOfflineReply } from '../lib/resolve-offline-reply';
import {
  BACK_ONLINE_NOTICE,
  EXIT_REPLY,
  INITIAL_TERMINAL_LOGS,
  OFFLINE_NOTES_UNAVAILABLE,
  OFFLINE_NOTICE,
  RATE_LIMITED_NOTICE,
  replaceLastLog,
  TOO_LONG_REPLY,
  type TerminalLogEntry,
} from './terminal-log';
import { closeTerminal } from './terminal-store';

/** The server gives each of its two providers 10 s for a first token; past this the live model is out. */
const FIRST_TEXT_TIMEOUT_MS = 25_000;
/** Simulated latency of the local notes; the first offline reply waits a little longer (§I.3). */
const OFFLINE_LATENCY_MS = 400;
const OFFLINE_NOTICE_LATENCY_MS = 600;
const EXIT_DELAY_MS = 700;
const IDLE_PRELOAD_TIMEOUT_MS = 15_000;
const HISTORY_LIMIT = 100;

/** Why the terminal went offline: a dropped connection comes back on its own, a dead service does not. */
type OfflineReason = 'network' | 'service';

/** Read fresh each time: TypeScript would otherwise keep a narrowed `navigator.onLine` across awaits. */
const isNetworkDown = (): boolean => !navigator.onLine;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Streams the live reply, but gives up when no text arrives in time or the stream ends empty, so the
 * caller can answer offline. Chunks that arrive after giving up are dropped.
 */
async function streamWithDeadline(userQuery: string, onText: (chunk: string) => void): Promise<void> {
  let received = false;
  let abandoned = false;
  let timer = 0;
  const controller = new AbortController();
  const deadline = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => {
      if (received) return;
      abandoned = true;
      controller.abort();
      reject(new Error('No reply in time'));
    }, FIRST_TEXT_TIMEOUT_MS);
  });
  try {
    await Promise.race([
      streamChatReply(
        userQuery,
        (chunk) => {
          if (abandoned || chunk === '') return;
          received = true;
          onText(chunk);
        },
        controller.signal,
      ),
      deadline,
    ]);
  } finally {
    window.clearTimeout(timer);
  }
  if (!received) throw new Error('Empty reply');
}

export function useTerminalSession(isOpen: boolean) {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<TerminalLogEntry[]>(() => [...INITIAL_TERMINAL_LOGS]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([]);
  const offlineReasonRef = useRef<OfflineReason>('service');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      inputRef.current?.focus();
    }
  }, [logs, isOpen]);

  // Cache the offline notes before they are needed: on the first open, and once the browser is idle.
  useEffect(() => {
    if (isOpen) preloadOfflineKnowledge();
  }, [isOpen]);

  useEffect(() => onIdle(preloadOfflineKnowledge, IDLE_PRELOAD_TIMEOUT_MS, IDLE_PRELOAD_TIMEOUT_MS), []);

  // A dropped connection that comes back sends questions to the live model again.
  useEffect(() => {
    if (!isOffline) return;
    const onOnline = () => {
      if (offlineReasonRef.current !== 'network') return;
      setIsOffline(false);
      setLogs((prev) => [...prev, { src: 'SYS', msg: BACK_ONLINE_NOTICE }]);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [isOffline]);

  const writeReply = (msg: string) => {
    setLogs((prev) => replaceLastLog(prev, () => ({ src: 'AI', msg })));
  };

  const goOffline = (reason: OfflineReason) => {
    offlineReasonRef.current = reason;
    setIsOffline(true);
  };

  /**
   * Answers from the offline notes; the reply and `isProcessing: false` land together (one announcement).
   * `notice` is printed above the reply (the first reply of an offline stretch, or a rate-limited question).
   */
  const answerOffline = async (userQuery: string, notice?: string) => {
    const startedAt = performance.now();
    let reply: string;
    try {
      const knowledge = await loadOfflineKnowledge();
      reply = resolveOfflineReply(userQuery, knowledge, { history: historyRef.current });
    } catch {
      reply = OFFLINE_NOTES_UNAVAILABLE;
    }
    const latency = notice ? OFFLINE_NOTICE_LATENCY_MS : OFFLINE_LATENCY_MS;
    const remaining = latency - (performance.now() - startedAt);
    if (remaining > 0) await wait(remaining);
    writeReply(notice ? `${notice}\n\n${reply}` : reply);
    setIsProcessing(false);
  };

  const handleCommand = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userQuery = input;
    setInput('');
    setIsProcessing(true);
    historyRef.current = [...historyRef.current, userQuery.trim()].slice(-HISTORY_LIMIT);

    // 1. Add User message to logs
    setLogs((prev) => [...prev, { src: 'USR', msg: userQuery }]);

    // 2. Commands that act on the session run locally, online or not
    const local = matchLocalCommand(userQuery);
    if (local === 'clear') {
      setLogs([]);
      setIsProcessing(false);
      return;
    }

    // 3. Add placeholder for AI response
    setLogs((prev) => [...prev, { src: 'AI', msg: '' }]);

    if (local === 'history') {
      writeReply(formatHistory(historyRef.current));
      setIsProcessing(false);
      return;
    }
    if (local === 'exit') {
      writeReply(EXIT_REPLY);
      setIsProcessing(false);
      window.setTimeout(closeTerminal, EXIT_DELAY_MS);
      return;
    }

    // --- OFFLINE MODE HANDLER ---
    if (isOffline) {
      await answerOffline(userQuery);
      return;
    }
    if (isNetworkDown()) {
      goOffline('network');
      await answerOffline(userQuery, OFFLINE_NOTICE);
      return;
    }

    // --- ONLINE MODE HANDLER ---
    try {
      await streamWithDeadline(userQuery, (chunk) => {
        setLogs((prev) => replaceLastLog(prev, (last) => ({ ...last, msg: last.msg + chunk })));
      });
      setIsProcessing(false);
    } catch (err) {
      // Too many questions too fast: answer this one from the notes, but stay live for the next.
      if (err instanceof ChatUplinkError && err.status === 429) {
        await answerOffline(userQuery, RATE_LIMITED_NOTICE);
        return;
      }
      if (err instanceof ChatUplinkError && err.status === 413) {
        writeReply(TOO_LONG_REPLY);
        setIsProcessing(false);
        return;
      }
      console.warn('Switching to offline protocol:', err);
      // fetch rejects with a TypeError when the network is down; an HTTP error or timeout means the service.
      goOffline(isNetworkDown() || err instanceof TypeError ? 'network' : 'service');
      await answerOffline(userQuery, OFFLINE_NOTICE);
    }
  };

  return { input, setInput, logs, isProcessing, isOffline, endRef, inputRef, handleCommand };
}
