import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const LifeBusiness = ({ isDark }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const traits = [
        { 
            title: 'Entrepreneurial Mindset', 
            desc: 'Building from the ground up. Identifying hidden opportunities, aggressively executing with precision, and scaling relentlessly.',
            metric: '01'
        },
        { 
            title: 'Finance & Strategy', 
            desc: 'Deep understanding of market mechanics. Optimizing capital allocation, leveraging resources, and driving sustainable, long-term growth.',
            metric: '02'
        },
        { 
            title: 'Calculated Risk', 
            desc: 'Willingness to explore uncharted territories. Embracing extreme calculated risks for asymmetric, outsized returns.',
            metric: '03'
        },
        { 
            title: 'Business Acumen', 
            desc: 'Aptitude for analyzing complex business models, parsing data signals from noise, and making high-impact decisions under pressure.',
            metric: '04'
        }
    ];

    return (
        <section className={`py-32 relative ${isDark ? 'bg-black text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                    
                    {/* Sticky Left Column */}
                    <div className="lg:col-span-5 lg:sticky lg:top-32 h-auto lg:h-[calc(100vh-16rem)] flex flex-col justify-between">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className={`font-mono text-xs tracking-[0.3em] uppercase block mb-8 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                Sector 03 — Index
                            </span>
                            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6 leading-none">
                                Business
                                <br />
                                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>Acumen</span>
                            </h2>
                            <p className={`text-lg font-light leading-relaxed max-w-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                Showcasing entrepreneurial capability, financial intuition, and an innate drive to disrupt standard conventions.
                            </p>
                        </motion.div>

                        {/* Interactive abstract graphic bound to hovered item */}
                        <div className="hidden lg:flex items-end flex-1 pb-12">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={hoveredIndex ?? 'default'}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className={`w-16 h-[2px] ${isDark ? 'bg-zinc-100' : 'bg-zinc-900'}`} />
                                    <span className="font-mono text-4xl font-light">
                                        {hoveredIndex !== null ? traits[hoveredIndex].metric : '00'}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Scrolling Right Column */}
                    <div className="lg:col-span-7 pb-32 lg:pb-0">
                        <div className="flex flex-col">
                            {traits.map((trait, index) => (
                                <motion.div
                                    key={index}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className={`group flex flex-col justify-center py-16 border-t ${index === traits.length - 1 ? 'border-b' : ''} ${isDark ? 'border-zinc-800' : 'border-zinc-300'} cursor-default relative overflow-hidden`}
                                >
                                    {/* Hover background slide effect */}
                                    <div className={`absolute inset-0 w-full h-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[0.16,1,0.3,1] ${isDark ? 'bg-zinc-900' : 'bg-white'}`} />
                                    
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-8">
                                        <div className="max-w-lg">
                                            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4 group-hover:translate-x-2 transition-transform duration-500">
                                                {trait.title}
                                            </h3>
                                            <p className={`text-lg font-light leading-relaxed group-hover:translate-x-2 transition-transform duration-500 delay-75 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                {trait.desc}
                                            </p>
                                        </div>
                                        
                                        <div className={`hidden md:flex shrink-0 transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                            <ArrowRight size={32} strokeWidth={1} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default LifeBusiness;
