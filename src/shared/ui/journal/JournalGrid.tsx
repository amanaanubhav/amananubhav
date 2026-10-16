import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface JournalGridProps {
  as?: 'div' | 'section' | 'article' | 'header' | 'footer';
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * The journal grid (§B.5): 4 / 8 / 12 columns with named lines `full-start`, `content-start`, `content-end`,
 * `full-end`. Content column n is grid track n + 1. The column template lives in `.journal-grid` (globals.css).
 */
export function JournalGrid({ as: Tag = 'div', id, className, children }: JournalGridProps) {
  return (
    <Tag id={id} className={cn('journal-grid', className)}>
      {children}
    </Tag>
  );
}
