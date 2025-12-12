import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './Utils/firebase';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout
import Layout from './Components/Layout/Layout';

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
            <Layout
                isDark={isDark}
                toggleTheme={toggleTheme}
                loading={loading}
                setLoading={setLoading}
                isVaultOpen={isVaultOpen}
                setIsVaultOpen={setIsVaultOpen}
                isTerminalOpen={isTerminalOpen}
                setIsTerminalOpen={setIsTerminalOpen}
                selectedStory={selectedStory}
                onCloseStory={handleCloseStory}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                handleOpenVault={handleOpenVault}
            >
                {RESUME ? (
                    <Routes>
                        <Route path="/" element={<Home isDark={isDark} resumeData={RESUME} />} />
                        <Route path="/stories" element={<Stories isDark={isDark} onOpenStory={handleOpenStory} />} />
                    </Routes>
                ) : (
                    <div className="p-20 text-center text-red-500 font-mono">Error: System Data Corrupted.</div>
                )}
            </Layout>
        </BrowserRouter>
    );
};

export default App;
