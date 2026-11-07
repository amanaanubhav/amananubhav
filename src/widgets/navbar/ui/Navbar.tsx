'use client';

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
} from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react';
import { Lock, Moon, Sun, Terminal } from 'lucide-react';
import { openTerminal } from '@/features/ai-terminal';
import { closeStory, useSelectedStory } from '@/features/read-story';
import { openVault } from '@/features/secure-vault';
import { MOTION, ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { useStageHold } from '@/shared/lib/stage-prefetch';
import { scrollToTop } from '@/shared/lib/smooth-scroll';
import { runThemeSweep, useTheme } from '@/shared/lib/theme';
import { RidgeMark } from '@/shared/ui/ridge-mark';
import { NAV_ITEMS, navItemCurrent } from '../config/nav-items';
import { isKeyboardFocus } from '../lib/is-keyboard-focus';
import { useHideOnScroll } from '../model/use-hide-on-scroll';
import { useLiquidHover } from '../model/use-liquid-hover';
import { usePageFitsViewport } from '../model/use-page-fits-viewport';
import { LiquidHover } from './LiquidHover';
import styles from './Navbar.module.css';

/** The bar tightens (44 px, wordmark folded into the mark) once the page is past the hero: 75% of a viewport. */
const COMPACT_AFTER_VH = 0.75;

/** Show: a soft liquid spring with a little give. Hide: the same spring without overshoot, a touch quicker. */
const SHOW: Transition = {
  type: 'spring',
  visualDuration: 0.42,
  bounce: 0.18,
  opacity: { duration: MOTION.dur.hover, ease: MOTION.bezier.settle },
};
const HIDE: Transition = {
  type: 'spring',
  visualDuration: 0.3,
  bounce: 0,
  opacity: { duration: MOTION.dur.hover, ease: MOTION.bezier.depart },
};
/** The droplet glides between links (and the theme icon turns) with the same liquid give. */
const GLIDE: Transition = { type: 'spring', visualDuration: 0.4, bounce: 0.2 };

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

function isCompactScroll(y: number): boolean {
  return typeof window !== 'undefined' && y > window.innerHeight * COMPACT_AFTER_VH;
}

/**
 * Every control in the bar: a 40 px hit area whose visible shapes (bead, pill, hover drop, static wash) sit inset
 * inside it, so the glass keeps even breathing room around them (Navbar.module.css `--bead-inset`).
 */
const CONTROL = cn(
  styles.ctl,
  'relative inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full',
  'font-ui transition-colors duration-hover ease-settle',
  // The ring is the global one (2 px focus-ring); it hugs the 40 px control so it never runs into the glass rim
  // or a neighbour, and reads as a solid ring outside the current link's 1 px bead rim (C-15).
  'focus-visible:outline-offset-0',
);

// The type-scale class stays outside cn(): tailwind-merge would read `text-ui` as a color.
const NAV_LINK =
  'text-ui ' +
  cn(
    CONTROL,
    'font-medium text-ink-muted hover:text-ink',
    'aria-[current=page]:text-ink aria-[current=true]:text-ink',
    'sm:px-2.5 sm:[--inset-x:0px] lg:px-3',
  );

/** An action control; extra classes merge here so `text-ui` never passes through cn(). */
const action = (...extra: Parameters<typeof cn>) =>
  'text-ui ' + cn(CONTROL, 'font-semibold text-ink', ...extra);

/**
 * The main navbar (§H.1, liquid-glass redesign): a stadium of frosted glass floating 8 px under the top edge,
 * centred, 48 px tall (44 px once past the hero), so it occupies the same 56 px band as the old strip.
 * The glass is the shared `.glass-chrome` material (fill, blur, rim, light and every fallback); Navbar.module.css adds
 * only the pill's own wet sheen, refractive rim and the hover drop.
 * The `<header>` is a click-through full-width band that carries `data-chrome` (the summit-hold dim, §C.8)
 * and z-navbar (above the story reader); the glass inside it springs in and out. Hides on scroll down and
 * shows on scroll up or near the top (`useHideOnScroll`, unchanged), and always shows while keyboard focus is
 * inside it (so a focus ring is never obscured), while a story is open and on a page too short to scroll.
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
  // The server renders the full bar; the real scroll position is read after hydration (a first render that read
  // it would not match the server's markup on a deep link such as /#next). A layout effect, so a navbar that
  // remounts mid-page (after an overlay closes) is compact before its first paint.
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the scroll position only exists on the client
    setCompact(isCompactScroll(window.scrollY));
  }, []);
  const [focusWithin, setFocusWithin] = useState(false);
  // <MotionConfig reducedMotion="user"> covers the transitions; the liquid hover drives motion values directly,
  // so it reads the OS setting itself (§C.4).
  const osReduce = useReducedMotion() ?? false;
  const liquid = useLiquidHover(osReduce, pathname);
  // A page that cannot scroll (e.g. /admin-chat) gives the hide-on-scroll hook nothing to read: always show there.
  const pageFits = usePageFitsViewport(pathname);
  // No link prefetch while the home stage holds the network for its 3D chunk (load-in-3d §10), and never for
  // the current route. A flip re-mounts each link's prefetch, so links in view prefetch once it is released.
  const held = useStageHold();
  const prefetchFor = (href: string) => (held || href === pathname ? false : undefined);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setCompact(isCompactScroll(y));
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

  const shown = visible || focusWithin || isReading || pageFits;
  const themeLabel = isDark ? 'Switch to day' : 'Switch to night';
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <header
      data-chrome=""
      onFocus={onFocus}
      onBlur={onBlur}
      // A pointer press inside the bar ends keyboard mode: the button keeps focus but no longer pins the bar.
      onPointerDown={() => setFocusWithin(false)}
      // A click-through band: only the glass takes pointer events. Its opacity stays with CSS (the §C.8 dim),
      // so the motion values live on the glass below, never on this `data-chrome` root. Mounted under the first-load
      // curtain (nothing mounts at its exit) and never visible or focusable until the climb leaves.
      className="pointer-events-none fixed inset-x-0 top-0 z-navbar px-2 pt-2 min-[400px]:px-3 sm:px-4 [html[data-boot=run]_&]:invisible"
    >
      <motion.div
        initial={{ y: '-150%', opacity: 0, scale: 0.94 }}
        animate={shown ? { y: '0%', opacity: 1, scale: 1 } : { y: '-150%', opacity: 0, scale: 0.94 }}
        transition={shown ? SHOW : HIDE}
        style={{ transformOrigin: '50% 0%' }}
        data-liquid={liquid.active ? '' : undefined}
        data-compact={compact ? '' : undefined}
        {...liquid.handlers}
        className={cn(
          'glass-chrome',
          styles.glass,
          'pointer-events-auto mx-auto flex items-center rounded-full',
          'w-full justify-between px-0.5 min-[360px]:gap-0.5 min-[360px]:px-1 min-[400px]:gap-1',
          'sm:w-fit sm:justify-center sm:px-1.5',
          compact ? 'h-11 sm:px-1' : 'h-12',
        )}
      >
        <LiquidHover values={liquid.values} dropRef={liquid.dropRef} />

        <Link
          href={ROUTES.home}
          prefetch={prefetchFor(ROUTES.home)}
          data-liquid-target=""
          aria-label="Aman Anubhav, home"
          onClick={(event) => onLinkClick(event, ROUTES.home)}
          className={action('max-[399px]:hidden sm:ps-2.5', compact ? 'sm:pe-2.5' : 'sm:pe-3.5')}
        >
          <RidgeMark size={22} lit className="shrink-0 text-ink" />
          <span
            aria-hidden="true"
            data-collapsed={compact ? '' : undefined}
            className={cn(styles.wordmark, 'max-sm:!hidden')}
          >
            <span className="font-semibold">Aman Anubhav</span>
          </span>
        </Link>

        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-ink/spec sm:block" />

        <nav aria-label="Main">
          <ul className="m-0 flex list-none items-center p-0 min-[360px]:gap-0.5 min-[400px]:gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const current = navItemCurrent(item, pathname);
              return (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    prefetch={prefetchFor(item.link)}
                    aria-current={current}
                    data-liquid-target=""
                    onClick={(event) => onLinkClick(event, item.link)}
                    className={NAV_LINK}
                  >
                    {current !== undefined ? (
                      <motion.span
                        layoutId="nav-active"
                        transition={GLIDE}
                        aria-hidden="true"
                        className={styles.bead}
                      />
                    ) : null}
                    <Icon
                      aria-hidden="true"
                      focusable="false"
                      className="relative size-5 sm:hidden"
                      strokeWidth={1.75}
                    />
                    <span className="relative max-sm:sr-only">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <span aria-hidden="true" className="hidden h-5 w-px shrink-0 bg-ink/spec sm:block" />

        <div className="flex items-center min-[360px]:gap-0.5 min-[400px]:gap-1">
          <button
            type="button"
            data-liquid-target=""
            aria-label={themeLabel}
            title={themeLabel}
            onClick={() => runThemeSweep(toggleTheme, { toDay: isDark })}
            className={action('w-10')}
          >
            {/* The turning icon is clipped by its own box, not the button's, so the touch hit area (::after) is not. */}
            <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full">
              <AnimatePresence initial={false}>
                <motion.span
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={GLIDE}
                  className="absolute inset-0 grid place-items-center"
                >
                  <ThemeIcon aria-hidden="true" focusable="false" className="size-5" strokeWidth={1.75} />
                </motion.span>
              </AnimatePresence>
            </span>
          </button>

          <button
            type="button"
            onClick={openTerminal}
            data-liquid-target=""
            data-return-focus="nav-terminal"
            aria-haspopup="dialog"
            aria-label="Ask: open the AI terminal"
            title="Open the AI terminal"
            className={action('lg:px-[15px]')}
          >
            <Terminal aria-hidden="true" focusable="false" className="size-5 shrink-0" strokeWidth={1.75} />
            <span aria-hidden="true" className="hidden lg:inline">
              Ask
            </span>
          </button>

          {/* The label shows from 1024 px, not 640 (§H.1 deviation for §J.3): below it the bar would not fit. */}
          <button
            type="button"
            onClick={openVault}
            data-liquid-target=""
            data-return-focus="nav-vault"
            aria-haspopup="dialog"
            title="Vault"
            className={action(styles.pill, 'max-lg:w-10 max-lg:gap-0 lg:px-4')}
          >
            <Lock aria-hidden="true" focusable="false" className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="max-lg:sr-only">Vault</span>
          </button>
        </div>
      </motion.div>
    </header>
  );
}
