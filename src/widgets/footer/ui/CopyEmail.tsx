'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import styles from './Footer.module.css';

type CopyState = 'idle' | 'copied' | 'failed';

const RESET_AFTER_MS = 2000;

/**
 * "Copy email" (§H.3): Clipboard API; the label reads "Copied" for 2 s and a polite live region
 * announces the result once. If the clipboard is unavailable it says so and names the address.
 */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    let next: CopyState = 'failed';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        next = 'copied';
      }
    } catch {
      next = 'failed';
    }
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), RESET_AFTER_MS);
  };

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : 'Copy email';
  const announcement =
    state === 'copied'
      ? 'Email address copied.'
      : state === 'failed'
        ? `Couldn't copy. The address is ${email}.`
        : '';

  const Icon = state === 'copied' ? Check : Copy;

  return (
    <>
      <button type="button" onClick={copy} className={cn(styles.line, styles.textAction)}>
        <Icon aria-hidden="true" focusable="false" className="size-4 shrink-0" strokeWidth={1.75} />
        <span className={styles.lineText}>{label}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
