import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VerticalNavbar from '../Components/UI/VerticalNavbar';
import Hero from '../Components/Sections/Hero';
import About from '../Components/Sections/About';
import Experience from '../Components/Sections/Experience';
import Projects from '../Components/Sections/Projects';
import Achievements from '../Components/Sections/Achievements';
import PortfolioGallery from '../Components/Sections/PortfolioGallery';

const Home = ({ isDark, resumeData }) => {
    const location = useLocation();

    const sections = [
        { id: 'home', label: 'Hero' },
        { id: 'about', label: 'About' },
        { id: 'experience', label: 'Experience' },
        { id: 'projects', label: 'Projects' },
        { id: 'achievements', label: 'Achievements' },
    ];

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
            <VerticalNavbar sections={sections} />
            <Hero isDark={isDark} />
            <About resumeData={resumeData} isDark={isDark} />
            <Experience resumeData={resumeData} isDark={isDark} />
            <PortfolioGallery isDark={isDark} />
            <Projects resumeData={resumeData} isDark={isDark} />
            <Achievements resumeData={resumeData} isDark={isDark} />
        </main>
    );
};

export default Home;
