import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Search } from 'lucide-react';
import { normalizeAchievement } from '../lib/utils';
import useScrollReveal from '../Hooks/useScrollReveal';

const Reveal = ({ children, delay = 0 }) => {
    const [ref, isVisible] = useScrollReveal();
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
            {children}
        </div>
    );
};

const AchievementsArchive = ({ isDark, resumeData }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Normalize and Filter
    const allAchievements = React.useMemo(() => {
        let items = resumeData.achievements.map(normalizeAchievement);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.desc.toLowerCase().includes(q) ||
                item.skills?.some(s => s.toLowerCase().includes(q))
            );
        }
        return items;
    }, [resumeData.achievements, searchQuery]);

    return (
        <div className={`min-h-screen pt-32 pb-20 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>
            <Reveal>
                <div className="max-w-7xl mx-auto mb-16">
                    <button
                        onClick={() => navigate(-1)}
                        className={`group flex items-center gap-2 mb-8 text-xs font-cyber tracking-widest uppercase transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Return to Signal
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-8 mb-12 border-zinc-800/50">
                        <div>
                            <h1 className={`text-4xl md:text-5xl font-bold font-sans mb-4 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                Honors Archive
                            </h1>
                            <p className="font-mono text-sm opacity-60">
                                Records of Recognition // {allAchievements.length} items
                            </p>
                        </div>

                        {/* Search */}
                        <div className={`flex items-center gap-2 px-3 py-2 border rounded-sm ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-300 bg-white'}`}>
                            <Search className="w-4 h-4 opacity-50" />
                            <input
                                type="text"
                                placeholder="Search honors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm outline-none w-40 md:w-64 placeholder-opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {allAchievements.map((item, i) => (
                            <Reveal key={i} delay={i * 30}>
                                <div
                                    className={`group md:grid md:grid-cols-12 md:gap-4 md:items-center p-6 md:py-5 md:px-6 border rounded-sm transition-colors duration-200 
                                        ${isDark
                                            ? 'bg-zinc-900/5 border-zinc-800/40 hover:bg-zinc-900/30 hover:border-zinc-700 text-zinc-400'
                                            : 'bg-white/50 border-zinc-200 hover:border-zinc-300 hover:shadow-sm text-zinc-600'}`}
                                >
                                    {/* Mobile: Top Row */}
                                    <div className="flex justify-between md:hidden mb-2">
                                        <span className="font-mono text-xs opacity-60">{String(i + 1).padStart(2, '0')}</span>
                                        <Trophy size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                                    </div>

                                    {/* Index (Desktop) */}
                                    <div className="hidden md:flex items-center gap-2 col-span-1 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                                        <span>{String(i + 1).padStart(2, '0')}</span>
                                    </div>

                                    {/* Title & Desc */}
                                    <div className="col-span-6 mb-3 md:mb-0">
                                        <div className="flex items-baseline gap-3">
                                            <h3 className={`text-base font-bold font-sans ${isDark ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-zinc-700 group-hover:text-black'}`}>
                                                {item.title}
                                            </h3>
                                            {item.rank && (
                                                <span className={`text-[10px] font-cyber uppercase tracking-widest opacity-60 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {item.rank}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs opacity-50 line-clamp-1 mt-0.5 font-sans group-hover:opacity-70 transition-opacity">
                                            {item.desc}
                                        </p>
                                    </div>

                                    {/* Skills (Desktop & Mobile) */}
                                    <div className="col-span-4 flex flex-wrap gap-2 mt-2 md:mt-0 justify-end md:justify-start">
                                        {item.skills?.slice(0, 4).map((skill, idx) => (
                                            <span key={idx} className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm opacity-60 group-hover:opacity-90 transition-opacity ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Trophy Icon (Desktop) */}
                                    <div className="col-span-1 hidden md:flex justify-end">
                                        <Trophy className={`w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${isDark ? 'text-white' : 'text-black'}`} />
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {allAchievements.length === 0 && (
                        <div className="text-center py-20 opacity-40 font-mono text-sm">
                            No records found.
                        </div>
                    )}
                </div>
            </Reveal>
        </div>
    );
};

export default AchievementsArchive;
