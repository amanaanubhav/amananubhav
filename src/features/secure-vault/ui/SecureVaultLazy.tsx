'use client';

import dynamic from 'next/dynamic';

import { useEscapeKey } from '@/shared/lib/dom';

import { closeVault } from '../model/vault-store';

/** Shown while the vault chunk loads (the navbar is already hidden); Escape still closes. */
function VaultLoading() {
  useEscapeKey(() => closeVault(), true);

  return (
    <div className="fixed inset-0 z-vault flex items-center justify-center bg-ground/[0.92] px-6">
      <p role="status" className="font-body text-ui italic text-ink-muted">
        Opening secure contact...
      </p>
    </div>
  );
}

/** Client-only, code-split vault; the shell mounts it only while the vault is open. */
export const SecureVaultLazy = dynamic(
  () => import('./SecureVault').then((m) => m.SecureVault),
  { ssr: false, loading: VaultLoading },
);
