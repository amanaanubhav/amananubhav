import { THEME_PALETTE, type ThemeName } from './palette';

/*
 * The home story map's colours (design pass 3, §6). One source for the relief scene's uniforms and
 * the DOM legend (its ramp bar uses the same hexes as the shader stops). No three.js here: this
 * module is safe in the initial chunk.
 *
 * Elevation: a 6-stop hypsometric ramp (moss valleys -> olive -> sand -> stone -> slate -> ice),
 * lightness-monotonic at about 1.15x luminance per 500 m band. Temperature: one teal family of
 * isotherms (0 °C bold, -10 °C fine), a neutral +10 °C hairline, a cold wash and frost stipple.
 * The walked route and the head are the theme's signal colours; side trips are a dusty violet.
 */

/** Altitudes (m) of the hypsometric ramp stops. */
export const STORY_HYPSO_STOPS_M = [800, 2000, 3500, 4500, 5500, 7000] as const;
/** Temperatures (°C) of the temperature-emphasis ramp stops. */
export const STORY_TEMP_STOPS_C = [-25, -10, 0, 5, 12, 22] as const;

type Hex = `#${string}`;
type Ramp = readonly [Hex, Hex, Hex, Hex, Hex, Hex];

export interface StoryThemeColors {
  /** Page ground (the sheet fades into it) and ink (contours, peak marks). */
  readonly ground: Hex;
  readonly ink: Hex;
  /** Walked route (core) and the head marker / "here" accent. */
  readonly route: Hex;
  readonly head: Hex;
  /** Side-trip branches and lake discs; the lighter tone is for lake label text. */
  readonly branch: Hex;
  readonly branchText: Hex;
  /** A main stretch not walked (dotted); none at present. */
  readonly jeep: Hex;
  /** Isotherms: +10 °C hairline, 0 °C, -10 °C; the cold wash below 0 °C. */
  readonly isoWarm: Hex;
  readonly isoZero: Hex;
  readonly isoCold: Hex;
  readonly coldTint: Hex;
  /** Aerial perspective: warm valleys -> cold at altitude. */
  readonly fog: Hex;
  readonly fogCold: Hex;
  readonly hypso: Ramp;
  readonly temp: Ramp;
  /** Contour alphas (100 m minor, 500 m index) and hillshade strength. */
  readonly minor: number;
  readonly index: number;
  readonly shade: number;
}

export const STORY_PALETTE: Readonly<Record<ThemeName, StoryThemeColors>> = {
  night: {
    ground: THEME_PALETTE.night.ground,
    ink: THEME_PALETTE.night.ink,
    route: THEME_PALETTE.night['signal-line'],
    head: THEME_PALETTE.night.signal,
    branch: THEME_PALETTE.night.water,
    branchText: '#C2B8DD',
    jeep: '#8E929B',
    isoWarm: '#9A948C',
    isoZero: '#5FC0C2',
    isoCold: '#9AD6D0',
    coldTint: '#1C3236',
    fog: '#14161B',
    fogCold: '#121721',
    hypso: ['#112015', '#202618', '#332E22', '#3C362E', '#37434E', '#4E5661'],
    temp: ['#8C93A3', '#4D5263', '#343846', '#2B2740', '#2F2228', '#4A2528'],
    minor: 0.075,
    index: 0.2,
    shade: 0.6,
  },
  day: {
    ground: THEME_PALETTE.day.ground,
    ink: THEME_PALETTE.day.ink,
    route: THEME_PALETTE.day['signal-line'],
    head: THEME_PALETTE.day.signal,
    branch: '#6B5A9C',
    branchText: '#6B5A9C',
    jeep: '#6A7069',
    isoWarm: '#857E75',
    isoZero: '#0F6A70',
    isoCold: '#4E9DA0',
    coldTint: '#CFE2E1',
    fog: '#E9ECEA',
    fogCold: '#E4E9EF',
    hypso: ['#D8ECDB', '#D7E0C7', '#D6CEB9', '#CBC0B5', '#A6B6C5', '#98A5B6'],
    temp: ['#F4F6F9', '#D8DFEA', '#C3CBD9', '#CCC3DD', '#DCC6CB', '#DDB1A6'],
    minor: 0.12,
    index: 0.3,
    shade: 0.45,
  },
};

/** CSS `linear-gradient` for the legend bar, from the same stops the shader uses. */
export function storyRampGradient(theme: ThemeName, layer: 'alt' | 'temp'): string {
  const colors = layer === 'temp' ? STORY_PALETTE[theme].temp : STORY_PALETTE[theme].hypso;
  const stops: readonly number[] = layer === 'temp' ? STORY_TEMP_STOPS_C : STORY_HYPSO_STOPS_M;
  const lo = stops[0];
  const hi = stops[stops.length - 1];
  const parts = colors.map((c, i) => `${c} ${(((stops[i] - lo) / (hi - lo)) * 100).toFixed(1)}%`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}
