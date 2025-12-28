import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Filter, ChevronDown, Calendar, Search } from 'lucide-react';
import useScrollReveal from '../Hooks/useScrollReveal';

const Reveal = ({ children, delay = 0 }) => {
    const [ref, isVisible] = useScrollReveal();
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
            {children}
        </div>
    );
};

// Archive Page Component
const ProjectArchive = ({ isDark, resumeData }) => {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'
    const [filterType, setFilterType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Extract unique domains/types for filter
    const allTypes = ['All', ...new Set(resumeData.projects.map(p => p.type))];

    const filteredProjects = useMemo(() => {
        let result = [...resumeData.projects];

        // Filter by Type
        if (filterType !== 'All') {
            result = result.filter(p => p.type === filterType);
        }

        // Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.tech.some(t => t.toLowerCase().includes(q))
            );
        }

        // Sort
        result.sort((a, b) => {
            const getYear = (y) => {
                if (y === 'Active') return 10000;
                if (y.includes('Present')) return 9999;
                return parseInt(y.split('-')[0]) || 0;
            };
            const yearA = getYear(a.year);
            const yearB = getYear(b.year);

            return sortBy === 'newest' ? yearB - yearA : yearA - yearB;
        });

        return result;
    }, [resumeData.projects, filterType, sortBy, searchQuery]);

    // Grouping Logic
    const groupedProjects = useMemo(() => {
        const groups = {};
        filteredProjects.forEach(p => {
            if (!groups[p.type]) groups[p.type] = [];
            groups[p.type].push(p);
        });
        return groups;
    }, [filteredProjects]);

    return (
        <div className={`min-h-screen pt-32 pb-20 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-50 text-zinc-600'}`}>

            {/* Header & Controls */}
            <Reveal>
                <div className="max-w-7xl mx-auto mb-16">
                    <button
                        onClick={() => navigate('/')}
                        className={`group flex items-center gap-2 mb-8 text-xs font-cyber tracking-widest uppercase transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Return to Signal
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-8 mb-12 border-zinc-800/50">
                        <div>
                            <h1 className={`text-4xl md:text-5xl font-bold font-sans mb-4 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                Project Archive
                            </h1>
                            <p className="font-mono text-sm opacity-60">
                                Complete engineering database // {filteredProjects.length} items
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Search */}
                            <div className={`flex items-center gap-2 px-3 py-2 border rounded-sm ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-300 bg-white'}`}>
                                <Search className="w-4 h-4 opacity-50" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-sm outline-none w-32 placeholder-opacity-50"
                                />
                            </div>

                            {/* Filter */}
                            <div className="relative group">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className={`appearance-none pl-3 pr-8 py-2 border rounded-sm text-sm font-mono cursor-pointer outline-none focus:ring-1 focus:ring-zinc-500 
                            ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'}`}
                                >
                                    {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                            </div>

                            {/* Sort */}
                            <button
                                onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-sm font-mono transition-colors
                        ${isDark ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-400' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-600'}`}
                            >
                                <Calendar className="w-4 h-4" />
                                {sortBy === 'newest' ? 'Newest' : 'Oldest'}
                            </button>
                        </div>
                    </div>

                    {/* GROUPS */}
                    <div className="grid grid-cols-1 gap-12">
                        {Object.entries(groupedProjects).map(([type, projects]) => (
                            <div key={type}>
                                {/* Group Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className={`font-cyber text-xs tracking-[0.2em] uppercase ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                        {type}
                                    </h2>
                                    <div className={`h-px flex-grow ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                </div>

                                {/* Projects Grid */}
                                <div className="grid grid-cols-1 gap-3">
                                    {projects.map((p, i) => (
                                        <Reveal key={p.id || i} delay={i * 30}>
                                            <a
                                                href={p.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`group md:grid md:grid-cols-12 md:gap-4 md:items-center p-6 md:py-5 md:px-6 border rounded-sm transition-colors duration-200 
                                        ${isDark
                                                        ? 'bg-zinc-900/5 border-zinc-800/40 hover:bg-zinc-900/30 hover:border-zinc-700 text-zinc-400'
                                                        : 'bg-white/50 border-zinc-200 hover:border-zinc-300 hover:shadow-sm text-zinc-600'}`}
                                            >
                                                {/* Mobile: Top Row */}
                                                <div className="flex justify-between md:hidden mb-2">
                                                    <span className="font-mono text-xs opacity-60">{p.year}</span>
                                                </div>

                                                {/* Year (Desktop) */}
                                                <div className="hidden md:block col-span-1 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                                                    {p.year.replace('20', "'")}
                                                </div>

                                                {/* Title & Desc */}
                                                <div className="col-span-5 mb-3 md:mb-0">
                                                    <div className="flex items-baseline gap-3">
                                                        <h3 className={`text-base font-bold font-sans ${isDark ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-zinc-700 group-hover:text-black'}`}>
                                                            {p.title}
                                                        </h3>
                                                    </div>
                                                    {/* Short descriptor only */}
                                                    <p className="text-xs opacity-50 line-clamp-1 mt-0.5 font-sans group-hover:opacity-70 transition-opacity">
                                                        {p.desc}
                                                    </p>
                                                </div>

                                                {/* Tech (Desktop & Mobile) */}
                                                <div className="col-span-5 flex flex-wrap gap-2 mt-2 md:mt-0 justify-end md:justify-start">
                                                    {p.tech.slice(0, 4).map(t => (
                                                        <span key={t} className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm opacity-60 group-hover:opacity-90 transition-opacity ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Link Icon */}
                                                <div className="col-span-1 hidden md:flex justify-end">
                                                    <ArrowUpRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? 'text-white' : 'text-black'}`} />
                                                </div>
                                            </a>
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredProjects.length === 0 && (
                            <div className="text-center py-20 opacity-40 font-mono text-sm">
                                No signals found.
                            </div>
                        )}
                    </div>
                </div>
            </Reveal >
        </div >
    );
};

export default ProjectArchive;
