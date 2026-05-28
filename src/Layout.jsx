import React from 'react';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import Navbar from './Components/Sections/Navbar';
import Footer from './Components/Sections/Footer';
import Preloader from './Components/UI/Preloader';
import SecureContact from './Components/UI/SecureContact';
import TerminalOverlay from './Components/UI/TerminalOverlay';
import StoryModal from './Components/UI/StoryModal';
import FloatingChat from './Components/UI/FloatingChat';

const Layout = ({
    children,
    isDark,
    toggleTheme,
    loading,
    setLoading,
    isVaultOpen,
    setIsVaultOpen,
    isTerminalOpen,
    setIsTerminalOpen,
    selectedStory,
    onCloseStory,
    activeSection,
    setActiveSection,
    handleOpenVault
}) => {
    return (
        <>
            {loading && <Preloader onComplete={() => setLoading(false)} />}

            {/* Story Modal Overlay */}
            {selectedStory && (
                <StoryModal story={selectedStory} onClose={onCloseStory} isDark={isDark} />
            )}

            <div className={`font-sans min-h-screen transition-colors duration-700 selection:bg-gray-500/30 ${isDark ? 'dark bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>

                {isVaultOpen && (
                    <SecureContact
                        isOpen={isVaultOpen}
                        onClose={() => setIsVaultOpen(false)}
                        isDark={isDark}
                    />
                )}

                <TerminalOverlay isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />

                {!loading && !isVaultOpen && !isTerminalOpen && (
                    <Navbar
                        activeSection={activeSection}
                        setActiveSection={setActiveSection}
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        openTerminal={() => setIsTerminalOpen(true)}
                        openVault={handleOpenVault}
                        closeStory={onCloseStory}
                    />
                )}

                {/* Main Content Area */}
                <main className="min-h-screen">
                    {children}
                </main>

                <Footer isDark={isDark} openVault={handleOpenVault} />
                <FloatingChat 
                    isDark={isDark} 
                    onOpenTerminal={() => setIsTerminalOpen(true)}
                    onOpenVault={handleOpenVault}
                />
            </div>
            <Analytics />
            <SpeedInsights />
        </>
    );
};

export default Layout;
