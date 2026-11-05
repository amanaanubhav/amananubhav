/*
 * The live, interactive sky of /personal#sky (FINAL-DESIGN §4.2, SKY-SPEC §2 to §5). Typed port of the reviewed
 * prototype engine `docs/redesign/life/sky/sky-proto.js` (with its review fixes and the prototype build's `names`
 * option). No React, no GSAP, no runtime imports: Node's type stripping can load this file directly, which is how
 * `scripts/posters/sky-selftest.mjs` tests it. Loaded only in the lazy sky chunk (`ui/sky/SkyLive.tsx`).
 *
 * Canvas 2D, render on demand: a frame is drawn only when the view, the time or the theme changes, or while a
 * gesture, momentum, a spring or a held key is running. The live clock redraws every 5 s (the sky turns 0.25° a
 * minute), and everything sleeps while the canvas is off screen or the tab is hidden.
 *
 *   const sky = createSky(canvas, { catalogue, place, theme, onSelect, onChange, onTick });
 *
 * Astronomy (low precision, about 0.05° for stars, 0.1° for planets, 0.2° for the Moon):
 *   - stars: J2000 positions (d3-celestial, `config/sky-catalogue.generated.ts`) precessed to date (IAU 1976);
 *   - sidereal time: IAU 1982 GMST (Meeus 12.4);
 *   - Sun, Moon, planets: Paul Schlyter's orbital elements with the main perturbations, the Moon topocentric.
 * No refraction, nutation or aberration: far below a pixel at the zoom levels this view allows.
 *
 * Colours: none here. The host resolves the palette tokens (inside the plate's night scope) and passes them in as
 * `theme`; the engine only mixes and fades the values it is given.
 *
 * Star data: d3-celestial by Olaf Frohn, Copyright (c) 2015, BSD-3-Clause; the full notice is in the generated
 * catalogue's header (scripts/posters/sky-data.mjs).
 */

/* =============================================================================================== */
/* Types                                                                                            */
/* =============================================================================================== */

/** The generated catalogue (`config/sky-catalogue.generated.ts`, layout in its header). */
export interface SkyCatalogue {
  readonly fields: number;
  readonly magLimit: number;
  readonly stars: readonly number[];
  readonly names: readonly (readonly [number, string, string])[];
  readonly constellations: readonly (readonly [string, string, string, string, number, number, number])[];
  readonly figures: readonly (readonly [number, readonly (readonly number[])[]])[];
}

/** Where the observer stands. Coordinates are used for the maths only, never printed (except Sikahar's 25° N). */
export interface SkyPlace {
  readonly id: string;
  readonly lat: number;
  readonly lon: number;
  /** Long label, e.g. "Sikahar, 25° N". */
  readonly label: string;
  /** Used in the summary: "Up now from 25° N, …". */
  readonly short: string;
  /** IANA zone; undefined = the browser's zone ("where you are"). */
  readonly timeZone?: string;
  /** "IST", "NPT", or '' for the browser's zone. */
  readonly tzLabel: string;
}

/** Resolved colours (palette tokens, resolved by the host) and canvas fonts. */
export interface SkyTheme {
  readonly sky: string;
  readonly skyHorizon: string;
  readonly ground: string;
  readonly horizon: string;
  readonly line: string;
  readonly label: string;
  readonly labelStrong: string;
  readonly halo: string;
  readonly starHot: string;
  readonly starSun: string;
  readonly starCool: string;
  readonly planet: string;
  readonly moon: string;
  readonly moonDark: string;
  readonly sun: string;
  readonly select: string;
  readonly selectLine: string;
  readonly grid: string;
  readonly glow: boolean;
  readonly fontLabel: string;
  readonly fontName: string;
  readonly fontCompass: string;
}

export interface SkyView {
  az: number;
  alt: number;
  fov: number;
  roll?: number;
}

export type SkyPhase = 'night' | 'twilight' | 'day';
export type SkyGestures = 'all' | 'horizontal';
export type SkyWheel = 'always' | 'modifier';

/** After every drawn frame. The host writes the DOM only when a value it shows changes. */
export interface SkyState {
  readonly t: number;
  readonly live: boolean;
  /** "21:40" in the place's zone. */
  readonly time: string;
  readonly tz: string;
  readonly place: SkyPlace;
  readonly view: SkyView;
  readonly sunAlt: number;
  readonly phase: SkyPhase;
  /** The finer stage: night, astronomical / nautical / civil twilight, day. */
  readonly stage: string;
}

export interface SkyTick {
  readonly t: number;
  readonly time: string;
  readonly live: boolean;
}

/** A card for a selection: kind, title, kicker (sub-line) and up to four facts. */
export interface SkyInfo {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly kicker: string;
  readonly lines: readonly (readonly [string, string])[];
}

export type SkyUpKind = 'moon' | 'planet' | 'star' | 'constellation';

export interface SkyUpItem {
  readonly id: string;
  readonly kind: SkyUpKind;
  readonly name: string;
  readonly alt: number;
  readonly az: number;
  readonly mag?: number;
}

export interface SkyUpNow {
  readonly items: readonly SkyUpItem[];
  readonly constellations: readonly SkyUpItem[];
  readonly phase: SkyPhase;
  /** The text alternative: "Up now from 25° N, 21:00 IST: Jupiter high in the east; …". */
  readonly text: string;
}

export interface SkyFound {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
}

/** What the reticle holds (Enter, the full-screen sky). */
export interface SkyCentre {
  readonly kind: 'hit' | 'nearest' | 'ground' | 'none';
  readonly id: string | null;
  readonly nearId: string | null;
  readonly text: string;
}

export type SkyOrientationMode = 'compass' | 'relative' | 'calibrate' | 'off' | 'drag' | 'pagehide' | 'destroy';

export interface SkyNight {
  readonly start: number;
  readonly end: number;
  readonly polar: boolean;
}

export interface SkyOptions {
  readonly catalogue: SkyCatalogue;
  readonly place: SkyPlace;
  readonly theme: SkyTheme;
  readonly view?: Partial<SkyView>;
  /** 'horizontal' leaves vertical touch pans to the page (inline on phones). */
  readonly gestures?: SkyGestures;
  /** 'modifier' zooms only with Ctrl/⌘ (or a trackpad pinch), so the page scrolls. */
  readonly wheel?: SkyWheel;
  /** No momentum, no animated moves. Undefined = follow the OS setting, live. */
  readonly reducedMotion?: boolean;
  /** Fewer stars, no glow, DPR <= 1.5. */
  readonly lite?: boolean;
  readonly grid?: boolean;
  readonly lines?: boolean;
  /** Star and constellation names (the selection keeps its label either way). */
  readonly names?: boolean;
  readonly hindi?: boolean;
  /** Drop the glow and faint stars while moving when a full frame costs > 8 ms. */
  readonly adaptive?: boolean;
  readonly onSelect?: (info: SkyInfo | null) => void;
  readonly onChange?: (state: SkyState) => void;
  readonly onTick?: (tick: SkyTick) => void;
  readonly onHint?: (kind: 'wheel') => void;
  /** Rectangles (canvas CSS px) covered by the page's own chrome; labels are not placed under them. Read per frame. */
  readonly reserve?: () => readonly { x: number; y: number; w: number; h: number }[];
  readonly onCentre?: (centre: SkyCentre) => void;
  readonly onVisibility?: (on: boolean) => void;
  readonly onOrientation?: (on: boolean, mode: SkyOrientationMode) => void;
}

export interface SkySettableOptions {
  grid?: boolean;
  lines?: boolean;
  names?: boolean;
  hindi?: boolean;
  gestures?: SkyGestures;
  wheel?: SkyWheel;
  lite?: boolean;
  reducedMotion?: boolean;
}

export interface Sky {
  setPlace(place: SkyPlace): void;
  /** Freeze the sky at a time (scrubbing). `{ animate: true }` sweeps there. Resolves when the sky arrives. */
  setTime(date: Date | number, opts?: { animate?: boolean }): Promise<void>;
  /** Back to the live clock (sweeps back unless reduced motion or off screen). Resolves on arrival. */
  now(opts?: { animate?: boolean }): Promise<void>;
  isLive(): boolean;
  getTime(): number;
  /** Sunset to sunrise around the current time, for the scrubber. */
  getNight(): SkyNight;
  setView(view: Partial<SkyView>, opts?: { animate?: boolean }): void;
  getView(): SkyView;
  resetView(): void;
  setTheme(theme: SkyTheme): void;
  setOptions(options: SkySettableOptions): void;
  /** Select by id ('star:12', 'planet:jupiter', 'moon', 'sun', 'constellation:Ori'); centres it unless told not to. */
  select(id: string | null, opts?: { center?: boolean; exact?: boolean }): SkyInfo | null;
  /** `{ riseSet: false }` skips the rise / set scan (the costly line) when only position and brightness are needed. */
  info(id?: string, opts?: { riseSet?: boolean }): SkyInfo | null;
  upNow(limit?: number): SkyUpNow;
  describe(): string;
  find(query: string): SkyFound[];
  /** "Point your phone up": call from a press (iOS asks only inside a user gesture). Rejects 'denied' | 'unsupported' | 'no-data'. */
  enableOrientation(): Promise<'on'>;
  disableOrientation(): void;
  orientationActive(): boolean;
  centreTarget(): SkyCentre;
  isOnscreen(): boolean;
  destroy(): void;
}

/* =============================================================================================== */
/* Maths                                                                                            */
/* =============================================================================================== */

type Vec3 = [number, number, number];

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const HOUR = 3_600_000;
const wrap = (r: number) => ((r % TAU) + TAU) % TAU;
const wrapPi = (r: number) => wrap(r + Math.PI) - Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const sind = (d: number) => Math.sin(d * DEG);
const cosd = (d: number) => Math.cos(d * DEG);

/** Julian Date (UT) of an epoch in ms. */
export function julianDate(ms: number): number {
  return ms / 86_400_000 + 2440587.5;
}

/** Greenwich mean sidereal time, radians (IAU 1982, Meeus 12.4). */
export function gmst(ms: number): number {
  const d = julianDate(ms) - 2451545.0;
  const t = d / 36525;
  return wrap((280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - (t * t * t) / 38710000) * DEG);
}

/** Local mean sidereal time, radians; longitude east-positive in degrees. */
export function lst(ms: number, lonDeg: number): number {
  return wrap(gmst(ms) + lonDeg * DEG);
}

/** 3x3 row-major product. */
function mul(a: Float64Array, b: Float64Array): Float64Array {
  const o = new Float64Array(9);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
}
function apply(m: Float64Array, x: number, y: number, z: number): Vec3 {
  return [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
}

/**
 * Precession J2000 -> mean equator and equinox of date (IAU 1976 angles, Meeus 21.2/21.3), as a row-major matrix
 * acting on equatorial unit vectors (cosδcosα, cosδsinα, sinδ).
 */
export function precessionMatrix(ms: number): Float64Array {
  const T = (julianDate(ms) - 2451545.0) / 36525;
  const as = DEG / 3600;
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) * as;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) * as;
  const th = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) * as;
  // P = R3(-z) R2(θ) R3(-ζ), frame rotations.
  const R3 = (a: number) => Float64Array.of(Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 1);
  const R2 = (a: number) => Float64Array.of(Math.cos(a), 0, -Math.sin(a), 0, 1, 0, Math.sin(a), 0, Math.cos(a));
  return mul(R3(-z), mul(R2(th), R3(-zeta)));
}

/** Equatorial (of date) -> horizontal (East, North, Up) for local sidereal time L and latitude φ, radians. */
export function horizonMatrix(lstRad: number, latRad: number): Float64Array {
  const sL = Math.sin(lstRad), cL = Math.cos(lstRad), sP = Math.sin(latRad), cP = Math.cos(latRad);
  return Float64Array.of(-sL, cL, 0, -sP * cL, -sP * sL, cP, cP * cL, cP * sL, sP);
}

/** Horizontal (E, N, U) vector -> { alt, az } in degrees, azimuth from north through east. */
export function altAz(e: number, n: number, u: number): { alt: number; az: number } {
  return { alt: Math.asin(clamp(u, -1, 1)) / DEG, az: wrap(Math.atan2(e, n)) / DEG };
}

/** One-shot: J2000 RA/Dec (degrees) -> { alt, az } for a place and time. */
export function horizontalOf(
  raDeg: number,
  decDeg: number,
  ms: number,
  latDeg: number,
  lonDeg: number,
  { precess = true }: { precess?: boolean } = {},
): { alt: number; az: number } {
  const v: Vec3 = [cosd(decDeg) * cosd(raDeg), cosd(decDeg) * sind(raDeg), sind(decDeg)];
  const p = precess ? apply(precessionMatrix(ms), ...v) : v;
  const h = apply(horizonMatrix(lst(ms, lonDeg), latDeg * DEG), ...p);
  return altAz(...h);
}

/* ---------------------------------------- Solar system ----------------------------------------- */
/* Paul Schlyter, "How to compute planetary positions" (elements referred to the ecliptic of date). */

export type PlanetKey = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
type OrbitKey = 'sun' | 'moon' | PlanetKey;
type Elements = [number, number, number, number, number, number];

