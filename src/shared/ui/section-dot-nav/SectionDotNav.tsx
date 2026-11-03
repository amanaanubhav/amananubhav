'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { CHROME, MOTION } from '@/shared/config';
// clsx, not cn: nothing here needs merging, and every class below is meant to apply as written.
import { clsx } from 'clsx';
import { useMediaQuery } from '@/shared/lib/dom';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { scrollToTarget } from '@/shared/lib/smooth-scroll';

import { dockSlotInUse, registerDockSlot } from './dock-slot';

export type SectionNavItem = {
  readonly id: string;
  readonly label: string;
  readonly altitudeM?: number;
  readonly waypoint?: string;
  readonly approx?: boolean;
  readonly kind?: 'waypoint' | 'interpolated' | 'planned';
};

export interface SectionDotNavProps {
  sections: readonly SectionNavItem[];
  /** e.g. 'Altitude: Annapurna Circuit, solo, 2026'. */
  track?: { caption: string };
  /** Default 'Sections on this page'. */
  label?: string;
}

const nf = new Intl.NumberFormat('en');
const fmt = (m: number) => nf.format(Math.round(m));
const hasAltitude = (s: SectionNavItem | undefined): s is SectionNavItem & { altitudeM: number } =>
  !!s && typeof s.altitudeM === 'number' && Number.isFinite(s.altitudeM);

/**
 * "Origin, Khudi, about 790 metres" when altitude data exists, else the label. The visible label
 * leads, so the name contains what is shown (WCAG 2.5.3 label in name).
 */
function accessibleName(s: SectionNavItem): string {
  const place = `${s.waypoint ?? s.label}${s.kind === 'planned' ? ' (planned)' : ''}`;
  if (hasAltitude(s)) return `${s.label}, ${place}, ${s.approx ? 'about ' : ''}${fmt(s.altitudeM)} metres`;
  if (s.kind === 'planned' && s.waypoint) return `${s.label}, ${place}`;
  return s.label;
}

interface Reading {
  /** The waypoint, "Chame". */
  readonly place: string;
  /** The datum, "~2,670 m" or "planned": never truncated. */
  readonly value: string;
  readonly planned: boolean;
  /** One line, "Chame ~2,670 m" or "Darwa Top, planned". */
  readonly text: string;
  /** "Chame, about 2,670 metres". */
  readonly spoken: string;
}

/** The waypoint and its altitude (or "planned"); null for a section without either. */
function readout(s: SectionNavItem | undefined): Reading | null {
  if (!s) return null;
  const place = s.waypoint ?? s.label;
  if (s.kind === 'planned') {
    return { place, value: 'planned', planned: true, text: `${place}, planned`, spoken: `${place}, planned` };
  }
  if (!hasAltitude(s)) return null;
  const value = `${s.approx ? '~' : ''}${fmt(s.altitudeM)} m`;
  return {
    place,
    value,
    planned: false,
    text: `${place} ${value}`,
    spoken: `${place}, ${s.approx ? 'about ' : ''}${fmt(s.altitudeM)} metres`,
  };
}

/** Moves keyboard focus to a section after a jump (non-interactive target: no focus ring). */
function focusSection(el: HTMLElement): void {
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1');
    el.style.outline = 'none';
  }
  el.focus({ preventScroll: true });
}

const px = (v: string) => Number.parseFloat(v) || 0;

/** Keys that scroll the page: they end a jump's pin on the chosen section. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/** expo.out, the settle curve (MOTION.ease.settle). */
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** The dock exists below the rail's breakpoint (Tailwind `lg`, CHROME.railFrom). */
const DOCK_QUERY = `(max-width: ${CHROME.railFrom - 0.02}px)`;
/** Hide after this much travel down, show after this much back up (px); a slotted dock returns this long after the last scroll (ms). */
const HIDE_AFTER = 24;
const SHOW_AFTER = 8;
const IDLE_MS = 600;

/** The aquamarine (action) "you are here" mark: the rail's marker, repeated in the chip and on the sheet's current row. */
function HereMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 8"
      className={clsx('block size-2 shrink-0 overflow-visible text-action forced-colors:text-[Highlight]', className)}
    >
      <path d="M0 0.4 7.6 4 0 7.6Z" className="signal-mark fill-current" />
    </svg>
  );
}

