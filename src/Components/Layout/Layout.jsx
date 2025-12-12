import React from 'react';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import Navbar from './Navbar';
import Footer from './Footer';
import Preloader from '../UI/Preloader';
import SecureContact from '../UI/SecureContact';
import TerminalOverlay from '../UI/TerminalOverlay';
import StoryModal from '../UI/StoryModal';

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

            <div className={`font-sans min-h-screen transition-colors duration-700 selection:bg-gray-500/30 ${isDark ? 'bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}>

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
                    />
                )}

                {/* Main Content Area */}
                <main className="min-h-screen">
                    {children}
                </main>

                <Footer isDark={isDark} openVault={handleOpenVault} />
            </div>
            <Analytics />
        </>
    );
};

export default Layout;
