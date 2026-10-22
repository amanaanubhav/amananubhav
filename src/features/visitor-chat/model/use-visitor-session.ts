import { useCallback, useEffect, useState } from 'react';

import type { VisitorProfile } from '@/entities/chat-thread';

import { VISITOR_SESSION_STORAGE_KEY } from '../config/visitor-chat';

type StoredSession = Partial<VisitorProfile> & { id?: string };

function removeStoredSession(): void {
  try {
    localStorage.removeItem(VISITOR_SESSION_STORAGE_KEY);
  } catch {
    // storage unavailable
  }
}

function writeStoredSession(session: VisitorProfile & { id: string }): void {
  try {
    localStorage.setItem(VISITOR_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable
  }
}

/** Visitor identity, form fields and chat id, persisted in localStorage (read in an effect only). */
export function useVisitorSession() {
  const [visitor, setVisitor] = useState<VisitorProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);

  // Persist visitor session. localStorage is read after mount (not during render) to avoid a
  // hydration mismatch, so hydrating the state here is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let savedSession: string | null = null;
    try {
      savedSession = localStorage.getItem(VISITOR_SESSION_STORAGE_KEY);
    } catch {
      return;
    }
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as StoredSession;
        if (parsed.name && parsed.email && parsed.phone) {
          setVisitor({ name: parsed.name, email: parsed.email, phone: parsed.phone });
          setName(parsed.name);
          setEmail(parsed.email);
          setPhone(parsed.phone);
          setChatId(parsed.id ?? null);
        } else {
          removeStoredSession();
        }
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveSession = useCallback((profile: VisitorProfile, id: string) => {
    setVisitor(profile);
    writeStoredSession({ ...profile, id });
  }, []);

  /** Thread was deleted by the admin (only once the server confirms it is gone): forget everything. */
  const resetSession = useCallback(() => {
    removeStoredSession();
    setVisitor(null);
    setChatId(null);
    setName('');
    setEmail('');
    setPhone('');
  }, []);

  return {
    visitor,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    chatId,
    setChatId,
    saveSession,
    resetSession,
  };
}
