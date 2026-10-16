import type { AsyncChecklistLine } from '../config/remote';

/** The checklist lines that may ship (Q-23): confirmed and with real text. Empty means the spread is omitted. */
export function confirmedChecklist(lines: readonly AsyncChecklistLine[]): readonly string[] {
  return lines.flatMap((line) => (line.confirmed && line.text ? [line.text] : []));
}
