'use client';

import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ChevronDown, Maximize2 } from 'lucide-react';
import { getMotionTier, useMotionTier } from '@/shared/lib/motion-tier';
import { SIKAHAR_READOUT, SKY_PRESET, SKY_UI } from '../../config/content';
import { SKY_CATALOGUE } from '../../config/sky-catalogue.generated';
import { onSkyCommand, type SkyCommand } from '../../lib/sky-commands';
import {
  compass16,
  createSky,
  formatMag,
  type Sky,
  type SkyInfo,
  type SkyOrientationMode,
  type SkyPhase,
  type SkyState,
  type SkyUpNow,
} from '../../lib/sky-engine';
import { hereSkyPlace, type SkyPlaceId, type SkyPlaceOption } from '../../lib/sky-place';
import { PointUpDialog } from './PointUpDialog';
import { SkyCard } from './SkyCard';
import { SkyClockBead } from './SkyClockBead';
import { SkyControls } from './SkyControls';
import { SkyFind } from './SkyFind';
import { SkyTable, type SkyTableRow } from './SkyTable';
import { UpNowList } from './UpNowList';
import {
  COARSE_QUERY,
  NARROW_QUERY,
  formatClock,
  formatDay,
  prefersReducedMotion,
  readSkyTheme,
  setTouchAction,
  useMedia,
  zonedTime,
} from './sky-dom';
import styles from './sky.module.css';

/** The DOM homes `SkyView` lays out, so the plate never moves when the sky goes live. */
export interface SkySlots {
  plate: HTMLDivElement;
  /** A `display: contents` box under the plate (the control strip). */
  controls: HTMLDivElement;
  /** The side column (cols 9-12 on desktop; under the controls below 1024 px). */
  side: HTMLDivElement;
}

export interface SkyLiveProps {
  slots: SkySlots;
  places: readonly SkyPlaceOption[];
}

/** The phase word of the clock bead: the readout's short words without their full stop. */
const PHASE: Record<SkyPhase, string> = {
  night: SIKAHAR_READOUT.short.night.replace(/\.$/, ''),
  twilight: SIKAHAR_READOUT.short.twilight.replace(/\.$/, ''),
  day: SIKAHAR_READOUT.short.day.replace(/\.$/, ''),
};

const ORIENTATION_NOTE: Partial<Record<SkyOrientationMode, string>> = {
  compass: SKY_UI.full.holdUp,
  relative: SKY_UI.full.noCompass,
  calibrate: SKY_UI.full.calibrate,
};

const CANVAS_CLASS =
  'absolute inset-0 z-0 block size-full cursor-grab outline-none active:cursor-grabbing ' +
  'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--focus-ring-action)] ' +
  'forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:-outline-offset-2';

const GLASS_BEAD = 'glass-chrome glass-bead absolute z-[2] h-11 rounded-full';

/**
 * Facing south. A landscape plate keeps 35° up; a portrait plate (phones) tilts up until the horizon sits near 88 % of
 * its height, so a quarter of the plate is not blank ground (review UX P2-2). Stereographic: the horizon straight below
 * the centre lies k·2·tan(alt / 2) down, with k the engine's scale for this field of view.
 */
function southAlt(plate: HTMLElement, fov = 90): number {
  const w = plate.clientWidth, h = plate.clientHeight;
  if (!w || !h || h <= w) return 35;
  const k = Math.min(w, h) / 2 / (2 * Math.tan((fov * Math.PI) / 720));
  const alt = (2 * Math.atan((0.38 * h) / (2 * k)) * 180) / Math.PI;
  return Math.min(50, Math.max(35, Math.round(alt)));
}

const MINUTE = 60_000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const kindWord = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

