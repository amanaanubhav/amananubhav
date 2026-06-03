import React from 'react';
import VerticalNavbar from '../Components/UI/VerticalNavbar';
import About from '../Components/Sections/About';
import ParallaxPortfolio from '../Components/Sections/PortfolioGallery';
import LifeSTEM from '../Components/Sections/LifeSTEM';
import LifeAthletics from '../Components/Sections/LifeAthletics';
import LifeBusiness from '../Components/Sections/LifeBusiness';

const Personal = ({ isDark, resumeData }) => {
    const sections = [
        { id: 'about', label: 'Identity' },
        { id: 'stem', label: 'Engineering' },
        { id: 'athletics', label: 'Athletics' },
        { id: 'business', label: 'Business' },
        { id: 'gallery', label: 'Gallery' }
    ];

    return (
        <main className={`relative z-10 min-h-screen ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-black'}`}>
            <VerticalNavbar sections={sections} />
            <div id="about">
                <About resumeData={resumeData} isDark={isDark} />
            </div>
            <div id="stem">
                <LifeSTEM isDark={isDark} />
            </div>
            <div id="athletics">
                <LifeAthletics isDark={isDark} />
            </div>
            <div id="business">
                <LifeBusiness isDark={isDark} />
            </div>
            <div id="gallery">
                <ParallaxPortfolio isDark={isDark} />
            </div>
        </main>
    );
};

export default Personal;
