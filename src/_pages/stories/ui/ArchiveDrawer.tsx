'use client';

import type { JSX, Ref } from 'react';
import { Calendar, ChevronUp, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { openStory } from '@/features/read-story';
import type { StoryFilters } from '../model/use-story-filters';

interface ArchiveDrawerProps {
  ref?: Ref<HTMLDivElement>;
  filters: StoryFilters;
  onCollapse: () => void;
}

// --- INLINE ARCHIVE DRAWER ---
export function ArchiveDrawer({ ref, filters, onCollapse }: ArchiveDrawerProps): JSX.Element {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    toggleSortOrder,
    categories,
    filteredStories,
    totalCount,
  } = filters;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full relative z-30 border-t"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24">

        {/* Controls Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h3 className="text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>FULL_DATABASE</h3>
            <p className="text-sm font-mono opacity-60" style={{ color: 'var(--text-secondary)' }}>
              {totalCount} ENTRIES FOUND
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text" placeholder="QUERY..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm font-mono bg-transparent border rounded-none outline-none focus:border-opacity-100 transition-all w-full sm:w-64"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <button
              onClick={toggleSortOrder}
              className="px-4 py-2 border text-xs font-cyber uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Sort: {sortOrder}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {categories.map((cat) => (
            <button
              key={cat} onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold uppercase tracking-widest pb-3 border-b-2 transition-colors whitespace-nowrap ${selectedCategory === cat ? 'border-green-500 opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}
              style={{ color: 'var(--text-primary)' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredStories.map((story) => (
            <motion.div
              key={story.id}
              className="group cursor-pointer flex flex-col gap-4"
              onClick={() => openStory(story)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="aspect-[3/2] overflow-hidden rounded-sm relative bg-black/5">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={story.coverImage} alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-cyber tracking-widest uppercase opacity-70" style={{ color: 'var(--text-secondary)' }}>
                  <span>{story.category}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {story.date}</span>
                </div>
                <h3 className="text-xl font-bold leading-tight group-hover:underline decoration-1 underline-offset-4" style={{ color: 'var(--text-primary)' }}>
                  {story.title}
                </h3>
                <p className="text-sm line-clamp-2 opacity-80" style={{ color: 'var(--text-secondary)' }}>{story.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <button onClick={onCollapse} className="flex items-center gap-2 text-xs font-cyber uppercase opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
            <ChevronUp size={14} /> Collapse Archive
          </button>
        </div>

      </div>
    </motion.div>
  );
}
