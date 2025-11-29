import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './Utils/supabase';

// Components
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
  const [isVaultOpen, setIsVaultOpen] = useState(false); // State to control Vault visibility
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Theme State - Defaults to Dark
  const [isDark, setIsDark] = useState(true); 

  useEffect(() => {
    if (auth) {
      const unsub = onAuthStateChanged(auth, setUser);
      signInAnonymously(auth).catch(console.error);
      return () => unsub();
    }
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const handleOpenVault = () => {
    console.log("Opening Vault..."); // Debugging log
    setIsVaultOpen(true);
  };

  return (
    <>
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      
      <div className={`font-sans min-h-screen transition-colors duration-700 selection:bg-gray-500/30 ${isDark ? 'bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>
        
        {/* Secure Vault Modal - Only renders when isVaultOpen is true */}
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
            openVault={handleOpenVault} // Pass the handler function
        />

        <LensHero isDark={isDark} />
        
        {RESUME ? (
            <main className={`relative z-10 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
                <About resumeData={RESUME} />
                <Projects resumeData={RESUME} isDark={isDark} />
                <Experience resumeData={RESUME} isDark={isDark} />
                <Achievements resumeData={RESUME} />
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