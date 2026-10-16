'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface BackButtonProps {
  className?: string;
}

/** "Back" (history back, as before), 44 px tall, a text button with the signal underline (§B.10). */
export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`text-ui ${cn(
        'group/back mb-8 inline-flex h-11 items-center gap-2 rounded-control pr-2 font-body font-medium text-ink',
        'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal',
        className,
      )}`}
    >
      <ArrowLeft
        aria-hidden="true"
        focusable="false"
        className="size-[18px] shrink-0 transition-transform duration-hover ease-settle group-hover/back:-translate-x-0.5"
        strokeWidth={1.75}
      />
      <span className="underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover group-hover/back:decoration-2">
        Back
      </span>
    </button>
  );
}
