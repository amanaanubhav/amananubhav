/**
 * Date parts for the logbook timeline (§G.3 #experience): each part is shown as written in the entity's display
 * label and, where a machine date exists, wrapped in `<time dateTime>`.
 */
export interface DatePart {
  /** Display text, exactly as the entity writes it ("Jun 2026", "Late 2025", "Present"). */
  readonly text: string;
  /** ISO `yyyy-mm` or `yyyy`; undefined when the part is not a date ("Present"). */
  readonly dateTime?: string;
}

const RANGE_SEPARATOR = /\s+(?:—|–|-|to)\s+/;
const YEAR = /\b(19|20)\d{2}\b/g;

/**
 * Splits an experience entry's display label into a start and an end part.
 * `time` "Jun 2026 — Jul 2026", start "2026-06", end "2026-07" → [{Jun 2026, 2026-06}, {Jul 2026, 2026-07}].
 * A single label ("2024 · 6 months", "Present") stays one part, dated by `start` when it has one.
 */
export function experienceDates(time: string, start?: string, end?: string): readonly DatePart[] {
  const pieces = time.split(RANGE_SEPARATOR).map((piece) => piece.trim()).filter(Boolean);
  if (pieces.length >= 2) {
    const [from, to] = pieces as [string, string];
    return [
      { text: from, dateTime: start },
      { text: to, dateTime: to.toLowerCase() === 'present' ? undefined : end },
    ];
  }
  const only = pieces[0] ?? time;
  return [{ text: only, dateTime: only.toLowerCase() === 'present' ? undefined : start }];
}

/**
 * Date parts for an education row from its free-text year ("2027 (expected)", "2019 to 2023"):
 * every four-digit year becomes a `<time>`; the words around it are kept.
 */
export function educationDates(year: string | undefined): readonly DatePart[] {
  if (!year) return [];
  const pieces = year.split(RANGE_SEPARATOR).map((piece) => piece.trim()).filter(Boolean);
  return pieces.map((piece) => {
    const match = piece.match(YEAR);
    return { text: piece, dateTime: match?.[0] };
  });
}
