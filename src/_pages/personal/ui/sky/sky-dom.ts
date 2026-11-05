'use client';

import { useSyncExternalStore } from 'react';
import type { SkyTheme } from '../../lib/sky-engine';

/*
 * Browser helpers of the live sky (lazy chunk only): the canvas theme read from the palette tokens, media queries as
 * hooks, and time formatting per zone. No colours are defined here: every value is a token, resolved inside the
 * plate's night scope.
 */

/** Engine colour slots -> palette tokens (SKY-SPEC §4.5; the prototype's mapping). */
const THEME_TOKENS = {
  sky: 'var(--ground-sky)',
  skyHorizon: 'var(--sky-horizon)',
  // The ground below the horizon is the page's own ground (the night scope's ground in Day: fix S4).
  ground: 'var(--ground)',
  horizon: 'var(--line-strong)',
  line: 'rgb(var(--c-ink) / var(--alpha-edge))',
  label: 'var(--ink-muted)',
  labelStrong: 'var(--ink)',
  halo: 'var(--ground-sky)',
  starHot: 'var(--star-hot)',
  starSun: 'var(--ink)',
  starCool: 'var(--star-cool)',
  planet: 'var(--accent-2)',
  moon: 'var(--ink)',
  moonDark: 'var(--surface-3)',
  sun: 'var(--star-cool)',
  select: 'var(--action)',
  selectLine: 'var(--action-line)',
  grid: 'rgb(var(--c-ink) / var(--alpha-faint))',
} as const;

type ColourKey = keyof typeof THEME_TOKENS;

let reader: CanvasRenderingContext2D | null = null;

/** A computed CSS colour (hex, rgb, oklch, color-mix…) as a canvas-safe `rgb()` / `rgba()` string. */
function toCanvasColour(css: string): string {
  if (!reader) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    reader = c.getContext('2d', { willReadFrequently: true });
  }
  if (!reader) return css;
  reader.clearRect(0, 0, 1, 1);
  reader.fillStyle = css;
  reader.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = reader.getImageData(0, 0, 1, 1).data;
  return a >= 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

/** Resolves the engine theme inside `scope` (the plate, which carries `data-palette-scope="night"`). */
export function readSkyTheme(scope: HTMLElement): SkyTheme {
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  scope.append(probe);
  const colours = {} as Record<ColourKey, string>;
  for (const key of Object.keys(THEME_TOKENS) as ColourKey[]) {
    probe.style.color = THEME_TOKENS[key];
    colours[key] = toCanvasColour(getComputedStyle(probe).color);
  }
  probe.remove();
  const style = getComputedStyle(scope);
  const display = style.getPropertyValue('--font-display').trim() || 'sans-serif';
  const data = style.getPropertyValue('--font-data').trim() || 'monospace';
  return {
    ...colours,
    glow: true,
    fontLabel: `600 11px ${display}`,
    fontName: `500 12px ${data}`,
    fontCompass: `600 13px ${display}`,
  };
}

/* ------------------------------------------------ media queries ------------------------------------------------ */

function subscribeQuery(query: string) {
  return (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  };
}
const subscribers = new Map<string, (onChange: () => void) => () => void>();

/** A media query as state (client-only islands: the server snapshot is never used for markup). */
export function useMedia(query: string): boolean {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = subscribeQuery(query);
    subscribers.set(query, subscribe);
  }
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const NARROW_QUERY = '(max-width: 767.98px)';
export const COARSE_QUERY = '(pointer: coarse)';
export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = () => window.matchMedia(REDUCE_QUERY).matches;

/**
 * The canvas's touch-action: `none` where the sky takes every gesture (desktop, full screen), `pan-y` inline on phones
 * (a vertical swipe scrolls the page). A plain function so components can set it on the canvas they were handed.
 */
export function setTouchAction(el: HTMLElement, value: 'none' | 'pan-y'): void {
  el.style.touchAction = value;
}

/* --------------------------------------------------- time --------------------------------------------------- */

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string | undefined, kind: 'time' | 'day'): Intl.DateTimeFormat {
  const key = `${timeZone ?? ''}|${kind}`;
  let f = formatters.get(key);
  if (!f) {
    f =
      kind === 'time'
        ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone })
        : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone });
    formatters.set(key, f);
  }
  return f;
}
/** "21:40" in the zone (the browser's when undefined). */
export const formatClock = (ms: number, timeZone?: string) => formatter(timeZone, 'time').format(ms);
/** "15 Jan" in the zone. */
export const formatDay = (ms: number, timeZone?: string) => formatter(timeZone, 'day').format(ms);

/** The zone's offset from UTC at an instant, in ms. */
function zoneOffset(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(ms);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** UTC ms of a wall-clock time in an IANA zone ("15 Jan, 21:00 in Asia/Kolkata"). */
export function zonedTime(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let t = wall - zoneOffset(wall, timeZone);
  const again = wall - zoneOffset(t, timeZone);
  if (again !== t) t = again;
  return t;
}
