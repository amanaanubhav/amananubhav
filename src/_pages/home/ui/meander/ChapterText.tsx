'use client';

import { motion } from 'motion/react';

import type { StoryPoint } from '../../config/meander';

/* ─────────────────────────────────────────────
   CHAPTER TEXT COMPONENT
   Positioned entirely on LEFT or RIGHT half,
   never crossing the center meander line.
   ───────────────────────────────────────────── */
export interface ChapterTextProps {
  point: StoryPoint;
  index: number;
  isDark: boolean;
}

export function ChapterText({ point, index, isDark }: ChapterTextProps) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -40, filter: 'blur(6px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute top-1/2 -translate-y-1/2 w-[40%] px-8 md:px-12 ${isLeft ? 'left-0 text-left' : 'right-0 text-right'
        }`}
    >
      {/* Chapter Number — Holographic gradient */}
      <motion.span
        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
        animate={{ opacity: 0.25, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`block text-[8rem] md:text-[12rem] font-serif font-black leading-none absolute -top-16 md:-top-24 ${isLeft ? '-left-2' : '-right-2'} pointer-events-none select-none`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)'
            : 'linear-gradient(135deg, #d4d4d8 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </motion.span>

      {/* Subtitle — with scan-line entrance */}
      <motion.p
        initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-xs font-cyber tracking-[0.5em] uppercase mb-5 relative z-10"
        style={{ color: isDark ? '#22d3ee' : '#71717a' }}
      >
        {point.subtitle}
      </motion.p>

      {/* Scan line that sweeps on chapter enter */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`h-px mb-6 origin-left ${isDark ? 'bg-gradient-to-r from-cyan-500/60 via-violet-500/30 to-transparent' : 'bg-gradient-to-r from-zinc-400/60 to-transparent'}`}
        style={{ transformOrigin: isLeft ? 'left' : 'right' }}
      />

      {/* Title — Gradient text */}
      <motion.h3
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tight leading-[0.95] mb-6 relative z-10"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, #ffffff 30%, #06b6d4 100%)'
            : 'linear-gradient(180deg, #18181b 30%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {point.title}
      </motion.h3>

      {/* Description — staggered reveal */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className={`text-base md:text-lg font-sans leading-relaxed relative z-10 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
      >
        {point.description}
      </motion.p>
    </motion.div>
  );
}
