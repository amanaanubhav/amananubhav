'use client';

import { useEffect, useState, type Dispatch, type SetStateAction, type SyntheticEvent } from 'react';

import { isAdminPasscode } from '@/shared/config';

import { createVaultUser, findUsersByUsername, startVaultSession } from '../api/vault-firestore';
import { ADMIN_CHANNEL_SALT, ADMIN_CHANNEL_SECRET, ADMIN_USERNAME } from '../config/vault';
import { computeHash, deriveKey } from '../lib/webcrypto';
import type {
  LoginForm, RegisterForm, VaultSessionUser, VaultTab, VaultUserDoc, VaultView,
} from './vault-types';

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

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

    try {
      const snap = await findUsersByUsername(regForm.username);
      if (!snap.empty) throw new Error('Username taken.');

      const passwordHash = await computeHash(regForm.password);

      await createVaultUser({
        username: regForm.username,
        fullName: regForm.fullName,
        org: regForm.org,
        email: regForm.email,
        phone: regForm.phone,
        passwordHash,
        role: 'user',
        status: 'active',
      });

      setLoginForm({ username: regForm.username, password: '' });
      setSuccessMsg('Identity Generated Successfully. Please Authenticate.');
      switchView('login');
    } catch (err) { setError(errorMessage(err)); }
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
      const snap = await findUsersByUsername(loginForm.username);

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
