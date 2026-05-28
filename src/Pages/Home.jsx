import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerticalNavbar from '../Components/UI/VerticalNavbar';
import Hero from '../Components/Sections/Hero';
import About from '../Components/Sections/About';
import PortfolioGallery from '../Components/Sections/PortfolioGallery';

const Home = ({ isDark, resumeData }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const sections = [
        { id: 'home', label: 'Hero' },
        { id: 'about', label: 'About' },
    ];

    useEffect(() => {
        if (location.state && location.state.scrollTo) {
            const section = document.getElementById(location.state.scrollTo);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                // Clear the state so it doesn't trigger again on browser back navigation
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location, navigate]);

    return (
        <main className={`relative z-10 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <VerticalNavbar sections={sections} />
            <Hero isDark={isDark} />
            <About resumeData={resumeData} isDark={isDark} />
            <PortfolioGallery isDark={isDark} />
        </main>
    );
};

export default Home;
