'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react';

import { closeTerminal, openTerminal, TerminalOverlay, useTerminalOpen } from '@/features/ai-terminal';
import { StoryReaderHost, useSelectedStory } from '@/features/read-story';
import { closeVault, openVault, SecureVault, useVaultOpen } from '@/features/secure-vault';
import { FloatingChat } from '@/features/visitor-chat';
import { ROUTES, THEME_PALETTE } from '@/shared/config';
import { signalBootReady, useBootPhase } from '@/shared/lib/boot';
import { useChromeProximity } from '@/shared/lib/chrome';
import { cn } from '@/shared/lib/cn';
import { useBodyScrollLock } from '@/shared/lib/dom';
import { ScrollTrigger } from '@/shared/lib/gsap';
import { useMotionTier } from '@/shared/lib/motion-tier';
import { scrollToTarget, useScrollLocked, useSmoothScrollRoot } from '@/shared/lib/smooth-scroll';
import { useTheme } from '@/shared/lib/theme';
import { StageCanvas } from '@/shared/ui/stage';
import { Footer } from '@/widgets/footer';
import { Navbar } from '@/widgets/navbar';

import { RouteScrollSync } from './RouteScrollSync';
import { ThemeEdge } from './ThemeEdge';

const noopSubscribe = () => () => {};
const readSaveData = () =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const serverSaveData = () => false;

/** Night/Day on `<html data-theme>` and the browser bar color (§C.1, §B.9). Layout effect, so a
 * theme sweep's flushSync commit carries the new attribute into the new view. */
function useThemeAttributeSync(isDark: boolean): void {
  useLayoutEffect(() => {
    const theme = isDark ? 'night' : 'day';
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_PALETTE[theme].ground);
  }, [isDark]);
}

/**
 * The app shell (§C.9). DOM order and overlay gating are unchanged from the legacy layout: story
 * reader (outside the .dark wrapper), then the themed wrapper with the skip link, the stage canvas,
 * vault?, terminal, navbar?, the single <main>, footer, chat? and the theme-sweep edge. The paper grain
 * is body::before (z-grain), switched by `html[data-grain]`.
 *
 * The first-load curtain (the climb, widgets/preloader) is not part of React: RootLayout renders its
 * skeleton and a script runs it. The shell follows its phase: the chrome is mounted but hidden under it, the stage
 * runs once it leaves, and on '/' the stage loads under it so the relief can rise as it clears (preloader design §6.1).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const tier = useMotionTier();
  const isHome = pathname === ROUTES.home;
  const bootPhase = useBootPhase();
  const booted = bootPhase !== 'run';
  const isVaultOpen = useVaultOpen();
  const isTerminalOpen = useTerminalOpen();
  const isReading = useSelectedStory() !== null;
  const scrollLocked = useScrollLocked();
  const saveData = useSyncExternalStore(noopSubscribe, readSaveData, serverSaveData);

  const isAdminRoute = pathname === ROUTES.adminChat;
  // The chrome stays mounted under the curtain (hidden by CSS while html[data-boot=run]), so nothing mounts at its
  // exit and the fade and the rise keep the main thread to themselves.
  const showChrome = !isVaultOpen && !isTerminalOpen;
  const grainEnabled = tier > 0 && !isAdminRoute && !saveData;
  // The home scene loads and compiles under the curtain (its entrance clock waits for boot); elsewhere the
  // stage waits until the curtain leaves.
  const stagePaused = (!booted && !isHome) || isVaultOpen || isTerminalOpen || isReading || scrollLocked;

  // Hydrated: the curtain may arrive (with the fonts and, on '/', the stage).
  useEffect(() => signalBootReady('app'), []);

  // Once the curtain has gone (not at its exit, where the fade and the rise need every frame).
  const bootGone = bootPhase === 'done';
  useEffect(() => {
    if (!bootGone) return;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [bootGone]);

  useSmoothScrollRoot(tier > 0 && !isAdminRoute);
  useBodyScrollLock(isVaultOpen || isTerminalOpen);
  useThemeAttributeSync(isDark);
  useChromeProximity();

  useEffect(() => {
    document.documentElement.dataset.tier = String(tier); // QA and debugging only; no CSS depends on it
  }, [tier]);

  // Paper grain (§B.6): drawn by `html[data-grain='on'] body::before` in globals.css, so it is never an LCP
  // candidate (a full-viewport div was, §J.2).
  useEffect(() => {
    const root = document.documentElement;
    if (!grainEnabled) return;
    root.dataset.grain = 'on';
    return () => {
      delete root.dataset.grain;
    };
  }, [grainEnabled]);

  const skipToContent = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById('content');
    if (!main) return;
    event.preventDefault();
    main.focus({ preventScroll: true });
    scrollToTarget(main, { immediate: true });
  }, []);

  return (
    <>
      <StoryReaderHost />

      <div className={cn('min-h-screen', isDark && 'dark')}>
        {/* Inert with the page it targets: while a story is open, #content cannot take focus. */}
        <a href="#content" className="skip-link" onClick={skipToContent} inert={isReading}>
          Skip to content
        </a>

        <StageCanvas paused={stagePaused} isDark={isDark} />

        {isVaultOpen && <SecureVault onClose={closeVault} />}

        <TerminalOverlay isOpen={isTerminalOpen} onClose={closeTerminal} />

        {showChrome && <Navbar />}

        {/*
          One z-content layer for the page and the footer, above the stage and grain. <main> opens no
          stacking context of its own, so its fixed children (waypoint rail, mobile chip, progress) stack
          by their own z against the footer (z-content inside this layer) instead of under it. Reader,
          navbar, terminal and vault stay above the whole layer.
          While a story is open the page behind it is inert; the navbar, terminal and vault stay live.
        */}
        <div className="relative z-content">
          <main id="content" tabIndex={-1} inert={isReading} className="relative focus:outline-none">
            {children}
          </main>

          <div className="contents" inert={isReading}>
            <Footer />
          </div>
        </div>
        {/* The chat is on every public page; /admin-chat is his own inbox. */}
        {showChrome && !isAdminRoute && (
          <div className="contents" inert={isReading}>
            <FloatingChat onOpenTerminal={openTerminal} onOpenVault={openVault} />
          </div>
        )}

        <ThemeEdge />
        <RouteScrollSync />
      </div>
    </>
  );
}
