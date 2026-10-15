'use client';

import { motion, type MotionValue } from 'motion/react';

import type { MeanderNode } from '../../lib/meander-geometry';

/* ═══════════════════════════════════════
   LAYER 8: SVG MEANDER LINE
   ═══════════════════════════════════════ */
export interface MeanderPathProps {
  d: string;
  nodes: readonly MeanderNode[];
  activeIndex: number;
  isDark: boolean;
  litPathOffset: MotionValue<number>;
  dotDashOffset: MotionValue<number>;
  dotVisibility: MotionValue<number>;
}

export function MeanderPath({
  d: meanderPath,
  nodes,
  activeIndex,
  isDark,
  litPathOffset,
  dotDashOffset,
  dotVisibility,
}: MeanderPathProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          {/* Gradient for the lit path */}
          <linearGradient id="meanderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#06b6d4' : '#71717a'} />
            <stop offset="50%" stopColor={isDark ? '#8b5cf6' : '#a1a1aa'} />
            <stop offset="100%" stopColor={isDark ? '#ec4899' : '#71717a'} />
          </linearGradient>

          {/* Glow filter for path */}
          <filter id="pathGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense glow for the dot */}
          <filter id="dotGlow" x="-500%" y="-500%" width="1100%" height="1100%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur3" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur3" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow for active nodes */}
          <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </filter>
        </defs>

        {/* 1. Ghost base path — barely visible track */}
        <path
          d={meanderPath}
          fill="none"
          stroke={isDark ? 'rgba(6,182,212,0.06)' : 'rgba(0,0,0,0.04)'}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* 2. Lit gradient path — reveals on scroll */}
        <motion.path
          d={meanderPath}
          fill="none"
          stroke="url(#meanderGradient)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          filter={isDark ? 'url(#pathGlow)' : undefined}
          style={{
            strokeDashoffset: litPathOffset,
            opacity: isDark ? 0.6 : 0.3,
          }}
        />

        {/* 3. Wide glow halo around dot */}
        <motion.path
          d={meanderPath}
          fill="none"
          stroke={isDark ? '#06b6d4' : 'rgba(0,0,0,0.2)'}
          strokeWidth="6"
          vectorEffect="non-scaling-stroke"
          pathLength="1"
          strokeDasharray="0.02 1"
          filter="url(#dotGlow)"
          style={{
            strokeDashoffset: dotDashOffset,
            opacity: dotVisibility,
          }}
        />

        {/* 4. Core bright dot */}
        <motion.path
          d={meanderPath}
          fill="none"
          stroke={isDark ? '#ffffff' : '#000000'}
          strokeWidth="5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength="1"
          strokeDasharray="0.008 1"
          filter={isDark ? 'url(#dotGlow)' : 'url(#pathGlow)'}
          style={{
            strokeDashoffset: dotDashOffset,
            opacity: dotVisibility,
          }}
        />

        {/* 5. Node indicators — warp points */}
        {nodes.map((pos, i) => (
          <g key={i}>
            {/* Outer glow ring (active only) */}
            {activeIndex >= i && isDark && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r="0.8"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="0.15"
                filter="url(#nodeGlow)"
                style={{
                  opacity: activeIndex === i ? 0.8 : 0.3,
                  transition: 'opacity 0.5s ease',
                }}
              />
            )}
            {/* Core dot */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="0.3"
              fill={
                isDark
                  ? activeIndex >= i
                    ? '#22d3ee'
                    : 'rgba(6,182,212,0.15)'
                  : activeIndex >= i
                    ? '#52525b'
                    : '#d4d4d8'
              }
              style={{ transition: 'fill 0.5s ease' }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
