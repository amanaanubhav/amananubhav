/**
 * Sort key used by the project archive. Ported verbatim from the legacy
 * ProjectArchive sort, including the parseInt NaN -> 0 fallback for labels
 * such as "Dec 2025 - Apr 2026" and "Research Phase".
 */
export function getProjectSortKey(year: string): number {
  if (year === 'Active') return 10000;
  if (year.includes('Present')) return 9999;
  return parseInt(year.split('-')[0] ?? '', 10) || 0;
}

/** Desktop year label: replaces only the first "20" with an apostrophe (legacy parity). */
export function formatProjectYearShort(year: string): string {
  return year.replace('20', "'");
}
