import type { Project } from '@/entities/project';

const YEAR = /\d{4}/g;

export interface LedgerYear {
  /** Text for the Year column ("2025", "2025–2026", "2020–present", "Research phase"); '' when unknown. */
  label: string;
  /** First four-digit year in the label, for `<time dateTime>`; undefined when the label has none. */
  dateTime?: string;
}

/** Sentence case for the few word-only labels ("Research Phase" → "Research phase"). */
function sentenceCase(text: string): string {
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Compacts a project's display year for the ledger's Year column. Display only: sorting still runs through
 * `getProjectSortKey` inside `filterProjects`, unchanged.
 */
export function formatLedgerYear(year: string): LedgerYear {
  const trimmed = year.trim();
  if (!trimmed) return { label: '' };

  const years = trimmed.match(YEAR) ?? [];
  const start = years[0];
  if (!start) return { label: sentenceCase(trimmed) };

  const ongoing = /present/i.test(trimmed);
  const end = ongoing ? 'present' : years[1];
  if (!end || end === start) return { label: start, dateTime: start };
  return { label: `${start}–${end}`, dateTime: start };
}

export interface StackSplit {
  shown: string[];
  rest: string[];
}

/**
 * The Stack column shows about two lines of tools, then "+N" (§G.5). Items are taken in data order while the
 * joined text stays inside `budget` characters (about two lines of 14 px Plex Mono in the column); at least
 * one item is always shown.
 */
export function splitStack(tech: readonly string[], budget = 40): StackSplit {
  const shown: string[] = [];
  let length = 0;
  for (const item of tech) {
    const next = length + (shown.length > 0 ? 2 : 0) + item.length;
    if (shown.length > 0 && next > budget) break;
    shown.push(item);
    length = next;
  }
  return { shown, rest: tech.slice(shown.length) };
}

/** Earliest four-digit year across the archive, for the page log ("since 2020"). */
export function earliestProjectYear(projects: readonly Project[]): string | undefined {
  let earliest: number | undefined;
  for (const project of projects) {
    for (const match of project.year.match(YEAR) ?? []) {
      const value = Number(match);
      if (earliest === undefined || value < earliest) earliest = value;
    }
  }
  return earliest === undefined ? undefined : String(earliest);
}

/** "1 build" / "14 builds". */
export function buildCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'build' : 'builds'}`;
}
