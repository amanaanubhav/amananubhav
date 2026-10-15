'use client';

import type { Dispatch, RefObject, SetStateAction, SyntheticEvent } from 'react';
import {
  AlertTriangle, CheckCircle, Database, HelpCircle, Lock, LogOut, Mail, Phone, Plus, Server,
  Shield, Trash2, Unlock,
} from 'lucide-react';

import type {
  LedgerBlock, LoginForm, RegisterForm, VaultSessionUser, VaultTab, VaultUser, VaultUserStatus, VaultView,
} from '../model/vault-types';

interface VaultSidebarProps {
  currentUser: VaultSessionUser | null;
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  onLogout: () => void;
}

export function VaultSidebar({ currentUser, activeTab, onTabChange, onLogout }: VaultSidebarProps) {
  return (
    <div className="w-64 bg-black border-r border-zinc-800 p-6 flex flex-col hidden md:flex">
      <div className="flex items-center gap-3 text-green-500 mb-10">
        <Shield size={28} />
        <div>
          <h1 className="font-bold text-xl tracking-tighter leading-none">CONTACT</h1>
          <div className="text-[10px] text-zinc-500 tracking-widest">SECURE NODE</div>
        </div>
      </div>
      {currentUser && (
        <div className="mb-8 p-4 bg-zinc-900/50 rounded border border-zinc-800">
          <div className="font-bold text-white truncate text-sm">{currentUser.username}</div>
          <div className={`text-[10px] font-bold uppercase mt-2 inline-flex px-2 py-0.5 rounded items-center gap-2 ${currentUser.role === 'admin' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
            {currentUser.role}
          </div>
        </div>
      )}
      {currentUser && (
        <nav className="space-y-2 flex-1">
          <button onClick={() => onTabChange('ledger')} className={`w-full text-left px-4 py-3 rounded text-xs font-bold tracking-wider transition-all flex items-center gap-3 ${activeTab === 'ledger' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
            <Database size={14} /> LEDGER
          </button>
          {currentUser.role === 'admin' && (
            <button onClick={() => onTabChange('users')} className={`w-full text-left px-4 py-3 rounded text-xs font-bold tracking-wider transition-all flex items-center gap-3 ${activeTab === 'users' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
              <Server size={14} /> USERS
            </button>
          )}
        </nav>
      )}
      {currentUser && (
        <button onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs font-bold mt-auto px-2"><LogOut size={14} /> DISCONNECT</button>
      )}
    </div>
  );
}

export function VaultHelp() {
  return (
    <div className="absolute top-4 left-4 z-50 group">
      <button className="text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-all border border-transparent hover:border-zinc-700">
        <HelpCircle size={20} />
      </button>
      {/* TOOLTIP */}
      <div className="absolute top-12 left-0 w-[85vw] sm:w-96 p-4 bg-black/95 backdrop-blur-md border border-zinc-800 rounded shadow-2xl text-xs text-zinc-400 font-mono hidden group-hover:block group-focus:block group-active:block z-50 pointer-events-none">
        <div className="font-bold text-white mb-2 flex items-center gap-2"><Lock size={12} /> SECURE PROTOCOL V5</div>
        <p className="leading-relaxed text-justify">
          The Secure Contact interface represents a cryptographic upgrade from standard contact forms, engineered on a custom blockchain architecture with end-to-end 256-bit encryption. Messages are strictly confidential, accessible only to you and the administrator. Note that to ensure absolute privacy, we employ a zero-knowledge protocol regarding your credentials; therefore, password recovery is impossible. Please secure your password diligently, as its loss will result in permanent account inaccessibility.
        </p>
      </div>
    </div>
  );
}

interface LoginPanelProps {
  loginForm: LoginForm;
  setLoginForm: Dispatch<SetStateAction<LoginForm>>;
  loading: boolean;
  successMsg: string;
  error: string;
  onLogin: (e: SyntheticEvent) => void;
  onSwitchView: (view: VaultView) => void;
}

export function LoginPanel({ loginForm, setLoginForm, loading, successMsg, error, onLogin, onSwitchView }: LoginPanelProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative">
      <div className="w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-bold text-white text-center tracking-tight">Access Secure Contact</h2>
        <div className="space-y-4">
          <input placeholder="USERNAME" className="w-full bg-black border border-zinc-800 p-4 text-sm text-white text-center tracking-widest outline-none focus:border-green-500 transition-colors" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input type="password" placeholder="PASSPHRASE" className="w-full bg-black border border-zinc-800 p-4 text-sm text-white text-center tracking-widest outline-none focus:border-green-500 transition-colors" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button onClick={onLogin} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 text-xs tracking-[0.2em] transition-colors">{loading ? 'DECRYPTING...' : 'CONNECT'}</button>
        </div>
        <div className="text-center"><button onClick={() => onSwitchView('register')} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">Generate Identity</button></div>
        {successMsg && <div className="text-green-400 text-xs text-center bg-green-900/20 p-3 border border-green-900/50 font-mono animate-pulse">{successMsg}</div>}
        {error && <div className="text-red-500 text-xs text-center bg-red-900/10 p-3 border border-red-900/30 font-mono">{error}</div>}
      </div>
    </div>
  );
}

interface RegisterPanelProps {
  regForm: RegisterForm;
  setRegForm: Dispatch<SetStateAction<RegisterForm>>;
  loading: boolean;
  error: string;
  onRegister: (e: SyntheticEvent) => void;
  onSwitchView: (view: VaultView) => void;
}

export function RegisterPanel({ regForm, setRegForm, loading, error, onRegister, onSwitchView }: RegisterPanelProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8 relative">
      <div className="w-full max-w-sm space-y-6">
        <h2 className="text-2xl font-bold text-white text-center tracking-tight">New Identity</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="FULL NAME" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.fullName} onChange={e => setRegForm({ ...regForm, fullName: e.target.value })} />
            <input placeholder="ORG" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.org} onChange={e => setRegForm({ ...regForm, org: e.target.value })} />
          </div>
          <input placeholder="EMAIL" type="email" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
          <input placeholder="PHONE" type="tel" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
          <input placeholder="USERNAME" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} />
          <input type="password" placeholder="PASSPHRASE" className="w-full bg-black border border-zinc-800 p-3 text-xs text-white text-center outline-none focus:border-green-500" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} />
          <button onClick={onRegister} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 text-xs tracking-[0.2em] mt-4">{loading ? 'GENERATING...' : 'COMMIT'}</button>
        </div>
        <div className="text-center"><button onClick={() => onSwitchView('login')} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest">Back to Login</button></div>
        {error && <div className="text-red-500 text-xs text-center bg-red-900/10 p-3 border border-red-900/30 font-mono">{error}</div>}
      </div>
    </div>
  );
}

interface LedgerPanelProps {
  currentUser: VaultSessionUser;
  chain: LedgerBlock[];
  chainEndRef: RefObject<HTMLDivElement | null>;
  msgInput: string;
  setMsgInput: Dispatch<SetStateAction<string>>;
  onAddBlock: () => void;
  onDeleteBlock: (id: string) => void;
  onNukeChain: () => void;
}

export function LedgerPanel({
  currentUser, chain, chainEndRef, msgInput, setMsgInput, onAddBlock, onDeleteBlock, onNukeChain,
}: LedgerPanelProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="pl-6 py-6 pr-24 border-b border-zinc-800 flex justify-between items-center bg-black/50">
        <div className="flex items-center gap-3"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><h3 className="font-bold text-white text-sm tracking-widest">LIVE_LEDGER</h3></div>
        {currentUser.role === 'admin' && <button onClick={onNukeChain} className="text-[10px] text-red-500 border border-red-900/50 px-3 py-1 hover:bg-red-900/20">NUKE CHAIN</button>}
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chain.map((block) => (
          <div key={block.id} className={`p-5 border transition-all ${block.decryptedContent ? 'bg-green-900/10 border-green-900/30' : 'bg-black border-zinc-800 opacity-60 hover:opacity-100'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono bg-zinc-900 px-2 py-1 text-zinc-500">BLK_{block.index}</span>
                <span className={`text-xs font-bold ${block.decryptedContent ? 'text-green-400' : 'text-white'}`}>{block.sender}</span>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">{block.timestamp?.toDate().toLocaleTimeString()}</span>
            </div>
            <div className="font-mono text-xs break-all leading-relaxed pl-2 border-l-2 border-zinc-800">
              {block.decryptedContent ? (
                <div className="flex flex-col gap-1">
                  <span className="text-green-300">{block.decryptedContent.text}</span>
                  {block.decryptSource === 'admin' && <span className="text-[9px] text-red-400 uppercase tracking-widest mt-1 flex items-center gap-1"><Unlock size={8} /> ADMIN_DECRYPT</span>}
                </div>
              ) : (
                <span className="text-zinc-600 italic flex items-center gap-2"><Lock size={10} /> [ ENCRYPTED_PAYLOAD ]</span>
              )}
            </div>
            {currentUser.role === 'admin' && (
              <div className="mt-3 pt-3 border-t border-zinc-900 flex justify-end">
                <button onClick={() => onDeleteBlock(block.id)} className="text-red-500 hover:text-red-400 text-[10px] flex items-center gap-1 uppercase tracking-wider"><Trash2 size={10} /> Prune Block</button>
              </div>
            )}
          </div>
        ))}
        <div ref={chainEndRef} />
      </div>
      {currentUser.role !== 'admin' && (
        <div className="p-4 border-t border-zinc-800 bg-black flex gap-0">
          <input className="flex-1 bg-zinc-900 border-y border-l border-zinc-700 p-4 text-sm text-white outline-none focus:bg-zinc-800 font-mono" placeholder="> Encrypt data..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onAddBlock(); }} />
          <button onClick={onAddBlock} disabled={!msgInput.trim()} className="bg-white hover:bg-zinc-200 px-6 text-black border-y border-r border-zinc-700"><Plus size={20} /></button>
        </div>
      )}
    </div>
  );
}

interface UsersPanelProps {
  usersList: VaultUser[];
  onToggleStatus: (id: string, status: VaultUserStatus) => void;
  onDeleteUser: (id: string) => void;
}

export function UsersPanel({ usersList, onToggleStatus, onDeleteUser }: UsersPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 grid gap-4">
      <div className="flex justify-between items-end mb-8 pr-12">
        <h2 className="text-xl font-bold text-white">User Directory</h2>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">{usersList.length} Registered Identities</span>
      </div>
      <div className="grid gap-4">
        {usersList.map(u => (
          <div key={u.id} className="bg-black p-5 border border-zinc-800 flex justify-between items-center hover:border-zinc-600">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{u.fullName}</span>
                <span className="text-xs text-zinc-500">@{u.username}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 flex flex-col gap-1">
                <span>{u.org}</span>
                <span className="flex items-center gap-1 text-zinc-600"><Mail size={10} /> {u.email}</span>
                <span className="flex items-center gap-1 text-zinc-600"><Phone size={10} /> {u.phone}</span>
              </div>
              <div className={`text-[9px] mt-2 inline-block px-2 py-0.5 uppercase ${u.status === 'blocked' ? 'bg-red-500 text-black' : 'bg-green-500 text-black'}`}>{u.status}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => onToggleStatus(u.id, u.status)} className="p-2 border border-zinc-700 text-zinc-400 hover:text-white">{u.status === 'blocked' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}</button>
              <button onClick={() => onDeleteUser(u.id)} className="p-2 border border-red-900 text-red-500 hover:bg-red-900/20"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
