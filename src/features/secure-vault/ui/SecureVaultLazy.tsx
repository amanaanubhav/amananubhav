'use client';

import dynamic from 'next/dynamic';

/** Client-only, code-split vault; the shell mounts it only while the vault is open. */
export const SecureVaultLazy = dynamic(
  () => import('./SecureVault').then((m) => m.SecureVault),
  { ssr: false },
);
