'use client';

import { useId, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Width classes for the input, e.g. "w-32" or "w-40 md:w-64". */
  className?: string;
  /** Visible to screen readers only; without it the placeholder names the field. */
  label?: string;
  id?: string;
}

/** Archive search (§D.3, §B.10 input states): `type="search"`, 44 px, a clear button once filled. */
export function SearchField({ value, onChange, placeholder, className, label, id }: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        'group/search relative inline-flex h-11 items-center gap-2 rounded-control border border-line-strong bg-surface-2 pl-3 text-ink',
        'transition-[border-color] duration-hover hover:border-ink-muted',
        'focus-within:border-signal focus-within:[outline-style:solid] focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-signal',
      )}
    >
      {label ? (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      ) : null}
      <Search aria-hidden="true" focusable="false" className="size-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label ? undefined : placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            onChange('');
          }
        }}
        className={`text-ui ${cn(
          'h-full min-w-0 bg-transparent font-body text-ink placeholder:text-ink-muted',
          'outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none',
          value ? 'pr-1' : 'pr-3',
          className,
        )}`}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="mr-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-hover hover:bg-surface hover:text-ink focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal"
        >
          <X aria-hidden="true" focusable="false" className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}
