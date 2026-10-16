'use client';

import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react';
import { Lock, Moon, Sun, Terminal } from 'lucide-react';
import { openTerminal } from '@/features/ai-terminal';
import { closeStory, useSelectedStory } from '@/features/read-story';
import { openVault } from '@/features/secure-vault';
import { MOTION, ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { useReducedMotionPreference } from '@/shared/lib/motion-tier';
import { scrollToTop } from '@/shared/lib/smooth-scroll';
import { runThemeSweep, useTheme } from '@/shared/lib/theme';
import { Button, IconButton } from '@/shared/ui/button';
import { TrigMark } from '@/shared/ui/trig-mark';
import { NAV_ITEMS, navItemCurrent } from '../config/nav-items';
import { useHideOnScroll } from '../model/use-hide-on-scroll';

/** The 1 px bottom rule appears once the page has moved (§B.6). */
const EDGE_AFTER_PX = 8;

/** Plain left clicks are taken over; modified clicks (new tab, new window) keep the browser's behavior. */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

// The type-scale class stays outside cn(): tailwind-merge would read `text-ui` as a color.
const NAV_LINK =
  'text-ui ' +
  cn(
    'relative inline-flex h-10 min-w-10 items-center justify-center rounded-control font-body font-medium',
    'text-ink-muted transition-colors duration-hover ease-settle hover:text-ink aria-[current=page]:text-ink aria-[current=true]:text-ink',
    'sm:px-2',
  );

const ACTION_SIZE = 'size-10 [@media(pointer:coarse)]:size-10';

/**
 * True when the focused element shows a keyboard focus ring. Focus that follows a mouse click or a tap does not
 * match `:focus-visible`, so it must not pin the navbar open (§J.4 item 1, §C.8 chrome dim). Browsers without
 * the selector count every focus, which keeps keyboard focus from being obscured.
 */
function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * The running head (§H.1): a full-width 56 px strip fixed at the top, above the story reader (z 95).
 * Hides on scroll down and shows on scroll up or near the top (`useHideOnScroll`, unchanged), and
 * always shows while keyboard focus is inside it (so a focus ring is never obscured) and while a story is open.
 * Focus left by a mouse click or tap does not count: the strip still hides on the next scroll down.
 */
export function Navbar() {
  const visible = useHideOnScroll();
  // The window cannot scroll while a story is open, so a navbar hidden before it opened would stay hidden
  // and leave the reader's top strip empty: it always shows while reading (§J.4 item 3).
  const isReading = useSelectedStory() !== null;
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { scrollY } = useScroll();
  // The navbar remounts after an overlay closes, possibly mid-page: start from the real scroll position.
  const [edged, setEdged] = useState(() => typeof window !== 'undefined' && window.scrollY > EDGE_AFTER_PX);
  const [focusWithin, setFocusWithin] = useState(false);
  // The OS setting is covered by <MotionConfig reducedMotion="user">; the footer switch is not (§C.4).
  const [forcedReduce] = useReducedMotionPreference();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setEdged(y > EDGE_AFTER_PX);
  });

  // The jump to the top starts once the new route has committed, not in the click: Lenis's own window click
  // listener (`stopInertiaOnNavigate`, §C.2) runs after this handler and resets a scroll started in the click,
  // and a scroll started before the history push would also be saved as the old page's back/forward position.
  const scrollTopOnArrival = useRef(false);
  useEffect(() => {
    if (!scrollTopOnArrival.current) return;
    scrollTopOnArrival.current = false;
    scrollToTop();
  }, [pathname]);

  const handleNavigation = useCallback(
    (link: string) => {
      closeStory();
      if (link === pathname) {
        // Same page: no route change and no Lenis reset; jump on the next frame.
        requestAnimationFrame(() => scrollToTop());
        return;
      }
      scrollTopOnArrival.current = true;
      router.push(link, { scroll: false });
    },
    [router, pathname],
  );

  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>, link: string) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    handleNavigation(link);
  };

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    setFocusWithin(isKeyboardFocus(event.target));
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
  };

  const shown = visible || focusWithin || isReading;

  return (
    <motion.header
      data-chrome=""
      initial={{ y: '-100%' }}
      animate={{ y: shown ? '0%' : '-100%' }}
      transition={forcedReduce ? { duration: 0 } : { duration: MOTION.dur.ui, ease: MOTION.bezier.glide }}
      onFocus={onFocus}
      onBlur={onBlur}
      // A pointer press inside the strip ends keyboard mode: the button keeps focus but no longer pins the strip.
      onPointerDown={() => setFocusWithin(false)}
      className={cn(
        'fixed inset-x-0 top-0 z-navbar h-14 border-b bg-ground',
        // Opacity is listed so the summit-hold dim (§C.8) fades back over 300 ms instead of snapping.
        '[transition:border-color_180ms_var(--ease-settle),opacity_300ms_var(--ease-settle)]',
        edged ? 'border-line' : 'border-transparent',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-full max-w-content items-center justify-between',
          'gap-1 px-4 max-[399px]:gap-0.5 max-[399px]:px-3',
          'sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6 lg:px-8',
        )}
      >
        <Link
          href={ROUTES.home}
          aria-label="Aman Anubhav, home"
          onClick={(event) => onLinkClick(event, ROUTES.home)}
          className={cn(
            'inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-control text-ink',
            'max-[399px]:hidden sm:justify-self-start sm:justify-start sm:pe-1',
          )}
        >
          <TrigMark size={20} className="shrink-0 text-signal" />
          <span
            className="hidden font-display text-ui font-semibold [font-variation-settings:'wdth'_100] sm:inline"
            aria-hidden="true"
          >
            Aman Anubhav
          </span>
        </Link>

        <nav aria-label="Main" className="sm:justify-self-center">
          <ul className="m-0 flex list-none items-center gap-1 p-0 max-[399px]:gap-0.5 lg:gap-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const current = navItemCurrent(item, pathname);
              const active = current !== undefined;
              return (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    aria-current={current}
                    onClick={(event) => onLinkClick(event, item.link)}
                    className={NAV_LINK}
                  >
                    <Icon aria-hidden="true" focusable="false" className="size-5 sm:hidden" strokeWidth={1.75} />
                    <span className="max-sm:sr-only">{item.name}</span>
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        transition={forcedReduce ? { duration: 0 } : MOTION.spring}
                        aria-hidden="true"
                        className="absolute inset-x-2 bottom-[3px] h-0.5 bg-signal forced-colors:bg-[CanvasText]"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1 max-[399px]:gap-0.5 sm:justify-self-end sm:gap-2">
          <IconButton
            size={40}
            icon={isDark ? Sun : Moon}
            label={isDark ? 'Switch to day' : 'Switch to night'}
            onClick={() => runThemeSweep(toggleTheme, { toDay: isDark })}
            className={ACTION_SIZE}
          />

          <button
            type="button"
            onClick={openTerminal}
            data-return-focus="nav-terminal"
            aria-label="Ask: open the AI terminal"
            title="Open the AI terminal"
            className={
              'text-ui ' +
              cn(
                'inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-control border border-transparent',
                'bg-transparent font-display font-semibold text-ink',
                'transition-[background-color,border-color,transform] duration-hover ease-settle',
                'hover:bg-surface-2 active:scale-[0.98] active:duration-micro',
                'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal',
                'lg:px-3',
              )
            }
          >
            <Terminal aria-hidden="true" focusable="false" className="size-5 shrink-0" strokeWidth={1.75} />
            <span aria-hidden="true" className="hidden lg:inline">
              Ask
            </span>
          </button>

          {/* The label shows from 1024 px, not 640 (§H.1 deviation for §J.3): with it the right group is about
              267 px and the strip would scroll horizontally below about 770 px. */}
          <Button
            variant="secondary"
            icon={Lock}
            onClick={openVault}
            data-return-focus="nav-vault"
            title="Secure contact"
            className="h-10 shrink-0 max-lg:w-10 max-lg:gap-0 max-lg:px-0 lg:px-4"
          >
            <span className="max-lg:sr-only">Secure contact</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
