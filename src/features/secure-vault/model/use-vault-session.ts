'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type SyntheticEvent } from 'react';

import { isAdminPasscode } from '@/shared/config';

import { createVaultUser, findUsersByUsername, startVaultSession } from '../api/vault-firestore';
import { ADMIN_CHANNEL_SALT, ADMIN_CHANNEL_SECRET, ADMIN_USERNAME } from '../config/vault';
import { isVaultUnreachable, VAULT_UNREACHABLE, VaultTimeoutError, withVaultTimeout } from '../lib/time-limit';
import { computeHash, deriveKey } from '../lib/webcrypto';
import type {
  LoginForm, RegisterForm, VaultSessionUser, VaultTab, VaultUserDoc, VaultView,
} from './vault-types';

/** An unreachable backend (time limit or Firestore `unavailable`) reads as one line; anything else as before. */
const errorMessage = (err: unknown): string => {
  if (isVaultUnreachable(err)) return VAULT_UNREACHABLE;
  return err instanceof Error ? err.message : String(err);
};

/**
 * A registration write that ran past the time limit. Firestore cannot cancel it, so it may still land: a retry for
 * the same username waits on this write instead of adding a second user doc with that name.
 */
interface PendingRegistration {
  username: string;
  passwordHash: string;
  write: Promise<void>;
}

/** Every registration field is required, in the form's order (labels match RegisterPanel). */
const REGISTER_FIELDS: readonly { key: keyof RegisterForm; label: string }[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'org', label: 'Organisation' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'username', label: 'Username' },
  { key: 'password', label: 'Passphrase' },
];

/** A light shape check (something@domain.tld); the address is confirmed by the reply, not here. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface VaultSession {
  view: VaultView;
  loading: boolean;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  successMsg: string;
  currentUser: VaultSessionUser | null;
  userKey: CryptoKey | null;
  adminKey: CryptoKey | null;
  regForm: RegisterForm;
  setRegForm: Dispatch<SetStateAction<RegisterForm>>;
  loginForm: LoginForm;
  setLoginForm: Dispatch<SetStateAction<LoginForm>>;
  activeTab: VaultTab;
  setActiveTab: Dispatch<SetStateAction<VaultTab>>;
  switchView: (newView: VaultView) => void;
  handleRegister: (e: SyntheticEvent) => Promise<void>;
  handleLogin: (e: SyntheticEvent) => Promise<void>;
  handleLogout: () => void;
}

/**
 * Pseudo-auth state machine ported 1:1 from SecureContact.jsx. The setState call order is kept
 * verbatim (e.g. switchView resetting loading before the trailing setLoading(false), the
 * validation early-return leaving successMsg untouched, activeTab surviving logout).
 */
export function useVaultSession(): VaultSession {
  const [view, setView] = useState<VaultView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [currentUser, setCurrentUser] = useState<VaultSessionUser | null>(null);
  const [userKey, setUserKey] = useState<CryptoKey | null>(null);
  const [adminKey, setAdminKey] = useState<CryptoKey | null>(null);

  const [regForm, setRegForm] = useState<RegisterForm>({
    username: '',
    password: '',
    fullName: '',
    org: '',
    email: '',
    phone: '',
  });
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState<VaultTab>('ledger');
  const pendingRegistration = useRef<PendingRegistration | null>(null);

  // Opening the vault is a first use of Firebase: start the shared anonymous session on mount.
  useEffect(() => {
    void startVaultSession();
  }, []);

  const switchView = (newView: VaultView) => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setView(newView);
  };

  const handleRegister = async (e: SyntheticEvent) => {
    e.preventDefault();
    // Every field is required (owner's rule): name the missing ones, then check the two formats.
    const missing = REGISTER_FIELDS.filter(({ key }) => !regForm[key].trim()).map(({ label }) => label);
    if (missing.length > 0) {
      setError(`Please fill in every field. Missing: ${missing.join(', ')}.`);
      return;
    }
    if (!EMAIL_PATTERN.test(regForm.email.trim())) {
      setError('Enter a valid email address, for example name@example.com.');
      return;
    }
    if (regForm.phone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number, with the country code if you are outside India.');
      return;
    }

    setLoading(true); setError('');

    const { username } = regForm;
    try {
      // Each network wait is time-limited (VAULT_NETWORK_TIMEOUT_MS): past it the error shows and the form is kept.
      const passwordHash = await computeHash(regForm.password);
      const pending = pendingRegistration.current?.username === username ? pendingRegistration.current : null;

      if (pending) {
        // Retry after a timed-out write: wait on it again. Landed with another passphrase, the name is taken.
        await withVaultTimeout(pending.write);
        if (pending.passwordHash !== passwordHash) throw new Error('Username taken.');
      } else {
        const snap = await withVaultTimeout(findUsersByUsername(username));
        if (!snap.empty) throw new Error('Username taken.');

        const write = createVaultUser({
          username,
          fullName: regForm.fullName,
          org: regForm.org,
          email: regForm.email,
          phone: regForm.phone,
          passwordHash,
          role: 'user',
          status: 'active',
        });
        // Handled here so a write left behind by the time limit never surfaces as an unhandled rejection.
        write.catch(() => undefined);
        pendingRegistration.current = { username, passwordHash, write };
        await withVaultTimeout(write);
      }

      pendingRegistration.current = null;
      setLoginForm({ username: regForm.username, password: '' });
      setSuccessMsg('Identity Generated Successfully. Please Authenticate.');
      switchView('login');
    } catch (err) {
      // Only a timed-out write can still land; any other outcome settles it, so the next try starts from the server.
      if (!(err instanceof VaultTimeoutError) && pendingRegistration.current?.username === username) {
        pendingRegistration.current = null;
      }
      setError(errorMessage(err));
    }
    setLoading(false);
  };

  const handleLogin = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) return;
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      // ADMIN LOGIN
      if (loginForm.username === ADMIN_USERNAME && isAdminPasscode(loginForm.password)) {
        setCurrentUser({ username: ADMIN_USERNAME, role: 'admin', fullName: 'System Administrator' });
        const admKey = await deriveKey(ADMIN_CHANNEL_SECRET, ADMIN_CHANNEL_SALT);
        setAdminKey(admKey);
        setView('dashboard');
        setLoading(false);
        return;
      }

      // USER LOGIN
      // Time-limited: a late answer after the limit is ignored and the next submit asks again.
      const snap = await withVaultTimeout(findUsersByUsername(loginForm.username));

      if (snap.empty) throw new Error('User not found.');

      const userData = snap.docs[0].data() as VaultUserDoc;
      const inputHash = await computeHash(loginForm.password);

      if (userData.passwordHash !== inputHash) throw new Error('Invalid password.');
      if (userData.status === 'blocked') throw new Error('Account Blocked.');

      const key = await deriveKey(loginForm.password, loginForm.username);
      setUserKey(key);
      setCurrentUser({ id: snap.docs[0].id, ...userData });
      setView('dashboard');
    } catch (err) { setError(errorMessage(err)); }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserKey(null);
    setAdminKey(null);
    switchView('login');
    setLoginForm({ username: '', password: '' });
  };

  return {
    view, loading, error, setError, successMsg,
    currentUser, userKey, adminKey,
    regForm, setRegForm, loginForm, setLoginForm,
    activeTab, setActiveTab,
    switchView, handleRegister, handleLogin, handleLogout,
  };
}
