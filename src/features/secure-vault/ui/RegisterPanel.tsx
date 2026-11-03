'use client';

import { useId, type Dispatch, type SetStateAction, type SyntheticEvent } from 'react';

import { Button } from '@/shared/ui/button';

import type { RegisterForm, VaultView } from '../model/vault-types';
import { PANEL_TITLE_STYLE, VaultError, VaultField, VaultScrollPane, VaultWarning } from './vault-form';

export interface RegisterPanelProps {
  titleId: string;
  regForm: RegisterForm;
  setRegForm: Dispatch<SetStateAction<RegisterForm>>;
  loading: boolean;
  error: string;
  onRegister: (e: SyntheticEvent) => void;
  onSwitchView: (view: VaultView) => void;
}

/**
 * Create an identity (§H.7). Every field is required (the owner's rule; the model checks them all and
 * names the missing ones); the browser's native validation stays off so the model's message is the one
 * shown, and an empty field is marked invalid while that message is up.
 */
export function RegisterPanel({
  titleId, regForm, setRegForm, loading, error, onRegister, onSwitchView,
}: RegisterPanelProps) {
  const errorId = useId();
  const warningId = useId();
  const describedBy = error ? errorId : undefined;
  const set = (key: keyof RegisterForm) => (e: { target: { value: string } }) =>
    setRegForm({ ...regForm, [key]: e.target.value });
  /** While the error is shown, flag the fields that are still empty. */
  const invalid = (key: keyof RegisterForm) => (error && !regForm[key].trim() ? true : undefined);

  return (
    <VaultScrollPane>
      <div className="w-full max-w-[42rem] md:my-auto px-5 py-6 sm:px-8 md:py-[clamp(1rem,4svh,3.5rem)]">
        <h2
          id={titleId}
          tabIndex={-1}
          style={PANEL_TITLE_STYLE}
          className="font-display text-h3 font-semibold text-ink [text-wrap:balance] focus:outline-none"
        >
          Create an identity
        </h2>
        <p className="mt-3 max-w-measure font-body text-body text-ink [text-wrap:pretty]">
          Your passphrase derives the key that encrypts your messages. Only a hash of it is stored.
        </p>

        <form onSubmit={onRegister} noValidate className="mt-6 md:mt-8 flex flex-col gap-5 [@media(max-height:760px)]:mt-6">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <VaultField
              label="Full name"
              name="name"
              autoComplete="name"
              data-vault-focus=""
              aria-required="true"
              aria-invalid={invalid('fullName')}
              value={regForm.fullName}
              onChange={set('fullName')}
              describedBy={describedBy}
            />
            <VaultField
              label="Organisation"
              name="organization"
              autoComplete="organization"
              aria-required="true"
              aria-invalid={invalid('org')}
              value={regForm.org}
              onChange={set('org')}
              describedBy={describedBy}
            />
            <VaultField
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              aria-required="true"
              aria-invalid={invalid('email')}
              value={regForm.email}
              onChange={set('email')}
              describedBy={describedBy}
            />
            <VaultField
              label="Phone"
              name="tel"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-required="true"
              aria-invalid={invalid('phone')}
              value={regForm.phone}
              onChange={set('phone')}
              describedBy={describedBy}
            />
            <VaultField
              label="Username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-required="true"
              aria-invalid={invalid('username')}
              value={regForm.username}
              onChange={set('username')}
              describedBy={describedBy}
            />
            <VaultField
              label="Passphrase"
              name="new-password"
              type="password"
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={invalid('password')}
              value={regForm.password}
              onChange={set('password')}
              describedBy={error ? `${warningId} ${errorId}` : warningId}
            />
          </div>

          <div id={warningId}>
            <VaultWarning>Passphrases can&apos;t be recovered. Store yours somewhere safe.</VaultWarning>
          </div>

          {error ? <VaultError id={errorId}>{error}</VaultError> : null}

          {/* Phones: the action row stays in view while the fields scroll under it (an opaque band on the sheet). */}
          <div
            className={
              'mt-2 flex flex-wrap items-center gap-x-6 gap-y-4 [@media(max-height:760px)]:mt-0 ' +
              'max-md:sticky max-md:bottom-0 max-md:z-[1] max-md:-mx-5 max-md:bg-surface max-md:px-5 max-md:pt-3 ' +
              'max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:shadow-[0_-1px_0_var(--line)] ' +
              'sm:max-md:-mx-8 sm:max-md:px-8'
            }
          >
            <Button type="submit" loading={loading} disabled={loading}>
              {loading ? 'Generating keys...' : 'Create identity'}
            </Button>
            <Button variant="text" onClick={() => onSwitchView('login')}>
              Back to sign in
            </Button>
          </div>
        </form>
      </div>
    </VaultScrollPane>
  );
}