const ELEMENTS: Record<OrbitKey, (d: number) => Elements> = {
  sun: (d) => [0, 0, 282.9404 + 4.70935e-5 * d, 1, 0.016709 - 1.151e-9 * d, 356.047 + 0.9856002585 * d],
  moon: (d) => [125.1228 - 0.0529538083 * d, 5.1454, 318.0634 + 0.1643573223 * d, 60.2666, 0.0549, 115.3654 + 13.0649929509 * d],
  mercury: (d) => [48.3313 + 3.24587e-5 * d, 7.0047 + 5e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d],
  venus: (d) => [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d, 0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d],
  mars: (d) => [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d],
  jupiter: (d) => [100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.895 + 0.0830853001 * d],
  saturn: (d) => [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.967 + 0.0334442282 * d],
};
const MAG0: Record<PlanetKey, [number, number, number, number]> = {
  mercury: [-0.36, 0.027, 2.2e-13, 6],
  venus: [-4.34, 0.013, 4.2e-7, 3],
  mars: [-1.51, 0.016, 0, 0],
  jupiter: [-9.25, 0.014, 0, 0],
  saturn: [-9.0, 0.044, 0, 0],
};
export const PLANETS: readonly PlanetKey[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
const PLANET_NAME: Record<PlanetKey, string> = {
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
};
const isPlanetKey = (k: string): k is PlanetKey => k in PLANET_NAME;

/** Heliocentric (or geocentric for the Moon) ecliptic position of an orbit: [x, y, z, r, lonDeg, latDeg]. */
function orbit([N, i, w, a, e, M0]: Elements): [number, number, number, number, number, number] {
  const M = ((M0 % 360) + 360) % 360;
  let E = M + (e / DEG) * sind(M) * (1 + e * cosd(M));
  for (let k = 0; k < 6; k++) E = E - (E - (e / DEG) * sind(E) - M) / (1 - e * cosd(E));
  const xv = a * (cosd(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sind(E);
  const v = Math.atan2(yv, xv) / DEG;
  const r = Math.hypot(xv, yv);
  const x = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
  const y = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
  const z = r * sind(v + w) * sind(i);
  return [x, y, z, r, Math.atan2(y, x) / DEG, Math.atan2(z, Math.hypot(x, y)) / DEG];
}

export interface EqPosition {
  ra: number;
  dec: number;
  dist: number;
  mag: number;
}
export interface MoonPosition extends EqPosition {
  /** Distance in Earth radii. */
  distEr: number;
  /** Fraction lit, 0..1. */
  lit: number;
  waxing: boolean;
  elong: number;
}
export type SolarSystem = { sun: EqPosition & { lon: number }; moon: MoonPosition } & Record<PlanetKey, EqPosition>;

function eclToEq(x: number, y: number, z: number, d: number): { ra: number; dec: number; dist: number } {
  const ecl = 23.4393 - 3.563e-7 * d;
  const ye = y * cosd(ecl) - z * sind(ecl);
  const ze = y * sind(ecl) + z * cosd(ecl);
  return { ra: wrap(Math.atan2(ye, x)) / DEG, dec: Math.atan2(ze, Math.hypot(x, ye)) / DEG, dist: Math.hypot(x, y, z) };
}

/** The Moon's apparent magnitude from its phase angle i in degrees (about −12.7 full, −10 half, −8 a thin crescent). */
const moonMag = (i: number) => -12.73 + 0.026 * Math.abs(i) + 4e-9 * i ** 4;

/**
 * Sun, Moon and the five naked-eye planets for an instant: geocentric RA/Dec of date (degrees), with magnitude, the
 * Moon's phase (fraction lit, waxing) and its distance in Earth radii.
 */
export function solarSystem(ms: number): SolarSystem {
  const d = julianDate(ms) - 2451543.5;
  const sunEl = ELEMENTS.sun(d);
  const [, , , rs, lonS] = orbit(sunEl);
  const xs = rs * cosd(lonS), ys = rs * sind(lonS);
  const sun = { ...eclToEq(xs, ys, 0, d), mag: -26.7, lon: lonS };

  // Moon, with the main perturbations.
  const mEl = ELEMENTS.moon(d);
  const [, , , rm0, lonM0, latM0] = orbit(mEl);
  const Ms = sunEl[5], Mm = mEl[5], Nm = mEl[0], ws = sunEl[2], wm = mEl[2];
  const Ls = Ms + ws, Lm = Mm + wm + Nm, D = Lm - Ls, F = Lm - Nm;
  const lonM = lonM0 - 1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms) - 0.059 * sind(2 * Mm - 2 * D)
    - 0.057 * sind(Mm - 2 * D + Ms) + 0.053 * sind(Mm + 2 * D) + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms)
    - 0.035 * sind(D) - 0.031 * sind(Mm + Ms) - 0.015 * sind(2 * F - 2 * D) + 0.011 * sind(Mm - 4 * D);
  const latM = latM0 - 0.173 * sind(F - 2 * D) - 0.055 * sind(Mm - F - 2 * D) - 0.046 * sind(Mm + F - 2 * D)
    + 0.033 * sind(F + 2 * D) + 0.017 * sind(2 * Mm + F);
  const rm = rm0 - 0.58 * cosd(Mm - 2 * D) - 0.46 * cosd(2 * D);
  const mx = rm * cosd(lonM) * cosd(latM), my = rm * sind(lonM) * cosd(latM), mz = rm * sind(latM);
  const elong = Math.acos(clamp(cosd(lonM - lonS) * cosd(latM), -1, 1)) / DEG;
  const lit = (1 - cosd(elong)) / 2;
  const moon: MoonPosition = {
    ...eclToEq(mx, my, mz, d),
    distEr: rm,
    lit,
    waxing: wrap((lonM - lonS) * DEG) < Math.PI,
    elong,
    mag: moonMag(180 - elong),
  };

  // Planets, with the Jupiter/Saturn mutual perturbations.
  const Mj = ELEMENTS.jupiter(d)[5], Msat = ELEMENTS.saturn(d)[5];
  const planets = {} as Record<PlanetKey, EqPosition>;
  for (const p of PLANETS) {
    const o = orbit(ELEMENTS[p](d));
    let [x, y, z] = o;
    const r = o[3];
    let lon = o[4], lat = o[5];
    if (p === 'jupiter' || p === 'saturn') {
      if (p === 'jupiter')
        lon += -0.332 * sind(2 * Mj - 5 * Msat - 67.6) - 0.056 * sind(2 * Mj - 2 * Msat + 21) + 0.042 * sind(3 * Mj - 5 * Msat + 21)
          - 0.036 * sind(Mj - 2 * Msat) + 0.022 * cosd(Mj - Msat) + 0.023 * sind(2 * Mj - 3 * Msat + 52) - 0.016 * sind(Mj - 5 * Msat - 69);
      else {
        lon += 0.812 * sind(2 * Mj - 5 * Msat - 67.6) - 0.229 * cosd(2 * Mj - 4 * Msat - 2) + 0.119 * sind(Mj - 2 * Msat - 3)
          + 0.046 * sind(2 * Mj - 6 * Msat - 69) + 0.014 * sind(Mj - 3 * Msat + 32);
        lat += -0.02 * cosd(2 * Mj - 4 * Msat - 2) + 0.018 * sind(2 * Mj - 6 * Msat - 49);
      }
      x = r * cosd(lon) * cosd(lat);
      y = r * sind(lon) * cosd(lat);
      z = r * sind(lat);
    }
    const gx = x + xs, gy = y + ys, gz = z;
    const R = Math.hypot(gx, gy, gz);
    const fv = Math.acos(clamp((r * r + R * R - rs * rs) / (2 * r * R), -1, 1)) / DEG;
    const [m0, k1, k2, n2] = MAG0[p];
    planets[p] = { ...eclToEq(gx, gy, gz, d), mag: m0 + 5 * Math.log10(r * R) + k1 * fv + (k2 ? k2 * fv ** n2 : 0) };
  }
  return { sun, moon, ...planets };
}

/* ------------------------------------------- Catalogue ------------------------------------------ */

interface Constellation {
  id: string;
  name: string;
  en: string;
  hi: string;
  rank: number;
  x: number;
  y: number;
  z: number;
}

interface Prepared {
  n: number;
  magLimit: number;
  /** Equatorial J2000 unit vectors. */
  SX: Float32Array;
  SY: Float32Array;
  SZ: Float32Array;
  SMAG: Float32Array;
  /** Tint band 0 hot .. 4 cool. */
  STINT: Uint8Array;
  /** Constellation index or -1. */
  SCON: Int16Array;
  names: Map<number, { name: string; bayer: string }>;
  con: Constellation[];
  conById: Map<string, number>;
  /** Figure segments as (constellation, star a, star b) triples. */
  seg: Int32Array;
  /** Brightest star of each constellation (-1 none). */
  conBrightest: number[];
}

const prepared = new WeakMap<SkyCatalogue, Prepared>();

function prepare(cat: SkyCatalogue): Prepared {
  const hit = prepared.get(cat);
  if (hit) return hit;
  const F = cat.fields;
  const n = Math.floor(cat.stars.length / F);
  const SX = new Float32Array(n), SY = new Float32Array(n), SZ = new Float32Array(n);
  const SMAG = new Float32Array(n), STINT = new Uint8Array(n), SCON = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * F;
    const ra = (cat.stars[o] / 50) * DEG, dec = (cat.stars[o + 1] / 50) * DEG;
    SX[i] = Math.cos(dec) * Math.cos(ra);
    SY[i] = Math.cos(dec) * Math.sin(ra);
    SZ[i] = Math.sin(dec);
    SMAG[i] = cat.stars[o + 2] / 10;
    const bv = cat.stars[o + 3] / 4 - 0.5;
    const t = clamp((bv - 0.6) / 0.9, -1, 1); // the same bands as astro.ts starTintFor
    STINT[i] = t <= -0.6 ? 0 : t <= -0.2 ? 1 : t <= 0.2 ? 2 : t <= 0.6 ? 3 : 4;
    SCON[i] = cat.stars[o + 4];
  }
  const names = new Map<number, { name: string; bayer: string }>();
  for (const [i, name, bayer] of cat.names) names.set(i, { name, bayer });
  const con: Constellation[] = cat.constellations.map(([id, name, en, hi, rank, ra, dec]) => ({
    id, name, en, hi, rank, x: cosd(dec) * cosd(ra), y: cosd(dec) * sind(ra), z: sind(dec),
  }));
  const conById = new Map(con.map((c, i) => [c.id, i]));
  const segments: number[] = [];
  for (const [ci, strings] of cat.figures)
    for (const s of strings) for (let k = 1; k < s.length; k++) segments.push(ci, s[k - 1], s[k]);
  const conBrightest = con.map(() => -1);
  for (let i = 0; i < n; i++) {
    const c = SCON[i];
    if (c >= 0 && conBrightest[c] < 0) conBrightest[c] = i;
  }
  const p: Prepared = { n, magLimit: cat.magLimit, SX, SY, SZ, SMAG, STINT, SCON, names, con, conById, seg: Int32Array.from(segments), conBrightest };
  prepared.set(cat, p);
  return p;
}

/* ------------------------------------------- Words ---------------------------------------------- */

const COMPASS16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const COMPASS8_WORD = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/** 16-point compass word for an azimuth (chips, card and table agree). */
export const compass16 = (azDeg: number) => COMPASS16[Math.round((((azDeg % 360) + 360) % 360) / 22.5) % 16];
const compassWord = (azDeg: number) => COMPASS8_WORD[Math.round((((azDeg % 360) + 360) % 360) / 45) % 8];
const heightWord = (alt: number) => (alt >= 70 ? 'almost overhead' : alt >= 40 ? 'high' : alt >= 15 ? 'mid-sky' : 'low');
/** "mag −1.4" style: a true minus sign. */
export const formatMag = (m: number) => (m < 0 ? `−${Math.abs(m).toFixed(1)}` : m.toFixed(1));
function brightWord(m: number): string {
  if (m < 0) return 'one of the brightest in the sky';
  if (m < 1.5) return 'very bright';
  if (m < 3) return 'easy to see';
  if (m < 4) return 'needs a darkish sky';
  return 'needs a dark sky';
}
const TINT_WORD = ['blue-white, a hot star', 'white', 'yellow-white, like the Sun', 'orange', 'red-orange, a cool star'];

/* =============================================================================================== */
/* The sky                                                                                          */
/* =============================================================================================== */

const VIEW_DEFAULT: SkyView = { az: 180, alt: 35, fov: 90 };
const DECEL = 0.996;
const FOV_MIN = 20, FOV_MAX = 150, ALT_MIN = -12, ALT_MAX = 90;
/** Sun altitude at sunrise and sunset (refraction and the Sun's radius). */
const SUN_H0 = -0.833;

type Sel =
  | { kind: 'star'; index: number }
  | { kind: 'constellation'; id: string }
  | { kind: 'planet' | 'moon' | 'sun'; id: string };

