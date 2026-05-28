import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerticalNavbar from '../Components/UI/VerticalNavbar';
import Experience from '../Components/Sections/Experience';
import TechStack from '../Components/Sections/TechStack';
import Projects from '../Components/Sections/Projects';
import Achievements from '../Components/Sections/Achievements';

const Professional = ({ isDark, resumeData }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const sections = [
        { id: 'experience', label: 'Experience' },
        { id: 'techstack', label: 'Tech Stack' },
        { id: 'projects', label: 'Projects' },
        { id: 'achievements', label: 'Achievements' },
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
        <main className={`relative z-10 ${isDark ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-black'}`}>
            <VerticalNavbar sections={sections} />
            <div className="pt-20">
                <Experience resumeData={resumeData} isDark={isDark} />
                <TechStack resumeData={resumeData} isDark={isDark} />
                <Projects resumeData={resumeData} isDark={isDark} />
                <Achievements resumeData={resumeData} isDark={isDark} />
            </div>
        </main>
    );
};

export default Professional;
