'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface BackButtonProps {
  className?: string;
}

/** "Back" (history back, as before), 44 px tall, a text button with the link underline (action-line, action on hover and focus; §B.10, §11). */
export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`text-ui ${cn(
        'group/back mb-8 inline-flex h-11 items-center gap-2 rounded-control pr-2 font-body font-medium text-link-ink',
        className,
      )}`}
    >
      <ArrowLeft
        aria-hidden="true"
        focusable="false"
        className="size-[18px] shrink-0 transition-transform duration-hover ease-settle group-hover/back:-translate-x-0.5"
        strokeWidth={1.75}
      />
      <span className="underline decoration-link-underline decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover group-hover/back:decoration-2 group-hover/back:decoration-action group-focus-visible/back:decoration-2 group-focus-visible/back:decoration-action">
        Back
      </span>
    </button>
  );
}
