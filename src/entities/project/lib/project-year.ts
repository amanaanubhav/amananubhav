const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

/** "Dec 2025", "2024" or a bare "present" / "active", with an optional month prefix on the year. */
const DATED = /(?:\b([a-z]{3})[a-z]*\.?\s+)?(\d{4})\b/i;
const ONGOING = /\b(present|active)\b/i;

/** Sort key of a label we cannot place in time (blank, "Research Phase"). */
export const UNKNOWN_PROJECT_SORT_KEY = 0;

function monthFraction(prefix: string | undefined): number {
  if (!prefix) return 0;
  const index = MONTHS.indexOf(prefix.toLowerCase() as (typeof MONTHS)[number]);
  return index < 0 ? 0 : index / 12;
}

/**
 * Chronological sort key for a project's display year, keyed on when the build started:
 * - the first four-digit year in the label ("Dec 2025 - Apr 2026" -> Dec 2025, "2020 - Present" -> 2020),
 *   with a month prefix as a fraction so builds in the same year keep their order;
 * - a label with no year that reads "present" or "Active" (case-insensitive) -> the current month, so the
 *   builds still running sort as the newest;
 * - anything else (blank, "Research Phase") -> `UNKNOWN_PROJECT_SORT_KEY` (0), below every dated build.
 *
 * Higher is newer. With a plain `b - a` / `a - b` comparator unknown labels sort last for "newest" and
 * first for "oldest"; `compareProjectYears` keeps them last in both orders.
 */
export function getProjectSortKey(year: string, now: Date = new Date()): number {
  const dated = DATED.exec(year);
  if (dated?.[2]) return Number(dated[2]) + monthFraction(dated[1]);
  if (ONGOING.test(year)) return now.getFullYear() + now.getMonth() / 12;
  return UNKNOWN_PROJECT_SORT_KEY;
}

/**
 * Comparator for `Array.prototype.sort` over year labels: chronological in the given order, labels with no
 * known year last in both orders, ties left in data order (the sort is stable).
 */
export function compareProjectYears(a: string, b: string, order: 'newest' | 'oldest'): number {
  const keyA = getProjectSortKey(a);
  const keyB = getProjectSortKey(b);
  const unknownA = keyA === UNKNOWN_PROJECT_SORT_KEY;
  const unknownB = keyB === UNKNOWN_PROJECT_SORT_KEY;
  if (unknownA || unknownB) return Number(unknownA) - Number(unknownB);
  return order === 'newest' ? keyB - keyA : keyA - keyB;
}

/** Desktop year label: replaces only the first "20" with an apostrophe (legacy parity). */
export function formatProjectYearShort(year: string): string {
  return year.replace('20', "'");
}
