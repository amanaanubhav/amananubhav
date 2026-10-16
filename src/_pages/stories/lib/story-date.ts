const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * A machine-readable `<time dateTime>` for a story's display date: "2026" -> "2026",
 * "Nov 2025" -> "2025-11". Labels such as "2020 to present" or "Research phase" return undefined
 * (no <time> renders for them).
 */
export function storyDateTime(label: string): string | undefined {
  const text = label.trim();
  if (/^\d{4}$/.test(text)) return text;
  const match = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(text);
  if (!match) return undefined;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  if (month === -1) return undefined;
  return `${match[2]}-${String(month + 1).padStart(2, '0')}`;
}
