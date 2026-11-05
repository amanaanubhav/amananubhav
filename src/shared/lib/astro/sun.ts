/**
 * The Sun alone: position, altitude, the sky's phase (night, twilight, day) and the sunset / sunrise
 * crossings. Kept apart from `astro.ts` so a small client island (the Life page's Sikahar readout)
 * can import it without the star tables. Dependency-free and server-safe, like `astro.ts`.
 *
 * Low-precision solar coordinates (Astronomical Almanac, about 0.01° for 1950-2050), which is far
 * finer than a minute of sunset time needs.
 */

const RAD = Math.PI / 180;
const MS_PER_DAY = 86_400_000;
/** J2000.0 (2000-01-01T12:00Z) in days since the Unix epoch. */
const J2000_UNIX_DAYS = 10_957.5;

/** Sun altitude at sunrise and sunset: the upper limb on the horizon with standard refraction. */
export const SUN_HORIZON_DEG = -0.833;
/** Below this the sky is fully dark (astronomical twilight ends). */
export const ASTRONOMICAL_NIGHT_DEG = -18;

export type SkyPhase = 'night' | 'twilight' | 'day';

export interface SunPosition {
  /** Right ascension, degrees 0-360 (equinox of date). */
  raDeg: number;
  /** Declination, degrees. */
  decDeg: number;
}

/** The Sun's apparent equatorial position at `ms` (Unix milliseconds). */
export function sunPosition(ms: number): SunPosition {
  const d = ms / MS_PER_DAY - J2000_UNIX_DAYS;
  const g = (357.529 + 0.98560028 * d) * RAD;
  const q = 280.459 + 0.98564736 * d;
  const lambda = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.00000036 * d) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  return { raDeg: ((ra / RAD) % 360 + 360) % 360, decDeg: dec / RAD };
}

/** The Sun's altitude above the horizon in degrees, seen from `latDeg` / `lonDeg` (east positive). */
export function sunAltitude(ms: number, latDeg: number, lonDeg: number): number {
  const d = ms / MS_PER_DAY - J2000_UNIX_DAYS;
  const { raDeg, decDeg } = sunPosition(ms);
  const gmstHours = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24;
  const hourAngle = (gmstHours * 15 + lonDeg - raDeg) * RAD;
  const lat = latDeg * RAD;
  const dec = decDeg * RAD;
  return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)) / RAD;
}

/** Night below −18°, twilight up to sunset altitude, day above it. */
export function skyPhase(sunAltDeg: number): SkyPhase {
  if (sunAltDeg < ASTRONOMICAL_NIGHT_DEG) return 'night';
  if (sunAltDeg < SUN_HORIZON_DEG) return 'twilight';
  return 'day';
}

const STEP_MS = 10 * 60_000;
/** Search window: a day and a quarter covers every latitude short of the polar circles. */
const SEARCH_STEPS = 180;

/**
 * The first time after `fromMs` the Sun crosses the horizon altitude, setting (`rising: false`) or
 * rising (`rising: true`), refined to under a second. `null` in polar day or night.
 */
function nextCrossing(fromMs: number, latDeg: number, lonDeg: number, rising: boolean): number | null {
  const above = (t: number) => sunAltitude(t, latDeg, lonDeg) >= SUN_HORIZON_DEG;
  let prevT = fromMs;
  let prevUp = above(fromMs);
  for (let n = 1; n <= SEARCH_STEPS; n++) {
    const t = fromMs + n * STEP_MS;
    const up = above(t);
    if (rising ? !prevUp && up : prevUp && !up) {
      let lo = prevT;
      let hi = t;
      for (let k = 0; k < 14; k++) {
        const mid = (lo + hi) / 2;
        if (above(mid) === prevUp) lo = mid;
        else hi = mid;
      }
      return Math.round(hi);
    }
    prevT = t;
    prevUp = up;
  }
  return null;
}

/** The next sunset after `fromMs`, or `null` when the Sun does not set within a day. */
export function nextSunset(fromMs: number, latDeg: number, lonDeg: number): number | null {
  return nextCrossing(fromMs, latDeg, lonDeg, false);
}

/** The next sunrise after `fromMs`, or `null` when the Sun does not rise within a day. */
export function nextSunrise(fromMs: number, latDeg: number, lonDeg: number): number | null {
  return nextCrossing(fromMs, latDeg, lonDeg, true);
}

export interface SunReading {
  /** Sun altitude in degrees. */
  altitudeDeg: number;
  phase: SkyPhase;
  /** Next sunset after `atMs` (ms), or `null` in polar day or night. */
  sunset: number | null;
  /** Next sunrise after `atMs` (ms), or `null` in polar day or night. */
  sunrise: number | null;
}

/** Everything a small readout needs in one call. */
export function readSun(atMs: number, latDeg: number, lonDeg: number): SunReading {
  const altitudeDeg = sunAltitude(atMs, latDeg, lonDeg);
  return {
    altitudeDeg,
    phase: skyPhase(altitudeDeg),
    sunset: nextSunset(atMs, latDeg, lonDeg),
    sunrise: nextSunrise(atMs, latDeg, lonDeg),
  };
}
