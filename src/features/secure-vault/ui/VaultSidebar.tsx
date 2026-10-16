'use client';

import { Lock, LogOut, MessagesSquare, Users, type LucideIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Stamp } from '@/shared/ui/journal';

import type { VaultSessionUser, VaultTab } from '../model/vault-types';

export interface VaultSidebarProps {
  currentUser: VaultSessionUser | null;
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  onLogout: () => void;
}

const displayName = (user: VaultSessionUser) => user.fullName || user.username;
const roleLabel = (user: VaultSessionUser) => (user.role === 'admin' ? 'Admin' : 'Member');

function SidebarTab({
  icon: Icon, active, onClick, children,
}: { icon: LucideIcon; active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={
        'flex h-11 w-full items-center gap-3 rounded-control px-3 text-left font-body text-ui transition-colors duration-hover ' +
        'focus-visible:outline-offset-[-2px] ' +
        (active ? 'bg-surface font-medium text-ink' : 'text-ink-muted hover:text-ink')
      }
    >
      <Icon aria-hidden="true" focusable="false" className="size-[18px] shrink-0" strokeWidth={1.75} />
      {children}
    </button>
  );
}

/** What the vault does, as a log (§D.1 log style: Literata italic keys, Plex Mono values). */
function CipherLog() {
  const rows: [string, string][] = [
    ['cipher', 'AES-GCM, 256-bit'],
    ['key', 'PBKDF2, SHA-256'],
    ['ledger', 'SHA-256 hash chain'],
  ];
  return (
    <dl className="flex flex-col gap-3">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt className="font-body text-caption italic text-ink-muted">{key}</dt>
          <dd className="font-data text-caption text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Desktop sidebar (§H.7, ≥ 768 px): identity, role stamp, Messages / People, Sign out. */
export function VaultSidebar({ currentUser, activeTab, onTabChange, onLogout }: VaultSidebarProps) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside aria-label="Vault" className="hidden min-h-0 flex-col border-r border-line bg-surface-2 md:flex">
      <p className="flex items-center gap-2 px-6 pt-6 font-body text-caption italic text-ink-muted">
        <Lock aria-hidden="true" focusable="false" className="size-3.5 shrink-0" strokeWidth={2} />
        Encrypted in your browser
      </p>

      {currentUser ? (
        <>
          <div className="px-6 pt-8">
            <p className="truncate font-display text-title font-semibold text-ink">{displayName(currentUser)}</p>
            <p className="truncate font-data text-caption text-ink-muted">@{currentUser.username}</p>
            <Stamp className="mt-3">{roleLabel(currentUser)}</Stamp>
          </div>

          <nav aria-label="Vault sections" className="mt-8 flex flex-col gap-1 px-3">
            <SidebarTab icon={MessagesSquare} active={activeTab === 'ledger' || !isAdmin} onClick={() => onTabChange('ledger')}>
              Messages
            </SidebarTab>
            {isAdmin ? (
              <SidebarTab icon={Users} active={activeTab === 'users'} onClick={() => onTabChange('users')}>
                People
              </SidebarTab>
            ) : null}
          </nav>

          <div className="mt-auto px-6 pb-6 pt-6">
            <Button variant="text" icon={LogOut} onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-auto px-6 pb-6">
          <CipherLog />
        </div>
      )}
    </aside>
  );
}

/** Mobile replacement for the sidebar (< 768 px): identity row, then a segmented control for admins. */
export function VaultMobileBar({ currentUser, activeTab, onTabChange, onLogout }: VaultSidebarProps) {
  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  const segment = (tab: VaultTab, label: string) => {
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => onTabChange(tab)}
        aria-pressed={active}
        className={
          'h-10 rounded-[1px] font-body text-ui transition-colors duration-hover focus-visible:outline-offset-[-2px] ' +
          '[@media(pointer:coarse)]:h-11 ' +
          (active ? 'bg-surface-2 font-medium text-ink' : 'text-ink-muted hover:text-ink')
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="shrink-0 border-b border-line px-4 py-2 md:hidden">
      <div className="flex min-h-11 items-center gap-3">
        <span className="min-w-0 truncate font-body text-ui font-medium text-ink">{displayName(currentUser)}</span>
        <Stamp>{roleLabel(currentUser)}</Stamp>
        <Button variant="text" icon={LogOut} onClick={onLogout} className="ml-auto shrink-0">
          Sign out
        </Button>
      </div>
      {isAdmin ? (
        <div
          role="group"
          aria-label="Vault sections"
          className="mb-1 mt-2 grid grid-cols-2 gap-0.5 rounded-control border border-line-strong p-0.5"
        >
          {segment('ledger', 'Messages')}
          {segment('users', 'People')}
        </div>
      ) : null}
    </div>
  );
}
