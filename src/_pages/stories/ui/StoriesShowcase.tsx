'use client';

import { useRef, useState, type JSX } from 'react';
import { ChevronUp, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { STORIES, getFeaturedStories } from '@/entities/story';
import { useScrollToTopOnMount } from '@/shared/lib/dom';
import { useStackedCardsTimeline } from '../lib/use-stacked-cards-timeline';
import { useStoryFilters } from '../model/use-story-filters';
import { ArchiveDrawer } from './ArchiveDrawer';
import { MechanicalCard } from './MechanicalCard';

const FEATURED_STORIES = getFeaturedStories(STORIES, 3);

// --- 2. Main Section Component ---
export function StoriesShowcase(): JSX.Element {
  useScrollToTopOnMount();

  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const archiveRef = useRef<HTMLDivElement>(null);

  const [showArchive, setShowArchive] = useState(false);
  const filters = useStoryFilters();

  useStackedCardsTimeline(sectionRef, triggerRef, ctaRef);

  const handleOpenArchive = (): void => {
    if (!showArchive) {
      setShowArchive(true);
      setTimeout(() => {
        // Smoothly scroll to the archive section after state update
        archiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      setShowArchive(false); // Toggle close
    }
  };

  return (
    <section ref={sectionRef} id="adventures" className="relative w-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* ScrollTrigger Track */}
      <div ref={triggerRef} className="h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(var(--text-secondary) 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
        />

        {/* Static Header */}
        <div className="absolute top-20 left-4 md:left-20 z-0">
          <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
            <Sparkles size={14} />
            <span className="text-[10px] font-cyber tracking-[0.3em] uppercase">Archives</span>
          </div>
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase opacity-20" style={{ color: 'var(--text-secondary)' }}>
            DATA<br />LOGS
          </h2>
        </div>

        {/* Revealed Cards */}
        <div className="relative w-full h-full max-w-7xl mx-auto z-10 perspective-[2000px]">
          {FEATURED_STORIES.map((story, index) => (
            <MechanicalCard key={story.id} story={story} index={index} />
          ))}
        </div>

        {/* Scroll CTA: inline style mirrors the GSAP fromTo start state so it never flashes before hydration */}
        <div
          ref={ctaRef}
          className="absolute bottom-20 z-20 flex justify-center w-full"
          style={{ opacity: 0, pointerEvents: 'none', transform: 'translate(0px, 20px)' }}
        >
          <button
            onClick={handleOpenArchive}
            className="flex items-center gap-3 px-6 py-3 rounded-full border bg-opacity-10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            style={{
              backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="text-xs font-cyber uppercase tracking-widest">{showArchive ? 'Close Archive' : 'Access Full Database'}</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border group-hover:bg-zinc-800 group-hover:border-zinc-800 group-hover:text-white transition-all transform ${showArchive ? 'rotate-180' : 'rotate-0'}`} style={{ borderColor: 'var(--text-secondary)' }}>
              <ChevronUp size={12} />
            </div>
          </button>
        </div>
      </div>

      {/* --- INLINE ARCHIVE DRAWER --- */}
      <AnimatePresence>
        {showArchive && (
          <ArchiveDrawer ref={archiveRef} filters={filters} onCollapse={() => setShowArchive(false)} />
        )}
      </AnimatePresence>

    </section>
  );
}
