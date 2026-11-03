'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

import { useEscapeKey } from '@/shared/lib/dom';

import { closeVault } from '../model/vault-store';
import { VAULT_SCRIM_CLASS, vaultScrimHandoff } from './vault-scrim';

/**
 * Shown while the vault chunk loads (the navbar is already hidden); Escape still closes. The same glass scrim as
 * the dialog, with the status on a small glass sheet so the text never sits on the translucent scrim.
 */
function VaultLoading() {
  useEscapeKey(() => closeVault(), true);
  useEffect(() => {
    // The dialog renders (and reads this) before this fallback's cleanup runs in the same commit.
    vaultScrimHandoff.shown = true;
    return () => {
      vaultScrimHandoff.shown = false;
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-vault flex items-center justify-center px-6 ${VAULT_SCRIM_CLASS}`}>
      <p role="status" className="glass-chrome glass-sheet rounded-full px-5 py-2 font-body text-ui italic text-ink-muted">
        Opening the Vault...
      </p>
    </div>
  );
}

/** Client-only, code-split vault; the shell mounts it only while the vault is open. */
export const SecureVaultLazy = dynamic(
  () => import('./SecureVault').then((m) => m.SecureVault),
  { ssr: false, loading: VaultLoading },
);
