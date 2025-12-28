import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Search } from 'lucide-react';
import { CometCard } from '../Components/UI/CometCard';
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
        <div className={`min-h-screen pt-32 pb-20 px-6 md:px-12 transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-50 text-zinc-600'}`}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {allAchievements.map((item, i) => (
                            <Reveal key={i} delay={i * 50}>
                                <CometCard className="w-full h-full">
                                    <div
                                        className={`relative flex flex-col justify-between p-5 h-full rounded-xl border transition-all duration-300 ${isDark
                                            ? 'bg-[#1F2121] border-zinc-800 text-white'
                                            : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                                            }`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Top Section */}
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                                <div className={`p-1.5 rounded-full ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-100'}`}>
                                                    <Trophy size={12} className={isDark ? 'text-yellow-500' : 'text-yellow-600'} />
                                                </div>
                                            </div>

                                            <h3 className="text-sm font-bold mb-1 leading-tight">
                                                {item.title}
                                            </h3>

                                            <div className={`text-[9px] font-cyber uppercase tracking-widest mb-2 opacity-70 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                {item.rank}
                                            </div>
                                        </div>

                                        {/* Bottom Section */}
                                        <div>
                                            <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                {item.desc}
                                            </p>

                                            <div className="flex flex-wrap gap-1.5 overflow-hidden">
                                                {item.skills?.slice(0, 2).map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-[9px] font-cyber px-1.5 py-0.5 rounded border ${isDark
                                                            ? 'border-zinc-700 bg-zinc-900/50 text-zinc-300'
                                                            : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                                                            }`}
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CometCard>
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