interface Body {
  id: string;
  kind: 'sun' | 'moon' | 'planet';
  name: string;
  x: number;
  y: number;
  z: number;
  alt: number;
  az: number;
  mag: number;
  r: number;
  lit?: number;
  waxing?: boolean;
}

interface Twilight {
  lim: number;
  alpha: number;
  day: number;
  stage: string;
  phase: SkyPhase;
}

interface HorizonGeometry {
  line: boolean;
  pts: Vec3[];
  zen: Vec3;
  cx: number;
  cy: number;
  R: number;
  groundInside: boolean;
}

interface LabelCandidate {
  id: string;
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
  pri: number;
  center?: boolean;
  track?: boolean;
}

interface Pointer {
  x: number;
  y: number;
  x0: number;
  y0: number;
  type: string;
}

interface Drag {
  hist: [number, number, number][];
  moved: boolean;
  axis: 'x' | 'both' | null;
  grab?: Vec3;
  pinch: { d0: number; fov0: number; mx: number; my: number; grab: Vec3 } | null;
}

type RiseSet = { rise: number | null; set: number | null } | { never: true } | { circumpolar: true };

/** iOS / WebKit extras on the orientation event. */
interface OrientationEventExtras extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

type Sprite = HTMLCanvasElement | OffscreenCanvas;

