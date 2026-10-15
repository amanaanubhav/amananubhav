'use client';

import { createStore } from '@/shared/lib/store';

const terminalOpenStore = createStore<boolean>(false);

export function useTerminalOpen(): boolean {
  return terminalOpenStore.use();
}

export function openTerminal(): void {
  terminalOpenStore.set(true);
}

export function closeTerminal(): void {
  terminalOpenStore.set(false);
}
