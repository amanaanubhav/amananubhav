'use client';

import type { JSX } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { getStoryLogLabel, storyLayoutIds, type Story } from '@/entities/story';
import { openStory } from '@/features/read-story';
import { useTheme } from '@/shared/lib/theme';
import type { CSSVars } from '@/shared/lib/css';

interface MechanicalCardProps {
  story: Story;
  index: number;
}

// --- 1. Reusable Card Component ---
export function MechanicalCard({ story, index }: MechanicalCardProps): JSX.Element {
  const { isDark } = useTheme();
  const layoutIds = storyLayoutIds(story.id);

  const surfaceStyle: CSSVars = {
    backgroundColor: 'rgba(var(--card-bg-rgb), var(--card-opacity))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderColor: 'var(--border-subtle)',
    boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '--card-opacity': 0.3,
  };

  return (
    <div
      className="blog-card absolute left-0 right-0 mx-auto w-full max-w-5xl px-4 md:px-0 h-[60vh] flex items-center justify-center will-change-transform"
      style={{
        zIndex: index + 1,
        top: `${15 + (index * 4)}%`, // Stacking offset
        visibility: 'hidden',
      }}
    >
      <div
        onClick={() => openStory(story)}
        className="card-surface relative w-full h-full rounded-lg overflow-hidden border cursor-pointer group shadow-2xl transition-all duration-500"
        style={surfaceStyle}
      >
        <div className="absolute inset-0 flex flex-col md:flex-row">
          {/* Visual Half */}
          <div className="w-full md:w-7/12 h-1/2 md:h-full relative overflow-hidden bg-black flex-shrink-0">
            <motion.div layoutId={layoutIds.container} className="w-full h-full">
              <motion.img
                layoutId={layoutIds.image}
                src={story.coverImage}
                alt={story.title}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              />
            </motion.div>
            <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-black/80 via-transparent to-transparent' : 'from-white/20 via-transparent to-transparent'}`} />
          </div>

          {/* Data Half - Layout & Text Stability Fixes */}
          <div className="w-full md:w-5/12 h-1/2 md:h-full p-8 md:p-12 flex flex-col justify-between relative z-10 overflow-hidden">
            <div className="flex flex-col gap-4 min-h-0">
              <div className="flex items-center gap-3 shrink-0">
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-green-500' : 'bg-zinc-800'} animate-pulse`} />
                <span className="text-[10px] font-cyber tracking-[0.2em] uppercase" style={{ color: 'var(--text-secondary)' }}>
                  {getStoryLogLabel(story.id)}
                </span>
              </div>
              <div className="shrink-0">
                <motion.h3
                  layoutId={layoutIds.title}
                  className="text-3xl md:text-4xl font-bold leading-tight mb-2 line-clamp-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {story.title}
                </motion.h3>
                <p className="text-sm md:text-base leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                  {story.subtitle}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={12} /> {story.date}
              </span>
              <button className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-green-500' : 'text-zinc-900'}`}>
                Decrypt <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
