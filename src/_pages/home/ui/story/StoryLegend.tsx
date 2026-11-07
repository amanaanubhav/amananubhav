'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';

import { CHROME, MOTION, STORY_LAPSE } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { useMediaQuery } from '@/shared/lib/dom';
import { useMotionAllowed, useMotionTier } from '@/shared/lib/motion-tier';
import { DockSlot } from '@/shared/ui/section-dot-nav';
import { setSceneParam, STORY_HYPSO_STOPS_M, STORY_TEMP_STOPS_C } from '@/shared/ui/stage';

import { LEGEND_COPY } from '../../config/copy';
import { ACTS, getPhase, getServerPhase, subscribePhase } from '../../lib/story-scroll';
import { STORY_PARAM, STORY_SCENE_ID } from '../scenes/story/frame';
import styles from './story.module.css';

const TREK_DAYS = 14;
const DOCK_QUERY = `(max-width: ${CHROME.railFrom - 0.02}px)`;

type Layer = 'alt' | 'temp';

/** The ramp from the palette's own map tokens (`--map-hypso-*`, `--map-temp-*`): it follows the theme by itself. */
function ramp(layer: Layer): string {
  const stops: readonly number[] = layer === 'alt' ? STORY_HYPSO_STOPS_M : STORY_TEMP_STOPS_C;
  const name = layer === 'alt' ? 'map-hypso' : 'map-temp';
  const lo = stops[0];
  const hi = stops[stops.length - 1];
  const parts = stops.map((v, i) => `var(--${name}-${i + 1}) ${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

const RAMP: Record<Layer, string> = { alt: ramp('alt'), temp: ramp('temp') };

/* Under the ramp: altitudes, or the temperature ramp's own ends (its isotherms are named above it). */
const TICKS: Record<Layer, { at: number; text: string }[]> = {
  alt: [
    { at: 1000, text: '1,000' },
    { at: 3000, text: '3,000' },
    { at: 5000, text: '5,000' },
    { at: 7000, text: '7,000 m' },
  ],
  temp: [
    { at: -25, text: '−25' },
    { at: 22, text: '+22 °C' },
  ],
};

/** The map's isotherms (story-layers: 0 °C bold teal, −10 °C fine teal, +10 °C a neutral hairline). */
const ISOTHERMS = [
  { c: 10, text: LEGEND_COPY.isoWarm, tone: 'warm' },
  { c: 0, text: LEGEND_COPY.isoZero, tone: 'zero' },
  { c: -10, text: LEGEND_COPY.isoCold, tone: 'cold' },
] as const;

/** Where `value` sits along a layer's ramp, 0 to 100 (the ramp runs from its first stop to its last). */
function along(layer: Layer, value: number): number {
  const range: readonly number[] = layer === 'alt' ? STORY_HYPSO_STOPS_M : STORY_TEMP_STOPS_C;
  const lo = range[0];
  const hi = range[range.length - 1];
  return Math.min(100, Math.max(0, ((value - lo) / (hi - lo)) * 100));
}

/** An isotherm on the ramp: on the altitude ramp at the altitude the model gives it (0 °C near 4,150 m). */
function isothermAlong(layer: Layer, c: number): number {
  return along(layer, layer === 'alt' ? STORY_LAPSE.baseM + ((c - STORY_LAPSE.baseC) / STORY_LAPSE.perKm) * 1000 : c);
}

const left = (x: number): CSSProperties => ({ left: `${x.toFixed(1)}%` });

interface LayerProps {
  layer: Layer;
  onLayer: (layer: Layer) => void;
}

/** The day, led by the route's tick, and the day's places. */
function Where({ day, place }: { day: string; place: string }) {
  return (
    <p className={styles.where}>
      <span className={styles.day}>{day}</span>
      <span className={styles.place}>{place}</span>
    </p>
  );
}

/** Altitude | Temperature as type (aria-pressed): the pressed one carries the signal underline. */
function LayerSwitch({ layer, onLayer }: LayerProps) {
  return (
    <div className={styles.switch} role="group" aria-label={LEGEND_COPY.emphasis}>
      <button type="button" aria-pressed={layer === 'alt'} onClick={() => onLayer('alt')}>
        {LEGEND_COPY.altitude}
      </button>
      <button type="button" aria-pressed={layer === 'temp'} onClick={() => onLayer('temp')}>
        {LEGEND_COPY.temperature}
      </button>
    </div>
  );
}

/**
 * One scale for the whole map: the ramp in the scene's colours, the isotherms marked on it where the map draws them
 * (named above it), the frost dots over its side below 0 °C, the ticks under it and one honesty line.
 */
function Scale({ layer }: { layer: Layer }) {
  const zero = isothermAlong(layer, 0);
  const frost: CSSProperties =
    layer === 'alt' ? { left: `${zero.toFixed(1)}%`, right: 0 } : { left: 0, right: `${(100 - zero).toFixed(1)}%` };
  return (
    <div className={styles.scale}>
      <ol className={styles.isoAt} aria-label={LEGEND_COPY.isoScale}>
        {ISOTHERMS.map((t) => (
          <li key={t.c} style={left(isothermAlong(layer, t.c))}>
            {t.text}
          </li>
        ))}
      </ol>
      <div className={styles.bar} style={{ backgroundImage: RAMP[layer] }} aria-hidden="true">
        <span className={styles.frostBand} style={frost} />
        {ISOTHERMS.map((t) => (
          <span key={t.c} className={styles.notch} data-tone={t.tone} style={left(isothermAlong(layer, t.c))} />
        ))}
      </div>
      <ol className={styles.ticks} aria-label={layer === 'alt' ? LEGEND_COPY.altitudeScale : LEGEND_COPY.temperatureScale}>
        {TICKS[layer].map((t) => (
          <li key={t.text} style={left(along(layer, t.at))}>
            {t.text}
          </li>
        ))}
      </ol>
      <p className={styles.note}>{layer === 'alt' ? LEGEND_COPY.shortAltitude : LEGEND_COPY.shortTemperature}</p>
    </div>
  );
}

/** Behind Key: the line and symbol key, the colour note in full (staged) and the honesty note. */
function LineKey({ layer }: { layer?: Layer }) {
  return (
    <>
      <ul className={styles.keys}>
        {LEGEND_COPY.keys.map((k) => (
          <li key={k.id}>
            <span className={`${styles.k} ${styles[k.style]}`} aria-hidden="true" />
            {k.text}
          </li>
        ))}
      </ul>
      {layer ? (
        <p className={styles.honesty}>{layer === 'alt' ? LEGEND_COPY.noteAltitude : LEGEND_COPY.noteTemperature}</p>
      ) : null}
      <p className={styles.honesty}>{LEGEND_COPY.honesty}</p>
    </>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" className={styles.chevron}>
      <path d="M2 6.5 5 3.5 8 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The map legend (§13): the live day and place, the Altitude | Temperature emphasis (aria-pressed buttons; the
 * scene swaps its fill, the story never changes), the ramp drawn from the same stops as the shader, the isotherm
 * key and the honesty note ("modelled from altitude, not measured"). "Key" discloses the line styles. In the static
 * layout (tier 0, or a stage that turned static: the plan sheet) it shows the trek line and the line key only. It
 * fades out with the story's end (staged) and stays away while #next is in view, in both layouts (#next has its own
 * map key there); it comes back once the visitor scrolls up into the story.
 *
 * From 1024 px: fixed above the chat bead, server-rendered with its default text (no layout shift when the scene
 * arrives). Over the 3D map it is type on the map, no card (Aman, 2026-11-07: the card was big and bulky): the
 * terrain recedes under it (`data-recede-chrome`, a pool like the story text's) and labels stay clear of it. Key
 * opens above it, so the switch and the Key never move under the pointer. The static layout (no live map, the page
 * scrolls under it) keeps the glass card. It publishes its height as `--legend-h` so the waypoint rail ends above it
 * (C-02).
 *
 * Below 1024 px: no bar of its own (C-01). A compact "Key" control sits in the dock bar (`<DockSlot>`), sharing its
 * glass, scrim and show / hide; it opens the whole legend as a sheet laid out against the bar.
 */
/**
 * True while the story stage is static (`[data-story-stage][data-static]`: a failed 3D load, or the tier dropped). The
 * tier alone misses a failed load, where the story driver never runs and the phase stays at its first act.
 */
function useStageStatic(tier: number): boolean {
  const [isStatic, setStatic] = useState(false);
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('[data-story-stage]');
    if (!stage) return;
    const read = () => setStatic(stage.hasAttribute('data-static'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(stage, { attributes: true, attributeFilter: ['data-static'] });
    return () => observer.disconnect();
  }, [tier]); // looked up again when the tier changes (the stage may be a new node)
  return isStatic;
}

/** #next's top above 60 % of the viewport, or the section scrolled past: the rest view and below. */
function useAtNext(): boolean {
  const [atNext, setAtNext] = useState(false);
  useEffect(() => {
    const next = document.getElementById('next');
    if (!next || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e) setAtNext(e.isIntersecting || e.boundingClientRect.top < 0);
      },
      { rootMargin: '0px 0px -40% 0px' },
    );
    io.observe(next);
    return () => io.disconnect();
  }, []);
  return atNext;
}

export function StoryLegend() {
  const tier = useMotionTier();
  const stageStatic = useStageStatic(tier);
  const staged = tier > 0 && !stageStatic;
  const phase = useSyncExternalStore(subscribePhase, getPhase, getServerPhase);
  const [layer, setLayer] = useState<Layer>('alt');
  const [keyOpen, setKeyOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const keyId = useId();
  const sheetId = useId();
  const asideRef = useRef<HTMLElement>(null);
  const dockWrapRef = useRef<HTMLDivElement>(null);
  const keyButtonRef = useRef<HTMLButtonElement>(null);
  const isDock = useMediaQuery(DOCK_QUERY);
  const allowed = useMotionAllowed();

  useEffect(() => {
    setSceneParam(STORY_SCENE_ID, STORY_PARAM.layer, layer);
  }, [layer]);

  const act = ACTS[phase.act];
  const whole = !staged || phase.overview || !act.place;
  const day = whole ? LEGEND_COPY.wholeDays(TREK_DAYS) : LEGEND_COPY.day(act.day, TREK_DAYS);
  const place = whole ? LEGEND_COPY.wholePlace : act.place;
  // The legend leaves once #next (with its own map key) is reached: read by an observer on the section's top at
  // 60 % of the viewport, in both layouts. The static layout has no story driver, so this is its only signal; in the
  // staged one the phase has already faded it at the story's end (the observer only keeps it away at the rest view
  // and below, never earlier).
  const atNext = useAtNext();
  const hidden = atNext || (staged && phase.legendHidden);

  // --legend-h (CORE-CONTRACT §3a): the legend's height from 1024 px, else 0, so the waypoint rail ends above it. It
  // never changes while scrolling (7a5ed17's rail never moved): a write on :root restyles the whole page and moves
  // the rail, one 50-70 ms frame each time a day's place wraps to a second line or back. So the place is counted at
  // two lines whatever the day, the hidden legend keeps its box (it fades out with the map), and an unchanged value
  // is never written: it changes on resize, the layer switch and the Key only.
  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    const html = document.documentElement;
    const wide = window.matchMedia(`(min-width: ${CHROME.railFrom}px)`);
    let published = '';
    const publish = () => {
      let h = 0;
      if (wide.matches) {
        h = el.getBoundingClientRect().height;
        const placeEl = el.querySelector<HTMLElement>(`.${styles.place}`);
        const line = placeEl ? Number.parseFloat(getComputedStyle(placeEl).lineHeight) : 0;
        if (placeEl && line > 0) h += Math.max(0, 2 * line - placeEl.getBoundingClientRect().height);
      }
      const value = `${Math.round(h)}px`;
      if (value === published) return;
      published = value;
      html.style.setProperty('--legend-h', value);
    };
    publish();
    const resize = new ResizeObserver(publish);
    resize.observe(el);
    wide.addEventListener('change', publish);
    return () => {
      resize.disconnect();
      wide.removeEventListener('change', publish);
      html.style.removeProperty('--legend-h');
    };
  }, []);

  // The Key sheet closes when the dock goes away (1024 px and up) and as the legend leaves with the map
  // (reset while rendering, from the previous gate: no effect, no extra commit).
  const keyGate = isDock && !hidden;
  const [prevKeyGate, setPrevKeyGate] = useState(keyGate);
  if (keyGate !== prevKeyGate) {
    setPrevKeyGate(keyGate);
    if (!keyGate) setSheetOpen(false);
  }

  // Escape and a press outside the Key (the section chip included) close the sheet; Escape returns focus to the Key.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setSheetOpen(false);
      keyButtonRef.current?.focus({ preventScroll: true });
    };
    const onPointer = (e: PointerEvent) => {
      const wrap = dockWrapRef.current;
      if (wrap && !wrap.contains(e.target as Node)) setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [sheetOpen]);

  const sheetIn: Transition = allowed ? { duration: MOTION.dur.ui, ease: MOTION.bezier.settle } : { duration: 0 };
  const sheetOut: Transition = allowed ? { duration: MOTION.dur.hover, ease: MOTION.bezier.settle } : { duration: 0 };

  return (
    <>
      <aside
        ref={asideRef}
        aria-label={LEGEND_COPY.label}
        data-recede-chrome=""
        data-hidden={hidden ? '' : undefined}
        data-open={keyOpen ? '' : undefined}
        data-card={staged ? undefined : ''}
        className={cn(styles.legend, !staged && 'glass-chrome glass-legend')}
      >
        <div id={keyId} hidden={!keyOpen} className={styles.keyPanel}>
          <LineKey layer={staged ? layer : undefined} />
        </div>
        <Where day={day} place={place} />
        <div className={styles.row}>
          {staged ? <LayerSwitch layer={layer} onLayer={setLayer} /> : <span />}
          <button
            type="button"
            className={styles.more}
            aria-expanded={keyOpen}
            aria-controls={keyId}
            onClick={() => setKeyOpen((v) => !v)}
          >
            {LEGEND_COPY.key}
            <Chevron />
          </button>
        </div>
        {staged ? <Scale layer={layer} /> : null}
      </aside>

      {hidden ? null : (
        <DockSlot>
          {/* contents: no box of its own, so the sheet is laid out against the dock bar (contracts/dock.md §4). */}
          <div ref={dockWrapRef} className="contents">
            <button
              ref={keyButtonRef}
              type="button"
              aria-expanded={sheetOpen}
              aria-controls={sheetOpen ? sheetId : undefined}
              onClick={() => setSheetOpen((v) => !v)}
              className={cn(
                'flex h-11 items-center gap-2 rounded-full pl-3 pr-4 font-body text-caption font-medium text-ink',
                'transition-[background-color,transform] duration-micro ease-settle',
                'hover:bg-[var(--hover-wash)] active:scale-[0.98] active:bg-[var(--press-wash)] aria-expanded:bg-[var(--hover-wash)]',
              )}
            >
              <span aria-hidden="true" className={styles.keySwatch} style={{ backgroundImage: RAMP[layer] }} />
              {LEGEND_COPY.key}
            </button>
            <AnimatePresence>
              {sheetOpen && (
                <motion.div
                  id={sheetId}
                  key="legend-sheet"
                  role="region"
                  aria-label={LEGEND_COPY.label}
                  data-dock-hold=""
                  initial={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                  exit={{ opacity: 0, transform: 'translateY(8px) scale(0.98)', transition: sheetOut }}
                  transition={sheetIn}
                  style={{ transformOrigin: '50% 100%' }}
                  className="glass-chrome glass-sheet absolute inset-x-0 bottom-full mb-2 rounded-[1.375rem] p-1.5"
                >
                  <div className={cn('scroll-pane max-h-[min(60svh,32rem)] overflow-y-auto', styles.sheetBody)} data-lenis-prevent>
                    <Where day={day} place={place} />
                    {staged ? (
                      <>
                        <div className={styles.row}>
                          <LayerSwitch layer={layer} onLayer={setLayer} />
                        </div>
                        <Scale layer={layer} />
                      </>
                    ) : null}
                    <LineKey layer={staged ? layer : undefined} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DockSlot>
      )}
    </>
  );
}
