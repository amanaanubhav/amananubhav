'use client';

import { RotateCcw } from 'lucide-react';
import { useDrawRegistry } from '../plates/draw-registry';

export interface DrawAgainButtonProps {
  /** The registry key of the plate to replay (`"<build id>:phone"` or `"<build id>:viewer"`). */
  drawKey: string;
  /** Visible label (`BUILD_NAV.drawAgain`). */
  label: string;
  /** Id of the build's h3, so the button reads as "Draw again, PAVANA". */
  describedBy?: string;
  /** Phones: icon only, a 44 px round bead at the end of the caption row (the label becomes its accessible name). */
  compact?: boolean;
}

/**
 * Draw again (FINAL §4.3.3): replays the plate's own draw sequence. Phones use the compact bead (review UX P1-3). It runs under reduced motion too, because the
 * person asked for it. Satin steel, 40 px (44 px on touch), with the shared press scale.
 */
export function DrawAgainButton({ drawKey, label, describedBy, compact = false }: DrawAgainButtonProps) {
  const registry = useDrawRegistry();
  if (compact)
    return (
      <button
        type="button"
        aria-label={label}
        aria-describedby={describedBy}
        onClick={() => registry?.get(drawKey)?.replay()}
        className="satin-steel grid size-11 shrink-0 place-items-center rounded-full border border-line-strong p-0 text-ink transition-transform duration-micro ease-settle active:scale-[0.95]"
      >
        <RotateCcw aria-hidden="true" size={18} strokeWidth={1.75} />
      </button>
    );
  return (
    <button
      type="button"
      aria-describedby={describedBy}
      onClick={() => registry?.get(drawKey)?.replay()}
      className="satin-steel inline-flex h-10 min-w-10 items-center gap-2 rounded-full border border-line-strong py-0 pl-3 pr-3.5 font-display text-[0.875rem] font-semibold text-ink transition-transform duration-micro ease-settle active:scale-[0.97] [@media(pointer:coarse)]:h-11"
    >
      <RotateCcw aria-hidden="true" size={16} strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  );
}
