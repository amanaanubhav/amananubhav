'use client';

import { useCallback, useState, type ReactNode } from 'react';

import { closeTerminal, openTerminal, TerminalOverlay, useTerminalOpen } from '@/features/ai-terminal';
import { StoryReaderHost } from '@/features/read-story';
import { closeVault, openVault, SecureVault, useVaultOpen } from '@/features/secure-vault';
import { FloatingChat } from '@/features/visitor-chat';
import { useTheme } from '@/shared/lib/theme';
import { Footer } from '@/widgets/footer';
import { Navbar } from '@/widgets/navbar';
import { Preloader } from '@/widgets/preloader';

/**
 * Replaces legacy Layout.jsx + App.jsx state. DOM order and wrapper classes are unchanged:
 * Preloader?, story reader (outside .dark), then the themed wrapper with vault?, terminal,
 * navbar?, the single <main>, footer and floating chat?.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const finishBoot = useCallback(() => setLoading(false), []);
  const isVaultOpen = useVaultOpen();
  const isTerminalOpen = useTerminalOpen();
  const showChrome = !loading && !isVaultOpen && !isTerminalOpen;

  return (
    <>
      {loading && <Preloader onComplete={finishBoot} />}

      <StoryReaderHost />

      <div
        className={`font-sans min-h-screen transition-colors duration-700 selection:bg-gray-500/30 ${isDark ? 'dark bg-black text-zinc-400' : 'bg-white text-zinc-600'}`}
      >
        {isVaultOpen && <SecureVault onClose={closeVault} />}

        <TerminalOverlay isOpen={isTerminalOpen} onClose={closeTerminal} />

        {showChrome && <Navbar />}

        <main className="min-h-screen">{children}</main>

        <Footer />
        {showChrome && <FloatingChat onOpenTerminal={openTerminal} onOpenVault={openVault} />}
      </div>
    </>
  );
}
