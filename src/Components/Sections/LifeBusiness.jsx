import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';

const LifeBusiness = ({ isDark }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const ventures = [
        {
            title: 'Accolades',
            subtitle: 'Founder / The Command Center for Human Potential',
            desc: 'An elite discovery framework shifting students from passive searching to strategic career engineering. Democratizing access to high-value technical opportunities globally by mitigating noise and curating premium data.',
            metric: '01',
            links: [
                { name: 'Website', url: 'https://www.accolades.site' }
            ]
        },
        {
            title: 'TheTravStory',
            subtitle: 'Founder / AI Travel Ecosystem',
            desc: 'An AI-powered platform generating personalized itineraries and facilitating direct bookings. Solving travel friction by saving time through hyper-curated, seamless experiences without the hustle and hiccups.',
            metric: '02',
            links: [
                { name: 'Website', url: 'https://www.thetravstory.com' },
                { name: 'Instagram', url: 'https://www.instagram.com/the_travstory/' }
            ]
        },
        {
            title: 'Deuxstem',
            subtitle: 'Founder',
            desc: 'An entrepreneurial venture focused on scaling innovative solutions. Driving impact through strategic development and focused execution.',
            metric: '03',
            links: [
                { name: 'LinkedIn', url: 'https://in.linkedin.com/company/deuxstem' },
                { name: 'Instagram', url: 'https://www.instagram.com/deuxstem/' },
                { name: 'Google', url: 'https://www.google.com/search?q=deuxstem' }
            ]
        },
        {
            title: 'MIT Launch X & Sedu',
            subtitle: 'Top 8% International Full Ride (2022)',
            desc: 'Selected as top 8% from all international applicants for a full ride to MIT Launch X. Developed a business named Sedu, engineering a rapid go-to-market strategy that generated $875 in sales within just 5 weeks.',
            metric: '04',
            links: []
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
                                Sector 03 — Index
                            </span>
                            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-6 leading-none">
                                Entrepreneurship
                                <br />
                                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>& Finance</span>
                            </h2>
                            <p className={`text-lg font-light leading-relaxed max-w-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                Building from the ground up. Identifying hidden market opportunities, executing with precision, and scaling relentlessly.
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
                                        {hoveredIndex !== null ? ventures[hoveredIndex].metric : '00'}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Scrolling Right Column */}
                    <div className="lg:col-span-7 pb-32 lg:pb-0">
                        <div className="flex flex-col">
                            {ventures.map((venture, index) => (
                                <motion.div
                                    key={index}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className={`group flex flex-col justify-center py-16 border-t ${index === ventures.length - 1 ? 'border-b' : ''} ${isDark ? 'border-zinc-800' : 'border-zinc-300'} cursor-default relative overflow-hidden`}
                                >
                                    {/* Hover background slide effect */}
                                    <div className={`absolute inset-0 w-full h-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[0.16,1,0.3,1] ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />

                                    <div className="relative z-10 flex flex-col px-4 md:px-8">
                                        <div className="max-w-lg">
                                            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-2 group-hover:translate-x-2 transition-transform duration-500">
                                                {venture.title}
                                            </h3>
                                            <span className={`block font-mono text-xs uppercase tracking-wider mb-6 group-hover:translate-x-2 transition-transform duration-500 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                {venture.subtitle}
                                            </span>
                                            <p className={`text-lg font-light leading-relaxed mb-8 group-hover:translate-x-2 transition-transform duration-500 delay-75 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                {venture.desc}
                                            </p>

                                            {venture.links && venture.links.length > 0 && (
                                                <div className="flex flex-wrap gap-6 group-hover:translate-x-2 transition-transform duration-500 delay-100">
                                                    {venture.links.map((link, i) => (
                                                        <a 
                                                            key={i} 
                                                            href={link.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest border-b pb-1 transition-colors ${isDark ? 'border-zinc-700 hover:border-white text-zinc-300 hover:text-white' : 'border-zinc-300 hover:border-black text-zinc-600 hover:text-black'}`}
                                                        >
                                                            {link.name} <ExternalLink size={14} />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Abstract Graphic on Right Side for extra visual flair */}
                                        <AnimatePresence>
                                            {hoveredIndex === index && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                    className="absolute right-0 top-0 bottom-0 w-1/4 pointer-events-none overflow-hidden hidden md:block"
                                                >
                                                    <svg className={`w-full h-full ${isDark ? 'text-zinc-800/30' : 'text-zinc-200/50'}`} viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
                                                        <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
                                                        <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
                                                        <circle cx="80" cy="20" r="2" fill="currentColor" />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

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
