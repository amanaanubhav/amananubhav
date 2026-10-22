'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CircleAlert, Lock, SquareTerminal } from 'lucide-react';

import type { VisitorChatState } from '../model/use-visitor-chat';
import { ChatPlane } from './ChatPlane';
import styles from './chat-window.module.css';

type FieldKey = 'name' | 'email' | 'phone';
type FieldErrors = Partial<Record<FieldKey, string>>;

/** Loose shape check only: the address still has to reach a real inbox. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, phone: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  if (!email.trim()) errors.email = 'Enter your email so the reply can reach you.';
  else if (!EMAIL_SHAPE.test(email.trim())) errors.email = 'Check the email address, like name@example.com.';
  if (!phone.trim()) errors.phone = 'Enter a phone number.';
  return errors;
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(error ? errorId : undefined)}
      {error ? (
        <p id={errorId} className={styles.error}>
          <CircleAlert aria-hidden="true" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

interface ChatIntroFormProps {
  chat: VisitorChatState;
  onOpenTerminal: () => void;
  onOpenVault: () => void;
}

/**
 * The intro step (chat design §4): who is writing, before the thread opens. Fields, their state and the submit
 * handler are the model's (`useVisitorChat`); this UI adds visible labels, autocomplete and inline errors, then
 * hands the same submit event to `handleStartChat`. "Other ways in" names the terminal and the Vault in words
 * (the header hides their icons on this step). The fields scroll inside the window when it is short; **Start chat**
 * sits in a fixed row under them, so it is never cut off. While content continues below the fold the body carries
 * `data-more`, which fades its lower edge (written straight to the DOM, so scrolling never re-renders).
 */
export function ChatIntroForm({ chat, onOpenTerminal, onOpenVault }: ChatIntroFormProps) {
  const { name, setName, email, setEmail, phone, setPhone, handleStartChat } = chat;
  const uid = useId();
  const [errors, setErrors] = useState<FieldErrors>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  // Scroll hint: recompute on scroll and whenever the body or any child changes size (inline errors, the window's
  // placement height, the sheet's --vvh, a font swap reflowing the copy).
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const update = () => {
      body.toggleAttribute('data-more', body.scrollTop + body.clientHeight < body.scrollHeight - 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(body);
    for (const child of Array.from(body.children)) observer.observe(child);
    body.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      body.removeEventListener('scroll', update);
    };
  }, []);

  const clearError = (key: FieldKey) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const next = validate(name, email, phone);
    if (next.name || next.email || next.phone) {
      event.preventDefault();
      setErrors(next);
      const first = (['name', 'email', 'phone'] as const).find((key) => next[key]);
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setErrors({});
    void handleStartChat(event);
  };

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form} aria-label="Start a chat">
      <div ref={bodyRef} className={styles.body} data-lenis-prevent>
        <p className={styles.say}>Say hello.</p>
        <p className={styles.lead}>Leave your email so the reply can find you.</p>
        <Field id={`${uid}-name`} label="Your name" error={errors.name}>
          {(describedBy) => (
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              autoComplete="name"
              required
              data-autofocus=""
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
              className={styles.input}
            />
          )}
        </Field>
        <Field id={`${uid}-email`} label="Your email" error={errors.email}>
          {(describedBy) => (
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError('email');
              }}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy}
              className={styles.input}
            />
          )}
        </Field>
        <Field id={`${uid}-phone`} label="Phone" error={errors.phone}>
          {(describedBy) => (
            <input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError('phone');
              }}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={describedBy}
              className={`${styles.input} tabular`}
            />
          )}
        </Field>
        <div className={styles.ways}>
          <p>Other ways in</p>
          <div className={styles.wayLinks}>
            <button type="button" data-return-focus="chat-launcher" onClick={onOpenTerminal} className={styles.link}>
              <SquareTerminal aria-hidden="true" strokeWidth={1.75} />
              Ask the AI terminal
            </button>
            <button type="button" data-return-focus="chat-launcher" onClick={onOpenVault} className={styles.link}>
              <Lock aria-hidden="true" strokeWidth={1.75} />
              Send privately via the Vault
            </button>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <button type="submit" className={styles.primary}>
          <ChatPlane />
          Start chat
        </button>
      </div>
    </form>
  );
}
