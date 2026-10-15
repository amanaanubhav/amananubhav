'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useTheme } from '@/shared/lib/theme';

import { ATHLETICS_SLIDES as slides } from '../config/content';
import { useInterval } from '../lib/use-interval';

export function AthleticsSection() {
    const { isDark } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);

    const advance = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % slides.length);
    }, []);
    useInterval(advance, 4000);

    return (
        <section className={`py-32 relative overflow-hidden ${isDark ? 'bg-black text-zinc-100' : 'bg-white text-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                {/* Editorial Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        {/* Massive background text */}
                        <span className={`absolute -top-12 -left-8 md:-top-24 md:-left-12 text-[8rem] md:text-[12rem] font-bold leading-none tracking-tighter select-none pointer-events-none opacity-5 ${isDark ? 'text-white' : 'text-black'}`}>
                            KINETIC
                        </span>

                        <span className={`font-mono text-xs tracking-[0.3em] uppercase block mb-6 relative z-10 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Motion
                        </span>

                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] relative z-10">
                            Athletics
                            <br />
                            <span className={`font-serif italic ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>&</span> Adventure
                        </h2>
                    </motion.div>
                </div>

                {/* Massive Unified Carousel */}
                <div className="relative w-full h-[70vh] md:h-[80vh] rounded-md overflow-hidden bg-black flex items-center justify-center isolate shadow-2xl">

                    {/* Background Media Crossfade */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute inset-0 z-0"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                                style={{ backgroundImage: `url(${slides[activeIndex].image})` }}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 opacity-90 pointer-events-none" />

                    {/* Bottom Left Text Overlap - Vertical Scroll Animation */}
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20 pointer-events-none">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="max-w-2xl"
                            >
                                <span className="font-mono text-xs md:text-sm tracking-[0.2em] uppercase text-zinc-400 block mb-4">
                                    {slides[activeIndex].category}
                                </span>
                                <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4 leading-none">
                                    {slides[activeIndex].title}
                                </h3>
                                <p className="text-lg md:text-xl font-light text-zinc-300">
                                    {slides[activeIndex].desc}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Indicator Dots / Bars */}
                    <div className="absolute bottom-8 right-8 md:bottom-16 md:right-16 z-20 flex gap-2 md:gap-4">
                        {slides.map((_, i) => (
                            <div key={i} className="w-8 md:w-12 h-1 bg-zinc-800 rounded-full overflow-hidden cursor-pointer" onClick={() => setActiveIndex(i)}>
                                {i === activeIndex && (
                                    <motion.div
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 4, ease: "linear" }}
                                        className="h-full bg-white"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Abstract sideways text decorative element */}
            <div className="absolute top-1/2 right-4 md:right-12 -translate-y-1/2 rotate-90 origin-right pointer-events-none hidden lg:block z-0">
                <span className={`font-mono text-xs tracking-[1em] uppercase opacity-30 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    OUTWARD BOUND // LIMITLESS
                </span>
            </div>
        </section>
    );
}
