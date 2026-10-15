'use client';

import { createStore } from '@/shared/lib/store';

/** Replaces App.jsx isVaultOpen + handleOpenVault prop drilling. The vault is mounted only while open. */
const vaultStore = createStore<boolean>(false);

export function useVaultOpen(): boolean {
  return vaultStore.use();
}

export function openVault(): void {
  vaultStore.set(true);
}

export function closeVault(): void {
  vaultStore.set(false);
}
