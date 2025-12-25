import React, { useEffect } from 'react';
import Adventures from '../Sections/Adventures';

const Stories = ({ isDark, onOpenStory }) => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="min-h-screen pt-20" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Adventures onOpenStory={onOpenStory} isDark={isDark} />
        </main>
    );
};

export default Stories;
