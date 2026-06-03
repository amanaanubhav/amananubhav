import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { ArrowUpRight, Sparkles, Clock, ArrowRight, Search, Calendar, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ADVENTURES } from '../../Data/adventures';

gsap.registerPlugin(ScrollTrigger);

const FEATURED_STORIES = ADVENTURES.slice(0, 3);

// --- 1. Reusable Card Component ---
const MechanicalCard = ({ story, index, isDark, onOpenStory }) => {
  return (
    <div
      className="blog-card absolute left-0 right-0 mx-auto w-full max-w-5xl px-4 md:px-0 h-[60vh] flex items-center justify-center will-change-transform"
      style={{
        zIndex: index + 1,
        top: `${15 + (index * 4)}%`, // Stacking offset
        visibility: 'hidden'
      }}
    >
      <div
        onClick={() => onOpenStory(story)}
        className="card-surface relative w-full h-full rounded-lg overflow-hidden border cursor-pointer group shadow-2xl transition-all duration-500"
        style={{
          backgroundColor: 'rgba(var(--card-bg-rgb), var(--card-opacity))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'var(--border-subtle)',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          '--card-opacity': 0.3
        }}
      >
        <div className="absolute inset-0 flex flex-col md:flex-row">
          {/* Visual Half */}
          <div className="w-full md:w-7/12 h-1/2 md:h-full relative overflow-hidden bg-black flex-shrink-0">
            <motion.div layoutId={`story-image-container-${story.id}`} className="w-full h-full">
              <motion.img
                layoutId={`story-image-${story.id}`}
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
                  LOG_{story.id.split('-')[0].toUpperCase()}
                </span>
              </div>
              <div className="shrink-0">
                <motion.h3
                  layoutId={`story-title-${story.id}`}
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
};

// --- 2. Main Section Component ---
const Adventures = ({ onOpenStory, isDark }) => {
  const sectionRef = useRef(null);
  const triggerRef = useRef(null);
  const ctaRef = useRef(null);
  const archiveRef = useRef(null);

  const [showArchive, setShowArchive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // GSAP ScrollTrigger - Progressive Translucency Implementation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.blog-card');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "+=350%",
          scrub: 1, // Strictly linked to scroll
          pin: true,
          anticipatePin: 1
        }
      });

      cards.forEach((card, i) => {
        // 1. Reveal Interaction
        tl.fromTo(card,
          {
            yPercent: 120,
            opacity: 0,
            scale: 0.95,
            visibility: 'hidden',
            '--card-opacity': 0.3,
            filter: 'blur(0px)' // Explicit start
          },
          {
            yPercent: 0,
            opacity: 1,
            scale: 1,
            visibility: 'visible',
            duration: 1,
            ease: "power2.out",
            '--card-opacity': 0.85,
            filter: 'blur(0px)' // Ensure sharp on arrival
          },
          i * 0.8
        );

        // 2. Recession Logic (Progressive Translucency)
        // If there is a previous card, fade it out as this card arrives
        if (i > 0) {
          const prevCard = cards[i - 1];
          // Use exact same duration/position as current card's arrival to sync perfectly
          tl.to(prevCard, {
            opacity: 0.4,       // Visually recede
            scale: 0.95,        // Shrink slightly to emphasize depth
            filter: "blur(4px)", // Optical blur
            duration: 1,        // Matches arrival duration
            ease: "power2.out"
          }, i * 0.8); // Start at same time current card starts arriving
        }
      });

      tl.fromTo(ctaRef.current,
        { y: 20, opacity: 0, pointerEvents: 'none' },
        { y: 0, opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: "power2.out" },
        "+=0.2"
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Archive Logic
  const categories = useMemo(() => ['All', ...new Set(ADVENTURES.map(s => s.category))], []);

  const filteredStories = useMemo(() => {
    return ADVENTURES.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || story.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [searchQuery, selectedCategory, sortOrder]);

  const handleOpenArchive = () => {
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
            <MechanicalCard key={story.id} story={story} index={index} isDark={isDark} onOpenStory={onOpenStory} />
          ))}
        </div>

        {/* Scroll CTA */}
        <div ref={ctaRef} className="absolute bottom-20 z-20 flex justify-center w-full">
          <button
            onClick={handleOpenArchive}
            className="flex items-center gap-3 px-6 py-3 rounded-full border bg-opacity-10 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            style={{
              backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
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
          <motion.div
            ref={archiveRef}
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
                    {ADVENTURES.length} ENTRIES FOUND
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
                    onClick={() => setSortOrder(p => p === 'newest' ? 'oldest' : 'newest')}
                    className="px-4 py-2 border text-xs font-cyber uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    Sort: {sortOrder}
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                {categories.map(cat => (
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
                    onClick={() => onOpenStory(story)}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="aspect-[3/2] overflow-hidden rounded-sm relative bg-black/5">
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
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
                <button onClick={() => setShowArchive(false)} className="flex items-center gap-2 text-xs font-cyber uppercase opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
                  <ChevronUp size={14} /> Collapse Archive
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default Adventures;