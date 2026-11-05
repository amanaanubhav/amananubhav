// lib/sky-commands.ts — the only coupling between Origin and the sky. No React, no engine import.
export type SkyCommand = 'preset' | 'tonight';
const EVENT = 'personal:sky-command';
let pending: { command: SkyCommand; at: number } | null = null;
/** A queued command older than this is stale (the visitor moved on before the sky loaded) and is dropped. */
const PENDING_TTL_MS = 8000;
/** Origin calls this ("Open this sky" → 'preset', the daylight readout link → 'tonight'). Queued until the sky mounts. */
export function requestSky(command: SkyCommand): void {
  pending = { command, at: Date.now() };
  window.dispatchEvent(new CustomEvent<SkyCommand>(EVENT, { detail: command }));
}
/** The sky subscribes once mounted; a command sent before it loaded is delivered at once. */
export function onSkyCommand(handler: (command: SkyCommand) => void): () => void {
  if (pending && Date.now() - pending.at < PENDING_TTL_MS) handler(pending.command);
  pending = null;
  const listener = (e: Event) => { pending = null; handler((e as CustomEvent<SkyCommand>).detail); };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
/** The sky plate left the page (client navigation): a command queued for it must not fire on a later visit. */
export function dropSkyCommand(): void {
  pending = null;
}
/** Warm the lazy chunk (focus or hover of "Look up"). */
export function prefetchSky(): void {
  window.dispatchEvent(new Event('personal:sky-prefetch'));
}
