'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface VaultHelpProps {
  /** Trailing controls of the bar (the close button). */
  children?: ReactNode;
}

/**
 * The vault's top bar with the "How this works" disclosure (§H.7): a real button with
 * `aria-expanded`, not a hover tooltip, and only claims the code actually makes.
 */
export function VaultHelp({ children }: VaultHelpProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="shrink-0 border-b border-line">
      <div className="flex h-14 items-center gap-3 pl-5 pr-2 sm:pl-8">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={
            'inline-flex min-h-6 items-center gap-1.5 rounded-control font-body text-ui text-ink underline ' +
            'decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] ' +
            'duration-hover hover:decoration-2 [@media(pointer:coarse)]:min-h-11'
          }
        >
          How this works
          <ChevronDown
            aria-hidden="true"
            focusable="false"
            strokeWidth={1.75}
            className={`size-4 shrink-0 transition-transform duration-ui ease-settle ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="ml-auto flex items-center">{children}</div>
      </div>
      <div id={panelId} hidden={!open} className="px-5 pb-5 sm:px-8">
        <p className="max-w-measure font-body text-caption text-ink-muted [text-wrap:pretty]">
          Messages are encrypted in your browser with AES-GCM (256-bit) and chained so tampering is detectable. Your
          passphrase never leaves your device and cannot be recovered.
        </p>
      </div>
    </div>
  );
}