/**
 * The live sky (FINAL-DESIGN §4.2, SKY-SPEC §2): the canvas engine plus its chrome, controls, card, Up now, Find, the
 * table and the full-screen view. Loaded lazily by `SkyView` with the engine and the catalogue.
 *
 * View and time live in the engine, not in React state: the engine reports every frame and the clock, the slider and
 * the phase word are written straight into the DOM, and only when they change. React holds what changes on a press or
 * once a minute: the selection, the Up now list, the place, the toggles and the full-screen state.
 */
export function SkyLive({ slots, places }: SkyLiveProps) {
  const { plate, controls, side } = slots;
  const narrow = useMedia(NARROW_QUERY);
  const coarse = useMedia(COARSE_QUERY);
  const tier = useMotionTier();
  const canOrient = coarse && 'DeviceOrientationEvent' in window;
  const inlineGestures = coarse ? 'horizontal' : 'all';

  const [sky, setSky] = useState<Sky | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [place, setPlace] = useState<SkyPlaceOption>(places[0]);
  const [live, setLive] = useState(true);
  const [info, setInfo] = useState<SkyInfo | null>(null);
  const [up, setUp] = useState<SkyUpNow | null>(null);
  const [rows, setRows] = useState<SkyTableRow[]>([]);
  const [ends, setEnds] = useState({ dusk: '--:--', dawn: '--:--' });
  const [lines, setLines] = useState(true);
  const [names, setNames] = useState(true);
  const [full, setFull] = useState(false);
  const [following, setFollowing] = useState(false);
  const [note, setNote] = useState<string>(SKY_UI.full.note);
  const [middle, setMiddle] = useState<{ label: string; body: string }>({ label: SKY_UI.full.middle, body: SKY_UI.full.nothingYet });
  const [announce, setAnnounce] = useState('');

  const skyRef = useRef<Sky | null>(null);
  const placeRef = useRef(place);
  const liveRef = useRef(true);
  const fullRef = useRef(false);
  const followingRef = useRef(false);
  const cardIdRef = useRef<string | null>(null);
  const nightRef = useRef<{ start: number; end: number }>({ start: 0, end: 1 });
  const textAtRef = useRef(0);
  const lastMinRef = useRef<string>('');
  const shown = useRef(new Map<Element, string>());
  const refreshTimer = useRef(0);
  const hintTimer = useRef(0);
  const zoomHinted = useRef(false);
  const tableOpenRef = useRef(false);
  /** Plate chrome (clock bead, place pill, full-screen bead, the hint while it shows) in canvas px: labels avoid it. */
  const reserveRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);

  const beadRef = useRef<HTMLParagraphElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const whenNowRef = useRef<HTMLSpanElement>(null);
  const fullTimeRef = useRef<HTMLSpanElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  /* ------------------------------------------------ text writes ------------------------------------------------ */

  const put = (el: Element | null, text: string) => {
    if (!el || shown.current.get(el) === text) return;
    shown.current.set(el, text);
    el.textContent = text;
  };

  /** Per frame: only what changed reaches the DOM (a minute, the zone, the phase, live or scrubbed). */
  const writeClock = (s: SkyState) => {
    const tz = placeRef.current.timeZone;
    const key = `${Math.floor(s.t / MINUTE)}|${placeRef.current.id}`;
    if (key !== lastMinRef.current) {
      lastMinRef.current = key;
      const day = formatDay(s.t, tz);
      put(timeRef.current, `${day !== formatDay(Date.now(), tz) ? `${day} · ` : ''}${s.time}`);
      put(fullTimeRef.current, `${s.time} ${s.tz}`.trim());
    }
    put(zoneRef.current, s.tz);
    put(phaseRef.current, PHASE[s.phase]);
    put(whenNowRef.current, s.live ? SKY_UI.whenNow : s.time);
    const bead = beadRef.current;
    if (bead && bead.dataset.live !== String(s.live)) bead.dataset.live = String(s.live);
    if (s.live !== liveRef.current) {
      liveRef.current = s.live;
      setLive(s.live);
    }
  };

  /* ------------------------------------------- time, text alternative ------------------------------------------- */

  /** The slider: sunset to sunrise of the night around the sky's time, in minutes, labelled in the place's zone. */
  const syncScrub = (engine: Sky) => {
    const night = engine.getNight();
    nightRef.current = night;
    const tz = placeRef.current.timeZone;
    setEnds({ dusk: formatClock(night.start, tz), dawn: formatClock(night.end, tz) });
    const input = scrubRef.current;
    if (!input) return;
    const max = Math.max(1, Math.round((night.end - night.start) / MINUTE));
    input.max = String(max);
    const t = engine.getTime();
    const value = clamp(Math.round((t - night.start) / MINUTE), 0, max);
    input.value = String(value);
    input.setAttribute('aria-valuetext', `${formatClock(t, tz)}${engine.isLive() ? SKY_UI.valueNowSuffix : ''}`);
    input.style.setProperty('--p', `${(value / max) * 100}%`);
  };

  /** Up now, the summary, the table and the card: once a minute while live, and on every place or time change. */
  const refreshText = (engine: Sky) => {
    textAtRef.current = Date.now();
    const next = engine.upNow(8);
    setUp(next);
    const all = [...next.items, ...next.constellations.slice(0, 4)];
    setRows(
      all.map((o) => {
        // Rise and set is a 24 h scan per row: only while the table is open (review P2-1). The card's own selection
        // still gets it below.
        const detail = engine.info(o.id, { riseSet: tableOpenRef.current });
        const riseSet = detail?.lines.find(([k]) => /rise|set/i.test(k))?.[1] ?? '';
        const bright =
          o.kind === 'moon'
            ? (detail?.lines.find(([k]) => k === 'Phase')?.[1] ?? '')
            : o.mag !== undefined
              ? `mag ${formatMag(o.mag)}`
              : '';
        return { id: o.id, cells: [o.name, kindWord(o.kind), `${Math.round(o.alt)}°`, compass16(o.az), bright, riseSet] };
      }),
    );
    const id = cardIdRef.current;
    if (id) setInfo(engine.info(id));
  };
  const refreshSoon = (engine: Sky) => {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => refreshText(engine), 200);
  };

  /* ---------------------------------------------------- hint ---------------------------------------------------- */

  /** Measure the plate chrome the labels must not sit under, then redraw (labels re-place on the next frame). */
  const measureReserve = () => {
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const base = canvas.getBoundingClientRect();
    reserveRef.current = [...host.querySelectorAll<HTMLElement>('[data-sky-reserve]')]
      .filter((el) => !el.hasAttribute('data-off') && el.getClientRects().length > 0)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
      });
    skyRef.current?.setOptions({});
  };
  const hideHint = () => {
    hintRef.current?.setAttribute('data-off', '');
    measureReserve();
  };
  const flashHint = (text: string) => {
    const hint = hintRef.current;
    if (!hint) return;
    hint.textContent = text;
    hint.removeAttribute('data-off');
    measureReserve();
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(hideHint, 2600);
  };
  /** A status the hint shows is spoken too: the hint itself is aria-hidden (review P1-1). */
  const tell = (text: string) => {
    setAnnounce(text);
    flashHint(text);
  };

  /* ------------------------------------------------ actions ------------------------------------------------ */

  const applyPlace = (engine: Sky, next: SkyPlaceOption) => {
    placeRef.current = next;
    engine.setPlace(next);
    setPlace(next);
    canvas?.setAttribute('aria-label', SKY_UI.canvasLabel(next.id === 'you' ? SKY_UI.hereLabel : next.segment));
    lastMinRef.current = '';
    syncScrub(engine);
    refreshText(engine);
  };

  const choosePlace = (id: SkyPlaceId) => {
    const engine = skyRef.current;
    if (!engine) return;
    if (id !== 'you') {
      const next = places.find((p) => p.id === id);
      if (next) applyPlace(engine, next);
      return;
    }
    if (!('geolocation' in navigator)) {
      tell(SKY_UI.location.unavailable);
      return;
    }
    tell(SKY_UI.location.asking);
    // Asked for only on this press; rounded to 0.1° and kept in this page (hereSkyPlace). Never stored or sent.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (skyRef.current !== engine) return;
        applyPlace(engine, hereSkyPlace(pos.coords.latitude, pos.coords.longitude));
        hideHint();
        setAnnounce(SKY_UI.location.here);
      },
      () => {
        if (skyRef.current === engine) tell(SKY_UI.location.denied);
      },
      { maximumAge: 600_000, timeout: 10_000 },
    );
  };

  /** The sky I grew up under (§4.2.5): Sikahar, 15 Jan of this year, 21:00 IST, facing south. Adds no fact. */
  const showPreset = (engine: Sky) => {
    const sikahar = places.find((p) => p.id === 'sikahar') ?? places[0];
    placeRef.current = sikahar;
    engine.setPlace(sikahar);
    setPlace(sikahar);
    canvas?.setAttribute('aria-label', SKY_UI.canvasLabel(sikahar.segment));
    const year = new Date().getFullYear();
    engine.setTime(zonedTime(year, SKY_PRESET.month, SKY_PRESET.day, SKY_PRESET.hour, SKY_PRESET.minute, SKY_PRESET.timeZone));
    engine.setView({ az: 180, alt: southAlt(plate), fov: 90 }, { animate: !prefersReducedMotion() });
    lastMinRef.current = '';
    syncScrub(engine);
    refreshText(engine);
  };

  /** See tonight (daylight): sweeps to sunset + 1 h of the coming night. */
  const showTonight = (engine: Sky) => {
    const night = engine.getNight();
    void engine.setTime(night.start + 3_600_000, { animate: !prefersReducedMotion() }).then(() => {
      if (skyRef.current !== engine) return; // unmounted mid-sweep (review P3-3)
      syncScrub(engine);
      refreshText(engine);
    });
  };

  const scrubTo = (minutes: number) => {
    const engine = skyRef.current;
    const input = scrubRef.current;
    if (!engine || !input) return;
    const max = Number(input.max) || 1;
    const value = clamp(minutes, 0, max);
    input.value = String(value);
    const t = nightRef.current.start + value * MINUTE;
    void engine.setTime(t);
    input.setAttribute('aria-valuetext', formatClock(t, placeRef.current.timeZone));
    input.style.setProperty('--p', `${(value / max) * 100}%`);
    refreshSoon(engine);
  };
  const onScrub = (e: ChangeEvent<HTMLInputElement>) => scrubTo(Number(e.target.value));
  /** Arrows step 10 minutes, Page Up / Down an hour (Home and End keep the native ends). */
  const onScrubKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const step = ({ ArrowLeft: -10, ArrowDown: -10, ArrowRight: 10, ArrowUp: 10, PageDown: -60, PageUp: 60 } as Record<string, number>)[e.key];
    if (step === undefined) return;
    e.preventDefault();
    scrubTo(Number(e.currentTarget.value) + step);
  };

  /** Live: a pressed toggle that never moves. Pressed while scrubbed, it sweeps back to now; slider and text sync on arrival. */
  const onLive = () => {
    const engine = skyRef.current;
    if (!engine || engine.isLive()) return;
    void engine.now({ animate: !prefersReducedMotion() }).then(() => {
      if (skyRef.current !== engine) return;
      syncScrub(engine);
      refreshText(engine);
    });
  };

  const pick = (id: string) => skyRef.current?.select(id);
  const closeCard = () => {
    skyRef.current?.select(null);
    canvas?.focus({ preventScroll: true });
  };

  const startFollow = (engine: Sky) => {
    followingRef.current = true;
    setFollowing(true);
    setNote(SKY_UI.full.holdUp);
    // iOS asks for motion access only inside a press: this runs in the button's click handler.
    engine.enableOrientation().catch((error: unknown) => {
      followingRef.current = false;
      setFollowing(false);
      setNote(error instanceof Error && error.message === 'denied' ? SKY_UI.full.declined : SKY_UI.full.unavailable);
    });
  };
  const openFull = (follow: boolean) => {
    const engine = skyRef.current;
    if (!engine || fullRef.current) return;
    fullRef.current = true;
    setFull(true);
    setNote(SKY_UI.full.note);
    setMiddle({ label: SKY_UI.full.middle, body: SKY_UI.full.nothingYet });
    if (follow) startFollow(engine);
  };
  const closeFull = () => {
    if (!fullRef.current) return;
    fullRef.current = false;
    setFull(false);
    if (followingRef.current) {
      followingRef.current = false;
      setFollowing(false);
      skyRef.current?.disableOrientation();
    }
  };
  const toggleFollow = () => {
    const engine = skyRef.current;
    if (!engine) return;
    if (!followingRef.current) {
      startFollow(engine);
      return;
    }
    followingRef.current = false;
    setFollowing(false);
    engine.disableOrientation();
  };

  /* ------------------------------------------------ engine events ------------------------------------------------ */

  const onEngineSelect = useEffectEvent((next: SkyInfo | null) => {
    const fresh = (next?.id ?? null) !== cardIdRef.current;
    cardIdRef.current = next?.id ?? null;
    setInfo(next);
    if (!next) return;
    // While the phone points the sky, the dialog's own "In the middle" region is the one voice (review P2-5).
    if (fresh && !(fullRef.current && followingRef.current))
      setAnnounce(`${next.title}. ${next.lines.map((l) => l.join(': ')).join('. ')}.`);
    if (fullRef.current) setMiddle({ label: `${SKY_UI.card.selected}:`, body: `${next.title} · ${next.lines[0]?.[1] ?? ''}` });
  });
  const onEngineChange = useEffectEvent((s: SkyState) => writeClock(s));
  /** Once a second while live: the minute can turn between the 5 s redraws. */
  const onEngineTick = useEffectEvent((time: string, t: number) => {
    const key = `${Math.floor(t / MINUTE)}|${placeRef.current.id}`;
    if (key === lastMinRef.current) return;
    lastMinRef.current = key;
    put(timeRef.current, time);
    put(fullTimeRef.current, `${time} ${placeRef.current.tzLabel}`.trim());
  });
  const onEngineHint = useEffectEvent(() => {
    // Plain wheel over the sky scrolls the page; say once how to zoom.
    if (zoomHinted.current) return;
    zoomHinted.current = true;
    tell(SKY_UI.zoomHint);
  });
  const onEngineCentre = useEffectEvent((text: string) => tell(text));
  const onEngineVisibility = useEffectEvent((on: boolean) => {
    const engine = skyRef.current;
    if (on && engine?.isLive() && Date.now() - textAtRef.current > MINUTE) {
      syncScrub(engine);
      refreshText(engine);
    }
  });
  const onEngineOrientation = useEffectEvent((on: boolean, mode: SkyOrientationMode) => {
    if (on) setNote(ORIENTATION_NOTE[mode] ?? SKY_UI.full.holdUp);
    else if (followingRef.current && mode === 'drag') {
      // A drag is the visitor's choice: pointing stops, and the toggle says so.
      followingRef.current = false;
      setFollowing(false);
      setNote(SKY_UI.full.dragOff);
    }
  });
  const onReady = useEffectEvent((engine: Sky, c: HTMLCanvasElement) => {
    setSky(engine);
    setCanvas(c);
    syncScrub(engine);
    refreshText(engine);
  });
  const onCommand = useEffectEvent((command: SkyCommand) => {
    const engine = skyRef.current;
    if (!engine) return;
    if (command === 'preset') showPreset(engine);
    else showTonight(engine);
  });
  const onMinute = useEffectEvent(() => {
    const engine = skyRef.current;
    if (engine && engine.isLive() && engine.isOnscreen()) {
      syncScrub(engine);
      refreshText(engine);
    }
  });
  const onMiddleTick = useEffectEvent(() => {
    const engine = skyRef.current;
    if (!engine) return;
    const c = engine.centreTarget();
    if (c.id) {
      // Following re-selects only when the target changes, not twice a second (no card churn, no rise / set rescans).
      const detail =
        followingRef.current && c.id !== cardIdRef.current
          ? engine.select(c.id, { center: false })
          : engine.info(c.id, { riseSet: false });
      if (detail) setMiddle({ label: SKY_UI.full.middle, body: `${detail.title} · ${detail.lines[0]?.[1] ?? ''}` });
    } else setMiddle({ label: '', body: c.text });
  });

  /* ------------------------------------------------ the engine ------------------------------------------------ */

  // One canvas and one engine per mount. The canvas is made here, not by React, because the full-screen view moves it
  // into the dialog and back (React must never own a node that changes parent).
  useEffect(() => {
    const c = document.createElement('canvas');
    c.tabIndex = 0;
    c.setAttribute('role', 'application');
    c.setAttribute('aria-roledescription', SKY_UI.canvasRoleDescription);
    c.setAttribute('aria-label', SKY_UI.canvasLabel(places[0].segment));
    c.setAttribute('aria-describedby', 'sky-summary sky-keys-line');
    c.className = CANVAS_CLASS;
    const gestures = window.matchMedia(COARSE_QUERY).matches ? 'horizontal' : 'all';
    // Phones inline: a vertical swipe scrolls the page, a sideways one turns the sky (SKY-SPEC §2.4).
    c.style.touchAction = gestures === 'all' ? 'none' : 'pan-y';
    plate.prepend(c);
    const lite = document.documentElement.dataset.lite === '1' || (getMotionTier() === 0 && !prefersReducedMotion());
    const engine = createSky(c, {
      catalogue: SKY_CATALOGUE,
      place: places[0],
      theme: readSkyTheme(plate),
      gestures,
      wheel: 'modifier',
      view: { az: 180, alt: southAlt(plate), fov: 90 },
      reserve: () => reserveRef.current,
      lite,
      lines: true,
      names: true,
      onSelect: (next) => onEngineSelect(next),
      onChange: (s) => onEngineChange(s),
      onTick: (tick) => onEngineTick(tick.time, tick.t),
      onHint: () => onEngineHint(),
      onCentre: (centre) => onEngineCentre(centre.text),
      onVisibility: (on) => onEngineVisibility(on),
      onOrientation: (on, mode) => onEngineOrientation(on, mode),
    });
    skyRef.current = engine;

    // The first frame is drawn (synchronously, on creation): the poster fades out on the next frame.
    const ready = requestAnimationFrame(() => {
      plate.setAttribute('data-sky-drawn', '');
      onReady(engine, c);
    });

    // A finger on the sky asks the phone dock to step aside (BUILD-PLAN §2.1).
    const hold = () => {
      if (!fullRef.current) plate.setAttribute('data-dock-avoid-held', '');
    };
    const letGo = () => plate.removeAttribute('data-dock-avoid-held');
    c.addEventListener('pointerdown', hold);
    window.addEventListener('pointerup', letGo);
    window.addEventListener('pointercancel', letGo);

    // Theme: re-read the tokens on a theme switch, a contrast change and once the self-hosted fonts are in.
    const retheme = () => engine.setTheme(readSkyTheme(plate));
    const themeWatch = new MutationObserver(retheme);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    const contrast = window.matchMedia('(prefers-contrast: more)');
    contrast.addEventListener('change', retheme);
    let alive = true;
    void document.fonts?.ready.then(() => alive && retheme());

    return () => {
      alive = false;
      cancelAnimationFrame(ready);
      c.removeEventListener('pointerdown', hold);
      window.removeEventListener('pointerup', letGo);
      window.removeEventListener('pointercancel', letGo);
      themeWatch.disconnect();
      contrast.removeEventListener('change', retheme);
      engine.destroy();
      c.remove();
      letGo();
      plate.removeAttribute('data-sky-drawn');
      skyRef.current = null;
    };
  }, [plate, places]);

  // Lite follows the tier (it can only drop at runtime).
  useEffect(() => {
    const lite = document.documentElement.dataset.lite === '1' || (tier === 0 && !prefersReducedMotion());
    sky?.setOptions({ lite });
  }, [sky, tier]);

  // Inline gestures follow the pointer (a tablet with a keyboard cover, a desktop touch screen).
  useEffect(() => {
    if (!sky || !canvas || fullRef.current) return;
    sky.setOptions({ gestures: inlineGestures });
    setTouchAction(canvas, inlineGestures === 'all' ? 'none' : 'pan-y');
  }, [sky, canvas, inlineGestures]);

  // Origin's "Open this sky" and the daylight readout link (BUILD-PLAN §2.2); a command sent before the sky loaded
  // arrives now.
  useEffect(() => (sky ? onSkyCommand((command) => onCommand(command)) : undefined), [sky]);

  // Live text: once a minute while live and on screen (and at once on return after a minute away: onVisibility).
  useEffect(() => {
    if (!sky) return;
    const timer = window.setInterval(() => onMinute(), MINUTE);
    return () => window.clearInterval(timer);
  }, [sky]);

  // The hint: shown when the sky first comes into view; gone on the first touch or after 5 s; never back this visit.
  useEffect(() => {
    if (!canvas) return;
    const hint = () => hintRef.current?.setAttribute('data-off', '');
    canvas.addEventListener('pointerdown', hint, { once: true });
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timer = window.setTimeout(hint, 5000);
      },
      { threshold: 0.5 },
    );
    io.observe(plate);
    return () => {
      canvas.removeEventListener('pointerdown', hint);
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [canvas, plate]);

  // The full-screen sky names what the reticle holds, twice a second, written (and announced) only when it changes.
  useEffect(() => {
    if (!full) return;
    const timer = window.setInterval(() => onMiddleTick(), 500);
    return () => window.clearInterval(timer);
  }, [full]);

  // Labels keep clear of the plate's glass: re-measure on resize and whenever that chrome changes.
  const onChromeChange = useEffectEvent(() => measureReserve());
  useEffect(() => {
    if (!canvas) return;
    const ro = new ResizeObserver(() => onChromeChange());
    ro.observe(plate);
    onChromeChange();
    return () => ro.disconnect();
  }, [canvas, plate, narrow, coarse, full, live]);

  useEffect(
    () => () => {
      window.clearTimeout(refreshTimer.current);
      window.clearTimeout(hintTimer.current);
    },
    [],
  );

  /* --------------------------------------------------- render --------------------------------------------------- */

  const engine = sky;
  const selectedId = info?.id ?? null;
  const placeOptions = [...places.map((p) => ({ id: p.id, option: p.option })), { id: 'you' as const, option: SKY_UI.places.you.option }];

  const plateChrome = (
    <>
      <SkyClockBead beadRef={beadRef} timeRef={timeRef} zoneRef={zoneRef} phaseRef={phaseRef} />
      {narrow ? (
        <label data-sky-reserve="" className={clsx(GLASS_BEAD, 'left-3 top-3 inline-flex items-center pl-3.5 pr-1.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring-action')}>
          <span className="sr-only">{SKY_UI.placeLabel}</span>
          <select
            value={place.id}
            onChange={(e) => choosePlace(e.target.value as SkyPlaceId)}
            className="h-11 cursor-pointer appearance-none border-0 bg-transparent py-0 pl-0 pr-7 font-display text-ui font-semibold text-ink focus-visible:outline-none [&>option]:bg-surface [&>option]:text-ink"
          >
            {placeOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.option}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 size-4 text-ink-muted" strokeWidth={2} />
        </label>
      ) : null}
      {coarse ? (
        <button
          type="button"
          aria-label={SKY_UI.openFull}
          data-sky-reserve=""
          onClick={() => openFull(false)}
          className={clsx(GLASS_BEAD, 'right-3 top-16 grid w-11 place-items-center text-ink transition-transform duration-micro active:scale-95 motion-reduce:active:scale-100')}
        >
          <Maximize2 aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      ) : null}
      <p
        ref={hintRef}
        aria-hidden="true"
        data-sky-reserve=""
        className={clsx(
          styles.hint,
          'glass-chrome glass-tile glass-steel pointer-events-none absolute left-1/2 top-[68px] z-[2] m-0 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-2 font-body text-caption leading-tight text-ink max-md:top-[116px]',
        )}
      >
        {coarse ? SKY_UI.hint.coarse : SKY_UI.hint.fine}
      </p>
      {narrow ? <SkyCard info={info} compact onCentre={() => selectedId && pick(selectedId)} onClose={closeCard} /> : null}
    </>
  );

  return (
    <>
      {createPortal(plateChrome, plate)}
      {createPortal(
        <SkyControls
          places={places}
          placeId={place.id}
          onPlace={choosePlace}
          live={live}
          onLive={onLive}
          dusk={ends.dusk}
          dawn={ends.dawn}
          scrubRef={scrubRef}
          whenNowRef={whenNowRef}
          onScrub={onScrub}
          onScrubKey={onScrubKey}
          onPreset={() => skyRef.current && showPreset(skyRef.current)}
          showTonight={live && up?.phase === 'day'}
          onTonight={() => skyRef.current && showTonight(skyRef.current)}
          lines={lines}
          names={names}
          onLines={() => {
            setLines(!lines);
            skyRef.current?.setOptions({ lines: !lines });
          }}
          onNames={() => {
            setNames(!names);
            skyRef.current?.setOptions({ names: !names });
          }}
          onZoom={(factor) => {
            const e = skyRef.current;
            if (e) e.setView({ fov: e.getView().fov * factor }, { animate: !prefersReducedMotion() });
          }}
          onFaceSouth={() => {
            const e = skyRef.current;
            if (e) e.setView({ az: 180, alt: southAlt(plate, e.getView().fov) }, { animate: !prefersReducedMotion() });
          }}
          coarse={coarse}
          canOrient={canOrient}
          onPointUp={() => openFull(true)}
          onLookAround={() => openFull(false)}
        />,
        controls,
      )}
      {createPortal(
        <aside aria-label={SKY_UI.sideLabel} className="grid content-start gap-7">
          {narrow ? null : <SkyCard info={info} compact={false} onCentre={() => selectedId && pick(selectedId)} onClose={closeCard} />}
          {up ? <UpNowList up={up} selectedId={selectedId} onPick={pick} /> : null}
          {engine ? <SkyFind find={(q) => engine.find(q)} selectedId={selectedId} onPick={pick} /> : null}
          <SkyTable
            caption={up ? up.text.slice(0, Math.max(0, up.text.indexOf(': '))) : ''}
            rows={rows}
            onOpenChange={(open) => {
              tableOpenRef.current = open;
              if (open && skyRef.current) refreshText(skyRef.current);
            }}
          />
        </aside>,
        side,
      )}
      <p id="sky-summary" className="sr-only">
        {up?.text ?? ''}
      </p>
      <p id="sky-keys-line" className="sr-only">
        {SKY_UI.keysLine}
      </p>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
      {engine && canvas ? (
        <PointUpDialog
          open={full}
          canvas={canvas}
          plate={plate}
          sky={engine}
          inlineGestures={inlineGestures}
          placeName={place.id === 'you' ? SKY_UI.places.you.segment : place.segment}
          following={following}
          canOrient={canOrient}
          middle={middle}
          note={note}
          timeRef={fullTimeRef}
          onDone={closeFull}
          onFollow={toggleFollow}
        />
      ) : null}
    </>
  );
}
