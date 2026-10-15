'use client';

import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { useTheme } from '@/shared/lib/theme';
import { BackgroundRippleEffect } from '@/shared/ui/background-ripple-effect';

import { ResumeButton } from './ResumeButton';

export function HeroSection() {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      className={cn(
        'relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black text-white',
        isDark ? 'bg-black text-white' : 'bg-white text-black',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Ripple Effect - Replaces Wireframe/Tunnel */}
      <div className="absolute inset-0 z-0">
        <BackgroundRippleEffect rows={24} cols={50} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none select-none space-y-6 md:space-y-8">
        <div className="relative flex items-center justify-center pointer-events-auto cursor-default z-20">
          <span className="absolute -left-12 md:-left-24 top-1/2 -translate-y-1/2 text-4xl md:text-6xl font-light text-neutral-500 transition-opacity duration-300 hover:text-white/80">
            {'>_'}
          </span>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase font-cyber text-center group">
            {/* AMAN ANUBHAV */}
            <span
              className="inline-block transition-all duration-300 ease-out"
              style={{
                textShadow: isHovered
                  ? isDark
                    ? '0 0 2px rgba(99,102,241,0.4), 0 0 12px rgba(99,102,241,0.3)' // Dark Hover: Indigo Glow
                    : '0 0 2px rgba(99,102,241,0.3), 0 0 10px rgba(99,102,241,0.2)' // Light Hover
                  : 'none',
              }}
            >
              AMAN  ANUBHAV
            </span>
          </h1>
        </div>

        {/* Subtitle - Negative margin to compensate for tracking space */}
        <h2 className="text-lg md:text-2xl font-light tracking-[0.3em] md:tracking-[0.5em] uppercase opacity-70 text-center -mr-[0.3em] md:-mr-[0.5em] pointer-events-auto transition-all duration-300 hover:opacity-100 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          ENGINEER <span className="mx-4 md:mx-8">ATHLETE</span>
        </h2>

        {/* Resume Button */}
        <div className="pt-7 md:pt-11 relative z-30 pointer-events-auto">
          <ResumeButton />
        </div>
      </div>
    </section>
  );
}
