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
        <section className={`py-32 relative ${isDark ? 'bg-black text-zinc-100' : 'bg-white text-zinc-900'}`}>
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
                                Foundation
                            </span>
                            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6 leading-none">
                                Engineering
                                <br />
                                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>& Innovation</span>
                            </h2>
                            <p className={`text-lg font-light leading-relaxed max-w-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                A deep-rooted passion for STEM. Merging raw technical capability with an obsessive eye for detail and design.
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
                                        {hoveredIndex !== null ? skills[hoveredIndex].num : '00'}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Scrolling Right Column */}
                    <div className="lg:col-span-7 pb-32 lg:pb-0">
                        <div className="flex flex-col">
                            {skills.map((item, index) => (
                                <motion.div
                                    key={index}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className={`group flex flex-col justify-center py-16 border-t ${index === skills.length - 1 ? 'border-b' : ''} ${isDark ? 'border-zinc-800' : 'border-zinc-300'} cursor-default relative overflow-hidden`}
                                >
                                    {/* Hover background slide effect */}
                                    <div className={`absolute inset-0 w-full h-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[0.16,1,0.3,1] ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
                                    
                                    <div className="relative z-10 flex flex-col px-4 md:px-8">
                                        <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4 group-hover:translate-x-2 transition-transform duration-500">
                                            {item.title}
                                        </h3>
                                        <p className={`text-lg font-light leading-relaxed mb-6 group-hover:translate-x-2 transition-transform duration-500 delay-75 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                            {item.desc}
                                        </p>
                                        <div className="flex flex-wrap gap-3 group-hover:translate-x-2 transition-transform duration-500 delay-100">
                                            {item.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className={`px-3 py-1 font-mono text-xs uppercase tracking-wider border rounded-full ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-zinc-300 text-zinc-600'} transition-colors duration-300`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Abstract Graphic on Right Side */}
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
                </div>
            </div>
        </section>
    );
};

export default LifeSTEM;
