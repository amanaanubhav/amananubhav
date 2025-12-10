import React, { useEffect } from 'react';
import Adventures from '../Sections/Adventures';

const Stories = ({ isDark, onOpenStory }) => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className={`min-h-screen pt-20 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-10 border-b border-zinc-800 pb-4">
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        Blogs & Stories
                    </h1>
                    <p className={`font-mono text-sm max-w-2xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        [ LOGS: THOUGHTS // EXPERIENCES // IDEAS ]
                    </p>
                </div>
            </div>
            <Adventures onOpenStory={onOpenStory} isDark={isDark} />
        </main>
    );
};

export default Stories;
