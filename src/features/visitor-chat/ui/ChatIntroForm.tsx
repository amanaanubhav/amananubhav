'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { CircleX } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import type { VisitorChatState } from '../model/use-visitor-chat';
import { FIELD_CLASSES } from './field-classes';

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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-body text-ui font-medium text-ink">
        {label}
      </label>
      {children(error ? errorId : undefined)}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 font-body text-caption text-error">
          <CircleX aria-hidden="true" className="mt-[0.2em] size-4 shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

interface ChatIntroFormProps {
  chat: VisitorChatState;
}

/**
 * The intro step (§H.6): who is writing, before the thread opens. Fields, their state and the submit handler
 * are the model's (`useVisitorChat`); this UI only adds visible labels, autocomplete and inline errors, then
 * hands the same submit event to `handleStartChat`. The fields scroll inside the window when it is short;
 * **Start chat** sits in a fixed row under them, so it is never cut off.
 */
export function ChatIntroForm({ chat }: ChatIntroFormProps) {
  const { name, setName, email, setEmail, phone, setPhone, handleStartChat } = chat;
  const uid = useId();
  const [errors, setErrors] = useState<FieldErrors>({});

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
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col" aria-label="Start a chat">
      <div
        className="scroll-pane flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-4 pt-4"
        data-lenis-prevent
      >
        <p className="m-0 font-body text-ui text-ink [text-wrap:pretty]">
          I usually reply within a day. Leave your email so the reply can find you.
        </p>
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
              className={FIELD_CLASSES}
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
              className={FIELD_CLASSES}
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
              className={cn(FIELD_CLASSES, 'tabular')}
            />
          )}
        </Field>
      </div>
      <div className="shrink-0 border-t border-line px-5 py-3">
        <Button type="submit" variant="primary" className="w-full">
          Start chat
        </Button>
      </div>
    </form>
  );
}