/** Creates the sky on a canvas. */
export function createSky(canvas: HTMLCanvasElement, opt: SkyOptions): Sky {
  const C0 = prepare(opt.catalogue);
  const { n: N_STARS, SX, SY, SZ, SMAG, STINT, SCON, seg: SEG, con: CON, conById: CON_BY_ID, conBrightest: CON_BRIGHTEST } = C0;
  const STAR_NAME = C0.names;
  const MAG_LIMIT = C0.magLimit;

  const ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  /** Touch: 'horizontal' leaves vertical swipes to the page (pan-y); 'all' takes every gesture. */
  const touchFor = (g: SkyGestures) => (g === 'all' ? 'none' : 'pan-y');
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const S = {
    place: opt.place,
    theme: opt.theme,
    view: { ...VIEW_DEFAULT, ...(opt.view || {}), roll: 0 } as Required<SkyView>,
    live: true,
    t: Date.now(),
    gestures: opt.gestures || 'all',
    wheel: opt.wheel || 'always',
    reduced: opt.reducedMotion ?? !!mq?.matches,
    lite: !!opt.lite,
    grid: !!opt.grid,
    lines: opt.lines ?? true,
    names: opt.names ?? true,
    hindi: !!opt.hindi,
    adaptive: opt.adaptive ?? true,
    fast: false,
    selection: null as Sel | null,
    w: 0,
    h: 0,
    dpr: 1,
    visible: true,
    onscreen: true,
  };

  if (canvas.style) canvas.style.touchAction = touchFor(S.gestures);

  /* ------------------------------------------------ frame state ------------------------------------------------ */
  // Projected positions from the last frame (hit testing reads these).
  const PX = new Float32Array(N_STARS), PY = new Float32Array(N_STARS), PR = new Float32Array(N_STARS);
  const PVIS = new Uint8Array(N_STARS);
  const HALT = new Float32Array(N_STARS); // altitude sine (U component) per star
  let bodies: Body[] = [];
  let labelBoxes: { id: string; x: number; y: number; w: number; h: number }[] = [];
  let solar: SolarSystem = solarSystem(S.t);
  let solarAt = S.t;
  let mats: { H: Float64Array; HP: Float64Array } = { H: new Float64Array(9), HP: new Float64Array(9) };
  let matsAt = -Infinity, matsKey = '';
  let sunAlt = -90;

  /* --------------------------------------------- motion (physics) ---------------------------------------------- */
  const motion = {
    vAz: 0,
    vAlt: 0, // momentum, deg/s
    spring: null as null | { az: number; alt: number; fov: number; vAz: number; vAlt: number; vFov: number },
    timeSpring: null as null | { to: number; v: number; live: boolean },
  };
  let raf = 0, lastFrame = 0, drawCost = 0;
  let fullTimer: ReturnType<typeof setTimeout> | undefined;
  let settleWaiters: (() => void)[] = []; // resolvers of the now() / setTime({ animate }) promises
  function flushSettle() {
    const w = settleWaiters;
    settleWaiters = [];
    w.forEach((r) => r());
  }

  const pointers = new Map<number, Pointer>();
  let drag: Drag | null = null;
  const keys = new Set<string>();
  const orient = {
    active: false,
    dirty: false,
    f: null as Vec3 | null,
    u: null as Vec3 | null,
    offset: null as number | null,
    relOffset: null as number | null,
    absolute: false,
    calibrate: false,
    mode: '' as SkyOrientationMode | '',
    handler: null as ((ev: Event) => void) | null,
    evName: '',
  };

  function requestRender() {
    if (raf || !S.visible || !S.onscreen) return;
    raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60;
    lastFrame = now;
    let moving = false;
    const v = S.view;

    // Momentum: exponential decay per ms (Apple's projection: v/1000 · d/(1−d)). 0.996 rather than scroll's 0.998:
    // a flick turns the sky about a quarter-second's worth of its release speed, so it never spins away.
    if (motion.vAz || motion.vAlt) {
      const decay = Math.pow(DECEL, dt * 1000);
      v.az = (v.az + motion.vAz * dt + 360) % 360;
      v.alt += motion.vAlt * dt;
      motion.vAz *= decay;
      motion.vAlt *= decay;
      if (v.alt > ALT_MAX || v.alt < ALT_MIN) {
        motion.vAlt = 0;
        settleAlt();
      }
      if (Math.hypot(motion.vAz, motion.vAlt) < 0.5) {
        motion.vAz = 0;
        motion.vAlt = 0;
      } else moving = true;
    }
    // Spring (damping 1.0, response 0.4 s): reorient, rubber-band release, zoom to target.
    if (motion.spring) {
      const sp = motion.spring;
      const w0 = TAU / 0.4;
      const step = (key: 'az' | 'alt' | 'fov', vel: 'vAz' | 'vAlt' | 'vFov') => {
        const x = key === 'az' ? wrapPi((v.az - sp.az) * DEG) / DEG : v[key] - sp[key];
        const a = -w0 * w0 * x - 2 * w0 * sp[vel];
        sp[vel] += a * dt;
        v[key] += sp[vel] * dt;
        return Math.abs(x) > 0.01 || Math.abs(sp[vel]) > 0.05;
      };
      const busy = [step('az', 'vAz'), step('alt', 'vAlt'), step('fov', 'vFov')].some(Boolean);
      v.az = (v.az + 360) % 360;
      if (!busy) {
        v.az = sp.az;
        v.alt = sp.alt;
        v.fov = sp.fov;
        motion.spring = null;
      } else moving = true;
    }
    // Time spring ("back to now"): critically damped, 0.6 s.
    if (motion.timeSpring) {
      const ts = motion.timeSpring;
      const goal = ts.live ? Date.now() : ts.to;
      const w0 = TAU / 0.6;
      const x = S.t - goal;
      const a = -w0 * w0 * x - 2 * w0 * ts.v;
      ts.v += a * dt;
      S.t += ts.v * dt;
      if (Math.abs(S.t - goal) < 30_000 && Math.abs(ts.v) < 60_000) {
        S.t = goal;
        S.live = !!ts.live;
        motion.timeSpring = null;
        flushSettle();
      } else moving = true;
    }
    if (orient.active) moving = orient.dirty || moving;
    orient.dirty = false;

    if (keys.size) keyStep(dt); // step first, then draw: no one-frame lag on held keys
    if (S.live && !motion.timeSpring) S.t = Date.now();
    // Quality tier while moving: when a full frame costs more than 8 ms (a 120 Hz budget), drop the glow and the
    // stars fainter than mag 4 until the sky settles; a full frame follows 120 ms after the last fast one.
    const busy = moving || keys.size > 0 || !!drag;
    S.fast = S.adaptive && busy && drawCost > 8;
    const t0 = performance.now();
    draw();
    if (!S.fast) {
      const c = performance.now() - t0;
      drawCost = drawCost ? drawCost * 0.7 + c * 0.3 : c;
    } else {
      clearTimeout(fullTimer);
      fullTimer = setTimeout(requestRender, 120);
    }
    if (moving || keys.size) raf = requestAnimationFrame(frame);
    else lastFrame = 0;
  }

  function settleAlt() {
    const v = S.view;
    const target = clamp(v.alt, ALT_MIN, ALT_MAX);
    if (target !== v.alt) toView({ alt: target }, { velocity: { alt: motion.vAlt } });
  }

  /** Spring the view to a target (interruptible: starts from the live value, carries velocity). */
  function toView(target: Partial<SkyView>, { velocity }: { velocity?: { az?: number; alt?: number } } = {}) {
    const v = S.view;
    const goal = {
      az: target.az ?? motion.spring?.az ?? v.az,
      alt: clamp(target.alt ?? motion.spring?.alt ?? v.alt, ALT_MIN, ALT_MAX),
      fov: clamp(target.fov ?? motion.spring?.fov ?? v.fov, FOV_MIN, FOV_MAX),
    };
    motion.vAz = 0;
    motion.vAlt = 0;
    if (S.reduced) {
      Object.assign(v, goal);
      motion.spring = null;
      requestRender();
      return;
    }
    motion.spring = {
      ...goal,
      vAz: velocity?.az ?? motion.spring?.vAz ?? 0,
      vAlt: velocity?.alt ?? motion.spring?.vAlt ?? 0,
      vFov: motion.spring?.vFov ?? 0,
    };
    requestRender();
  }

  /* ------------------------------------------------- projection ------------------------------------------------- */

  function scale() {
    // The field of view spans the shorter side; stereographic radius 2·tan(θ/2).
    return Math.min(S.w, S.h) / 2 / (2 * Math.tan((S.view.fov * DEG) / 4));
  }
  /** Camera basis rows (right, up, forward) in horizontal (E, N, U) coordinates. */
  function cameraMatrix(view: SkyView = S.view): Float64Array {
    const { az, alt, roll = 0 } = view;
    const sa = sind(az), ca = cosd(az), sh = sind(alt), ch = cosd(alt);
    const f = [ch * sa, ch * ca, sh];
    const r = [ca, -sa, 0];
    const u = [-sh * sa, -sh * ca, ch];
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const r2 = [r[0] * cr + u[0] * sr, r[1] * cr + u[1] * sr, r[2] * cr + u[2] * sr];
    const u2 = [-r[0] * sr + u[0] * cr, -r[1] * sr + u[1] * cr, -r[2] * sr + u[2] * cr];
    return Float64Array.of(r2[0], r2[1], r2[2], u2[0], u2[1], u2[2], f[0], f[1], f[2]);
  }
  function updateMatrices() {
    const key = `${S.place.lat},${S.place.lon}`;
    if (Math.abs(S.t - matsAt) < 2000 && key === matsKey) return;
    const P = precessionMatrix(S.t);
    const H = horizonMatrix(lst(S.t, S.place.lon), S.place.lat * DEG);
    mats = { H, HP: mul(H, P) };
    matsAt = S.t;
    matsKey = key;
    if (Math.abs(S.t - solarAt) > 60_000) {
      solar = solarSystem(S.t);
      solarAt = S.t;
    }
  }
  /** Horizontal (E,N,U) -> screen [x, y, z]; z is the cosine to the view centre. */
  function project(C: Float64Array, k: number, e: number, n: number, u: number): Vec3 {
    const x = C[0] * e + C[1] * n + C[2] * u;
    const y = C[3] * e + C[4] * n + C[5] * u;
    const z = C[6] * e + C[7] * n + C[8] * u;
    const m = (2 / (1 + Math.max(z, -0.999))) * k;
    return [S.w / 2 + x * m, S.h / 2 - y * m, z];
  }
  /** Screen position of a horizontal direction for a trial view (the grab solver). */
  function screenOf(view: SkyView, d: Vec3): Vec3 {
    const C = cameraMatrix(view);
    const k = Math.min(S.w, S.h) / 2 / (2 * Math.tan((view.fov * DEG) / 4));
    return project(C, k, d[0], d[1], d[2]);
  }
  /**
   * Solves the view (azimuth, altitude) that puts direction d exactly under screen point (px, py): two unknowns, two
   * equations, a few Newton steps from the current view. Returns false when the geometry is singular (grabbed at the
   * zenith), so the caller can fall back to an incremental pan.
   */
  function solveGrab(d: Vec3, px: number, py: number): boolean {
    const v = S.view;
    let az = v.az, alt = v.alt, ok = false;
    for (let it = 0; it < 12; it++) {
      const base = { az, alt, fov: v.fov, roll: v.roll };
      const [x0, y0] = screenOf(base, d);
      const fx = x0 - px, fy = y0 - py;
      if (Math.abs(fx) < 0.05 && Math.abs(fy) < 0.05) {
        ok = true;
        break;
      }
      const h = 0.01;
      const [xa, ya] = screenOf({ ...base, az: az + h }, d);
      const [xb, yb] = screenOf({ ...base, alt: alt + h }, d);
      const j11 = (xa - x0) / h, j21 = (ya - y0) / h, j12 = (xb - x0) / h, j22 = (yb - y0) / h;
      const det = j11 * j22 - j12 * j21;
      if (Math.abs(det) < 1e-6) return false;
      az -= clamp((j22 * fx - j12 * fy) / det, -20, 20);
      alt -= clamp((-j21 * fx + j11 * fy) / det, -20, 20);
    }
    if (!ok) {
      const [x1, y1] = screenOf({ az, alt, fov: v.fov, roll: v.roll }, d);
      ok = Math.hypot(x1 - px, y1 - py) < 0.5;
    }
    if (!ok || !Number.isFinite(az) || !Number.isFinite(alt)) return false;
    v.az = ((az % 360) + 360) % 360;
    v.alt = alt > ALT_MAX ? ALT_MAX + rubber(alt - ALT_MAX, 30) : alt < ALT_MIN ? ALT_MIN - rubber(ALT_MIN - alt, 30) : alt;
    requestRender();
    return true;
  }
  /** Screen point -> horizontal direction (inverse stereographic). */
  function unproject(px: number, py: number): Vec3 {
    const k = scale();
    const X = (px - S.w / 2) / k, Y = -(py - S.h / 2) / k;
    const r2 = (X * X + Y * Y) / 4;
    const z = (1 - r2) / (1 + r2), s = 1 / (1 + r2);
    const x = X * s, y = Y * s;
    const C = cameraMatrix(); // rows r, u, f; the inverse is the transpose
    return [C[0] * x + C[3] * y + C[6] * z, C[1] * x + C[4] * y + C[7] * z, C[2] * x + C[5] * y + C[8] * z];
  }
  /** Of-date RA/Dec -> horizontal. */
  const eqToHor = (ra: number, dec: number) => apply(mats.H, cosd(dec) * cosd(ra), cosd(dec) * sind(ra), sind(dec));
  /** Sun, Moon or planet in the sky now; the Moon topocentric (parallax lowers it by up to ~1°), as drawn. */
  function bodyAltAz(key: 'sun' | 'moon' | PlanetKey) {
    const ss = solar[key];
    const r = altAz(...eqToHor(ss.ra, ss.dec));
    if (key === 'moon') r.alt -= (Math.asin(1 / solar.moon.distEr) / DEG) * cosd(r.alt);
    return r;
  }

  /* ---------------------------------------------------- draw ---------------------------------------------------- */

  function twilight(): Twilight {
    // Limiting magnitude and star opacity from the Sun's altitude.
    if (sunAlt <= -18) return { lim: S.lite ? 4.2 : MAG_LIMIT, alpha: 1, day: 0, stage: 'night', phase: 'night' };
    if (sunAlt <= -12) return { lim: 4.5, alpha: 1, day: 0.05, stage: 'astronomical twilight', phase: 'twilight' };
    if (sunAlt <= -6) return { lim: 3.4, alpha: 0.95, day: 0.15, stage: 'nautical twilight', phase: 'twilight' };
    if (sunAlt <= SUN_H0) return { lim: 2, alpha: 0.85, day: 0.35, stage: 'civil twilight', phase: 'twilight' };
    return { lim: 2.5, alpha: 0.4, day: 0.6, stage: 'day', phase: 'day' };
  }

  // Per-theme cache: resolved star colours, glow sprites, label widths (dropped when the theme changes).
  let tc: { theme: SkyTheme; starColors: string[]; sprites: (Sprite | null | undefined)[]; widths: Map<string, number> } | null = null;
  function themeCache() {
    if (tc && tc.theme === S.theme) return tc;
    const T = S.theme;
    tc = {
      theme: T,
      starColors: [T.starHot, mix(T.starHot, T.starSun), T.starSun, mix(T.starCool, T.starSun), T.starCool],
      sprites: [],
      widths: new Map(),
    };
    return tc;
  }
  function glowSprite(b: number): Sprite | null {
    const c = themeCache();
    const cached = c.sprites[b];
    if (cached !== undefined) return cached;
    const s: Sprite | null =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(64, 64)
        : typeof document !== 'undefined' && typeof document.createElement === 'function'
          ? document.createElement('canvas')
          : null;
    if (!s) return (c.sprites[b] = null);
    s.width = s.height = 64;
    const g2 = s.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!g2) return (c.sprites[b] = null);
    const g = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, withAlpha(c.starColors[b], 0.28));
    g.addColorStop(1, withAlpha(c.starColors[b], 0));
    g2.fillStyle = g;
    g2.fillRect(0, 0, 64, 64);
    return (c.sprites[b] = s);
  }

  function draw() {
    if (!S.w || !S.h) return;
    updateMatrices();
    const T = S.theme, v = S.view, k = scale(), C = cameraMatrix();
    const HP = mats.HP;
    const sunH = eqToHor(solar.sun.ra, solar.sun.dec);
    sunAlt = Math.asin(sunH[2]) / DEG;
    const tw = twilight();
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);

    // Sky ground, with a day wash when the Sun is up.
    ctx.globalAlpha = 1;
    ctx.fillStyle = T.sky;
    ctx.fillRect(0, 0, S.w, S.h);
    if (tw.day > 0) {
      ctx.globalAlpha = tw.day * 0.6;
      ctx.fillStyle = T.skyHorizon;
      ctx.fillRect(0, 0, S.w, S.h);
      ctx.globalAlpha = 1;
    }

    const horizon = horizonGeometry(C, k);
    drawHorizonGlow(horizon, tw);
    if (S.grid) drawGrid(C, k);

    // Stars: project, cull, bin by tint into five paths (five fills per frame).
    const lim = Math.min(tw.lim, S.lite ? 4.2 : MAG_LIMIT) + (v.fov < 50 ? 0.3 : 0);
    const zoomBoost = clamp(Math.sqrt(90 / v.fov), 1, 1.8);
    const cullZ = Math.cos(Math.min(175, v.fov * 1.1) * DEG);
    const bins: number[][] = [[], [], [], [], []];
    for (let i = 0; i < N_STARS; i++) {
      PVIS[i] = 0;
      const x = SX[i], y = SY[i], z = SZ[i];
      const e = HP[0] * x + HP[1] * y + HP[2] * z;
      const n = HP[3] * x + HP[4] * y + HP[5] * z;
      const u = HP[6] * x + HP[7] * y + HP[8] * z;
      HALT[i] = u;
      const cx = C[0] * e + C[1] * n + C[2] * u, cy = C[3] * e + C[4] * n + C[5] * u, cz = C[6] * e + C[7] * n + C[8] * u;
      if (cz < cullZ) continue;
      const m = (2 / (1 + cz)) * k;
      const sx = S.w / 2 + cx * m, sy = S.h / 2 - cy * m;
      PX[i] = sx;
      PY[i] = sy;
      PVIS[i] = 2; // projected (figure lines may use it, even just off screen)
      if (sx < -20 || sy < -20 || sx > S.w + 20 || sy > S.h + 20) continue;
      if (u < -0.02 || SMAG[i] > lim || (S.fast && SMAG[i] > 4)) continue;
      const r = Math.max(0.5, Math.pow(lim - SMAG[i] + 0.9, 1.05) * 0.5 * zoomBoost);
      PR[i] = r;
      PVIS[i] = 1;
      bins[STINT[i]].push(i);
    }

    // Constellation figures: all of them with Lines on; with Lines off only the selection's own figure.
    drawFigures(tw, !S.lines);

    const starColors = themeCache().starColors;
    ctx.globalAlpha = tw.alpha;
    if (T.glow && !S.lite && !S.fast) {
      // One pre-rendered glow sprite per tint band (built once per theme), stamped with drawImage.
      outer: for (const bin of bins)
        for (const i of bin) {
          if (SMAG[i] > 1.6) continue;
          const spr = glowSprite(STINT[i]);
          if (!spr) break outer;
          const r = PR[i] * 3.2;
          ctx.drawImage(spr, PX[i] - r, PY[i] - r, r * 2, r * 2);
        }
    }
    bins.forEach((bin, b) => {
      if (!bin.length) return;
      ctx.beginPath();
      for (const i of bin) {
        ctx.moveTo(PX[i] + PR[i], PY[i]);
        ctx.arc(PX[i], PY[i], PR[i], 0, TAU);
      }
      ctx.fillStyle = starColors[b];
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Sun, Moon, planets.
    bodies = [];
    drawSolar(C, k, tw);

    // Ground (the page's own ground colour: the earth the reader stands on) over everything below 0°.
    drawGround(horizon);
    drawCompass(C, k);

    // Labels last, decluttered by priority.
    drawLabels(C, k, tw);
    drawSelection();
    emitChange(tw);
  }

  function horizonGeometry(C: Float64Array, k: number): HorizonGeometry {
    // The horizon is a great circle; stereographic maps it to a circle (or a line when it passes the antipode).
    const az = S.view.az;
    const pts = [az - 90, az, az + 90].map((a) => project(C, k, sind(a), cosd(a), 0));
    const zen = project(C, k, 0, 0, 1);
    const [ax, ay] = pts[0], [bx, by] = pts[1], [cx, cy] = pts[2];
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    const line = { line: true, pts, zen, cx: 0, cy: 0, R: 0, groundInside: false };
    if (Math.abs(d) < 1e-6) return line;
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
    const R = Math.hypot(ax - ux, ay - uy);
    if (R > 1e5) return line;
    const zenInside = Math.hypot(zen[0] - ux, zen[1] - uy) < R;
    return { line: false, cx: ux, cy: uy, R, groundInside: !zenInside, pts, zen };
  }
  function groundPath(g: HorizonGeometry): boolean {
    ctx.beginPath();
    if (g.line) {
      // Half-plane on the side away from the zenith.
      const [[ax, ay], , [cx, cy]] = g.pts;
      const dx = cx - ax, dy = cy - ay, L = Math.hypot(dx, dy) || 1;
      let nx = -dy / L, ny = dx / L;
      if ((g.zen[0] - ax) * nx + (g.zen[1] - ay) * ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const B = 1e4;
      ctx.moveTo(ax - (dx / L) * B, ay - (dy / L) * B);
      ctx.lineTo(ax + (dx / L) * B, ay + (dy / L) * B);
      ctx.lineTo(ax + (dx / L) * B + nx * B, ay + (dy / L) * B + ny * B);
      ctx.lineTo(ax - (dx / L) * B + nx * B, ay - (dy / L) * B + ny * B);
      ctx.closePath();
      return false;
    }
    if (g.groundInside) ctx.arc(g.cx, g.cy, g.R, 0, TAU);
    else {
      ctx.rect(-10, -10, S.w + 20, S.h + 20);
      ctx.arc(g.cx, g.cy, g.R, 0, TAU, true);
    }
    return !g.groundInside;
  }
  function drawGround(g: HorizonGeometry) {
    const T = S.theme;
    const evenodd = groundPath(g);
    ctx.fillStyle = T.ground;
    ctx.fill(evenodd ? 'evenodd' : 'nonzero');
    // Horizon line.
    ctx.beginPath();
    if (g.line) {
      const [[ax, ay], , [cx, cy]] = g.pts;
      const dx = cx - ax, dy = cy - ay;
      ctx.moveTo(ax - dx * 50, ay - dy * 50);
      ctx.lineTo(cx + dx * 50, cy + dy * 50);
    } else ctx.arc(g.cx, g.cy, g.R, 0, TAU);
    ctx.strokeStyle = T.horizon;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  function drawHorizonGlow(g: HorizonGeometry, tw: Twilight) {
    if (S.lite) return;
    const T = S.theme;
    const band = Math.min(S.w, S.h) * 0.22;
    let grad: CanvasGradient;
    if (g.line) {
      const [[ax, ay], , [cx, cy]] = g.pts;
      const mx = (ax + cx) / 2, my = (ay + cy) / 2;
      const dx = g.zen[0] - mx, dy = g.zen[1] - my, L = Math.hypot(dx, dy) || 1;
      grad = ctx.createLinearGradient(mx, my, mx + (dx / L) * band, my + (dy / L) * band);
    } else if (g.groundInside) grad = ctx.createRadialGradient(g.cx, g.cy, g.R, g.cx, g.cy, g.R + band);
    else grad = ctx.createRadialGradient(g.cx, g.cy, Math.max(0, g.R - band), g.cx, g.cy, g.R);
    const a = 0.75 + tw.day * 0.25;
    const stops: [number, number][] = g.groundInside || g.line ? [[0, a], [1, 0]] : [[0, 0], [1, a]];
    for (const [o, al] of stops) grad.addColorStop(o, withAlpha(T.skyHorizon, al));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S.w, S.h);
  }
  function drawGrid(C: Float64Array, k: number) {
    ctx.strokeStyle = S.theme.grid;
    ctx.lineWidth = 1;
    const line = (fn: (t: number) => Vec3) => {
      ctx.beginPath();
      let pen = false;
      for (let t = 0; t <= 360; t += 3) {
        const [e, n, u] = fn(t);
        const [x, y, z] = project(C, k, e, n, u);
        if (z < -0.6) {
          pen = false;
          continue;
        }
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
    };
    for (const alt of [30, 60]) line((a) => [cosd(alt) * sind(a), cosd(alt) * cosd(a), sind(alt)]);
    for (let az = 0; az < 360; az += 45)
      line((t) => {
        const alt = t / 4;
        return [cosd(alt) * sind(az), cosd(alt) * cosd(az), sind(alt)];
      });
  }
  /** The figure of the selection (a constellation, or the constellation of a selected star), or -1. */
  function selectedFigure(): number {
    const sel = S.selection;
    if (!sel) return -1;
    if (sel.kind === 'constellation') return CON_BY_ID.get(sel.id) ?? -1;
    if (sel.kind === 'star') return SCON[sel.index];
    return -1;
  }
  function drawFigures(tw: Twilight, selectedOnly: boolean) {
    const T = S.theme;
    const sel = selectedFigure();
    if (selectedOnly && sel < 0) return;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (let pass = selectedOnly ? 1 : 0; pass < 2; pass++) {
      ctx.beginPath();
      let any = false;
      for (let s = 0; s < SEG.length; s += 3) {
        const c = SEG[s], a = SEG[s + 1], b = SEG[s + 2];
        if ((pass === 1) !== (c === sel)) continue;
        if (!PVIS[a] || !PVIS[b] || (HALT[a] < -0.05 && HALT[b] < -0.05)) continue;
        if (Math.hypot(PX[a] - PX[b], PY[a] - PY[b]) > Math.max(S.w, S.h)) continue; // wrapped across the antipode
        // Leave a small gap around each star so the dot stays readable.
        const dx = PX[b] - PX[a], dy = PY[b] - PY[a], L = Math.hypot(dx, dy) || 1;
        const ga = (PR[a] || 1) + 2.5, gb = (PR[b] || 1) + 2.5;
        if (L <= ga + gb) continue;
        ctx.moveTo(PX[a] + (dx / L) * ga, PY[a] + (dy / L) * ga);
        ctx.lineTo(PX[b] - (dx / L) * gb, PY[b] - (dy / L) * gb);
        any = true;
      }
      if (!any) continue;
      ctx.globalAlpha = pass === 1 ? 1 : tw.alpha;
      ctx.strokeStyle = pass === 1 ? T.selectLine : T.line;
      ctx.lineWidth = pass === 1 ? 1.5 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawSolar(C: Float64Array, k: number, tw: Twilight) {
    const T = S.theme;
    const add = (id: string, kind: Body['kind'], name: string, eq: EqPosition, extra: { r: number; lit?: number; waxing?: boolean }): Body => {
      const [e, n, u] = eqToHor(eq.ra, eq.dec);
      const { alt, az } = altAz(e, n, u);
      const [x, y, z] = project(C, k, e, n, u);
      const b: Body = { id, kind, name, x, y, z, alt, az, mag: eq.mag, ...extra };
      if (z > -0.3 && x > -40 && y > -40 && x < S.w + 40 && y < S.h + 40) bodies.push(b);
      return b;
    };
    const sunB = add('sun', 'sun', 'Sun', solar.sun, { r: Math.max(7, k * 0.0046 * 2) });
    // Moon: topocentric parallax lowers it by up to ~1°.
    const mo = solar.moon;
    const moonB = add('moon', 'moon', 'Moon', mo, { r: Math.max(7, k * 0.0045 * 2), lit: mo.lit, waxing: mo.waxing });
    const par = (Math.asin(1 / mo.distEr) / DEG) * cosd(moonB.alt);
    if (par) {
      moonB.alt -= par;
      const [x, y, z] = project(C, k, cosd(moonB.alt) * sind(moonB.az), cosd(moonB.alt) * cosd(moonB.az), sind(moonB.alt));
      moonB.x = x;
      moonB.y = y;
      moonB.z = z;
    }
    for (const p of PLANETS) add(`planet:${p}`, 'planet', PLANET_NAME[p], solar[p], { r: clamp(3.6 - solar[p].mag * 0.7, 2.2, 6.5) });

    for (const b of bodies) {
      if (b.alt < -1) continue;
      if (b.kind === 'sun') {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.fillStyle = T.sun;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 4, 0, TAU);
        ctx.strokeStyle = withAlpha(T.sun, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (b.kind === 'moon') drawMoon(b, sunB);
      else {
        if (b.mag > tw.lim + 1.5 && tw.phase === 'day') continue;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.fillStyle = T.planet;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 3, 0, TAU);
        ctx.strokeStyle = withAlpha(T.planet, 0.45);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  function drawMoon(b: Body, sunB: Body) {
    const T = S.theme, r = b.r;
    const lit = b.lit ?? 1;
    // The lit limb faces the Sun on screen.
    const ang = Math.atan2(sunB.y - b.y, sunB.x - b.x);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = T.moonDark;
    ctx.fill();
    // Terminator: half disc toward +x plus an ellipse of width r·(2·lit−1).
    const kx = r * (2 * lit - 1);
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(0, 0, Math.abs(kx), r, 0, Math.PI / 2, -Math.PI / 2, kx < 0);
    ctx.fillStyle = T.moon;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.strokeStyle = withAlpha(T.moon, 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  function drawCompass(C: Float64Array, k: number) {
    const T = S.theme;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = T.fontCompass;
    for (let i = 0; i < 8; i++) {
      const az = i * 45;
      const [x, y, z] = project(C, k, cosd(-3) * sind(az), cosd(-3) * cosd(az), sind(-3));
      if (z < -0.2 || x < 12 || x > S.w - 12 || y < 12 || y > S.h - 12) continue;
      const main = i % 2 === 0;
      ctx.fillStyle = main ? (az === 0 ? T.select : T.labelStrong) : T.label;
      ctx.globalAlpha = main ? 1 : 0.8;
      ctx.fillText(COMPASS16[i * 2], x, y + (main ? 6 : 4));
    }
    ctx.globalAlpha = 1;
  }
  function drawLabels(C: Float64Array, k: number, tw: Twilight) {
    const T = S.theme, fov = S.view.fov;
    const cands: LabelCandidate[] = [];
    const selId = S.selection ? selKey(S.selection) : '';
    for (const b of bodies) {
      if (b.alt < 0 && selId !== b.id) continue;
      if (b.kind === 'planet' && tw.phase === 'day' && b.name !== 'Venus' && b.name !== 'Jupiter') continue;
      cands.push({
        id: b.id, text: b.name, x: b.x + b.r + (selId === b.id ? 18 : 6), y: b.y, font: T.fontName,
        color: b.kind === 'planet' ? T.planet : T.labelStrong, pri: 100 - b.mag,
      });
    }
    const starNameLim = fov > 110 ? 1.0 : fov > 70 ? 1.6 : fov > 40 ? 2.4 : 3.6;
    for (const [i, nm] of STAR_NAME) {
      if (PVIS[i] !== 1 || !nm.name) continue;
      const isSel = selId === `star:${i}`;
      if (!isSel && (!S.names || SMAG[i] > starNameLim)) continue;
      cands.push({
        id: `star:${i}`, text: nm.name, x: PX[i] + PR[i] + (isSel ? 18 : 5), y: PY[i], font: T.fontName,
        color: T.labelStrong, pri: (isSel ? 200 : 50) - SMAG[i],
      });
    }
    if (S.names || selId.startsWith('constellation:')) {
      const rankLim = fov > 110 ? 1 : fov > 60 ? 2 : 3;
      CON.forEach((c) => {
        const isSel = selId === `constellation:${c.id}`;
        if (!isSel && (!S.names || c.rank > rankLim)) return;
        const [e, n, u] = apply(mats.HP, c.x, c.y, c.z);
        if (u < 0.03 && !isSel) return;
        const [x, y, z] = project(C, k, e, n, u);
        if (z < 0) return;
        const name = S.hindi && c.hi ? c.hi : c.name;
        cands.push({
          id: `constellation:${c.id}`, text: S.hindi && c.hi ? name : name.toUpperCase(), x, y, font: T.fontLabel,
          color: isSel ? T.select : T.label, pri: (isSel ? 190 : 20) - c.rank * 2, center: true, track: !S.hindi,
        });
      });
    }
    cands.sort((a, b) => b.pri - a.pri);
    labelBoxes = [];
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    // Widths are cached per (font, tracking, text) for the theme; the font switches only when it changes.
    const widths = themeCache().widths;
    const spacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    const hasLS = 'letterSpacing' in ctx;
    let curFont = '', curTrack = -1;
    const applyFont = (c: LabelCandidate) => {
      if (c.font !== curFont) {
        ctx.font = c.font;
        curFont = c.font;
      }
      const tr = c.track ? 1 : 0;
      if (hasLS && tr !== curTrack) {
        spacing.letterSpacing = tr ? '1.5px' : '0px';
        curTrack = tr;
      }
    };
    const reserved = opt.reserve?.() ?? [];
    for (const c of cands) {
      const wk = `${c.font}|${c.track ? 1 : 0}|${c.text}`;
      let w = widths.get(wk);
      if (w === undefined) {
        applyFont(c);
        w = ctx.measureText(c.text).width;
        widths.set(wk, w);
      }
      const h = 14;
      const x = c.center ? c.x - w / 2 : c.x, y = c.y - h / 2;
      if (x < 4 || y < 4 || x + w > S.w - 4 || y + h > S.h - 4) continue;
      const lw = w;
      const hits = (o: { x: number; y: number; w: number; h: number }) => x < o.x + o.w + 6 && x + lw + 6 > o.x && y < o.y + o.h + 2 && y + h + 2 > o.y;
      if (labelBoxes.some(hits) || reserved.some(hits)) continue;
      labelBoxes.push({ id: c.id, x, y, w, h });
      applyFont(c);
      ctx.textAlign = 'left';
      ctx.strokeStyle = S.theme.halo;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = 0.9;
      ctx.strokeText(c.text, x, c.y);
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, x, c.y);
    }
    if (hasLS) spacing.letterSpacing = '0px';
  }
  function drawSelection() {
    if (!S.selection) return;
    const p = selPoint(S.selection);
    if (!p) return;
    const r = (p.r || 3) + 7;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.strokeStyle = S.theme.select;
    ctx.lineWidth = 1.75;
    ctx.stroke();
    // Four ticks: a surveyor's reticle.
    ctx.beginPath();
    for (let q = 0; q < 4; q++) {
      const a = (q * Math.PI) / 2;
      ctx.moveTo(p.x + Math.cos(a) * (r + 3), p.y + Math.sin(a) * (r + 3));
      ctx.lineTo(p.x + Math.cos(a) * (r + 8), p.y + Math.sin(a) * (r + 8));
    }
    ctx.stroke();
  }
  function selPoint(sel: Sel): { x: number; y: number; r: number } | null {
    if (sel.kind === 'star') return PVIS[sel.index] ? { x: PX[sel.index], y: PY[sel.index], r: PR[sel.index] } : null;
    if (sel.kind === 'constellation') return null; // its figure is highlighted instead
    return bodies.find((b) => b.id === sel.id) || null;
  }
  const selKey = (sel: Sel) => (sel.kind === 'star' ? `star:${sel.index}` : sel.kind === 'constellation' ? `constellation:${sel.id}` : sel.id);

  /* --------------------------------------------- info, text alternative --------------------------------------------- */

  let fmtTz: string | null = null;
  let fmtF: Intl.DateTimeFormat | null = null; // one formatter per time zone, not one per frame
  function fmtTime(ms: number): string {
    try {
      const tz = S.place.timeZone || '';
      if (!fmtF || fmtTz !== tz) {
        fmtF = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz || undefined });
        fmtTz = tz;
      }
      return fmtF.format(ms);
    } catch {
      return new Date(ms).toISOString().slice(11, 16);
    }
  }
  let dayTz: string | null = null;
  let dayF: Intl.DateTimeFormat | null = null;
  function localDay(ms: number): string {
    try {
      const tz = S.place.timeZone || '';
      if (!dayF || dayTz !== tz) {
        dayF = new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined });
        dayTz = tz;
      }
      return dayF.format(ms);
    } catch {
      return new Date(ms).toDateString();
    }
  }
  /** Next rise and set within 24 h (10-minute steps, then bisection), or circumpolar / never rises. */
  function riseSet(altAt: (t: number) => number): RiseSet {
    const h0 = -0.5;
    let prev = altAt(S.t), rise: number | null = null, set: number | null = null, max = prev;
    const step = 10 * 60_000;
    for (let t = S.t + step; t <= S.t + 24 * HOUR && (!rise || !set); t += step) {
      const a = altAt(t);
      max = Math.max(max, a);
      if (prev < h0 !== a < h0) {
        let lo = t - step, hi = t;
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) / 2;
          if (altAt(mid) < h0 === prev < h0) lo = mid;
          else hi = mid;
        }
        if (a >= h0 && !rise) rise = hi;
        else if (a < h0 && !set) set = hi;
      }
      prev = a;
    }
    if (!rise && !set) return max < h0 ? { never: true } : { circumpolar: true };
    return { rise, set };
  }
  function vectorAltAt(x: number, y: number, z: number) {
    return (t: number) => {
      const H = horizonMatrix(lst(t, S.place.lon), S.place.lat * DEG);
      return Math.asin(clamp(apply(mul(H, precessionMatrix(t)), x, y, z)[2], -1, 1)) / DEG;
    };
  }
  /**
   * A body's altitude over time for rise and set. The full solar system is solved once per whole hour and RA / Dec are
   * interpolated between (the Moon moves about 0.5° an hour, so the error is far under the 0.5° horizon margin):
   * about 26 solves per body instead of about 170 (review P2-1).
   */
  function bodyAltAt(key: 'sun' | 'moon' | PlanetKey) {
    const hourly = new Map<number, readonly [number, number]>();
    const radec = (h: number) => {
      let v = hourly.get(h);
      if (!v) {
        const ss = solarSystem(h * HOUR)[key];
        v = [ss.ra, ss.dec];
        hourly.set(h, v);
      }
      return v;
    };
    return (t: number) => {
      const h = Math.floor(t / HOUR), f = t / HOUR - h;
      const [ra0, dec0] = radec(h);
      const [ra1, dec1] = radec(h + 1);
      const dra = ((ra1 - ra0 + 540) % 360) - 180;
      const ra = ra0 + dra * f, dec = dec0 + (dec1 - dec0) * f;
      const H = horizonMatrix(lst(t, S.place.lon), S.place.lat * DEG);
      const [, , u] = apply(H, cosd(dec) * cosd(ra), cosd(dec) * sind(ra), sind(dec));
      return Math.asin(clamp(u, -1, 1)) / DEG - (key === 'moon' ? 0.95 : 0);
    };
  }
  /** "Sets 04:12 · rises 15:17 tomorrow": next event first; a later local date says so. */
  function riseSetText(rs: RiseSet): string {
    if ('circumpolar' in rs) return 'Never sets from here';
    if ('never' in rs) return 'Never rises from here';
    const today = localDay(S.t);
    const ev: [string, number][] = [];
    if (rs.rise) ev.push(['rises', rs.rise]);
    if (rs.set) ev.push(['sets', rs.set]);
    ev.sort((a, b) => a[1] - b[1]);
    // "tomorrow" only past the observing night: an 05:40 set seen from 21:00 is still tonight's.
    const text = ev
      .map(([w, t]) => `${w} ${fmtTime(t)}${localDay(t) !== today && t - S.t > 12 * HOUR ? ' tomorrow' : ''}`)
      .join(' · ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  /** "34° up · SSW", or "Below the horizon · ESE · rises 22:06" (the rise only when the scan already ran). */
  const where = (alt: number, az: number, rs?: RiseSet) => {
    if (alt >= 0) return `${Math.round(alt)}° up · ${compass16(az)}`;
    const rise = rs && 'rise' in rs && rs.rise ? riseSetText({ rise: rs.rise, set: null }).toLowerCase() : '';
    return ['Below the horizon', compass16(az), rise].filter(Boolean).join(' · ');
  };

  /** A small readable card for a selection. */
  function info(sel: Sel | null, { riseSet: withRiseSet = true }: { riseSet?: boolean } = {}): SkyInfo | null {
    if (!sel) return null;
    const scan = (altAt: () => (t: number) => number) => (withRiseSet ? riseSet(altAt()) : undefined);
    const rsLine = (rs: RiseSet | undefined): [string, string][] => (rs ? [['Rise / set', riseSetText(rs)]] : []);
    updateMatrices();
    if (sel.kind === 'star') {
      const i = sel.index;
      const nm = STAR_NAME.get(i) || { name: '', bayer: '' };
      const con = SCON[i] >= 0 ? CON[SCON[i]] : null;
      const { alt, az } = altAz(...apply(mats.HP, SX[i], SY[i], SZ[i]));
      const rs = scan(() => vectorAltAt(SX[i], SY[i], SZ[i]));
      const desig = nm.bayer && con ? `${nm.bayer} ${con.id}` : '';
      return {
        id: `star:${i}`,
        kind: 'Star',
        // Named: "Deneb" / "α Cyg · in Cygnus". Bayer only: "δ Cyg" / "in Cygnus". Neither: "A star in Cygnus".
        title: nm.name || desig || `A star${con ? ` in ${con.name}` : ''}`,
        kicker: nm.name ? [desig, con ? `in ${con.name}` : ''].filter(Boolean).join(' · ') : desig && con ? `in ${con.name}` : '',
        lines: [
          ['Now', where(alt, az, rs)],
          ['Brightness', `mag ${formatMag(SMAG[i])}, ${brightWord(SMAG[i])}`],
          ['Colour', TINT_WORD[STINT[i]]],
          ...rsLine(rs),
        ],
      };
    }
    if (sel.kind === 'constellation') {
      const ci = CON_BY_ID.get(sel.id);
      if (ci === undefined) return null;
      const c = CON[ci];
      const { alt, az } = altAz(...apply(mats.HP, c.x, c.y, c.z));
      const rs = scan(() => vectorAltAt(c.x, c.y, c.z));
      const bi = CON_BRIGHTEST[ci], bn = bi >= 0 ? STAR_NAME.get(bi) : undefined;
      return {
        id: `constellation:${c.id}`,
        kind: 'Constellation',
        title: c.name,
        kicker: [c.en ? `the ${c.en}` : '', S.hindi && c.hi ? c.hi : ''].filter(Boolean).join(' · '),
        lines: [
          ['Now', where(alt, az, rs)],
          ['Brightest star', bi >= 0 ? `${bn?.name || (bn?.bayer ? `${bn.bayer} ${c.id}` : 'unnamed')} (mag ${formatMag(SMAG[bi])})` : '—'],
          ...rsLine(rs),
        ],
      };
    }
    const key = sel.id === 'sun' || sel.id === 'moon' ? sel.id : sel.id.replace('planet:', '');
    if (key !== 'sun' && key !== 'moon' && !isPlanetKey(key)) return null;
    const { alt, az } = bodyAltAz(key);
    const rs = scan(() => bodyAltAt(key));
    const lines: [string, string][] = [['Now', where(alt, az, rs)]];
    if (key === 'moon') {
      const m = solar.moon;
      lines.push(['Phase', `${Math.round(m.lit * 100)}% lit, ${m.lit > 0.97 ? 'full' : m.lit < 0.03 ? 'new' : m.waxing ? 'waxing' : 'waning'}`]);
    } else if (key !== 'sun') lines.push(['Brightness', `mag ${formatMag(solar[key].mag)}, ${brightWord(solar[key].mag)}`]);
    lines.push(...rsLine(rs));
    return {
      id: sel.id,
      kind: key === 'sun' ? 'Star (ours)' : key === 'moon' ? 'Moon' : 'Planet',
      title: key === 'sun' ? 'Sun' : key === 'moon' ? 'Moon' : PLANET_NAME[key],
      kicker: key === 'sun' ? 'Never look at it through a lens' : '',
      lines,
    };
  }

  /** What is up now, brightest first: the text alternative and the Up now list. */
  function upNow(limit = 8): SkyUpNow {
    updateMatrices();
    const out: SkyUpItem[] = [];
    const sAlt = Math.asin(clamp(eqToHor(solar.sun.ra, solar.sun.dec)[2], -1, 1)) / DEG;
    for (const key of ['moon', ...PLANETS] as const) {
      const ss = solar[key];
      const { alt, az } = bodyAltAz(key); // the Moon with parallax, as the card shows it
      if (alt > 3 && (sAlt < -6 || key === 'moon' || ss.mag < -3))
        out.push({
          id: key === 'moon' ? 'moon' : `planet:${key}`,
          kind: key === 'moon' ? 'moon' : 'planet',
          name: key === 'moon' ? 'Moon' : PLANET_NAME[key],
          alt,
          az,
          mag: ss.mag,
        });
    }
    // By day only the Moon and the brightest planets are listed: the summary says so, and the stars (drawn faint
    // per SKY-SPEC §2) are not named in Up now until the Sun is down (review P1-2).
    const daytime = sAlt > SUN_H0;
    for (const [i, nm] of STAR_NAME) {
      if (daytime) break;
      if (!nm.name || SMAG[i] > 1.6) continue;
      const { alt, az } = altAz(...apply(mats.HP, SX[i], SY[i], SZ[i]));
      if (alt > 8) out.push({ id: `star:${i}`, kind: 'star', name: nm.name, alt, az, mag: SMAG[i] });
    }
    out.sort((a, b) => (a.mag ?? 0) - (b.mag ?? 0));
    const cons: SkyUpItem[] = CON.map((c) => ({ c, ...altAz(...apply(mats.HP, c.x, c.y, c.z)) }))
      .filter((o) => o.alt > 20 && o.c.rank === 1)
      .sort((a, b) => b.alt - a.alt)
      .slice(0, 6)
      .map((o) => ({ id: `constellation:${o.c.id}`, kind: 'constellation', name: o.c.name, alt: o.alt, az: o.az }));
    const items = out.slice(0, limit);
    const phase: SkyPhase = daytime ? 'day' : sAlt > -18 ? 'twilight' : 'night';
    const lead = `Up now from ${S.place.short || S.place.label}, ${fmtTime(S.t)}${S.place.tzLabel ? ` ${S.place.tzLabel}` : ''}`;
    const body = items.map((o) => `${o.name} ${heightWord(o.alt)} in the ${compassWord(o.az)}`).join('; ');
    const dayNote = phase === 'day' ? 'The Sun is up, so only the Moon and the brightest planets show. ' : '';
    const conText = cons.length ? ` Constellations: ${cons.map((c) => c.name).join(', ')}.` : '';
    return { items, constellations: cons, phase, text: `${lead}: ${dayNote}${body || 'nothing bright above the horizon'}.${conText}` };
  }

  function emitChange(tw: Twilight) {
    opt.onChange?.({
      t: S.t,
      live: S.live && !motion.timeSpring,
      time: fmtTime(S.t),
      tz: S.place.tzLabel || '',
      place: S.place,
      view: { ...S.view },
      sunAlt,
      phase: tw.phase,
      stage: tw.stage,
    });
  }

  /* ---------------------------------------------------- hit test ---------------------------------------------------- */

  function bodySel(b: Body): Sel {
    return { kind: b.kind, id: b.id };
  }
  function hitTest(px: number, py: number, coarse: boolean, radius?: number): Sel | null {
    const R = radius ?? (coarse ? 24 : 14);
    let best: Sel | null = null, bestScore = Infinity;
    const consider = (sel: Sel, x: number, y: number, mag: number, r = 0) => {
      const d = Math.hypot(px - x, py - y) - r;
      if (d > R) return;
      const score = d - (3.5 - Math.min(mag, 5)) * 2.5; // the brighter wins a near tie
      if (score < bestScore) {
        bestScore = score;
        best = sel;
      }
    };
    for (const b of bodies) if (b.alt > -1) consider(bodySel(b), b.x, b.y, b.kind === 'moon' || b.kind === 'sun' ? -10 : b.mag, b.r);
    for (let i = 0; i < N_STARS; i++) if (PVIS[i] === 1) consider({ kind: 'star', index: i }, PX[i], PY[i], SMAG[i]);
    if (best) return best;
    for (const l of labelBoxes) {
      if (px >= l.x - 4 && px <= l.x + l.w + 4 && py >= l.y - 6 && py <= l.y + l.h + 6) return parseId(l.id);
    }
    // Nearest figure segment.
    let bestSeg = -1, bestD = coarse ? 14 : 9;
    for (let s = 0; s < SEG.length; s += 3) {
      const a = SEG[s + 1], b = SEG[s + 2];
      if (!PVIS[a] || !PVIS[b] || HALT[a] < 0 || HALT[b] < 0) continue;
      const d = segDist(px, py, PX[a], PY[a], PX[b], PY[b]);
      if (d < bestD) {
        bestD = d;
        bestSeg = SEG[s];
      }
    }
    return bestSeg >= 0 && CON[bestSeg] ? { kind: 'constellation', id: CON[bestSeg].id } : null;
  }
  function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1);
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  function selectInternal(sel: Sel | null, { announce = true }: { announce?: boolean } = {}) {
    S.selection = sel;
    requestRender();
    if (announce) opt.onSelect?.(sel ? info(sel) : null);
  }
  /** Direction of a selection, for centring. */
  function selAltAz(sel: Sel): { alt: number; az: number } {
    updateMatrices();
    if (sel.kind === 'star') return altAz(...apply(mats.HP, SX[sel.index], SY[sel.index], SZ[sel.index]));
    if (sel.kind === 'constellation') {
      const c = CON[CON_BY_ID.get(sel.id) ?? 0];
      return altAz(...apply(mats.HP, c.x, c.y, c.z));
    }
    const key = sel.id === 'sun' || sel.id === 'moon' ? sel.id : sel.id.replace('planet:', '');
    return key === 'sun' || key === 'moon' || isPlanetKey(key) ? bodyAltAz(key) : { alt: S.view.alt, az: S.view.az };
  }
  function parseId(id: string): Sel | null {
    if (id.startsWith('star:')) {
      const index = Number(id.slice(5));
      return Number.isInteger(index) && index >= 0 && index < N_STARS ? { kind: 'star', index } : null;
    }
    if (id.startsWith('constellation:')) {
      const cid = id.slice(14);
      return CON_BY_ID.has(cid) ? { kind: 'constellation', id: cid } : null;
    }
    if (id.startsWith('planet:')) return isPlanetKey(id.slice(7)) ? { kind: 'planet', id } : null;
    if (id === 'moon' || id === 'sun') return { kind: id, id };
    return null;
  }

  /* ---------------------------------------------------- input ---------------------------------------------------- */

  const listeners: (() => void)[] = [];
  function on<K extends keyof HTMLElementEventMap>(el: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions): void;
  function on(el: EventTarget, ev: string, fn: (e: Event) => void, o?: AddEventListenerOptions): void;
  function on(el: EventTarget, ev: string, fn: (e: Event) => void, o?: AddEventListenerOptions) {
    el.addEventListener(ev, fn, o);
    listeners.push(() => el.removeEventListener(ev, fn, o));
  }
  const local = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  function stopMotion() {
    // Interrupt from the presentation value: the view state *is* what is on screen.
    motion.vAz = 0;
    motion.vAlt = 0;
    motion.spring = null;
  }

  on(canvas, 'pointerdown', (e) => {
    if (e.button > 0) return;
    const [x, y] = local(e);
    pointers.set(e.pointerId, { x, y, x0: x, y0: y, type: e.pointerType });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best effort (a synthetic or already released pointer) */
    }
    stopMotion();
    if (pointers.size === 1) drag = { hist: [[e.timeStamp, S.view.az, S.view.alt]], moved: false, axis: null, pinch: null };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      drag = {
        hist: [],
        moved: true,
        axis: 'both',
        pinch: {
          d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          fov0: S.view.fov,
          mx: (a.x + b.x) / 2,
          my: (a.y + b.y) / 2,
          grab: unproject((a.x + b.x) / 2, (a.y + b.y) / 2),
        },
      };
    }
  });
  on(canvas, 'pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p || !drag) return;
    const [x, y] = local(e);
    const dx = x - p.x, dy = y - p.y;
    p.x = x;
    p.y = y;
    if (drag.pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      S.view.fov = clamp(drag.pinch.fov0 * (drag.pinch.d0 / d), FOV_MIN, FOV_MAX);
      // Zoom about the fingers: the sky point between them stays between them.
      if (!solveGrab(drag.pinch.grab, mx, my)) panBy(mx - drag.pinch.mx, my - drag.pinch.my, mx, my);
      drag.pinch.mx = mx;
      drag.pinch.my = my;
      return;
    }
    if (!drag.moved) {
      const tx = x - p.x0, ty = y - p.y0;
      const th = p.type === 'mouse' ? 3 : 8; // hysteresis before committing
      if (Math.hypot(tx, ty) < th) return;
      if (S.gestures === 'horizontal' && p.type !== 'mouse' && Math.abs(ty) > Math.abs(tx)) {
        drag = null; // the page scrolls
        return;
      }
      drag.moved = true;
      drag.axis = S.gestures === 'horizontal' && p.type !== 'mouse' ? 'x' : 'both';
      if (orient.active) disableOrientation('drag');
      drag.grab = unproject(p.x0, p.y0); // the sky point under the finger at touch-down
    }
    // Keep the grabbed point under the finger (exact), or pan incrementally where the solve is singular.
    if (drag.axis === 'x' || !drag.grab || !solveGrab(drag.grab, x, y))
      panBy(dx, drag.axis === 'x' ? 0 : dy, x, drag.axis === 'x' ? p.y0 : y);
    drag.hist.push([e.timeStamp, S.view.az, S.view.alt]);
    if (drag.hist.length > 6) drag.hist.shift();
  });
  const end = (e: PointerEvent, cancelled: boolean) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (!p || !drag) return;
    if (drag.pinch) {
      if (pointers.size < 2) drag = null;
      return;
    }
    if (!drag.moved && !cancelled) {
      selectInternal(hitTest(p.x, p.y, p.type !== 'mouse'));
      drag = null;
      return;
    }
    // Velocity from the last ~80 ms of samples, handed to momentum.
    const h = drag.hist;
    drag = null;
    if (cancelled || S.reduced || h.length < 2) {
      settleAlt();
      return;
    }
    const last = h[h.length - 1];
    let first = h[0];
    for (const s of h)
      if (last[0] - s[0] <= 80) {
        first = s;
        break;
      }
    const dt = (last[0] - first[0]) / 1000;
    if (dt <= 0 || e.timeStamp - last[0] > 60) {
      settleAlt();
      return;
    }
    const cap = 720;
    motion.vAz = clamp(wrapPi((last[1] - first[1]) * DEG) / DEG / dt, -cap, cap);
    motion.vAlt = clamp((last[2] - first[2]) / dt, -cap, cap);
    if (S.view.alt > ALT_MAX || S.view.alt < ALT_MIN) {
      motion.vAz = 0;
      settleAlt();
    }
    requestRender();
  };
  on(canvas, 'pointerup', (e) => end(e, false));
  on(canvas, 'pointercancel', (e) => end(e, true));
  on(canvas, 'lostpointercapture', (e) => {
    if (pointers.has(e.pointerId)) end(e, true);
  });

  /**
   * Grab-the-sky pan: the sky point under the finger stays under the finger. The view turns by the difference between
   * the directions under the previous and the current pointer position (exact to first order anywhere on screen, and
   * it spins naturally when grabbed near the zenith).
   */
  function panBy(dx: number, dy: number, px = S.w / 2, py = S.h / 2) {
    const v = S.view;
    const a = altAz(...unproject(px - dx, py - dy)), b = altAz(...unproject(px, py));
    v.az = (v.az + clamp(wrapPi((a.az - b.az) * DEG) / DEG, -30, 30) + 360) % 360;
    let alt = v.alt + (a.alt - b.alt);
    // Rubber-band past the limits (Apple's formula), so the edge resists rather than stops.
    if (alt > ALT_MAX) alt = ALT_MAX + rubber(alt - ALT_MAX, 30);
    if (alt < ALT_MIN) alt = ALT_MIN - rubber(ALT_MIN - alt, 30);
    v.alt = alt;
    requestRender();
  }
  const rubber = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

  function zoomAt(px: number, py: number, fov: number) {
    const before = unproject(px, py);
    S.view.fov = clamp(fov, FOV_MIN, FOV_MAX);
    if (motion.spring) motion.spring.fov = S.view.fov;
    if (solveGrab(before, px, py)) {
      S.view.alt = clamp(S.view.alt, ALT_MIN, ALT_MAX);
      return;
    }
    const after = unproject(px, py);
    const b = altAz(...before), a = altAz(...after);
    S.view.az = (S.view.az + wrapPi((b.az - a.az) * DEG) / DEG + 360) % 360;
    S.view.alt = clamp(S.view.alt + (b.alt - a.alt), ALT_MIN, ALT_MAX);
    requestRender();
  }

  on(
    canvas,
    'wheel',
    (e) => {
      const zoomIntent = e.ctrlKey || e.metaKey;
      if (S.wheel === 'modifier' && !zoomIntent) {
        opt.onHint?.('wheel'); // let the page scroll
        return;
      }
      e.preventDefault();
      stopMotion();
      const [x, y] = local(e);
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? S.h : 1;
      // Trackpad pinches arrive as small ctrl+wheel deltas, mouse notches as ~100: scale each, cap per event.
      const dy = e.deltaY * unit;
      const f = Math.exp(clamp(dy * (Math.abs(dy) < 40 ? 0.01 : 0.0025), -0.4, 0.4));
      zoomAt(x, y, S.view.fov * f);
    },
    { passive: false },
  );

  // Keyboard: arrows look (held keys glide), +/- zoom, N E S W face, Enter names the centre, Esc clears, 0 resets.
  function keyStep(dt: number) {
    const rate = 60 * (S.view.fov / 90); // deg/s, slower when zoomed in
    let dAz = 0, dAlt = 0;
    if (keys.has('ArrowLeft')) dAz -= rate * dt;
    if (keys.has('ArrowRight')) dAz += rate * dt;
    if (keys.has('ArrowUp')) dAlt += rate * dt;
    if (keys.has('ArrowDown')) dAlt -= rate * dt;
    S.view.az = (S.view.az + dAz + 360) % 360;
    S.view.alt = clamp(S.view.alt + dAlt, ALT_MIN, ALT_MAX);
  }
  on(canvas, 'keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k.startsWith('Arrow')) {
      e.preventDefault();
      stopMotion();
      if (S.reduced) {
        // Discrete 15° steps, no glide.
        const st = 15 * (S.view.fov / 90);
        if (k === 'ArrowLeft') S.view.az -= st;
        if (k === 'ArrowRight') S.view.az += st;
        if (k === 'ArrowUp') S.view.alt = clamp(S.view.alt + st, ALT_MIN, ALT_MAX);
        if (k === 'ArrowDown') S.view.alt = clamp(S.view.alt - st, ALT_MIN, ALT_MAX);
        S.view.az = (S.view.az + 360) % 360;
        requestRender();
        return;
      }
      keys.add(k);
      requestRender();
      return;
    }
    if (k === '+' || k === '=') {
      e.preventDefault();
      toView({ fov: S.view.fov / 1.4 });
      return;
    }
    if (k === '-' || k === '_') {
      e.preventDefault();
      toView({ fov: S.view.fov * 1.4 });
      return;
    }
    if (k === '0' || k === 'Home') {
      e.preventDefault();
      toView(VIEW_DEFAULT);
      return;
    }
    const face = ({ n: 0, e: 90, s: 180, w: 270 } as Record<string, number>)[k.toLowerCase()];
    if (face !== undefined) {
      e.preventDefault();
      toView({ az: face });
      return;
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      const c = centreTarget();
      if (c.sel) selectInternal(c.sel);
      else opt.onCentre?.(publicCentre(c));
      return;
    }
    if (k === 'Escape' && S.selection) {
      e.preventDefault();
      selectInternal(null);
    }
  });
  on(canvas, 'keyup', (e) => {
    keys.delete(e.key);
  });
  on(canvas, 'blur', () => keys.clear());

  interface Centre {
    kind: SkyCentre['kind'];
    sel: Sel | null;
    near?: Sel;
    text: string;
  }
  /**
   * What is in the middle of the view. Only the reticle counts (36 px or 8 % of the short side). When it is empty the
   * answer says so and points to the nearest bright named thing on screen; below the horizon it says "ground".
   */
  function centreTarget(): Centre {
    const cx = S.w / 2, cy = S.h / 2, R = Math.max(36, Math.min(S.w, S.h) * 0.08);
    if (S.view.alt < -1) return { kind: 'ground', sel: null, text: "That's the ground. Tilt up." };
    const sel = hitTest(cx, cy, true, R);
    if (sel) return { kind: 'hit', sel, text: '' };
    let best: { s: Sel; name: string; x: number; y: number } | null = null, bd = Infinity;
    const near = (s: Sel, name: string, x: number, y: number) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d < bd) {
        bd = d;
        best = { s, name, x, y };
      }
    };
    for (const b of bodies) if (b.alt > 0 && (b.kind === 'moon' || (b.kind === 'planet' && b.mag < 2))) near(bodySel(b), b.name, b.x, b.y);
    for (let i = 0; i < N_STARS; i++) {
      const nm = STAR_NAME.get(i)?.name;
      if (PVIS[i] === 1 && HALT[i] > 0 && SMAG[i] < 2 && nm) near({ kind: 'star', index: i }, nm, PX[i], PY[i]);
    }
    const found = best as { s: Sel; name: string; x: number; y: number } | null;
    if (!found || found.x < 0 || found.y < 0 || found.x > S.w || found.y > S.h) return { kind: 'none', sel: null, text: 'Nothing bright in the middle.' };
    const dx = found.x - cx, dy = found.y - cy;
    const v = dy < -R ? 'up' : dy > R ? 'down' : '', h = dx < -R ? 'to the left' : dx > R ? 'to the right' : '';
    const way = v && h ? `${v} and ${h}` : v || h;
    return { kind: 'nearest', sel: null, near: found.s, text: `Nothing bright in the middle. Nearest: ${found.name}${way ? `, ${way}` : ''}.` };
  }
  const publicCentre = (c: Centre): SkyCentre => ({
    kind: c.kind,
    id: c.sel ? selKey(c.sel) : null,
    nearId: c.near ? selKey(c.near) : null,
    text: c.text,
  });

  /* ------------------------------------------- device orientation -------------------------------------------- */

  async function enableOrientation(): Promise<'on'> {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') throw new Error('unsupported');
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') {
      const r = await DOE.requestPermission();
      if (r !== 'granted') throw new Error('denied');
    }
    if (orient.handler) window.removeEventListener(orient.evName, orient.handler);
    const evName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    return new Promise<'on'>((resolve, reject) => {
      let got = false;
      const handler = (raw: Event) => {
        const ev = raw as OrientationEventExtras;
        if (ev.alpha == null || ev.beta == null || ev.gamma == null) return;
        if (!got) {
          got = true;
          clearTimeout(timer);
          orient.active = true;
          stopMotion();
          resolve('on');
        }
        onOrientation(ev); // first: it sets orient.absolute, so the mode reported below is the real one
        const mode: SkyOrientationMode = orient.calibrate ? 'calibrate' : orient.absolute ? 'compass' : 'relative';
        if (mode !== orient.mode) {
          orient.mode = mode;
          opt.onOrientation?.(true, mode); // re-reported when it changes
        }
      };
      const timer = setTimeout(() => {
        if (!got) {
          window.removeEventListener(evName, handler);
          if (orient.handler === handler) orient.handler = null;
          reject(new Error('no-data'));
        }
      }, 1500);
      orient.handler = handler;
      orient.evName = evName;
      orient.offset = null;
      orient.relOffset = null;
      orient.mode = '';
      window.addEventListener(evName, handler);
    });
  }
  function disableOrientation(reason: SkyOrientationMode) {
    if (orient.handler) window.removeEventListener(orient.evName, orient.handler);
    orient.handler = null;
    if (!orient.active) return;
    orient.active = false;
    orient.f = null;
    orient.u = null;
    S.view.roll = 0;
    opt.onOrientation?.(false, reason);
    requestRender();
  }
  function onOrientation(ev: OrientationEventExtras) {
    let alpha = ev.alpha ?? 0;
    orient.absolute = ev.absolute || ev.webkitCompassHeading != null;
    // iOS: accuracy −1 (unknown) or worse than 20° asks for the figure-8 calibration.
    orient.calibrate = ev.webkitCompassAccuracy != null && (ev.webkitCompassAccuracy < 0 || ev.webkitCompassAccuracy > 20);
    if (ev.webkitCompassHeading != null) {
      // iOS: alpha is relative; anchor it to the compass heading (a smoothed circular offset).
      const off = wrapPi((360 - ev.webkitCompassHeading - alpha) * DEG) / DEG;
      orient.offset = orient.offset == null ? off : orient.offset + (wrapPi((off - orient.offset) * DEG) / DEG) * 0.1;
      alpha += orient.offset;
    }
    const a = alpha * DEG, b = (ev.beta ?? 0) * DEG, g = (ev.gamma ?? 0) * DEG;
    // W3C: R = Rz(α) Rx(β) Ry(γ), device frame -> earth frame (x East, y North, z Up).
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
    const R = [
      ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg,
      sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg,
      -cb * sg, sb, cb * cg,
    ];
    const scr = (typeof screen !== 'undefined' ? (screen.orientation?.angle ?? 0) : 0) * DEG;
    const f: Vec3 = [-R[2], -R[5], -R[8]]; // the back camera looks along -z
    const ux = -Math.sin(scr), uy = Math.cos(scr); // screen-up in device coordinates
    const u: Vec3 = [R[0] * ux + R[1] * uy, R[3] * ux + R[4] * uy, R[6] * ux + R[7] * uy];
    // Low-pass on the vectors, not the angles, so the 0/360 wrap cannot glitch.
    const lerp = (p: Vec3 | null, q: Vec3, t: number): Vec3 => (p ? [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t] : q);
    orient.f = lerp(orient.f, f, 0.3);
    orient.u = lerp(orient.u, u, 0.3);
    const fl = Math.hypot(...orient.f) || 1;
    const dir = altAz(orient.f[0] / fl, orient.f[1] / fl, orient.f[2] / fl);
    const alt = dir.alt;
    let az = dir.az;
    if (!orient.absolute) {
      // No compass: keep the view's azimuth where it was when pointing started ("north is approximate").
      if (orient.relOffset == null) orient.relOffset = S.view.az - az;
      az = (az + orient.relOffset + 720) % 360;
    }
    // Roll: the angle of the phone's up against the view's natural up.
    const sa2 = sind(az), ca2 = cosd(az), sh = sind(alt), ch = cosd(alt);
    const rr: Vec3 = [ca2, -sa2, 0], uu: Vec3 = [-sh * sa2, -sh * ca2, ch];
    const dot = (p: Vec3, q: Vec3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    S.view.az = az;
    S.view.alt = clamp(alt, -60, 90);
    S.view.roll = Math.atan2(-dot(orient.u, rr), dot(orient.u, uu));
    orient.dirty = true;
    requestRender();
  }

  /* ------------------------------------------- size, visibility, clock -------------------------------------------- */

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, S.lite ? 1.5 : 2);
    S.w = Math.max(1, r.width);
    S.h = Math.max(1, r.height);
    S.dpr = dpr;
    canvas.width = Math.round(S.w * dpr);
    canvas.height = Math.round(S.h * dpr);
    draw(); // synchronous: no blank frame after a resize
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(canvas);
  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([en]) => {
          S.onscreen = en.isIntersecting;
          if (S.onscreen) requestRender();
          else if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
            lastFrame = 0;
          }
          opt.onVisibility?.(S.onscreen && S.visible);
        })
      : null;
  io?.observe(canvas);
  const onVis = () => {
    S.visible = document.visibilityState !== 'hidden';
    if (S.visible) requestRender();
    opt.onVisibility?.(S.onscreen && S.visible);
  };
  if (typeof document !== 'undefined') on(document, 'visibilitychange', onVis);
  if (typeof window !== 'undefined') on(window, 'pagehide', () => disableOrientation('pagehide')); // sensors never outlive the page
  const onMq = () => {
    if (opt.reducedMotion === undefined && mq) S.reduced = mq.matches;
  };
  mq?.addEventListener?.('change', onMq);

  let lastTickDraw = 0;
  const clock = setInterval(() => {
    if (!S.visible || !S.onscreen) return;
    if (S.live && !motion.timeSpring) {
      S.t = Date.now();
      opt.onTick?.({ t: S.t, time: fmtTime(S.t), live: true });
      // The sky turns 0.25°/min: a redraw every 5 s is below a pixel at the widest zoom.
      if (S.t - lastTickDraw > 5000 && !raf) {
        lastTickDraw = S.t;
        requestRender();
      }
    }
  }, 1000);

  resize();

  /* ----------------------------------------------------- API ----------------------------------------------------- */

  return {
    setPlace(place) {
      S.place = place;
      matsAt = -Infinity;
      solarAt = -Infinity;
      requestRender();
      if (S.selection) opt.onSelect?.(info(S.selection));
    },
    setTime(date, { animate = false } = {}) {
      const ms = +date;
      flushSettle(); // a newer target supersedes a pending one
      if (animate && !S.reduced && S.visible && S.onscreen) {
        motion.timeSpring = { to: ms, v: motion.timeSpring?.v || 0, live: false };
        S.live = false;
      } else {
        S.t = ms;
        S.live = false;
        motion.timeSpring = null;
      }
      requestRender();
      return motion.timeSpring ? new Promise<void>((r) => settleWaiters.push(r)) : Promise.resolve();
    },
    now({ animate = true } = {}) {
      flushSettle();
      if (animate && !S.reduced && S.visible && S.onscreen && Math.abs(S.t - Date.now()) > 60_000)
        motion.timeSpring = { to: 0, v: 0, live: true };
      else {
        S.live = true;
        S.t = Date.now();
        motion.timeSpring = null;
      }
      requestRender();
      return motion.timeSpring ? new Promise<void>((r) => settleWaiters.push(r)) : Promise.resolve();
    },
    isLive: () => S.live && !motion.timeSpring,
    getTime: () => S.t,
    getNight() {
      const sunAltAt = bodyAltAt('sun');
      const h0 = SUN_H0;
      const find = (from: number, dir: 1 | -1, rising: boolean): number | null => {
        const step = 10 * 60_000;
        let prev = sunAltAt(from);
        for (let t = from + dir * step, n = 0; n < 200; t += dir * step, n++) {
          const a = sunAltAt(t);
          const crossed =
            dir > 0
              ? rising ? prev < h0 && a >= h0 : prev >= h0 && a < h0
              : rising ? a < h0 && prev >= h0 : a >= h0 && prev < h0;
          if (crossed) {
            let lo = Math.min(t, t - dir * step), hi = Math.max(t, t - dir * step);
            for (let k = 0; k < 14; k++) {
              const mid = (lo + hi) / 2;
              if (sunAltAt(mid) >= h0 === sunAltAt(lo) >= h0) lo = mid;
              else hi = mid;
            }
            return hi;
          }
          prev = a;
        }
        return null;
      };
      const base = S.live ? Date.now() : S.t;
      const nightNow = sunAltAt(base) < h0;
      const start = nightNow ? find(base, -1, false) : find(base, 1, false);
      const end = find(start ?? base, 1, true);
      return { start: start ?? base, end: end ?? base + 11 * HOUR, polar: start == null || end == null };
    },
    setView(view, { animate = true } = {}) {
      if (animate) toView(view);
      else {
        stopMotion();
        Object.assign(S.view, view);
        requestRender();
      }
    },
    getView: () => ({ ...S.view }),
    resetView() {
      toView(VIEW_DEFAULT);
    },
    setTheme(theme) {
      S.theme = theme;
      requestRender();
    },
    setOptions(o) {
      if (o.grid !== undefined) S.grid = o.grid;
      if (o.lines !== undefined) S.lines = o.lines;
      if (o.names !== undefined) S.names = o.names;
      if (o.hindi !== undefined) S.hindi = o.hindi;
      if (o.gestures !== undefined) {
        S.gestures = o.gestures;
        if (canvas.style) canvas.style.touchAction = touchFor(o.gestures);
      }
      if (o.wheel !== undefined) S.wheel = o.wheel;
      if (o.reducedMotion !== undefined) S.reduced = o.reducedMotion;
      if (o.lite !== undefined && o.lite !== S.lite) {
        S.lite = o.lite;
        resize();
      }
      requestRender();
    },
    select(id, { center = true, exact = false } = {}) {
      if (!id) {
        selectInternal(null);
        return null;
      }
      const sel = parseId(id);
      if (!sel) return null;
      if (center) {
        const { alt, az } = selAltAz(sel);
        // Frame a low object rather than centre it: it sits in the lower third with the horizon near the bottom
        // (planetarium style) instead of the plate half-filling with ground. { exact: true } centres it.
        const fov = motion.spring?.fov ?? S.view.fov;
        const goal = exact || alt < 0 ? alt : Math.max(alt, fov * 0.3);
        toView({ az, alt: clamp(goal, ALT_MIN, ALT_MAX) });
      }
      selectInternal(sel);
      return info(sel);
    },
    info: (id, opts) => info(id ? parseId(id) : S.selection, opts),
    upNow,
    describe: () => upNow().text,
    find(query) {
      const q = String(query).trim().toLowerCase();
      if (!q) return [];
      const res: SkyFound[] = [];
      for (const p of PLANETS) if (PLANET_NAME[p].toLowerCase().startsWith(q)) res.push({ id: `planet:${p}`, name: PLANET_NAME[p], kind: 'Planet' });
      if ('moon'.startsWith(q)) res.push({ id: 'moon', name: 'Moon', kind: 'Moon' });
      for (const c of CON)
        if (c.name.toLowerCase().startsWith(q) || c.id.toLowerCase() === q) res.push({ id: `constellation:${c.id}`, name: c.name, kind: 'Constellation' });
      for (const [i, nm] of STAR_NAME) if (nm.name && nm.name.toLowerCase().startsWith(q)) res.push({ id: `star:${i}`, name: nm.name, kind: 'Star' });
      // An ambiguous prefix picks something visible: matches above the horizon rank first, order kept within each.
      const up = (id: string) => {
        const sel = parseId(id);
        return sel && selAltAz(sel).alt > 0 ? 0 : 1;
      };
      return res
        .map((r, k) => ({ r, k, u: up(r.id) }))
        .sort((a, b) => a.u - b.u || a.k - b.k)
        .slice(0, 8)
        .map((o) => o.r);
    },
    enableOrientation,
    disableOrientation: () => disableOrientation('off'),
    orientationActive: () => orient.active,
    centreTarget: () => publicCentre(centreTarget()),
    isOnscreen: () => S.onscreen && S.visible,
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      clearInterval(clock);
      clearTimeout(fullTimer);
      flushSettle();
      ro?.disconnect();
      io?.disconnect();
      mq?.removeEventListener?.('change', onMq);
      disableOrientation('destroy');
      listeners.forEach((off) => off());
    },
  };
}

/* ---------------------------------------------- colour helpers ---------------------------------------------- */
/* The values come from the host (resolved palette tokens as `rgb()` / `rgba()` or hex); nothing is defined here. */

function parseColor(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1, 7);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const m = c.match(/[\d.]+/g);
  return m && m.length >= 3 ? [+m[0], +m[1], +m[2], m[3] != null ? +m[3] : 1] : [127, 127, 127, 1];
}
function withAlpha(c: string, a: number): string {
  const [r, g, b, a0] = parseColor(c);
  return `rgba(${r},${g},${b},${a * a0})`;
}
function mix(a: string, b: string): string {
  const p = parseColor(a), q = parseColor(b);
  return `rgb(${Math.round((p[0] + q[0]) / 2)},${Math.round((p[1] + q[1]) / 2)},${Math.round((p[2] + q[2]) / 2)})`;
}
