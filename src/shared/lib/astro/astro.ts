/**
 * Pure positional astronomy for the `/personal#sky` scene, its DOM readouts and the build scripts
 * (DESIGN-SPEC §D.4). Dependency-free and server-safe: no runtime imports, no enums, no namespaces,
 * so Node's built-in type stripping can load this file directly from a script
 * (`import { BRIGHT_STARS } from '../../src/shared/lib/astro/astro.ts'`).
 *
 * Accuracy target: a few arc-minutes for 1950-2050 (J2000 positions, no precession, nutation,
 * aberration or refraction). That is far finer than a pixel at the chart and dome scales used here.
 */

/* ------------------------------------------------------------------------------------------------
 * Observer
 * --------------------------------------------------------------------------------------------- */

/** The sky Aman grew up under: Sikahar, Bihar, published only as 25° N (privacy rule §A.6). */
export const SKY_OBSERVER = {
  latDeg: 25,
  lonDeg: 85,
  label: 'Bihar, 25° N',
  timeZone: 'Asia/Kolkata',
} as const satisfies {
  readonly latDeg: 25;
  readonly lonDeg: 85;
  readonly label: 'Bihar, 25° N';
  readonly timeZone: 'Asia/Kolkata';
};

/* ------------------------------------------------------------------------------------------------
 * Bright named stars (J2000, Hipparcos-derived values rounded to 4 decimals; V magnitude; B-V)
 * --------------------------------------------------------------------------------------------- */

export interface NamedStar {
  name: string;
  raDeg: number;
  decDeg: number;
  mag: number;
  bv?: number;
}

/** The brightest named stars, sorted brightest first (lowest magnitude first). */
export const BRIGHT_STARS: readonly NamedStar[] = [
  { name: 'Sirius', raDeg: 101.2872, decDeg: -16.7161, mag: -1.46, bv: 0.0 },
  { name: 'Canopus', raDeg: 95.988, decDeg: -52.6957, mag: -0.74, bv: 0.15 },
  { name: 'Rigil Kentaurus', raDeg: 219.9021, decDeg: -60.834, mag: -0.27, bv: 0.71 },
  { name: 'Arcturus', raDeg: 213.9153, decDeg: 19.1824, mag: -0.05, bv: 1.23 },
  { name: 'Vega', raDeg: 279.2347, decDeg: 38.7837, mag: 0.03, bv: 0.0 },
  { name: 'Capella', raDeg: 79.1723, decDeg: 45.998, mag: 0.08, bv: 0.8 },
  { name: 'Rigel', raDeg: 78.6345, decDeg: -8.2016, mag: 0.13, bv: -0.03 },
  { name: 'Procyon', raDeg: 114.8255, decDeg: 5.225, mag: 0.34, bv: 0.42 },
  { name: 'Achernar', raDeg: 24.4285, decDeg: -57.2368, mag: 0.46, bv: -0.16 },
  { name: 'Betelgeuse', raDeg: 88.7929, decDeg: 7.4071, mag: 0.5, bv: 1.85 },
  { name: 'Hadar', raDeg: 210.9559, decDeg: -60.373, mag: 0.61, bv: -0.23 },
  { name: 'Altair', raDeg: 297.6958, decDeg: 8.8683, mag: 0.76, bv: 0.22 },
  { name: 'Acrux', raDeg: 186.6496, decDeg: -63.0991, mag: 0.76, bv: -0.24 },
  { name: 'Aldebaran', raDeg: 68.9802, decDeg: 16.5093, mag: 0.86, bv: 1.54 },
  { name: 'Antares', raDeg: 247.3519, decDeg: -26.432, mag: 0.96, bv: 1.83 },
  { name: 'Spica', raDeg: 201.2983, decDeg: -11.1613, mag: 0.97, bv: -0.23 },
  { name: 'Pollux', raDeg: 116.329, decDeg: 28.0262, mag: 1.14, bv: 1.0 },
  { name: 'Fomalhaut', raDeg: 344.4127, decDeg: -29.6222, mag: 1.16, bv: 0.09 },
  { name: 'Deneb', raDeg: 310.358, decDeg: 45.2803, mag: 1.25, bv: 0.09 },
  { name: 'Mimosa', raDeg: 191.9303, decDeg: -59.6888, mag: 1.25, bv: -0.23 },
  { name: 'Regulus', raDeg: 152.093, decDeg: 11.9672, mag: 1.35, bv: -0.11 },
  { name: 'Adhara', raDeg: 104.6565, decDeg: -28.9721, mag: 1.5, bv: -0.21 },
  { name: 'Castor', raDeg: 113.6494, decDeg: 31.8883, mag: 1.58, bv: 0.03 },
  { name: 'Shaula', raDeg: 263.4022, decDeg: -37.1038, mag: 1.62, bv: -0.22 },
  { name: 'Gacrux', raDeg: 187.7915, decDeg: -57.1132, mag: 1.64, bv: 1.6 },
  { name: 'Bellatrix', raDeg: 81.2828, decDeg: 6.3497, mag: 1.64, bv: -0.22 },
  { name: 'Elnath', raDeg: 81.573, decDeg: 28.6075, mag: 1.65, bv: -0.13 },
  { name: 'Polaris', raDeg: 37.9546, decDeg: 89.2641, mag: 1.98, bv: 0.6 },
];

/* ------------------------------------------------------------------------------------------------
 * Time
 * --------------------------------------------------------------------------------------------- */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
/** IST is UTC+5:30 all year (no daylight saving). */
const IST_OFFSET_MS = 5.5 * MS_PER_HOUR;

function wrapRad(rad: number): number {
  const r = rad % TAU;
  return r < 0 ? r + TAU : r;
}

