'use client';

import { X } from 'lucide-react';

import { useLedger } from '../model/use-ledger';
import { useVaultSession } from '../model/use-vault-session';
import { LedgerPanel, LoginPanel, RegisterPanel, UsersPanel, VaultHelp, VaultSidebar } from './VaultPanels';

export interface SecureVaultProps {
  onClose: () => void;
}

/** Secure Contact vault modal (legacy SecureContact.jsx). Mounted only while open, so no isOpen prop. */
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

  const handleLogout = () => {
    session.handleLogout();
    ledger.resetChain();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 font-cyber animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-lg flex overflow-hidden shadow-2xl relative">

        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-all"><X size={20} /></button>

        <VaultSidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={session.setActiveTab}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col relative bg-zinc-950/50">

          <VaultHelp />

          {view === 'login' && (
            <LoginPanel
              loginForm={session.loginForm}
              setLoginForm={session.setLoginForm}
              loading={session.loading}
              successMsg={session.successMsg}
              error={session.error}
              onLogin={(e) => { void session.handleLogin(e); }}
              onSwitchView={session.switchView}
            />
          )}

          {view === 'register' && (
            <RegisterPanel
              regForm={session.regForm}
              setRegForm={session.setRegForm}
              loading={session.loading}
              error={session.error}
              onRegister={(e) => { void session.handleRegister(e); }}
              onSwitchView={session.switchView}
            />
          )}

          {view === 'dashboard' && activeTab === 'ledger' && currentUser && (
            <LedgerPanel
              currentUser={currentUser}
              chain={ledger.chain}
              chainEndRef={ledger.chainEndRef}
              msgInput={ledger.msgInput}
              setMsgInput={ledger.setMsgInput}
              onAddBlock={() => { void ledger.handleAddBlock(); }}
              onDeleteBlock={(id) => { void ledger.deleteBlock(id); }}
              onNukeChain={() => { void ledger.nukeChain(); }}
            />
          )}

          {view === 'dashboard' && activeTab === 'users' && currentUser?.role === 'admin' && (
            <UsersPanel
              usersList={ledger.usersList}
              onToggleStatus={(id, s) => { void ledger.toggleUserStatus(id, s); }}
              onDeleteUser={(id) => { void ledger.deleteUser(id); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
