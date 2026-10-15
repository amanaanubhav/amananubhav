'use client';

import type { ReactNode } from 'react';
import { useScrollReveal } from '@/shared/lib/scroll-reveal';

/**
 * Presets map 1:1 to the legacy per-file Reveal copies (class strings kept literal for Tailwind):
 * - archive:  ProjectArchive
 * - section:  AchievementsArchive, Achievements, TechStack
 * - timeline: Experience
 * - hero:     About, ProfessionalHero
 * - tilt:     Projects
 */
export type RevealPreset = 'archive' | 'section' | 'timeline' | 'hero' | 'tilt';

export interface RevealProps {
  children: ReactNode;
  preset: RevealPreset;
  delay?: number;
  className?: string;
}

const PRESET_CLASSES: Record<RevealPreset, { base: string; visible: string; hidden: string }> = {
  archive: {
    base: 'transition-all duration-500 transform',
    visible: 'opacity-100 translate-y-0',
    hidden: 'opacity-0 translate-y-4',
  },
  section: {
    base: 'transition-all duration-700 transform',
    visible: 'opacity-100 translate-y-0',
    hidden: 'opacity-0 translate-y-10',
  },
  timeline: {
    base: 'transition-all duration-700 transform',
    visible: 'opacity-100 translate-x-0',
    hidden: 'opacity-0 -translate-x-10',
  },
  hero: {
    base: 'transition-all duration-1000 transform',
    visible: 'opacity-100 translate-y-0',
    hidden: 'opacity-0 translate-y-10',
  },
  tilt: {
    base: 'transition-all duration-1000 ease-out transform perspective-1000',
    visible: 'opacity-100 translate-y-0 rotate-x-0',
    hidden: 'opacity-0 translate-y-12 rotate-x-6',
  },
};

export function Reveal({ children, preset, delay, className }: RevealProps) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  const p = PRESET_CLASSES[preset];
  const classes = `${p.base} ${isVisible ? p.visible : p.hidden}${className ? ` ${className}` : ''}`;

  return (
    <div
      ref={ref}
      style={delay === undefined ? undefined : { transitionDelay: `${delay}ms` }}
      className={classes}
    >
      {children}
    </div>
  );
}
