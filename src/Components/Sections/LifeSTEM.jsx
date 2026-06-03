import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LifeSTEM = ({ isDark }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const skills = [
        {
            num: '01',
            title: 'SYSTEMS ENGINEERING',
            desc: 'Building robust, scalable architectures and complex digital systems.',
            tags: ['Architecture', 'Scalability', 'Infrastructure']
        },
        {
            num: '02',
            title: 'CREATIVE INNOVATION',
            desc: 'Solving complex problems with creative, outside-the-box technical solutions.',
            tags: ['R&D', 'Problem Solving', 'Prototyping']
        },
        {
            num: '03',
            title: 'TECHNICAL EXECUTION',
            desc: 'Hands-on experience in cutting-edge technologies and modern development.',
            tags: ['Full Stack', 'Cloud', 'Optimization']
        }
    ];

    return (
        <section className={`py-32 relative ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12 border-zinc-500/20"
                >
                    <div>
                        <span className={`font-mono text-xs tracking-[0.3em] uppercase block mb-6 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Sector 01 — Foundation
                        </span>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase">
                            Engineering
                            <br />
                            <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>& Innovation</span>
                        </h2>
                    </div>
                    <div className="md:max-w-sm">
                        <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            A deep-rooted passion for STEM. Merging raw technical capability with an obsessive eye for detail and design.
                        </p>
                    </div>
                </motion.div>

                {/* Blueprint Grid */}
                <div className="border-t border-zinc-500/20">
                    {skills.map((item, index) => (
                        <motion.div
                            key={index}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`group relative border-b border-zinc-500/20 py-12 md:py-16 transition-colors duration-500 ${hoveredIndex === index ? (isDark ? 'bg-zinc-900/30' : 'bg-zinc-100/50') : ''}`}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 items-center">
                                {/* Number */}
                                <div className="md:col-span-2">
                                    <span className={`font-mono text-3xl md:text-5xl font-light ${hoveredIndex === index ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : (isDark ? 'text-zinc-700' : 'text-zinc-300')} transition-colors duration-500`}>
                                        {item.num}
                                    </span>
                                </div>
                                
                                {/* Title */}
                                <div className="md:col-span-5 relative z-10">
                                    <h3 className={`text-2xl md:text-4xl font-bold uppercase tracking-tight transition-transform duration-500 ${hoveredIndex === index ? 'md:translate-x-4' : ''}`}>
                                        {item.title}
                                    </h3>
                                </div>
                                
                                {/* Description & Tags */}
                                <div className={`md:col-span-5 transition-opacity duration-500 ${hoveredIndex === index ? 'opacity-100' : 'opacity-60'}`}>
                                    <p className={`text-lg font-light mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        {item.desc}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {item.tags.map((tag, i) => (
                                            <span 
                                                key={i} 
                                                className={`px-3 py-1 font-mono text-xs uppercase tracking-wider border rounded-full ${isDark ? 'border-zinc-700 text-zinc-400 group-hover:border-zinc-500 group-hover:text-zinc-300' : 'border-zinc-300 text-zinc-600 group-hover:border-zinc-400 group-hover:text-zinc-800'} transition-colors duration-300`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Abstract Hover Graphic overlay */}
                            <AnimatePresence>
                                {hoveredIndex === index && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none overflow-hidden hidden md:block"
                                    >
                                        <svg className={`w-full h-full ${isDark ? 'text-zinc-800/30' : 'text-zinc-200/50'}`} viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
                                            <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
                                            <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
                                            <line x1="60" y1="100" x2="100" y2="60" stroke="currentColor" strokeWidth="0.5" />
                                            <circle cx="80" cy="20" r="2" fill="currentColor" />
                                        </svg>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LifeSTEM;
