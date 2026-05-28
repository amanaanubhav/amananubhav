import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const VerticalNavbar = ({ sections }) => {
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            let current = sections.length > 0 ? sections[0].id : '';

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const top = element.offsetTop;
                    const height = element.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        current = section.id;
                    }
                }
            }
            if (current !== activeSection) {
                setActiveSection(current);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Trigger once to set initial state
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections, activeSection]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!sections || sections.length === 0) return null;

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[4000] hidden md:flex flex-col gap-4">
            {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                    <div
                        key={section.id}
                        className="group relative flex items-center justify-end cursor-pointer"
                        onClick={() => scrollToSection(section.id)}
                    >
                        {/* Label */}
                        <div className={`
                            absolute right-8 px-3 py-1 rounded-md text-xs font-medium tracking-wide
                            transition-all duration-300 pointer-events-none whitespace-nowrap
                            bg-white/10 dark:bg-black/50 backdrop-blur-md
                            border border-neutral-200 dark:border-white/10
                            ${isActive ? 'opacity-100 translate-x-0 text-black dark:text-white' : 'opacity-0 translate-x-4 text-neutral-500'}
                            group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-black dark:group-hover:text-white
                        `}>
                            {section.label}
                        </div>
                        
                        {/* Dot */}
                        <motion.div
                            className={`
                                w-3 h-3 rounded-full transition-all duration-300
                                ${isActive ? 'bg-zinc-800 dark:bg-zinc-200 scale-125' : 'bg-neutral-300 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600'}
                                group-hover:bg-zinc-600 dark:group-hover:bg-zinc-400 group-hover:scale-110
                            `}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default VerticalNavbar;
