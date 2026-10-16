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
 * Create an identity (§H.7). Required fields follow the model's own check (username, passphrase,
 * email, phone); the browser's native validation stays off so the model's message is the one shown.
 */
export function RegisterPanel({
  titleId, regForm, setRegForm, loading, error, onRegister, onSwitchView,
}: RegisterPanelProps) {
  const errorId = useId();
  const warningId = useId();
  const describedBy = error ? errorId : undefined;
  const set = (key: keyof RegisterForm) => (e: { target: { value: string } }) =>
    setRegForm({ ...regForm, [key]: e.target.value });

  return (
    <VaultScrollPane>
      <div className="w-full max-w-[40rem] px-5 py-10 sm:px-10 md:py-14">
        <h2
          id={titleId}
          tabIndex={-1}
          style={PANEL_TITLE_STYLE}
          className="font-display text-h3 font-semibold text-ink [text-wrap:balance] focus:outline-none"
        >
          Create an identity
        </h2>
        <p className="mt-3 max-w-measure font-body text-body text-ink-muted [text-wrap:pretty]">
          Your passphrase derives the key that encrypts your messages. Only a hash of it is stored.
        </p>

        <form onSubmit={onRegister} noValidate className="mt-8 flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <VaultField
              label="Full name"
              hint="optional"
              name="name"
              autoComplete="name"
              data-vault-focus=""
              value={regForm.fullName}
              onChange={set('fullName')}
            />
            <VaultField
              label="Organisation"
              hint="optional"
              name="organization"
              autoComplete="organization"
              value={regForm.org}
              onChange={set('org')}
            />
            <VaultField
              label="Email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              aria-required="true"
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
              value={regForm.password}
              onChange={set('password')}
              describedBy={error ? `${warningId} ${errorId}` : warningId}
            />
          </div>

          <div id={warningId}>
            <VaultWarning>Passphrases can&apos;t be recovered. Store yours somewhere safe.</VaultWarning>
          </div>

          {error ? <VaultError id={errorId}>{error}</VaultError> : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-4">
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
