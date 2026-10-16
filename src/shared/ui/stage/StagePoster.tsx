import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface StagePosterProps {
  children: ReactNode;
  className?: string;
}

/**
 * The SSR poster inside a stage slot: a complete SVG plate, visible until the scene sets
 * `data-stage-live` on the slot (it then fades out in 400 ms, globals.css). Decorative: the
 * slot's own description and the page DOM carry every fact.
 */
export function StagePoster({ children, className }: StagePosterProps) {
  return (
    <div aria-hidden="true" className={cn('stage-poster pointer-events-none absolute inset-0', className)}>
      {children}
    </div>
  );
}
