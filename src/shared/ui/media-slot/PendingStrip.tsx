import { cn } from '@/shared/lib/cn';

export interface PendingStripProps {
  /** "Photo to come", "Screens to come" or "Clip to come". */
  label: string;
  /** What belongs there: the registry's `short`, or the caller's `captionText`. */
  subject: string;
  /** "Plate N", only where the plate sequence is real. */
  number?: number;
  className?: string;
}

/**
 * A needed photo that is not here yet, as production shows it in a spread's plate column (C-05, SYS-7): one line
 * naming what belongs there, set like a log row (the key in Literata italic ink-muted, the value in ink) on a
 * surface-2 tone step, the pending plate's own ground collapsed to a line. No aspect box, border or drawing.
 * It hugs its text, wraps in a narrow column and never truncates.
 */
export function PendingStrip({ label, subject, number, className }: PendingStripProps) {
  // text-caption stays outside cn(), like every type-scale class in shared/ui.
  return (
    <p
      className={`text-caption ${cn(
        'm-0 w-fit max-w-full bg-surface-2 px-3 py-2 font-body text-ink [text-wrap:pretty]',
        className,
      )}`}
    >
      {number !== undefined ? (
        <span className="mr-2 font-data [font-variant-numeric:tabular-nums_slashed-zero]">Plate {number}</span>
      ) : null}
      <span className="italic text-ink-muted">{label}:</span> {subject}
    </p>
  );
}
