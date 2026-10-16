export type TerminalLogSource = 'SYS' | 'AI' | 'USR';

export interface TerminalLogEntry {
  src: TerminalLogSource;
  msg: string;
}

export const INITIAL_TERMINAL_LOGS: readonly TerminalLogEntry[] = [
  { src: 'SYS', msg: "Live model with an offline cache. Try 'help', 'projects', 'treks' or 'remote'." },
  { src: 'AI', msg: "Hi, I'm Aman. Ask me about my work, my treks, or how I work remotely." },
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