/**
 * A rail label's knockout: a glass chip that takes the page light behind it (Update 1.1); solid ground under reduced
 * transparency and more contrast (globals). On / the solid ground knockout stays, over the scene.
 */
const KNOCKOUT =
  'glass-chip [:root:has(#home-title)_&]:bg-ground [:root:has(#home-title)_&]:[-webkit-backdrop-filter:none] [:root:has(#home-title)_&]:[backdrop-filter:none]';

/** Brings the dock back now (a jump, an opening sheet); nothing while there is no dock. */
function showDock(dock: HTMLElement | null): void {
  const html = document.documentElement;
  if (!html.dataset.dock) return;
  html.dataset.dock = 'shown';
  dock?.removeAttribute('data-away');
}

/** Keyboard focus (`:focus-visible`), not a press: a tapped chip must not pin the dock in place. */
function isKeyboardFocus(target: EventTarget | null): target is Element {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * The rail and the dock are portalled into a host placed right after `<main>`, in the shell's z-content layer,
 * so they stack by their own z against the footer (the footer, z 41, slides over z-rail as the last page), and
 * sit between main and the footer in the tab order (§J.1). The host mirrors main's `inert` (the story reader).
 * The server and the first client render keep them inline, so the `#id` links work without JS.
 */
function useRailHost(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const main = document.getElementById('content') ?? document.querySelector('main');
    const el = document.createElement('div');
    el.style.display = 'contents';
    el.setAttribute('data-section-nav-host', '');
    if (main?.parentNode) main.after(el);
    else document.body.append(el);
    let observer: MutationObserver | null = null;
    if (main) {
      const sync = () => {
        el.inert = main.inert;
      };
      sync();
      observer = new MutationObserver(sync);
      observer.observe(main, { attributes: true, attributeFilter: ['inert'] });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the host only exists after mount
    setHost(el);
    return () => {
      observer?.disconnect();
      el.remove();
      setHost(null);
    };
  }, []);
  return host;
}

/**
 * The waypoint rail (§H.2) and the one floating-chrome system around it (SYS-8).
 *
 * From 1024 px: a fixed rail laid out by zones inside its 13rem reserve (`right-6` + `w-40`, CORE-CONTRACT §2.2),
 * from under the navbar band (`--nav-clear` + 2rem) down to above the chat bead and the home legend
 * (`--chat-stack` + `--legend-h` + 1.5rem). The head holds the altimeter (the real altitude of the section you
 * are in), its waypoint and the track caption; the ticks share what is left, evenly, whatever its height. It carries
 * `data-rail`, which keeps the journal grid's content out of that band, so its labels show at rest.
 *
 * Below 1024 px: ONE bottom dock (C-01). A `.glass-chrome` capsule holds the section chip (it opens a non-modal
 * sheet of every section) and the page's own slot (<DockSlot>); the chat bead docks beside it. A ground scrim
 * under the band fades text instead of slicing it. The dock hides on scroll down and returns on scroll up, with
 * keyboard focus inside, at the page's end and while a sheet hangs from it; it never hides under reduced motion. A
 * page with its own controls in the slot (/) also shows it at the top and after 600 ms idle; a page with an empty
 * slot opens with its bar put away and leaves it away at rest, so it never sits over the text (the bead stays). It publishes `html[data-dock]` and `--dock-h` for the bead and the legend
 * (contracts/dock.md) and gives way while the footer rises through its band. A 2 px progress hairline sits at the top.
 *
 * Links are real `#id` anchors (they work without JS); JS scrolls through `scrollToTarget`.
 */
