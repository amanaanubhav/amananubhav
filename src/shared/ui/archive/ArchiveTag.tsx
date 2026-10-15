import type { ReactNode } from 'react';

export interface ArchiveTagProps {
  children: ReactNode;
  /** Theme border class supplied by the caller: "border-zinc-800" (dark) or "border-zinc-200" (light). */
  className?: string;
}

export function ArchiveTag({ children, className = '' }: ArchiveTagProps) {
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm opacity-60 group-hover:opacity-90 transition-opacity ${className}`}>
      {children}
    </span>
  );
}