/** Julian Date (UT) of an instant. 2000-01-01T12:00:00Z is 2451545.0. */
export function julianDate(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2440587.5;
}

/**
 * Local mean sidereal time in radians [0, 2π) for an east-positive longitude
 * (IAU 1982 GMST polynomial, Meeus eq. 12.4).
 */
export function localSiderealTime(date: Date, lonDeg: number): number {
  const jd = julianDate(date);
  const d = jd - 2451545.0;
  const t = d / 36525;
  const gmstDeg = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - (t * t * t) / 38710000;
  return wrapRad((gmstDeg + lonDeg) * DEG);
}

/**
 * The sky clock of `/personal#sky`: progress 0 is 18:30 IST and 1 is 05:30 IST the next morning,
 * on the IST calendar date of `base` (default: now). Progress is clamped to [0, 1].
 */
export function skyTimeAt(progress: number, base: Date = new Date()): Date {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const ist = new Date(base.getTime() + IST_OFFSET_MS);
  // 18:30 IST = 13:00 UTC on the same IST calendar date.
  const startUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 13, 0, 0, 0);
  return new Date(startUtc + p * 11 * MS_PER_HOUR);
}

/** '21:40 IST' (24-hour clock, minutes truncated). */
export function formatIST(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const mm = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} IST`;
}

/* ------------------------------------------------------------------------------------------------
 * Coordinates
 * --------------------------------------------------------------------------------------------- */

/**
 * Equatorial (RA, Dec) to horizontal (altitude, azimuth), all in radians.
 * Azimuth is measured from north through east, in [0, 2π).
 */
export function equatorialToHorizontal(
  raRad: number,
  decRad: number,
  lstRad: number,
  latRad: number,
): { altRad: number; azRad: number } {
  const h = lstRad - raRad;
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const cosH = Math.cos(h);
  const sinAlt = sinDec * sinLat + cosDec * cosLat * cosH;
  const altRad = Math.asin(Math.min(1, Math.max(-1, sinAlt)));
  const north = sinDec * cosLat - cosDec * sinLat * cosH;
  const east = -cosDec * Math.sin(h);
  return { altRad, azRad: wrapRad(Math.atan2(east, north)) };
}

/**
 * The rotation that takes an equatorial unit vector `(cos δ cos α, cos δ sin α, sin δ)` to a
 * horizontal unit vector in a y-up, right-handed frame (the three.js convention):
 *
 *   x = east, y = zenith, z = south   (so -z points north)
 *
 * Returned as 9 numbers in column-major order, ready for `new THREE.Matrix3().fromArray(m)` or a
 * GLSL `mat3` uniform. For a horizontal vector `v`: `altitude = asin(v.y)`,
 * `azimuth (from north through east) = atan2(v.x, -v.z)`.
 */
export function equatorialToHorizontalMatrix(lstRad: number, latRad: number): readonly number[] {
  const sL = Math.sin(lstRad);
  const cL = Math.cos(lstRad);
  const sP = Math.sin(latRad);
  const cP = Math.cos(latRad);
  // Rows of the matrix (east, up, south) x (ex, ey, ez).
  const r0 = [-sL, cL, 0];
  const r1 = [cP * cL, cP * sL, sP];
  const r2 = [sP * cL, sP * sL, -cP];
  return [r0[0], r1[0], r2[0], r0[1], r1[1], r2[1], r0[2], r1[2], r2[2]];
}

/* ------------------------------------------------------------------------------------------------
 * Star colour
 * --------------------------------------------------------------------------------------------- */

/** Ballesteros (2012): B-V colour index to effective temperature in kelvin. */
function bvToKelvin(bv: number): number {
  const b = Math.min(2.0, Math.max(-0.4, bv));
  return 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));
}

/** Planckian locus approximation (Tanner Helland fit), kelvin to sRGB in 0..1. */
function kelvinToSrgb(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v: number) => Math.min(1, Math.max(0, v / 255));
  return [c(r), c(g), c(b)];
}

/**
 * B-V colour index to an sRGB triple in 0..1, luminance-normalised: every star gets the same
 * relative luminance (Rec. 709 weights on the sRGB values) as far as the gamut allows, so the
 * triple carries hue only and brightness stays with magnitude. Pair with a mix factor (the sky
 * uses at most 12% toward this colour from ink).
 */
export function bvToRgb(bv: number): readonly [number, number, number] {
  const [r, g, b] = kelvinToSrgb(bvToKelvin(Number.isFinite(bv) ? bv : 0.6));
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (y <= 0) return [1, 1, 1];
  let nr = r / y;
  let ng = g / y;
  let nb = b / y;
  const max = Math.max(nr, ng, nb);
  if (max > 1) {
    nr /= max;
    ng /= max;
    nb /= max;
  }
  return [nr, ng, nb];
}

/* ------------------------------------------------------------------------------------------------
 * Readouts
 * --------------------------------------------------------------------------------------------- */

/**
 * The brightest named star at or above `minAltDeg` (default 20°) for the observer of
 * `SKY_OBSERVER` at `date`, with its altitude in degrees; `null` when none qualifies.
 */
export function brightestAbove(date: Date, minAltDeg: number = 20): { star: NamedStar; altDeg: number } | null {
  const lst = localSiderealTime(date, SKY_OBSERVER.lonDeg);
  const lat = SKY_OBSERVER.latDeg * DEG;
  let best: { star: NamedStar; altDeg: number } | null = null;
  for (const star of BRIGHT_STARS) {
    if (best && star.mag >= best.star.mag) continue;
    const { altRad } = equatorialToHorizontal(star.raDeg * DEG, star.decDeg * DEG, lst, lat);
    const altDeg = altRad / DEG;
    if (altDeg >= minAltDeg) best = { star, altDeg };
  }
  return best;
}
