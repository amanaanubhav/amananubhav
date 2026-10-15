export type TerminalLogSource = 'SYS' | 'AI' | 'USR';

export interface TerminalLogEntry {
  src: TerminalLogSource;
  msg: string;
}

export const INITIAL_TERMINAL_LOGS: readonly TerminalLogEntry[] = [
  { src: 'SYS', msg: "If System Offline? : Try 'help','about','clear'" },
  { src: 'AI', msg: "Terminal Ready. Accessing Aman Anubhav's digital consciousness. How can I assist?" },
];

/** Returns a copy of logs with the last entry replaced by `update(last)`. */
export function replaceLastLog(
  logs: readonly TerminalLogEntry[],
  update: (last: TerminalLogEntry) => TerminalLogEntry,
): TerminalLogEntry[] {
  const newLogs = [...logs];
  const lastIndex = newLogs.length - 1;
  const last = newLogs[lastIndex];
  if (last) newLogs[lastIndex] = update(last);
  return newLogs;
}
