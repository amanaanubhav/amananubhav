'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';

import { CHROME, MOTION } from '@/shared/config';
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

const TICKS: Record<Layer, { at: number; text: string }[]> = {
  alt: [
    { at: 1000, text: '1,000' },
    { at: 3000, text: '3,000' },
    { at: 5000, text: '5,000' },
    { at: 7000, text: '7,000 m' },
  ],
  temp: [
    { at: -20, text: '−20' },
    { at: -10, text: '−10' },
    { at: 0, text: '0 °C' },
    { at: 10, text: '+10' },
    { at: 20, text: '+20' },
  ],
};

function tickLeft(layer: Layer, at: number): CSSProperties {
  const range: readonly number[] = layer === 'alt' ? STORY_HYPSO_STOPS_M : STORY_TEMP_STOPS_C;
  const lo = range[0];
  const hi = range[range.length - 1];
  return { left: `${(((at - lo) / (hi - lo)) * 100).toFixed(1)}%` };
}

interface LayerProps {
  layer: Layer;
  onLayer: (layer: Layer) => void;
}

/** Day and place, the Altitude | Temperature switch (aria-pressed), the ramp, its ticks, the isotherm key, the note. */
function Where({ day, place }: { day: string; place: string }) {
  return (
    <p className={styles.where}>
      <span className={styles.day}>{day}</span>
      <span className={styles.place}>{place}</span>
    </p>
  );
}

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

function Scale({ layer }: { layer: Layer }) {
  return (
    <>
      <div className={styles.bar} style={{ backgroundImage: RAMP[layer] }} aria-hidden="true" />
      <ol className={styles.ticks} aria-label={layer === 'alt' ? LEGEND_COPY.altitudeScale : LEGEND_COPY.temperatureScale}>
        {TICKS[layer].map((t) => (
          <li key={t.text} style={tickLeft(layer, t.at)}>
            {t.text}
          </li>
        ))}
      </ol>
      <ul className={styles.iso}>
        <li>
          <span className={`${styles.line} ${styles.lineWarm}`} aria-hidden="true" />
          {LEGEND_COPY.isoWarm}
        </li>
        <li>
          <span className={styles.line} aria-hidden="true" />
          {LEGEND_COPY.isoZero}
        </li>
        <li>
          <span className={`${styles.line} ${styles.lineCold}`} aria-hidden="true" />
          {LEGEND_COPY.isoCold}
        </li>
        <li>
          <span className={styles.frost} aria-hidden="true" />
          {LEGEND_COPY.frost}
        </li>
      </ul>
      <p className={styles.note}>{layer === 'alt' ? LEGEND_COPY.noteAltitude : LEGEND_COPY.noteTemperature}</p>
    </>
  );
}

function LineKey() {
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
      <p className={styles.honesty}>{LEGEND_COPY.honesty}</p>
    </>
  );
}

/**
 * The map legend (§13): the live day and place, the Altitude | Temperature emphasis (aria-pressed buttons; the
 * scene swaps its fill, the story never changes), the ramp drawn from the same stops as the shader, the isotherm
 * key and the honesty note ("modelled from altitude, not measured"). "Key" discloses the line styles. At tier 0
 * (the static plan sheet) it shows the trek line and the line key only. It fades out as the map dissolves.
 *
 * From 1024 px: fixed glass chrome above the chat bead (its own frosted card, story.module.css), server-rendered
 * with its default text (no layout shift when the scene arrives). A recede pool sits under it
 * (`data-recede-chrome`), and it publishes its height as `--legend-h` so the waypoint rail ends above it (C-02).
 *
 * Below 1024 px: no bar of its own (C-01). A compact "Key" control sits in the dock bar (`<DockSlot>`), sharing its
 * glass, scrim and show / hide; it opens the whole legend as a sheet laid out against the bar.
 */
export function StoryLegend() {
  const tier = useMotionTier();
  const staged = tier > 0;
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
  const hidden = staged && phase.legendHidden;

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
        className={`glass-chrome glass-legend ${styles.legend}`}
      >
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
          </button>
        </div>
        {staged ? <Scale layer={layer} /> : null}
        <div id={keyId} hidden={!keyOpen}>
          <LineKey />
        </div>
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
                    <LineKey />
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
