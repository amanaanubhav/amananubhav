import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VerticalNavbar from '../Components/UI/VerticalNavbar';
import Hero from '../Components/Sections/Hero';
import StoryGuide from '../Components/Sections/StoryGuide';

const Home = ({ isDark, resumeData }) => {
    const location = useLocation();

    const sections = [
        { id: 'home', label: 'Hero' },
        { id: 'story', label: 'Story Guide' },
    ];

    useEffect(() => {
        if (location.state && location.state.scrollTo) {
            const section = document.getElementById(location.state.scrollTo);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                // Clear the state natively without triggering a React Router re-render
                const newHistoryState = { ...window.history.state };
                if (newHistoryState && newHistoryState.usr) {
                    delete newHistoryState.usr.scrollTo;
                }
                window.history.replaceState(newHistoryState, '');
            }
        }
    }, [location]);

    return (
        <main className={`relative z-10 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <VerticalNavbar sections={sections} />
            <Hero isDark={isDark} />
            <div id="story">
                <StoryGuide isDark={isDark} />
            </div>
        </main>
    );
};

export default Home;
