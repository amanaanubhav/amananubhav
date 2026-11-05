'use client';

import { useState, type FormEvent } from 'react';
import { clsx } from 'clsx';
import { SKY_UI } from '../../config/content';
import type { SkyFound } from '../../lib/sky-engine';

export interface SkyFindProps {
  find: (query: string) => SkyFound[];
  selectedId: string | null;
  onPick: (id: string) => void;
}

/**
 * Find (FINAL-DESIGN §4.2.1): a prefix search over stars, planets and constellations, 44 px, the results as buttons
 * below; Enter selects the first. A separate status line speaks the count and the first match (not the whole list on
 * every keystroke).
 */
export function SkyFind({ find, selectedId, onPick }: SkyFindProps) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? find(query) : [];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (results[0]) onPick(results[0].id);
  };

  return (
    <form role="search" onSubmit={onSubmit} className="grid gap-2">
      <label htmlFor="sky-find" className="font-display text-ui font-semibold text-ink">
        {SKY_UI.find}
      </label>
      <input
        id="sky-find"
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={SKY_UI.findPlaceholder}
        className="h-11 w-full rounded-control border border-line-strong bg-surface px-3.5 font-body text-ui text-ink placeholder:text-placeholder focus-visible:outline-offset-1"
      />
      <p role="status" className="sr-only">
        {query.trim() ? (results.length ? SKY_UI.findStatus(results.length, results[0].name) : SKY_UI.findNone) : ''}
      </p>
      <ul className="m-0 grid list-none gap-0.5 p-0 empty:hidden">
        {query.trim() && results.length === 0 ? (
          <li className="font-body text-caption text-ink-muted">{SKY_UI.findNone}</li>
        ) : (
          results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={r.id === selectedId}
                onClick={() => onPick(r.id)}
                className={clsx(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-control px-2.5 py-1.5 text-left transition-[background-color,transform] duration-micro',
                  'hover:bg-[var(--hover-wash)] active:scale-[0.98] active:bg-[var(--press-wash)] motion-reduce:active:scale-100 [@media(pointer:coarse)]:min-h-11',
                  'aria-pressed:bg-action-soft aria-pressed:shadow-[inset_2px_0_0_var(--action)]',
                )}
              >
                <span className="font-display text-ui font-semibold text-ink">{r.name}</span>
                <span className="font-body text-caption text-ink-muted">{r.kind}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </form>
  );
}
