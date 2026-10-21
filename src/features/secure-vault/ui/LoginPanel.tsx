'use client';

import { useId, type Dispatch, type SetStateAction, type SyntheticEvent } from 'react';

import { Button } from '@/shared/ui/button';

import type { LoginForm, VaultView } from '../model/vault-types';
import { PANEL_TITLE_STYLE, VaultError, VaultField, VaultScrollPane, VaultSuccess } from './vault-form';

export interface LoginPanelProps {
  titleId: string;
  loginForm: LoginForm;
  setLoginForm: Dispatch<SetStateAction<LoginForm>>;
  loading: boolean;
  successMsg: string;
  error: string;
  onLogin: (e: SyntheticEvent) => void;
  onSwitchView: (view: VaultView) => void;
}

/** Sign in (§H.7). Submitting runs the model's `handleLogin`, which prevents the native submit. */
export function LoginPanel({
  titleId, loginForm, setLoginForm, loading, successMsg, error, onLogin, onSwitchView,
}: LoginPanelProps) {
  const errorId = useId();
  const describedBy = error ? errorId : undefined;

  return (
    <VaultScrollPane>
      <div className="w-full max-w-[28rem] px-5 py-10 sm:px-10 md:py-14">
        <h2
          id={titleId}
          tabIndex={-1}
          style={PANEL_TITLE_STYLE}
          className="font-display text-h3 font-semibold text-ink [text-wrap:balance] focus:outline-none"
        >
          Vault
        </h2>
        <p className="mt-3 font-body text-body text-ink-muted [text-wrap:pretty]">
          Your message is encrypted in your browser with AES-GCM and added to a hash-chained ledger before it is
          stored. It reaches my private inbox, not a public thread.
        </p>

        <form onSubmit={onLogin} noValidate className="mt-8 flex flex-col gap-5">
          <VaultField
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            data-vault-focus=""
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            describedBy={describedBy}
          />
          <VaultField
            label="Passphrase"
            name="password"
            type="password"
            autoComplete="current-password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            describedBy={describedBy}
          />

          {successMsg ? <VaultSuccess>{successMsg}</VaultSuccess> : null}
          {error ? <VaultError id={errorId}>{error}</VaultError> : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button type="submit" loading={loading} disabled={loading}>
              {loading ? 'Decrypting...' : 'Open the vault'}
            </Button>
            <Button variant="text" onClick={() => onSwitchView('register')}>
              Create an identity
            </Button>
          </div>
        </form>
      </div>
    </VaultScrollPane>
  );
}
