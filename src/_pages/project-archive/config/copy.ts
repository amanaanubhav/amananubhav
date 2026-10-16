/** [S-CH6-BUILDS] and the §G.5 interface copy for /project-archive (§I.7). */
export const ARCHIVE_COPY = {
  headline: 'The full record, early experiments included.',
  body: "The professional page shows the projects I'd hand a hiring manager. This is everything: production systems, hackathon builds, research I'm still curious about, and the school-age inventions that got me started. Filter by year, stack or type.",
  searchLabel: 'Search builds',
  searchPlaceholder: 'Search builds',
  typeLabel: 'Type',
  allTypes: 'All types',
  sortNewest: 'Newest first',
  sortOldest: 'Oldest first',
  filters: 'Filters',
  clearSearch: 'Clear search',
  logLabel: 'Archive log',
  columns: {
    glyph: 'Glyph',
    year: 'Year',
    build: 'Build',
    what: 'What it is',
    stack: 'Stack',
    tag: 'Tag',
    links: 'Links',
  },
} as const;

export function emptyMessage(query: string): string {
  return query ? `No builds match "${query}".` : 'No builds of this type.';
}
