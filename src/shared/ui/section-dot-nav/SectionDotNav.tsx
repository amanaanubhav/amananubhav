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
import { AnimatePresence, motion } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { MOTION } from '@/shared/config';
// clsx, not cn: tailwind-merge (unconfigured) treats `text-caption` as a colour and drops it.
import { clsx } from 'clsx';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { getLenis, scrollToTarget } from '@/shared/lib/smooth-scroll';

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

/** "Chame ~2,670 m" (visible readout) and "Chame, about 2,670 metres" (spoken). */
function readout(s: SectionNavItem | undefined): { text: string; spoken: string } | null {
  if (!s) return null;
  if (s.kind === 'planned') {
    const place = s.waypoint ?? s.label;
    return { text: `${place}, planned`, spoken: `${place}, planned` };
  }
  if (!hasAltitude(s)) return null;
  const place = s.waypoint ?? s.label;
  return {
    text: `${place} ${s.approx ? '~' : ''}${fmt(s.altitudeM)} m`,
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

/**
 * Scrolls a section into place. Lenis' `scrollTo(element)` already subtracts the target's
 * `scroll-margin-top` and the root's `scroll-padding-top`, so it gets the bare element. Without Lenis
 * (tier 0, before the chunk loads) the jump goes to a computed number with both applied here, so
 * the two paths land on the same spot whatever the native fallback does with elements.
 */
function scrollToSection(el: HTMLElement): void {
  if (getLenis()) {
    scrollToTarget(el);
    return;
  }
  const marginTop = px(getComputedStyle(el).scrollMarginTop);
  const paddingTop = px(getComputedStyle(document.documentElement).scrollPaddingTop);
  scrollToTarget(Math.max(0, el.getBoundingClientRect().top + window.scrollY - marginTop - paddingTop));
}

/** expo.out, the settle curve (MOTION.ease.settle). */
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Below this width the content column can run under the rail's 160 px box, so the rail is compact:
 * ticks, marker and a small altitude value stay; the active label, the waypoint line and the track
 * caption appear while the rail is hovered or holds focus (§J.3: the rail never overlaps body text).
 */
const REVEAL = clsx(
  'transition-opacity duration-hover',
  'opacity-0 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 min-[1840px]:opacity-100',
);

/**
 * The rail is portalled into a host placed right after `<main>`: outside main's `z-content` stacking
 * context (so `z-rail` beats the footer), and between main and the footer in the tab order (§J.1).
 * The host mirrors main's `inert` (the story reader). The server and the first client render keep
 * the rail inline, so the `#id` links work without JS.
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
 * The waypoint rail (§H.2). Desktop: a fixed rail of ticks with an altimeter that reads the real
 * altitude of the section you are in. Below 1024 px: a chip with the current section that opens a
 * non-modal sheet, and a 2 px progress hairline. Links are real `#id` anchors (they work without
 * JS); JS scrolls through `scrollToTarget`.
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

  const sectionsRef = useRef(sections);
  const hairRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
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
    // A user scroll (wheel, press or drag, scroll keys) releases a jump's pin.
    const release = () => {
      pinned.current = null;
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

  if (sections.length === 0) return null;

  const n = sections.length;
  const at = Math.min(active, n - 1);
  const current: SectionNavItem | undefined = at >= 0 ? sections[at] : undefined;
  const frac = n > 1 && at > 0 ? at / (n - 1) : 0;
  const reading = readout(current);
  const spring = allowed ? MOTION.spring : { duration: 0 };

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
    scrollToSection(el);
    if (keyboard) focusSection(el);
  };

  const chipDescription = `${reading ? `${reading.spoken}. ` : ''}${label}`;

  const ui = (
    <>
      {/* Desktop (>= 1024 px): the waypoint rail */}
      <nav
        aria-label={label}
        data-chrome=""
        className="group/rail pointer-events-none fixed right-6 top-1/2 z-rail hidden h-[min(60vh,520px)] w-40 -translate-y-1/2 flex-col items-end lg:flex"
      >
        {anyAltitude && (
          <div aria-hidden="true" className="mb-5 flex min-h-[3.25rem] flex-col items-end text-right">
            {/* The value stays visible but compact (it fits the 96 px reserve); full size on wide screens. */}
            <p className={clsx('flex items-baseline gap-1 px-1 leading-tight', current && 'bg-ground')}>
              {current?.kind === 'planned' ? (
                <span className="font-body text-ui italic text-ink-muted min-[1840px]:text-title">planned</span>
              ) : (
                <>
                  {hasAltitude(current) && current.approx && (
                    <span className="font-data text-ui text-ink-muted min-[1840px]:text-title">~</span>
                  )}
                  <span ref={valueRef} className="tabular font-data text-ui font-medium text-ink min-[1840px]:text-title">
                    {initialValue}
                  </span>
                  {hasAltitude(current) && <span className="font-data text-caption text-ink-muted">m</span>}
                </>
              )}
            </p>
            {current && (
              <p className={clsx('max-w-40 truncate bg-ground px-1 font-body text-caption italic text-ink-muted', REVEAL)}>
                {current.waypoint ?? current.label}
              </p>
            )}
          </div>
        )}

        <div className="relative w-8 flex-1">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-4 right-0 w-8">
            <span className="absolute inset-y-0 right-[15.5px] w-px bg-line-strong forced-colors:bg-[CanvasText]" />
            <span
              className="absolute right-[15px] top-0 w-0.5 origin-top bg-ink transition-[height] duration-ui ease-settle forced-colors:bg-[Highlight]"
              style={{ height: `${frac * 100}%` }}
            />
            <motion.span
              className={clsx(
                'absolute right-[22px] block size-2 -translate-y-1/2 text-signal transition-opacity duration-hover forced-colors:text-[Highlight]',
                current ? 'opacity-100' : 'opacity-0',
              )}
              initial={false}
              animate={{ top: `${frac * 100}%` }}
              transition={spring}
            >
              <svg viewBox="0 0 8 8" className="block size-2 overflow-visible">
                <path d="M0 0.4 7.6 4 0 7.6Z" className="signal-mark fill-current" />
              </svg>
            </motion.span>
          </div>
          <ol className="relative flex h-full flex-col justify-between">
            {sections.map((s, i) => {
              const isActive = i === at;
              const small = s.kind === 'interpolated';
              return (
                <li key={s.id} className="relative flex h-8 items-center justify-end">
                  <a
                    href={`#${s.id}`}
                    aria-label={accessibleName(s)}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={(e) => jump(e, s.id, false)}
                    className="group pointer-events-auto relative block size-8 rounded-control"
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
                    <span
                      className={clsx(
                        'pointer-events-none absolute right-full top-1/2 mr-1 -translate-y-1/2 whitespace-nowrap bg-ground px-2 py-0.5',
                        'font-body text-caption font-medium',
                        isActive
                          ? clsx('text-ink group-focus-visible:opacity-100', REVEAL)
                          : 'text-ink-muted opacity-0 transition-opacity duration-hover group-focus-visible:text-ink group-focus-visible:opacity-100 [@media(min-height:700px)]:group-hover:text-ink [@media(min-height:700px)]:group-hover:opacity-100',
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

        {track && (
          <p
            className={clsx(
              'mt-5 line-clamp-3 w-24 bg-ground px-1 text-right font-body text-caption text-ink-muted min-[1840px]:line-clamp-2 min-[1840px]:w-40',
              REVEAL,
            )}
          >
            {track.caption}
          </p>
        )}
      </nav>

      {/* Below 1024 px: progress hairline, chip and non-modal sheet */}
      <nav aria-label={label} className="lg:hidden">
        <div
          ref={hairRef}
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-progress h-0.5 origin-left bg-signal forced-colors:bg-[Highlight]"
          style={{ transform: 'scaleX(0)' }}
        />
        {/* The chip (and its sheet) dims as a whole in the summit hold (§C.8). */}
        <div
          ref={mobileRef}
          data-chrome=""
          className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-4 z-rail max-w-[calc(100vw-112px)]"
        >
          {/* The name is the visible text; the spoken altitude and the nav's purpose are its description. */}
          <button
            ref={chipRef}
            type="button"
            aria-expanded={open}
            aria-controls={sheetId}
            aria-describedby={chipDescId}
            onClick={() => setOpen((o) => !o)}
            className={clsx(
              'group flex h-11 max-w-full items-center rounded-control border border-line-strong bg-surface pl-3 pr-2',
              'font-body text-caption text-ink transition-colors duration-hover hover:bg-surface-2 aria-expanded:bg-surface-2',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate">
                {current ? (
                  <>
                    <span className="font-medium">{current.label}</span>
                    <span className="text-ink-muted">, {at + 1} of {n}</span>
                    {reading && <span className="tabular font-data text-ink-muted"> · {reading.text}</span>}
                  </>
                ) : (
                  <span className="font-medium">Sections</span>
                )}
              </span>
              <ChevronUp
                aria-hidden="true"
                className={clsx('size-4 shrink-0 transition-transform duration-ui', open ? 'rotate-0' : 'rotate-180')}
              />
            </span>
          </button>
          <span id={chipDescId} hidden>
            {chipDescription}
          </span>

          <AnimatePresence>
            {open && (
              <motion.div
                id={sheetId}
                key="sheet"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8, transition: allowed ? { duration: MOTION.dur.overlayOut } : { duration: 0 } }}
                transition={spring}
                className="absolute bottom-full left-0 mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-panel border border-line bg-surface p-1.5 shadow-float"
              >
                <ol className="scroll-pane max-h-[60svh] overflow-y-auto" data-lenis-prevent>
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
                            'relative flex min-h-11 flex-col justify-center gap-0.5 rounded-control px-3 py-2 [outline-offset:-2px]',
                            'font-body text-ui transition-colors duration-hover hover:bg-surface-2',
                            isActive ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:text-ink',
                          )}
                        >
                          {isActive && (
                            <span aria-hidden="true" className="absolute inset-y-1 left-0 w-0.5 bg-signal forced-colors:bg-[Highlight]" />
                          )}
                          {/* Labels wrap; the waypoint and altitude take their own line. The name comes from
                              this content (label first, then the spoken readout), so it contains the visible text. */}
                          <span className="[overflow-wrap:anywhere] [text-wrap:pretty]">{s.label}</span>
                          {r && (
                            <>
                              <span className="sr-only">, {r.spoken}</span>
                              <span aria-hidden="true" className="tabular font-data text-caption text-ink-muted">
                                {r.text}
                              </span>
                            </>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ol>
                {track && <p className="px-3 pb-1 pt-2 font-body text-caption italic text-ink-muted">{track.caption}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );

  return host ? createPortal(ui, host) : ui;
};
