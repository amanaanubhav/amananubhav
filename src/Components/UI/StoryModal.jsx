import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { X, Calendar, Tag, Link as LinkIcon, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const StoryModal = ({ story, onClose, isDark }) => {
    const containerRef = useRef(null);
    const progressRef = useRef(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    // GSAP Scroll Progress
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            if (containerRef.current && progressRef.current) {
                gsap.to(progressRef.current, {
                    scaleX: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current.querySelector('article'),
                        scroller: containerRef.current,
                        start: "top bottom",
                        end: "bottom bottom",
                        scrub: true
                    }
                });
            }
        }, containerRef);
        return () => ctx.revert();
    }, [story]);

    if (!story) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] overflow-y-auto"
            style={{
                backgroundColor: 'rgba(var(--bg-primary-rgb), 0.85)', // High contrast translucency
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
            ref={containerRef}
        >
            {/* GSAP Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-zinc-800/20">
                <div
                    ref={progressRef}
                    className="h-full w-full bg-green-500 origin-left scale-x-0"
                />
            </div>

            {/* Navbar for Modal */}
            <div className={`fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none`}>
                <button
                    onClick={onClose}
                    className={`pointer-events-auto flex items-center gap-3 transition-all group px-5 py-2.5 rounded-full border backdrop-blur-md shadow-lg`}
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-cyber tracking-widest uppercase">Return</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto pt-32 pb-32 px-6 md:px-12 relative">

                {/* Hero Image */}
                <div className="mb-20 rounded-lg overflow-hidden border shadow-2xl aspect-video relative group" style={{ borderColor: 'var(--border-subtle)' }}>
                    <motion.div
                        layoutId={`story-image-container-${story.id}`}
                        className="w-full h-full relative"
                    >
                        <motion.img
                            layoutId={`story-image-${story.id}`}
                            src={story.coverImage}
                            alt={story.title}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                </div>

                {/* Header */}
                <header className="mb-16 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-[10px] font-cyber text-green-500 uppercase tracking-widest">
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-900/30 bg-green-900/10">
                            <Calendar size={12} /> {story.date}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-900/30 bg-green-900/10">
                            <Tag size={12} /> {story.category}
                        </span>
                    </div>

                    <motion.h1
                        layoutId={`story-title-${story.id}`}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {story.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto font-sans"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {story.subtitle}
                    </motion.p>
                </header>

                {/* Article Content */}
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    // We remove hardcoded prose colors and use CSS vars via style injection for maximum control
                    className="prose prose-lg md:prose-xl max-w-none font-sans leading-loose"
                    style={{
                        '--tw-prose-body': 'var(--text-secondary)',
                        '--tw-prose-headings': 'var(--text-primary)',
                        '--tw-prose-links': 'var(--text-primary)',
                        '--tw-prose-bold': 'var(--text-primary)',
                        '--tw-prose-counters': 'var(--text-secondary)',
                        '--tw-prose-bullets': 'var(--border-subtle)',
                        '--tw-prose-hr': 'var(--border-subtle)',
                        '--tw-prose-quotes': 'var(--text-secondary)',
                        '--tw-prose-quote-borders': 'var(--accent-metallic)',
                        '--tw-prose-captions': 'var(--text-muted)',
                        '--tw-prose-code': 'var(--text-primary)',
                        '--tw-prose-pre-code': 'var(--text-primary)',
                        '--tw-prose-pre-bg': 'var(--card-bg)',
                        '--tw-prose-th-borders': 'var(--border-subtle)',
                        '--tw-prose-td-borders': 'var(--border-subtle)',
                    }}
                >
                    <div dangerouslySetInnerHTML={{ __html: story.content }} />
                </motion.article>

            </div>
        </motion.div>
    );
};
export default StoryModal;