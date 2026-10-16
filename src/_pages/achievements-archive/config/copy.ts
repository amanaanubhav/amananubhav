/** [S-CH7-PROOF] and the §G.6 interface copy for /achievements (§I.7). */
export const HONORS_COPY = {
  headline: 'Wins, with the context that makes them mean something.',
  body: 'Awards are a lagging signal; the work came first. Each one below says what it was for and what I built to earn it.',
  searchLabel: 'Search honors',
  searchPlaceholder: 'Search honors',
  clearSearch: 'Clear search',
  logLabel: 'Register log',
  entryLogLabel: 'Year and organisation',
  ungrouped: 'More honors',
} as const;

export function emptyHonorsMessage(query: string): string {
  return `No honors match "${query}".`;
}