export const SectionDotNav = ({
  sections,
  track,
  label = 'Sections on this page',
}: SectionDotNavProps): ReactElement | null => {
  /** Index of the section you are in; -1 above the first section (an id-less hero). */
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const allowed = useMotionAllowed();
  const sheetId = useId();
  const chipDescId = useId();
  const host = useRailHost();
  /** False on the server and during hydration, so the dock's attributes never flash on a desktop. */
  const isDock = useMediaQuery(DOCK_QUERY);

  const sectionsRef = useRef(sections);
  const hairRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  /** The phone nav (chip and sheet): a press outside it closes the sheet. */
  const mobileRef = useRef<HTMLElement>(null);
  /** The dock's fixed band: its height is `--dock-h`, it carries the scrim and `data-yield`. */
  const dockRef = useRef<HTMLDivElement>(null);
  /** Mirrors `open` for the dock's scroll logic (a sheet hanging from the dock keeps it shown). */
  const openRef = useRef(false);
  /** True from a jump until the scroll it started goes idle: the dock stays while the page glides. */
  const holdRef = useRef(false);
  /**
   * The section chosen by a jump stays current until the user scrolls, or until it leaves the viewport
   * after the jump has brought it into view (`seen`), so short sections stay current when chosen.
   */
  const pinned = useRef<{ index: number; seen: boolean } | null>(null);
  const shown = useRef<number | null>(hasAltitude(sections[0]) && sections[0].kind !== 'planned' ? sections[0].altitudeM : null);
  // The server renders the first section's reading; later values are written by the tween below.
  const [initialValue] = useState(() =>
    hasAltitude(sections[0]) && sections[0].kind !== 'planned' ? fmt(sections[0].altitudeM) : '',
  );

  const idsKey = sections.map((s) => s.id).join('|');
  const anyAltitude = sections.some(hasAltitude);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  // One rAF-throttled scroll listener; the active section is the last whose top is above the centre
  // (none while the page is still above the first one). "Top" is the snap line (top minus
  // scroll-margin-top), so a jump to a section with a large scroll margin marks that section.
  useEffect(() => {
    if (!idsKey) return;
    let raf = 0;
    let margins = new Map<string, number>();
    const readMargins = () => {
      margins = new Map();
      for (const s of sectionsRef.current) {
        const el = document.getElementById(s.id);
        if (el) margins.set(s.id, px(getComputedStyle(el).scrollMarginTop));
      }
    };
    const measure = () => {
      raf = 0;
      const list = sectionsRef.current;
      const mid = window.innerHeight / 2;
      let idx = -1;
      for (let i = 0; i < list.length; i += 1) {
        const el = document.getElementById(list[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - (margins.get(list[i].id) ?? 0) <= mid) idx = i;
        const pin = pinned.current;
        if (pin && pin.index === i) {
          const inView = rect.bottom > 0 && rect.top < window.innerHeight;
          if (inView) pin.seen = true;
          else if (pin.seen) pinned.current = null;
        }
      }
      setActive(pinned.current?.index ?? idx);
      const hair = hairRef.current;
      if (hair) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        hair.style.transform = `scaleX(${p.toFixed(4)})`;
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onResize = () => {
      readMargins();
      schedule();
    };
    // A user scroll (wheel, press or drag, scroll keys) releases a jump's pin and the dock's hold.
    const release = () => {
      pinned.current = null;
      holdRef.current = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) release();
    };
    readMargins();
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('pointerdown', release, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', release);
      window.removeEventListener('pointerdown', release);
      window.removeEventListener('keydown', onKey);
    };
  }, [idsKey, host]);

  // Altimeter: tween to the new altitude over 600 ms (expo.out), written to the text node; jump when
  // motion is off. Planned and altitude-less sections blank the value and keep the last reading.
  useLayoutEffect(() => {
    const el = valueRef.current;
    const item = active >= 0 ? sectionsRef.current[active] : undefined;
    if (!el) return;
    if (!hasAltitude(item) || item.kind === 'planned') {
      el.textContent = '';
      return;
    }
    const to = item.altitudeM;
    const from = shown.current ?? to;
    if (!allowed || from === to) {
      shown.current = to;
      el.textContent = fmt(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const v = from + (to - from) * expoOut(t);
      shown.current = v;
      el.textContent = fmt(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, allowed, idsKey, host]);

  // Sheet: Escape and outside press close it; focus returns to the chip when it was inside.
  useEffect(() => {
    if (!open) return;
    const wrap = mobileRef.current;
    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) chipRef.current?.focus({ preventScroll: true });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (wrap && !wrap.contains(e.target as Node)) close(!!wrap.contains(document.activeElement));
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // A sheet hanging from the dock keeps it shown.
  useEffect(() => {
    openRef.current = open;
    if (open) showDock(dockRef.current);
  }, [open]);

  // The dock contract (CORE-CONTRACT §3c): while the dock exists, `html[data-dock]` and `--dock-h` (its band, from
  // the window's bottom edge to the bar's top edge, safe area included) are on :root. A layout effect, so a route
  // change between two dock pages swaps them before paint and the docked bead never jumps.
  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!isDock || !dock) return;
    const html = document.documentElement;
    // A page with controls in the slot (the home legend's Key) opens with the dock shown. A page with an empty slot
    // opens with its bar put away (`data-away` on the band), so it never rests over the first screen's text; the
    // first scroll back up, keyboard focus or a sheet brings it. Only the bar goes: `html[data-dock]` stays `shown`,
    // so the chat bead (the only way into chat) keeps its place. Reduced motion keeps the bar in place (the dock never
    // travels there).
    const away =
      !dockSlotInUse() &&
      html.dataset.motion !== 'off' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      document.querySelector('[data-dock-hold]') === null;
    html.dataset.dock = 'shown';
    dock.toggleAttribute('data-away', away);
    const publish = () => html.style.setProperty('--dock-h', `${dock.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(dock, { box: 'border-box' });
    return () => {
      observer.disconnect();
      delete html.dataset.dock;
      dock.removeAttribute('data-away');
      html.style.removeProperty('--dock-h');
    };
  }, [isDock, host]);

  // Show and hide. The attribute is the state (a jump or an opening sheet writes it too); the followers (the bead,
  // the legend's slot) move in the same style pass, so the dock moves as one piece.
  useEffect(() => {
    const dock = dockRef.current;
    if (!isDock || !dock) return;
    const html = document.documentElement;
    const main = document.getElementById('content') ?? document.querySelector('main');
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lastY = window.scrollY;
    /** Where the idle clock was last restarted: only real movement restarts it, not Lenis's sub-pixel tail. */
    let idleFrom = lastY;
    let travel = 0;
    let raf = 0;
    let idle = 0;
    let keyboard = false;
    /** The page has its own controls in the slot (sticky: the home legend's Key leaves the slot in some acts). */
    let slotted = false;
    const usesSlot = () => (slotted ||= dockSlotInUse());

    // With controls in the slot the whole dock moves as one piece (`html[data-dock]`: the bar, the bead, the legend's
    // slot). With an empty slot only the bar goes away (`data-away` on the band) and the bead keeps its place, so chat
    // is never off screen at rest.
    const write = (shown: boolean) => {
      const slot = usesSlot();
      const next = shown || !slot ? 'shown' : 'hidden';
      if (html.dataset.dock !== next) html.dataset.dock = next;
      dock.toggleAttribute('data-away', !shown && !slot);
    };
    // With an empty slot the dock does not come back on its own mid-page: at rest it would sit over the text.
    const settle = () => {
      holdRef.current = false;
      travel = 0;
      if (usesSlot()) write(true);
    };
    // Reduced motion keeps only the scrim: the dock never travels.
    const pinnedShown = () =>
      openRef.current ||
      holdRef.current ||
      keyboard ||
      html.dataset.motion === 'off' ||
      reduceQuery.matches ||
      document.querySelector('[data-dock-hold]') !== null;

    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const viewport = window.innerHeight;
      const max = html.scrollHeight - viewport;
      // The footer is the last page and slides over the dock (z 41 over z-rail): the bar and the scrim give way
      // while it rises through their band, instead of being cut by its edge. The bead stays (it is above it). Never
      // while the dock is in use (keyboard focus inside it, an open sheet, a hold): a focused chip must stay on screen
      // (WCAG 2.4.11), and the band then lifts over the footer (has-[:focus-visible] / an expanded control).
      if (main) {
        const end = main.getBoundingClientRect().bottom;
        const inUse =
          (keyboard && dock.contains(document.activeElement)) ||
          openRef.current ||
          document.querySelector('[data-dock-hold]') !== null;
        dock.toggleAttribute('data-yield', !inUse && end < viewport + 24 && end < html.scrollHeight - y - 1);
      }
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(y - idleFrom) >= 4) {
        idleFrom = y;
        window.clearTimeout(idle);
        idle = window.setTimeout(settle, IDLE_MS);
      }
      if (pinnedShown() || y >= max - 2 || (y <= SHOW_AFTER && usesSlot())) {
        travel = 0;
        write(true);
        return;
      }
      if (dy === 0) return;
      if ((dy > 0) !== (travel > 0)) travel = 0;
      travel += dy;
      if (travel > HIDE_AFTER) write(false);
      else if (travel < -SHOW_AFTER) write(true);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    // Keyboard focus in the dock, in its slot or in a follower (`data-dock-follow`, the bead) holds it shown.
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      keyboard = isKeyboardFocus(target) && (dock.contains(target) || target.closest('[data-dock-follow]') !== null);
      if (keyboard) write(true);
      schedule();
    };
    const onFocusOut = () => {
      keyboard = false;
      schedule();
    };

    frame();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(idle);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      dock.removeAttribute('data-yield');
    };
  }, [isDock, host]);

  if (sections.length === 0) return null;

  const n = sections.length;
  const at = Math.min(active, n - 1);
  const current: SectionNavItem | undefined = at >= 0 ? sections[at] : undefined;
  const frac = n > 1 && at > 0 ? at / (n - 1) : 0;
  const reading = readout(current);
  const spring = allowed ? MOTION.spring : { duration: 0 };
  // The sheet: in on the settle curve at the UI duration, out faster (exits about 65% of the entrance).
  const sheetIn: Transition = allowed ? { duration: MOTION.dur.ui, ease: MOTION.bezier.settle } : { duration: 0 };
  const sheetOut: Transition = allowed ? { duration: MOTION.dur.hover, ease: MOTION.bezier.settle } : { duration: 0 };

  const jump = (e: ReactMouseEvent<HTMLAnchorElement>, id: string, fromSheet: boolean) => {
    const el = document.getElementById(id);
    if (!el) return; // let the anchor's default handle it
    e.preventDefault();
    const keyboard = e.detail === 0;
    if (fromSheet) setOpen(false);
    const index = sections.findIndex((s) => s.id === id);
    if (index >= 0) {
      pinned.current = { index, seen: false };
      setActive(index);
    }
    // The dock stays while the page glides to the section (the hold ends when that scroll goes idle).
    holdRef.current = true;
    showDock(dockRef.current);
    // scrollToTarget subtracts the section's scroll-margin-top and the root's scroll-padding-top on both paths
    // (Lenis and the native fallback), so the heading lands under the navbar band, never beneath it.
    scrollToTarget(el);
    if (keyboard) focusSection(el);
  };

  // The visible chip text is its name ("How I work"); the position, the waypoint and its altitude are its description.
  const chipDescription = [current ? `${at + 1} of ${n}` : '', reading?.spoken ?? '', label].filter(Boolean).join('. ');

  const ui = (
    <>
      {/*
        From 1024 px: the waypoint rail, laid out by zones inside its reserve (right-6 + w-40, CORE-CONTRACT §2.2):
        from under the navbar band down to above the chat bead and the home legend (--legend-h, published by the
        legend), so no state of it reaches the legend. The head (altimeter, waypoint, track caption) takes what it
        needs; the ticks share the rest. A size container: the caption stays in the accessibility tree but leaves the
        screen when the rail is too short for it and evenly spaced 32 px ticks (1366 x 680 under the home legend).
        `data-rail` keeps the journal grid's content tracks out of the band, so every label here shows at rest.
      */}
      <nav
        aria-label={label}
        data-chrome=""
        data-rail=""
        className={clsx(
          'group/rail pointer-events-none fixed right-6 z-rail hidden has-[:focus-visible]:z-rail-focus w-40 flex-col items-end lg:flex',
          'top-[calc(var(--nav-clear)+2rem)] bottom-[calc(var(--chat-stack)+var(--legend-h)+1.5rem)]',
          '[container-type:size] transition-[bottom] duration-ui ease-settle [html[data-boot=run]_&]:invisible',
        )}
      >
        {(anyAltitude || track) && (
          <div className="mb-5 flex shrink-0 flex-col items-end gap-1.5 text-right">
            {anyAltitude && (
              <div aria-hidden="true" className="flex min-h-[2.625rem] flex-col items-end gap-0.5">
                <p className={clsx('flex items-baseline gap-1 px-1 leading-tight', current && KNOCKOUT)}>
                  {current?.kind === 'planned' ? (
                    <span className="font-body text-ui italic text-ink-muted min-[1840px]:text-title">planned</span>
                  ) : (
                    <>
                      {hasAltitude(current) && current.approx && (
                        <span className="font-data text-ui text-ink-muted min-[1840px]:text-title">~</span>
                      )}
                      <span
                        ref={valueRef}
                        className="tabular font-data text-ui font-medium text-ink min-[1840px]:text-title"
                      >
                        {initialValue}
                      </span>
                      {hasAltitude(current) && <span className="font-data text-ui text-ink-muted">m</span>}
                    </>
                  )}
                </p>
                {current && (
                  <p className={clsx('max-w-40 truncate px-1 font-body text-caption italic text-ink-muted', KNOCKOUT)}>
                    {current.waypoint ?? current.label}
                  </p>
                )}
              </div>
            )}
            {track && (
              // Full text at w-40, never clamped; each line carries its own ground knockout, like a map label.
              <p className="sr-only [@container(min-height:22.5rem)]:not-sr-only">
                <span className="block w-40 font-body text-caption text-ink-muted">
                  <span className={clsx('px-1 py-0.5 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]', KNOCKOUT)}>
                    {track.caption}
                  </span>
                </span>
              </p>
            )}
          </div>
        )}

        <div className="relative min-h-0 w-8 flex-1">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-4 right-0 w-8">
            <span className="absolute inset-y-0 right-[15.5px] w-px bg-line-strong track-steel forced-colors:bg-[CanvasText]" />
            {/* Compositor only (no layout per frame while the story scrolls): the fill spans the track and scales from
                its top; the head rides a track-sized wrapper whose `y` percentage is a fraction of the track. */}
            <span
              className="absolute inset-y-0 right-[15px] w-0.5 origin-top bg-action transition-transform duration-ui ease-settle forced-colors:bg-[Highlight]"
              style={{ transform: `scaleY(${frac})` }}
            />
            <motion.span className="absolute inset-0 block" initial={false} animate={{ y: `${frac * 100}%` }} transition={spring}>
              <span
                className={clsx(
                  'absolute right-[22px] top-0 block size-2 -translate-y-1/2 transition-opacity duration-hover',
                  current ? 'opacity-100' : 'opacity-0',
                )}
              >
                <HereMark />
              </span>
            </motion.span>
          </div>
          {/* Each tick sits at its fraction of the track's own box, so ticks and marker always agree and a short
              rail packs them closer instead of running past its foot. */}
          <ol className="absolute inset-y-4 right-0 w-8">
            {sections.map((s, i) => {
              const isActive = i === at;
              const small = s.kind === 'interpolated';
              return (
                <li
                  key={s.id}
                  className="absolute right-0 flex size-8 -translate-y-1/2 items-center justify-end"
                  style={{ top: `${n > 1 ? (i / (n - 1)) * 100 : 0}%` }}
                >
                  {/* Focus: the ring hugs a ground cell (offset 0), so it holds 3:1 against what is beside it over
                      any map colour or photo (C-15); the label shows with it. */}
                  <a
                    href={`#${s.id}`}
                    aria-label={accessibleName(s)}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={(e) => jump(e, s.id, false)}
                    className="group pointer-events-auto relative block size-8 rounded-control focus-visible:bg-ground focus-visible:[outline-offset:0px]"
                  >
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'absolute top-1/2 h-px -translate-y-1/2 transition-colors duration-hover',
                        small ? 'right-3.5 w-1' : 'right-3 w-2',
                        isActive
                          ? 'h-0.5 bg-ink forced-colors:bg-[Highlight]'
                          : clsx(
                              'forced-colors:bg-[CanvasText]',
                              s.kind === 'planned' ? 'bg-line-strong' : 'bg-ink-muted group-hover:bg-ink',
                            ),
                      )}
                    />
                    {/* The label never leaves the rail: 160 px less the 32 px tick and its 4 px gap; a longer one
                        wraps (balanced) rather than reaching into the text column. The current one shows at rest. */}
                    <span
                      className={clsx(
                        'pointer-events-none absolute right-full top-1/2 mr-1 w-max max-w-[7.75rem] -translate-y-1/2 px-2 py-0.5 text-right',
                        KNOCKOUT,
                        'font-body text-caption font-medium [text-wrap:balance]',
                        isActive
                          ? 'text-ink'
                          : 'text-ink-muted opacity-0 transition-opacity duration-hover group-hover:text-ink group-hover:opacity-100 group-focus-visible:text-ink group-focus-visible:opacity-100',
                      )}
                    >
                      {s.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Below 1024 px: the page's progress, a 2 px hairline along the top edge. */}
      <div
        ref={hairRef}
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-progress h-0.5 origin-left bg-action lg:hidden forced-colors:bg-[Highlight]"
        style={{ transform: 'scaleX(0)' }}
      />

      {/*
        Below 1024 px: the dock (C-01; positioning API in contracts/dock.md). A fixed band along the bottom edge with
        12 px insets plus the safe area: the bar, then the square the chat bead docks into (--bar-h wide, 12 px in from
        the right, 12 px gap). Its ::before is the scroll-edge scrim: ground from the bar's top down, fading out 24 px
        above it, so a line passing under the dock fades instead of being sliced; it leaves with the bar. The band dims
        as one piece in the summit hold (data-chrome, §C.8) and gives way (data-yield) while the footer rises through it.
      */}
      <div
        ref={dockRef}
        data-chrome=""
        className={clsx(
          'group/dock pointer-events-none fixed inset-x-0 bottom-0 z-rail flex justify-end lg:hidden [html[data-boot=run]_&]:invisible',
          // In use (a focused control, an open sheet), the band stacks over the footer (z 41) instead of under it.
          'has-[:focus-visible]:z-rail-focus has-[[aria-expanded=true]]:z-rail-focus',
          'pb-[calc(12px+env(safe-area-inset-bottom,0px))] pl-[calc(12px+env(safe-area-inset-left,0px))] pr-[calc(24px+var(--bar-h)+env(safe-area-inset-right,0px))]',
          'before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:bottom-0',
          'before:[background-image:linear-gradient(to_bottom,transparent,rgb(var(--c-ground)_/_var(--alpha-edge))_12px,rgb(var(--c-ground)_/_var(--alpha-heavy))_24px,rgb(var(--c-ground)_/_var(--alpha-glass)))]',
          // Reduced transparency: the same fade, then solid ground under the bar (nothing shows through the band).
          '[@media(prefers-reduced-transparency:reduce)]:before:[background-image:linear-gradient(to_bottom,transparent,rgb(var(--c-ground)_/_var(--alpha-heavy))_12px,var(--ground)_24px)]',
          'before:transition-opacity before:duration-ui before:ease-settle forced-colors:before:hidden',
          '[html[data-dock=hidden]_&]:before:opacity-0 [html[data-dock=hidden]_&]:before:duration-hover',
          'data-[away]:before:opacity-0 data-[away]:before:duration-hover',
          'data-[yield]:before:opacity-0 data-[yield]:before:duration-hover',
        )}
      >
        {/*
          The bar. Hidden, it travels below the window's edge with its shadow (--dock-h + 16 px) on `translate`, so the
          bead (and the legend's slot inside it) move in the same style pass: away quickly (180 ms), back settling
          (280 ms), both on the settle curve and interruptible mid-way. Reduced motion never hides it.
        */}
        <div
          className={clsx(
            'pointer-events-auto relative z-0 flex h-[var(--bar-h)] w-full max-w-[30rem] items-center gap-1 p-1',
            '[transition:translate_var(--dur-ui)_var(--ease-settle)]',
            '[html[data-dock=hidden]_&]:[transition-duration:var(--dur-hover)] [html[data-dock=hidden]_&]:[translate:0_calc(var(--dock-h)+16px)]',
            'group-data-[away]/dock:[transition-duration:var(--dur-hover)] group-data-[away]/dock:[translate:0_calc(var(--dock-h)+16px)]',
            'group-data-[yield]/dock:[transition-duration:var(--dur-hover)] group-data-[yield]/dock:[translate:0_calc(var(--dock-h)+16px)]',
          )}
        >
          {/* The glass is a layer under the controls, not their parent: inside a backdrop-filter, a sheet rising from
              the bar would blur only the bar. Open, it trades the violet refraction for the active rim. */}
          <span
            aria-hidden="true"
            data-state={open ? 'open' : 'closed'}
            className="glass-chrome pointer-events-none absolute inset-0 -z-10 rounded-full"
          />
          <nav ref={mobileRef} aria-label={label} className="flex min-w-0 flex-1">
            {/* The name truncates, the datum never does; the count and the waypoint join it from 480 px (C-03). */}
            <button
              ref={chipRef}
              type="button"
              aria-expanded={open}
              aria-controls={open ? sheetId : undefined}
              aria-describedby={chipDescId}
              onClick={() => setOpen((o) => !o)}
              className={clsx(
                'flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full pl-3.5 pr-3 text-left',
                'font-body text-caption text-ink transition-[background-color,transform] duration-micro ease-settle',
                'hover:bg-[var(--hover-wash)] active:scale-[0.98] active:bg-[var(--press-wash)] aria-expanded:bg-[var(--hover-wash)]',
              )}
            >
              {current ? (
                <>
                  <HereMark />
                  <span className="min-w-0 truncate font-medium">{current.label}</span>
                  <span aria-hidden="true" className="-ml-2 hidden shrink-0 min-[480px]:inline">
                    , {at + 1} of {n}
                  </span>
                  {reading && (
                    <>
                      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-ink/rim forced-colors:bg-[CanvasText]" />
                      <span aria-hidden="true" className="hidden min-w-0 truncate [flex-shrink:4] min-[480px]:inline">
                        {reading.place}
                      </span>
                      <span
                        aria-hidden="true"
                        className={clsx('shrink-0', reading.planned ? 'italic' : 'tabular font-data')}
                      >
                        {reading.value}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="font-medium">Sections</span>
              )}
              <ChevronUp
                aria-hidden="true"
                className={clsx('ml-auto size-4 shrink-0 transition-transform duration-ui ease-settle', open && 'rotate-180')}
              />
            </button>
            <span id={chipDescId} hidden>
              {chipDescription}
            </span>

            {/* The sheet rises out of the bar (origin at its foot), as wide as the bar; laid out against the bar row. */}
            <AnimatePresence>
              {open && (
                <motion.div
                  id={sheetId}
                  key="sheet"
                  initial={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                  exit={{ opacity: 0, transform: 'translateY(8px) scale(0.98)', transition: sheetOut }}
                  transition={sheetIn}
                  style={{ transformOrigin: '50% 100%' }}
                  className="glass-chrome glass-sheet absolute inset-x-0 bottom-full mb-2 rounded-[1.375rem] p-1.5"
                >
                  <ol className="scroll-pane max-h-[min(60svh,32rem)] overflow-y-auto" data-lenis-prevent>
                    {sections.map((s, i) => {
                      const isActive = i === at;
                      const r = readout(s);
                      return (
                        <li key={s.id}>
                          <a
                            href={`#${s.id}`}
                            aria-current={isActive ? 'location' : undefined}
                            onClick={(e) => jump(e, s.id, true)}
                            className={clsx(
                              'flex min-h-12 items-center gap-3 rounded-2xl py-2 pl-3 pr-4 [outline-offset:-2px]',
                              'font-body text-ui text-ink transition-colors duration-hover',
                              isActive
                                ? 'bg-action-soft ring-1 ring-inset ring-action-line focus-visible:outline-focus-ring-inverse'
                                : 'hover:bg-[var(--hover-wash)] active:bg-[var(--press-wash)]',
                            )}
                          >
                            {/* The rail in miniature: a tick per section, the action mark on the current one. */}
                            <span aria-hidden="true" className="flex w-2 shrink-0 justify-center">
                              {isActive ? (
                                <HereMark />
                              ) : (
                                <span
                                  className={clsx(
                                    'h-px forced-colors:bg-[CanvasText]',
                                    s.kind === 'interpolated' ? 'w-1' : 'w-2',
                                    s.kind === 'planned' ? 'bg-line-strong' : 'bg-ink-muted',
                                  )}
                                />
                              )}
                            </span>
                            {/* Labels wrap; the waypoint and altitude take their own line. The name comes from this
                                content (label first, then the spoken readout), so it contains the visible text. */}
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className={clsx('[overflow-wrap:anywhere] [text-wrap:pretty]', isActive && 'font-medium')}>
                                {s.label}
                              </span>
                              {r && (
                                <>
                                  <span className="sr-only">, {r.spoken}</span>
                                  <span
                                    aria-hidden="true"
                                    className={clsx('text-caption', r.planned ? 'italic' : 'tabular font-data')}
                                  >
                                    {r.text}
                                  </span>
                                </>
                              )}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                  {track && <p className="px-3 pb-1.5 pt-2 font-body text-caption italic text-ink">{track.caption}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
          {/* The page's own controls (<DockSlot>, the home legend's Key) on the same glass, after the chip. */}
          <div
            ref={isDock ? registerDockSlot : undefined}
            data-dock-slot=""
            className="flex shrink-0 items-center gap-1 empty:hidden"
          />
        </div>
      </div>
    </>
  );

  return host ? createPortal(ui, host) : ui;
};
