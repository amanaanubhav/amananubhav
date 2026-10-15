'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { streamChatReply } from '../api/stream-chat-reply';
import { resolveOfflineReply } from '../lib/resolve-offline-reply';
import { INITIAL_TERMINAL_LOGS, replaceLastLog, type TerminalLogEntry } from './terminal-log';

export function useTerminalSession(isOpen: boolean) {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<TerminalLogEntry[]>(() => [...INITIAL_TERMINAL_LOGS]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      inputRef.current?.focus();
    }
  }, [logs, isOpen]);

  const handleCommand = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userQuery = input;
    setInput('');
    setIsProcessing(true);

    // 1. Add User message to logs
    setLogs((prev) => [...prev, { src: 'USR', msg: userQuery }]);

    // 2. Handle 'clear' command locally
    if (userQuery.toLowerCase().trim() === 'clear') {
      setLogs([]);
      setIsProcessing(false);
      return;
    }

    // 3. Add placeholder for AI response
    setLogs((prev) => [...prev, { src: 'AI', msg: '' }]);

    // --- OFFLINE MODE HANDLER ---
    if (isOffline) {
      setTimeout(() => {
        const reply = resolveOfflineReply(userQuery);
        setLogs((prev) => replaceLastLog(prev, () => ({ src: 'AI', msg: reply })));
        setIsProcessing(false);
      }, 400); // Simulated local latency
      return;
    }

    // --- ONLINE MODE HANDLER ---
    try {
      await streamChatReply(userQuery, (chunk) => {
        setLogs((prev) => replaceLastLog(prev, (last) => ({ ...last, msg: last.msg + chunk })));
      });
    } catch (err) {
      console.warn('Switching to offline protocol:', err);
      setIsOffline(true); // PERMANENTLY SWITCH TO OFFLINE MODE

      const reply = resolveOfflineReply(userQuery);

      setTimeout(() => {
        setLogs((prev) =>
          replaceLastLog(prev, () => ({
            src: 'AI',
            msg: `[!] Connection Lost. Switching to Local Database...\n\n${reply}`,
          })),
        );
      }, 600);
    } finally {
      setIsProcessing(false);
    }
  };

  return { input, setInput, logs, isProcessing, isOffline, endRef, inputRef, handleCommand };
}
