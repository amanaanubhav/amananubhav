import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';

import type { CSSVars } from '@/shared/lib/css';

/**
 * Input states of §B.10 (rest, hover, focus, disabled, invalid via the global aria-invalid rule). Night sets the
 * field a step lighter than the sheet (surface-2); Day keeps the bright paper (surface) so a resting field never
 * reads as the sage disabled fill.
 */
export const VAULT_INPUT_CLASS =
  'h-11 w-full rounded-control border border-line-strong bg-surface-2 [html[data-theme=day]_&]:bg-surface ' +
  'px-3 font-body text-[16px] text-ink ' +
  'placeholder:text-placeholder transition-colors duration-hover hover:border-ink-muted focus:border-action ' +
  'focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:border-disabled-edge disabled:bg-disabled-fill ' +
  'disabled:text-disabled-ink [html[data-theme=day]_&]:disabled:bg-disabled-fill';

export interface VaultFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> {
  label: string;
  /** Muted note after the label, e.g. "optional". */
  hint?: string;
  /** Id of a message (usually the form error) this field is described by. */
  describedBy?: string;
}

/** A labelled vault input: visible label above, 44 px field. */
export function VaultField({ label, hint, describedBy, ...input }: VaultFieldProps) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-body text-ui font-medium text-ink">
        {label}
        {hint ? <span className="font-normal italic text-ink-muted"> ({hint})</span> : null}
      </label>
      <input id={id} aria-describedby={describedBy} className={VAULT_INPUT_CLASS} {...input} />
    </div>
  );
}

/**
 * Inline form error: icon plus text, never color alone (§B.1 rule 4). Like its success and warning siblings the
 * status colour sits on the icon and the 14 px message is ink (status text needs 16 px, or 14 px at 600+).
 */
export function VaultError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-2 font-body text-caption font-medium text-ink">
      <CircleX aria-hidden="true" focusable="false" className="mt-0.5 size-4 shrink-0 text-error" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}

/** Inline success note. */
export function VaultSuccess({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 font-body text-caption text-ink">
      <CircleCheck aria-hidden="true" focusable="false" className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}

/** Inline warning note (never placed directly against a signal element). */
export function VaultWarning({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 font-body text-caption text-ink">
      <TriangleAlert aria-hidden="true" focusable="false" className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}

/**
 * The scrollable body of a form view; scrolls natively under Lenis (§C.3). A flex column, so a form view centres
 * itself with `my-auto`: auto margins fall to zero once the content is taller than the pane, so centring never
 * pushes the top out of reach (safe centring, O-01). Views without `my-auto` stay top-aligned.
 */
export function VaultScrollPane({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      data-lenis-prevent=""
      role={label ? 'region' : undefined}
      aria-label={label}
      className="scroll-pane flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
    >
      {children}
    </div>
  );
}

/** Archivo at wdth 104 for panel titles (§B.4.2, large h3). */
export const PANEL_TITLE_STYLE: CSSVars = { '--wdth': 104 };
