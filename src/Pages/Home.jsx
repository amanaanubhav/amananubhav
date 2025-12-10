import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LensHero from '../Components/Hero/LensHero';
import About from '../Sections/About';
import Experience from '../Sections/Experience';
import Projects from '../Sections/Projects';
import Achievements from '../Sections/Achievements';
import PortfolioGallery from '../Sections/PortfolioGallery';

const Home = ({ isDark, resumeData }) => {
    const location = useLocation();

    useEffect(() => {
        if (location.state && location.state.scrollTo) {
            const section = document.getElementById(location.state.scrollTo);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    return (
        <main className={`relative z-10 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <LensHero isDark={isDark} />
            <About resumeData={resumeData} isDark={isDark} />
            <Experience resumeData={resumeData} isDark={isDark} />
            <PortfolioGallery isDark={isDark} />
            <Projects resumeData={resumeData} isDark={isDark} />
            <Achievements resumeData={resumeData} isDark={isDark} />
        </main>
    );
};

export default Home;
