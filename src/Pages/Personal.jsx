import React from 'react';
import VerticalNavbar from '../Components/UI/VerticalNavbar';
import About from '../Components/Sections/About';
import ParallaxPortfolio from '../Components/Sections/PortfolioGallery';

const Personal = ({ isDark, resumeData }) => {
    const sections = [
        { id: 'about', label: 'Identity' },
        { id: 'gallery', label: 'Gallery' }
    ];

    return (
        <main className={`relative z-10 min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-black'}`}>
            <VerticalNavbar sections={sections} />
            <div id="about">
                <About resumeData={resumeData} isDark={isDark} />
            </div>
            <div id="gallery">
                <ParallaxPortfolio isDark={isDark} />
            </div>
        </main>
    );
};

export default Personal;
