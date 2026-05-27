import React from 'react';
import VerticalNavbar from '../Components/UI/VerticalNavbar';

const Personal = ({ isDark }) => {
    // We will define sections when we build this out
    const sections = [
        { id: 'intro', label: 'Introduction' }
    ];

    return (
        <main className={`relative z-10 min-h-screen pt-32 px-4 md:px-20 ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-black'}`}>
            <VerticalNavbar sections={sections} />
            <section id="intro" className="min-h-screen flex items-center justify-center">
                <h1 className="text-4xl font-bold">Personal Space</h1>
                <p className="mt-4 text-lg opacity-70 ml-4">(Coming Soon)</p>
            </section>
        </main>
    );
};

export default Personal;
