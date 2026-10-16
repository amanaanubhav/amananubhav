import { useSyncExternalStore } from 'react';

/**
 * Whether the first-load preloader has finished (§D.4). Module state, so it survives client
 * navigations: after the first boot every later page mounts with `true`.
 */
let bootDone = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const getSnapshot = () => bootDone;
const getServerSnapshot = () => false;

/** Called once by the shell's `finishBoot`, when the preloader hands over to the page. */
export function markBootDone(): void {
  if (bootDone) return;
  bootDone = true;
  listeners.forEach((listener) => listener());
}

/** Non-reactive read, for code that runs outside render (effects, event handlers). */
export function isBootDone(): boolean {
  return bootDone;
}

/** `false` on the server and during hydration of the first load; `true` once the preloader has left. */
export function useBootDone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
