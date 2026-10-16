'use client';

import { useId } from 'react';
import { cn } from '@/shared/lib/cn';
import { useMediaQuery } from '@/shared/lib/dom';
import { useReducedMotionPreference } from '@/shared/lib/motion-tier';

/**
 * The "Reduce motion" switch (§C.4, §H.3). Turning it on drops the motion tier to 0 at once (no smooth
 * scroll, no canvas, static layouts); turning it off applies on the next reload, and the hint says so.
 */
export function ReduceMotionSwitch() {
  const [on, setOn] = useReducedMotionPreference();
  const systemReduces = useMediaQuery('(prefers-reduced-motion: reduce)');
  const hintId = useId();

  const hint = on
    ? 'Turning it off takes effect on the next reload.'
    : systemReduces
      ? 'Your system setting already reduces motion.'
      : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => setOn(!on)}
        className={cn(
          'group/switch inline-flex min-h-11 items-center gap-3 rounded-control text-ink',
          'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal',
        )}
      >
        <span className="font-body text-ui font-medium">Reduce motion</span>
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex h-6 w-10 shrink-0 items-center rounded-control border transition-colors duration-hover ease-settle',
            on ? 'border-ink bg-surface-2' : 'border-line-strong bg-transparent group-hover/switch:bg-surface-2',
            'forced-colors:border-[ButtonText]',
          )}
        >
          <span
            className={cn(
              'absolute left-[3px] top-[3px] size-4 rounded-control transition-[transform,background-color] duration-ui ease-settle',
              on ? 'translate-x-4 bg-signal' : 'translate-x-0 bg-ink-muted',
              'forced-colors:bg-[ButtonText]',
            )}
          />
        </span>
      </button>
      {hint ? (
        <p id={hintId} className="m-0 font-body text-caption italic text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
