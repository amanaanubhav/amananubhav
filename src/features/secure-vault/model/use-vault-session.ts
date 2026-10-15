'use client';

import { useState, type Dispatch, type SetStateAction, type SyntheticEvent } from 'react';

import { isAdminPasscode } from '@/shared/config';

import { createVaultUser, findUsersByUsername } from '../api/vault-firestore';
import { ADMIN_CHANNEL_SALT, ADMIN_CHANNEL_SECRET, ADMIN_USERNAME } from '../config/vault';
import { computeHash, deriveKey } from '../lib/webcrypto';
import type {
  LoginForm, RegisterForm, VaultSessionUser, VaultTab, VaultUserDoc, VaultView,
} from './vault-types';

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

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

  const switchView = (newView: VaultView) => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setView(newView);
  };

  const handleRegister = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!regForm.username || !regForm.password || !regForm.email || !regForm.phone) {
      setError('All fields (Username, Pass, Email, Phone) are required.');
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
