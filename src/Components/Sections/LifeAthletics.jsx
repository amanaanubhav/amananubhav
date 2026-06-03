import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const LifeAthletics = ({ isDark }) => {
    return (
        <section className={`py-32 relative overflow-hidden ${isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                
                {/* Editorial Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
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
                            Sector 02 — Motion
                        </span>
                        
                        <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] relative z-10">
                            Athletics
                            <br />
                            <span className={`font-serif italic ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>&</span> Adventure
                        </h2>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="md:max-w-xs relative z-10"
                    >
                        <p className={`text-xl font-light leading-relaxed border-l-2 pl-6 ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-zinc-300 text-zinc-600'}`}>
                            Life beyond the desk. Pushing physical limits, embracing risk, and telling compelling visual stories through the lens.
                        </p>
                    </motion.div>
                </div>

                {/* Asymmetric Masonry Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-start">
                    
                    {/* Left Column - Tall Image & Text */}
                    <div className="md:col-span-5 space-y-16 mt-0 md:mt-24">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className={`aspect-[3/4] rounded-sm overflow-hidden relative group ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}
                        >
                            {/* Placeholder Image Layer */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518602164578-cd0074062767?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20 grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-60" />
                            
                            <div className="absolute bottom-8 left-8 right-8">
                                <h3 className="text-3xl font-bold uppercase tracking-tight mb-2">Fitness & Athletics</h3>
                                <p className={`font-mono text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>01 / High Energy Maintenance</p>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="pl-8 md:pl-12"
                        >
                            <h3 className="text-4xl font-bold uppercase tracking-tight mb-4">Videography</h3>
                            <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                Capturing raw moments. Visual storytelling that translates adrenaline and silence into a universal cinematic language.
                            </p>
                        </motion.div>
                    </div>

                    {/* Right Column - Wide Image & Abstract element */}
                    <div className="md:col-span-7 space-y-16">
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative"
                        >
                            <div className={`aspect-video md:aspect-[4/3] rounded-sm overflow-hidden relative group ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20 grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-60" />
                            </div>
                            
                            {/* Overlapping Text Card */}
                            <div className={`absolute -bottom-12 -left-4 md:-left-12 p-8 md:p-12 w-10/12 shadow-2xl backdrop-blur-md ${isDark ? 'bg-zinc-950/90' : 'bg-white/90'}`}>
                                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Adventure Sports</h3>
                                <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    Embracing calculated risk. The outdoors demand a physical and mental presence that sharply hones survival instincts and split-second decision making.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
            
            {/* Abstract sideways text decorative element */}
            <div className="absolute top-1/2 right-4 md:right-12 -translate-y-1/2 rotate-90 origin-right pointer-events-none hidden lg:block">
                <span className={`font-mono text-xs tracking-[1em] uppercase opacity-30 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    OUTWARD BOUND // LIMITLESS
                </span>
            </div>
        </section>
    );
};

export default LifeAthletics;
