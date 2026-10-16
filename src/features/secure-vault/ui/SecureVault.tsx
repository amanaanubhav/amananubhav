'use client';

import { useEffect, useId, useRef } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

import { MOTION } from '@/shared/config';
import { useEscapeKey, useFocusTrap } from '@/shared/lib/dom';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { IconButton } from '@/shared/ui/button';

import { useLedger } from '../model/use-ledger';
import { useVaultSession } from '../model/use-vault-session';
import { LedgerPanel } from './LedgerPanel';
import { LoginPanel } from './LoginPanel';
import { RegisterPanel } from './RegisterPanel';
import { UsersPanel } from './UsersPanel';
import { VaultHelp } from './VaultHelp';
import { VaultMobileBar, VaultSidebar } from './VaultSidebar';

export interface SecureVaultProps {
  onClose: () => void;
}

/**
 * Secure contact (§H.7): a modal dialog at z-vault, mounted only while open (no isOpen prop).
 * Desktop: sidebar + main pane in one panel; below 768 px: a full-screen sheet with the mobile bar.
 */
export function SecureVault({ onClose }: SecureVaultProps) {
  const session = useVaultSession();
  const { view, currentUser, activeTab } = session;
  const ledger = useLedger({
    view,
    currentUser,
    userKey: session.userKey,
    adminKey: session.adminKey,
    setError: session.setError,
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const motionOk = useMotionAllowed();

  // People is admin-only; a tab left on 'users' by an earlier admin session shows Messages instead.
  const isAdmin = currentUser?.role === 'admin';
  const tab = isAdmin ? activeTab : 'ledger';

  // Each view names its own focus target ([data-vault-focus]). Focus moves there on open and whenever
  // a view change removed the focused control; a click on a sidebar tab keeps focus where it is.
  useEffect(() => {
    const target = mainRef.current?.querySelector<HTMLElement>('[data-vault-focus]') ?? null;
    initialFocusRef.current = target;
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const active = document.activeElement;
      const lost = !active || active === document.body || active === dialog || !dialog?.contains(active);
      if (lost) target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [view, tab]);

  useEscapeKey(onClose, true);
  useFocusTrap(dialogRef, true, { initialFocus: initialFocusRef });

  const handleLogout = () => {
    session.handleLogout();
    ledger.resetChain();
  };

  const fade = { duration: 0.15 };
  const panelMotion = motionOk
    ? { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: MOTION.spring } }
    : { initial: { opacity: 0 }, animate: { opacity: 1, transition: fade } };

  const navProps = { currentUser, activeTab: tab, onTabChange: session.setActiveTab, onLogout: handleLogout };

  return (
    <div className="fixed inset-0 z-vault flex items-stretch justify-center md:items-center md:p-6">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ground/[0.92]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: motionOk ? { duration: MOTION.dur.ui, ease: MOTION.bezier.settle } : fade }}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          'relative flex h-[100dvh] w-full flex-col overflow-hidden bg-surface text-ink pt-[env(safe-area-inset-top)] ' +
          'md:grid md:h-[80vh] md:max-h-[calc(100dvh-48px)] md:min-h-[min(560px,calc(100dvh-48px))] md:max-w-[1040px] ' +
          'md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:rounded-panel md:border md:border-line md:pt-0 md:shadow-float'
        }
        {...panelMotion}
      >
        <VaultSidebar {...navProps} />

        <div ref={mainRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <VaultHelp>
            <IconButton label="Close secure contact" icon={X} size={40} onClick={onClose} />
          </VaultHelp>

          <VaultMobileBar {...navProps} />

          {view === 'login' && (
            <LoginPanel
              titleId={titleId}
              loginForm={session.loginForm}
              setLoginForm={session.setLoginForm}
              loading={session.loading}
              successMsg={session.successMsg}
              error={session.error}
              onLogin={(e) => {
                void session.handleLogin(e);
              }}
              onSwitchView={session.switchView}
            />
          )}

          {view === 'register' && (
            <RegisterPanel
              titleId={titleId}
              regForm={session.regForm}
              setRegForm={session.setRegForm}
              loading={session.loading}
              error={session.error}
              onRegister={(e) => {
                void session.handleRegister(e);
              }}
              onSwitchView={session.switchView}
            />
          )}

          {view === 'dashboard' && tab === 'ledger' && currentUser && (
            <LedgerPanel
              titleId={titleId}
              currentUser={currentUser}
              chain={ledger.chain}
              chainEndRef={ledger.chainEndRef}
              msgInput={ledger.msgInput}
              setMsgInput={ledger.setMsgInput}
              error={session.error}
              onAddBlock={() => {
                void ledger.handleAddBlock();
              }}
              onDeleteBlock={(id) => {
                void ledger.deleteBlock(id);
              }}
              onNukeChain={() => {
                void ledger.nukeChain();
              }}
            />
          )}

          {view === 'dashboard' && tab === 'users' && isAdmin && (
            <UsersPanel
              titleId={titleId}
              usersList={ledger.usersList}
              onToggleStatus={(id, s) => {
                void ledger.toggleUserStatus(id, s);
              }}
              onDeleteUser={(id) => {
                void ledger.deleteUser(id);
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
