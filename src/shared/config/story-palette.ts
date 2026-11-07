import { STORY_THEME, type StoryThemeTokens, type ThemeName } from './palette';

/*
 * The home story map's colours (PALETTE-SPEC §4.11, §5.7, R28). One source for the relief scene's
 * uniforms, the SSR plan sheet and the DOM legend (its ramp bar uses the same hexes as the shader
 * stops). Every value is generated from scripts/palette/palette.json (`npm run palette:emit`), so this
 * module holds no colour of its own. No three.js here: it is safe in the initial chunk.
 *
 * Elevation: a 6-stop hypsometric ramp (moss valleys -> olive -> sand -> stone -> slate -> ice),
 * lightness-monotonic. Temperature: a diverging glacier -> dusk violet -> oxblood ramp about +5 °C,
 * aqua isotherms (0 °C bold, -10 °C fine), a neutral +10 °C hairline and a cold wash.
 * His walked route and the head are the signal family; side trips are violet (`branch`); lake discs
 * are `lake` and lake labels `lakeText`. The map draws no casing, halo or outline: the generated
 * `routeCasing` / `labelHalo` tokens are not used here (7a5ed17's fine line work and labels).
 */

/** Altitudes (m) of the hypsometric ramp stops. */
export const STORY_HYPSO_STOPS_M = [800, 2000, 3500, 4500, 5500, 7000] as const;
/** Temperatures (°C) of the temperature-emphasis ramp stops. */
export const STORY_TEMP_STOPS_C = [-25, -10, 0, 5, 12, 22] as const;
/**
 * The modelled temperature (never measured): about +22 °C at Besisahar (760 m), -6.5 °C per 1,000 m. The scene's
 * `uLapse` and the legend's isotherm marks (the altitude of each isotherm on the altitude ramp) read the same model.
 */
export const STORY_LAPSE = { baseM: 760, baseC: 22, perKm: -6.5 } as const;

/** The map's colours for one theme (the generated `map` group of the palette). */
export type StoryThemeColors = StoryThemeTokens;

export const STORY_PALETTE: Readonly<Record<ThemeName, StoryThemeColors>> = STORY_THEME;

/** CSS `linear-gradient` for the legend bar, from the same stops the shader uses. */
export function storyRampGradient(theme: ThemeName, layer: 'alt' | 'temp'): string {
  const colors = layer === 'temp' ? STORY_PALETTE[theme].temp : STORY_PALETTE[theme].hypso;
  const stops: readonly number[] = layer === 'temp' ? STORY_TEMP_STOPS_C : STORY_HYPSO_STOPS_M;
  const lo = stops[0];
  const hi = stops[stops.length - 1];
  const parts = colors.map((c, i) => `${c} ${(((stops[i] - lo) / (hi - lo)) * 100).toFixed(1)}%`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}
