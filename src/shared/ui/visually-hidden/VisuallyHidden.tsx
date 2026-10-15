import type { ReactNode } from 'react';

export interface VisuallyHiddenProps {
  children: ReactNode;
  as?: 'span' | 'div';
}

/** Content for assistive technology only: removed visually, kept in the accessibility tree. */
export function VisuallyHidden({ children, as: Tag = 'span' }: VisuallyHiddenProps) {
  return <Tag className="sr-only">{children}</Tag>;
}
