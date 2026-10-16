export type TerminalLogSource = 'SYS' | 'AI' | 'USR';

export interface TerminalLogEntry {
  src: TerminalLogSource;
  msg: string;
}

/**
 * The log starts empty: the UI shows the greeting below as its empty state (also after `clear`),
 * so the conversation itself opens with the visitor's first question.
 */
export const INITIAL_TERMINAL_LOGS: readonly TerminalLogEntry[] = [];

/** The empty state of the terminal (no question asked yet). */
export const TERMINAL_GREETING = {
  title: "Hi, I'm Aman.",
  line: "Ask me about the AI products I build, the passes I've walked alone, or how I work from anywhere.",
} as const;

/** Prefixed once to the first reply of each offline stretch (§I.3 wording). */
export const OFFLINE_NOTICE = 'Connection lost. Answering from my offline notes.';

/** When even the offline notes could not load (offline before they were ever cached). */
export const OFFLINE_NOTES_UNAVAILABLE =
  "My offline notes didn't load either. Email me at amannbhv.cswork@gmail.com, or try again once you're back online.";

/** The server's per-visitor rate limit (429): this one question is answered offline, the next goes live. */
export const RATE_LIMITED_NOTICE = 'Too many questions at once. Answering this one from my offline notes.';

/** The request body was over the server's cap (413); the input box caps visitors at TERMINAL_INPUT_MAX_CHARS. */
export const TOO_LONG_REPLY =
  "That's more than I can read here. Keep it under 1,000 characters, or email me at amannbhv.cswork@gmail.com.";

/** Matches the server's per-question cap (guardrails LIMITS.maxMessageChars). */
export const TERMINAL_INPUT_MAX_CHARS = 1_000;

export const BACK_ONLINE_NOTICE = "Connection back. I'm answering live again.";

export const EXIT_REPLY = 'Closing the terminal. Your log stays here for next time.';

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
