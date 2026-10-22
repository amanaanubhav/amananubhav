import { useSyncExternalStore } from 'react';

/**
 * The first-load boot (§D.4, docs/redesign/preloader/design.md §4.2). The curtain is not React: the pre-paint
 * gate sets html[data-boot=run] on the first hard load of a session, and the climb script moves it to `exit`
 * and `done` (also announced as `aa:boot` events). This store mirrors that, as module state, so it survives
 * client navigations: after the first boot every later page mounts with boot done. A load without the
 * curtain (a reload in the session, no JS for the gate, /admin) is done from the start.
 */
export type BootPhase = 'run' | 'exit' | 'done';

const listeners = new Set<() => void>();

function readPhase(): BootPhase {
  const value = document.documentElement.getAttribute('data-boot');
  return value === 'run' || value === 'exit' ? value : 'done';
}

let phase: BootPhase = typeof document === 'undefined' ? 'run' : readPhase();
/** Done from the curtain's exit on: page entrances play while the land falls away. */
let bootDone = phase !== 'run';

function setPhase(next: BootPhase): void {
  if (next === phase || phase === 'done') return;
  phase = next;
  bootDone = true;
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('aa:boot', (event) => {
    const next = (event as CustomEvent<{ phase?: string }>).detail?.phase;
    if (next === 'exit' || next === 'done') setPhase(next);
  });
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const getSnapshot = () => bootDone;
const getServerSnapshot = () => false;
const getPhaseSnapshot = () => phase;
/** The server cannot know whether the curtain will run; it renders the page as booted (the curtain covers it). */
const getServerPhase = (): BootPhase => 'done';

/** Non-reactive read, for code that runs outside render (effects, event handlers, frame loops). */
export function isBootDone(): boolean {
  return bootDone;
}

/** `false` on the server and during hydration of the first load; `true` once the curtain is leaving or absent. */
export function useBootDone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The curtain's phase; `'done'` on the server and during hydration (the SSR markup is the booted page). */
export function useBootPhase(): BootPhase {
  return useSyncExternalStore(subscribe, getPhaseSnapshot, getServerPhase);
}

type BootWindow = Window & { __aaBoot?: { ready(key: string): void } | null; __aaBootQ?: string[] | null };

/**
 * Reports one readiness key to the curtain (`app`, `stage`; it waits for the fonts itself). Before the climb
 * script has arrived the key is queued for it; when no curtain runs this does nothing.
 */
export function signalBootReady(key: 'app' | 'stage'): void {
  if (phase !== 'run') return;
  const w = window as BootWindow;
  if (w.__aaBoot) w.__aaBoot.ready(key);
  else if (w.__aaBootQ !== null) (w.__aaBootQ ??= []).push(key);
}
