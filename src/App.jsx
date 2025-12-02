import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
// FIX: Changed from 'supabase' to 'firebase' to match your actual backend
import { auth } from './Utils/firebase'; 

// Using your Capitalized folder structure
import LensHero from './Components/Hero/LensHero';
import Navbar from './Components/Layout/Navbar';
import About from './Sections/About';
import Projects from './Sections/Projects';
import Experience from './Sections/Experience';
import Achievements from './Sections/Achievements';
import Footer from './Components/Layout/Footer';
import Preloader from './Components/UI/Preloader';
import SecureVault from './Components/UI/SecureVault';
import TerminalOverlay from './Components/UI/TerminalOverlay';
import { RESUME } from './Data/resume';

const App = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(true); 

    useEffect(() => {
        // Only run auth check if auth is initialized successfully
        if (auth) {
             const unsub = onAuthStateChanged(auth, setUser);
             signInAnonymously(auth).catch(console.error);
             return () => unsub();
        }
    }, []);

    const toggleTheme = () => setIsDark(!isDark);
    const handleOpenVault = () => setIsVaultOpen(true);

    return (
        <>
            {loading && <Preloader onComplete={() => setLoading(false)} />}
            
            <div className={`font-sans min-h-screen transition-colors duration-700 selection:bg-gray-500/30 ${isDark ? 'bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>
                
                {isVaultOpen && (
                    <SecureVault 
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

                <LensHero isDark={isDark} />
                
                {RESUME ? (
                    <main className={`relative z-10 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
                        <About resumeData={RESUME} />
                        <Projects resumeData={RESUME} isDark={isDark} />
                        <Experience resumeData={RESUME} isDark={isDark} />
                        <Achievements resumeData={RESUME} isDark={isDark} />
                    </main>
                ) : (
                    <div className="p-20 text-center text-red-500 font-mono">Error: System Data Corrupted.</div>
                )}

                <Footer isDark={isDark} />
            </div>
        </>
    );
};

export default App;