import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './Utils/firebase';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Components
import Navbar from './Components/Layout/Navbar';
import Footer from './Components/Layout/Footer';
import Preloader from './Components/UI/Preloader';
import SecureContact from './Components/UI/SecureContact';
import TerminalOverlay from './Components/UI/TerminalOverlay';
import StoryModal from './Components/UI/StoryModal';
import { RESUME } from './Data/resume';

// Pages
import Home from './Pages/Home';
import Stories from './Pages/Stories';

const App = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null); // State for Story Modal
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        if (auth) {
            const unsub = onAuthStateChanged(auth, setUser);
            signInAnonymously(auth).catch(console.error);
            return () => unsub();
        }
    }, []);

    const toggleTheme = () => setIsDark(!isDark);
    const handleOpenVault = () => setIsVaultOpen(true);

    // New Handlers
    const handleOpenStory = (story) => setSelectedStory(story);
    const handleCloseStory = () => setSelectedStory(null);

    return (
        <BrowserRouter>
            {loading && <Preloader onComplete={() => setLoading(false)} />}

            {/* Story Modal Overlay */}
            {selectedStory && (
                <StoryModal story={selectedStory} onClose={handleCloseStory} />
            )}

            <div className={`font-sans min-h-screen transition-colors duration-700 selection:bg-gray-500/30 ${isDark ? 'bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>

                {isVaultOpen && (
                    <SecureContact
                        isOpen={isVaultOpen}
                        onClose={() => setIsVaultOpen(false)}
                        isDark={isDark}
                    />
                )}

                <TerminalOverlay isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />

                <Navbar
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    openTerminal={() => setIsTerminalOpen(true)}
                    openVault={handleOpenVault}
                />

                {RESUME ? (
                    <Routes>
                        <Route path="/" element={<Home isDark={isDark} resumeData={RESUME} />} />
                        <Route path="/stories" element={<Stories isDark={isDark} onOpenStory={handleOpenStory} />} />
                    </Routes>
                ) : (
                    <div className="p-20 text-center text-red-500 font-mono">Error: System Data Corrupted.</div>
                )}

                <Footer isDark={isDark} openVault={handleOpenVault} />
            </div>
        </BrowserRouter>
    );
};

export default App;