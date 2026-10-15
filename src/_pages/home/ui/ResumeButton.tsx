'use client';

import { SITE } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { StatefulButton } from '@/shared/ui/stateful-button';

export function ResumeButton() {
  return (
    <StatefulButton
      onClick={() =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            window.open(SITE.resumeDriveUrl, '_blank');
            resolve();
          }, 2000);
        })
      }
      className={cn(
        // Base styling - Pill shape with gradient glow
        'group relative px-6 py-3 rounded-full text-sm font-medium tracking-wide',
        'min-w-[180px] overflow-hidden',
        // Background & Border
        'bg-zinc-900/80 backdrop-blur-md',
        'border border-zinc-700/50',
        // Text
        'text-zinc-100',
        // Glow effect on hover
        'shadow-[0_0_0_1px_rgba(56,189,248,0.1)]',
        'hover:shadow-[0_0_20px_rgba(56,189,248,0.3),0_0_40px_rgba(56,189,248,0.1)]',
        'hover:border-cyan-500/50',
        // Transition
        'transition-all duration-500 ease-out',
        // Ring for focus
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-black',
      )}
    >
      {/* Gradient overlay on hover */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Button content with arrow */}
      <span className="relative flex items-center justify-center gap-3">
        <span className="font-cyber justify-center tracking-[0.2em] text-zinc-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          RESUME
        </span>
        <svg
          className="w-4 h-4 text-zinc-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </StatefulButton>
  );
}
