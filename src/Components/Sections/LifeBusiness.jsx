import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

const LifeBusiness = ({ isDark }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const ventures = [
        {
            title: 'Accolades',
            subtitle: 'Founder / The Command Center for Human Potential',
            desc: 'An elite discovery framework shifting students from passive searching to strategic career engineering. Democratizing access to high-value technical opportunities globally by mitigating noise and curating premium data.',
            metric: '01',
            links: [
                { name: 'Website', url: 'https://www.accolades.site' }
            ],
            // Media placeholder styling
            mediaColor: isDark ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'
        },
        {
            title: 'TheTravStory',
            subtitle: 'Founder / AI Travel Ecosystem',
            desc: 'An AI-powered platform generating personalized itineraries and facilitating direct bookings. Solving travel friction by saving time through hyper-curated, seamless experiences without the hustle and hiccups.',
            metric: '02',
            links: [
                { name: 'Website', url: 'https://www.thetravstory.com' },
                { name: 'Instagram', url: 'https://www.instagram.com/the_travstory/' }
            ],
            mediaColor: isDark ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'
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
            ],
            mediaColor: isDark ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'
        },
        {
            title: 'MIT Launch X & Sedu',
            subtitle: 'Top 8% International Full Ride (2022)',
            desc: 'Selected as top 8% from all international applicants for a full ride to MIT Launch X. Developed a business named Sedu, engineering a rapid go-to-market strategy that generated $875 in sales within just 5 weeks.',
            metric: '04',
            links: [],
            mediaColor: isDark ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'
        }
    ];

    return (
        <section className={`py-32 relative ${isDark ? 'bg-black text-zinc-100' : 'bg-white text-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                {/* Header Section - Non Sticky to avoid clutter/overlap */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-20 md:mb-32"
                >
                    <span className={`font-mono text-xs tracking-[0.3em] uppercase block mb-6 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Index
                    </span>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter uppercase mb-6 leading-tight max-w-4xl">
                        Entrepreneurship <br className="hidden md:block"/>
                        <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>& Finance</span>
                    </h2>
                    <p className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Building from the ground up. Identifying hidden market opportunities, executing with precision, and scaling relentlessly.
                    </p>
                </motion.div>

                {/* Content Section: Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                    
                    {/* Left: Interactive List */}
                    <div className="lg:col-span-7 flex flex-col relative z-20">
                        {ventures.map((venture, index) => (
                            <div 
                                key={index}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => setActiveIndex(index)}
                                className={`group py-12 border-t cursor-pointer transition-colors duration-500 ${isDark ? 'border-zinc-800 hover:border-zinc-500' : 'border-zinc-200 hover:border-zinc-400'} ${index === ventures.length - 1 ? 'border-b' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-3xl md:text-4xl font-bold uppercase tracking-tight transition-colors duration-300 ${activeIndex === index ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-zinc-600' : 'text-zinc-400')}`}>
                                        {venture.title}
                                    </h3>
                                    <span className={`font-mono text-sm transition-colors duration-300 ${activeIndex === index ? (isDark ? 'text-zinc-300' : 'text-zinc-600') : (isDark ? 'text-zinc-800' : 'text-zinc-300')}`}>
                                        {venture.metric}
                                    </span>
                                </div>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <span className={`block font-mono text-xs uppercase tracking-wider mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {venture.subtitle}
                                    </span>
                                    <p className={`text-base md:text-lg font-light leading-relaxed mb-8 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        {venture.desc}
                                    </p>

                                    {venture.links && venture.links.length > 0 && (
                                        <div className="flex flex-wrap gap-6 mt-4">
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
                            </div>
                        ))}
                    </div>

                    {/* Right: Sticky Media Container */}
                    <div className={`hidden lg:block lg:col-span-5 sticky top-32 h-[60vh] w-full rounded-2xl overflow-hidden border transition-colors duration-500 shadow-2xl ${isDark ? 'border-zinc-800/50 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className={`absolute inset-0 w-full h-full bg-gradient-to-br ${ventures[activeIndex].mediaColor} flex flex-col items-center justify-center p-8 text-center`}
                            >
                                {/* Media Placeholder Content */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border backdrop-blur-sm transition-colors duration-300 ${isDark ? 'border-white/10 bg-black/50 text-white/50' : 'border-black/10 bg-white/50 text-black/50'}`}>
                                    <ImageIcon size={24} />
                                </div>
                                <h4 className={`text-xl font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    {ventures[activeIndex].title}
                                </h4>
                                <p className={`text-sm font-mono uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    Media Space Reserved
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default LifeBusiness;
