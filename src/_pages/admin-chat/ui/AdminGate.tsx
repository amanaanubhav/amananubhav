'use client';

import { useId, useState, type FormEvent, type JSX } from 'react';
import { CircleX } from 'lucide-react';

import { Button } from '@/shared/ui/button';

import { INBOX_COPY } from './thread-display';

type PreventableEvent = { preventDefault(): void };

export interface AdminGateProps {
  authInput: string;
  onAuthInputChange: (value: string) => void;
  onLogin: (e: PreventableEvent) => void;
}

/**
 * The passcode gate (§G.7): one centred form. The check itself stays in `useAdminInbox().login`; when the
 * form is still on screen after a submit, the code was not accepted, so the error line shows until the next edit.
 */
export function AdminGate({ authInput, onAuthInputChange, onLogin }: AdminGateProps): JSX.Element {
  const [rejected, setRejected] = useState(false);
  // Counts submits so a repeated wrong code remounts the alert and is announced again.
  const [attempt, setAttempt] = useState(0);
  const inputId = useId();
  const errorId = useId();
  const leadId = useId();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    onLogin(e);
    setRejected(true);
    setAttempt((n) => n + 1);
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4 pb-16 pt-24">
      <form onSubmit={submit} aria-describedby={leadId} className="w-full max-w-sm text-center">
        <h1 className="text-h3 m-0 font-display font-semibold text-ink">{INBOX_COPY.title}</h1>
        <p id={leadId} className="text-ui m-0 mt-3 font-body text-ink-muted">
          {INBOX_COPY.gateLead}
        </p>

        {/* Hidden account name so password managers and Chrome's form audit can pair the code with a user. */}
        <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden tabIndex={-1} aria-hidden="true" />

        <div className="mt-10 text-left">
          <label htmlFor={inputId} className="text-ui mb-2 block font-body font-medium text-ink">
            {INBOX_COPY.gateLabel}
          </label>
          <input
            id={inputId}
            type="password"
            value={authInput}
            onChange={(e) => {
              setRejected(false);
              onAuthInputChange(e.target.value);
            }}
            autoComplete="current-password"
            spellCheck={false}
            aria-invalid={rejected || undefined}
            aria-describedby={rejected ? errorId : undefined}
            className="text-ui h-11 w-full rounded-control border border-line-strong bg-surface-2 px-3 font-data text-ink transition-[border-color] duration-micro hover:border-ink-muted focus-visible:border-signal focus-visible:outline-offset-0"
          />
          {rejected ? (
            <p key={attempt} id={errorId} role="alert" className="text-caption m-0 mt-2 flex items-start gap-2 font-body text-error">
              <CircleX aria-hidden="true" focusable="false" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              {INBOX_COPY.gateError}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="mt-6 w-full duration-micro">
          {INBOX_COPY.gateSubmit}
        </Button>
      </form>
    </div>
  );
}
