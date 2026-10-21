import { Color, Vector2, Vector3, Vector4 } from 'three';

import { hexToRgb01 } from '@/shared/config';
import { STORY_HYPSO_STOPS_M, STORY_PALETTE, STORY_TEMP_STOPS_C, type StoryThemeColors } from '@/shared/ui/stage';

import { stageUniforms } from './stage-uniforms';

/*
 * One uniforms object shared by the three story materials (terrain, ribbon, markers): the theme
 * colours of `stageUniforms` (same objects, so ThemeUniforms' 700 ms tween reaches them; the route
 * is `uSignal`) plus the story's own colours, which `applyStoryTheme` blends by `uDay` each frame,
 * and the values the scene writes per frame (design §15.5).
 */

const color = (hex: string) => {
  const [r, g, b] = hexToRgb01(hex);
  const c = new Color();
  c.r = r;
  c.g = g;
  c.b = b;
  return c;
};

type ColorKey = 'head' | 'branch' | 'jeep' | 'isoWarm' | 'isoZero' | 'isoCold' | 'coldTint' | 'fog' | 'fogCold';
const COLOR_KEYS: readonly ColorKey[] = [
  'head',
  'branch',
  'jeep',
  'isoWarm',
  'isoZero',
  'isoCold',
  'coldTint',
  'fog',
  'fogCold',
];

interface ThemeColors {
  named: Record<ColorKey, Color>;
  hypso: Color[];
  temp: Color[];
  src: StoryThemeColors;
}
const themeColors = (src: StoryThemeColors): ThemeColors => ({
  named: Object.fromEntries(COLOR_KEYS.map((k) => [k, color(src[k])])) as Record<ColorKey, Color>,
  hypso: src.hypso.map(color),
  temp: src.temp.map(color),
  src,
});
const NIGHT = themeColors(STORY_PALETTE.night);
const DAY = themeColors(STORY_PALETTE.day);

export function createStoryUniforms() {
  const c = (k: ColorKey) => ({ value: NIGHT.named[k].clone() });
  return {
    ...stageUniforms,
    uHeadC: c('head'),
    uBranch: c('branch'),
    uJeep: c('jeep'),
    uIsoWarm: c('isoWarm'),
    uIsoZero: c('isoZero'),
    uIsoCold: c('isoCold'),
    uColdTint: c('coldTint'),
    uFog: c('fog'),
    uHypso: { value: NIGHT.hypso.map((h) => h.clone()) },
    uHypsoAt: { value: [...STORY_HYPSO_STOPS_M] },
    uTempC: { value: NIGHT.temp.map((h) => h.clone()) },
    uTempAt: { value: [...STORY_TEMP_STOPS_C] },
    /** 1 = elevation fill, 0 = temperature fill (the legend toggle, damped). */
    uFillMix: { value: 1 },
    /** Temperature model: (reference altitude m, reference °C, °C per km). */
    uLapse: { value: new Vector3(760, 22, -6.5) },
    uMinor: { value: NIGHT.src.minor },
    /** Minor contours fade out beyond dist 16. */
    uMinorK: { value: 1 },
    uIndex: { value: NIGHT.src.index },
    uShade: { value: NIGHT.src.shade },
    uLight: { value: new Vector3(0, 1, 0) },
    /** Half extents of the terrain plane (x, z), for the feathered sheet rim. */
    uHalf: { value: new Vector2(10, 10) },
    uRangeM: { value: 7000 },
    /** World units of the full height range (vertical exaggeration). */
    uEx: { value: 2.6 },
    /** Canvas size in CSS px, and its pixel ratio. */
    uResolution: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    /** World size of one CSS px at view depth 1 (marker sprites). */
    uPxScale: { value: 0.001 },
    /** Temperature strength: isotherms and frost (follow the head's altitude). */
    uIso: { value: 0.38 },
    uHatch: { value: 0.12 },
    /** Frost cells per world unit (about 6 px at the target). */
    uHatchK: { value: 10 },
    /** The +10 °C hairline's zoom gate (close shots only). */
    uWarmK: { value: 1 },
    /** 0 = flat bands + index contours only, 1 = the lit relief. Pinned to 1 since the map loads in 3D. */
    uLive: { value: 1 },
    /**
     * The entrance (load-in-3d §3): 0 = the ground exactly (terrain, ribbon and markers at the paper),
     * 1 = the map. The relief rises summits first; the route and markers fade in from 0.45 to 0.9.
     */
    uReveal: { value: 1 },
    uFadeNear: { value: 20 },
    uFadeFar: { value: 60 },
    /** 1 -> 0: the map dissolves into the ground in place (the ending). */
    uFade: { value: 1 },
    /** Route reveal: main length drawn, and each side trip's (Blue, Green, Ice, Tilicho). */
    uDrawMain: { value: 0 },
    uDrawTrip: { value: new Vector4() },
    /** Ghost dashes per world unit, and the ghost's alpha (.7 in the establishing shot -> .4). */
    uDashK: { value: 10 },
    uGhost: { value: 0.4 },
    uTime: { value: 0 },
    uPulse: { value: 1 },
    uRects: { value: Array.from({ length: 10 }, () => new Vector4()) },
    uRectN: { value: 0 },
    uFeather: { value: 112 },
    uRadius: { value: 26 },
    uLumCap: { value: 0.04 },
    uLumFloor: { value: 0.64 },
    uKnee: { value: 0.022 },
    uKneeDay: { value: 0.7 },
    /** The recede's theme and paper: the target theme at once, never mid-tween (`setRecedeTheme`). */
    uRecedeDay: { value: 0 },
    uRecedePaper: { value: paperColor('night') },
  };
}

function paperColor(theme: 'night' | 'day'): Color {
  const [r, g, b] = hexToRgb01(STORY_PALETTE[theme].ground);
  const color = new Color();
  color.r = r;
  color.g = g;
  color.b = b;
  return color;
}

const RECEDE_PAPER = { night: paperColor('night'), day: paperColor('day') } as const;

/**
 * Points the recede (the pools under text) at the target theme immediately, while the map's colours
 * tween: the text switches ink at once, so its pool must too (R31 during the theme tween).
 */
export function setRecedeTheme(u: StoryUniforms, isDark: boolean): void {
  u.uRecedeDay.value = isDark ? 0 : 1;
  u.uRecedePaper.value.copy(isDark ? RECEDE_PAPER.night : RECEDE_PAPER.day);
}

export type StoryUniforms = ReturnType<typeof createStoryUniforms>;

/**
 * Blends the story colours between Night and Day by `day` (the tweened `uDay`), and the fog toward
 * its cold tone by `cold` (0..1, with the head's altitude). Cheap: about 25 colour lerps.
 */
export function applyStoryTheme(u: StoryUniforms, day: number, cold: number): void {
  u.uHeadC.value.lerpColors(NIGHT.named.head, DAY.named.head, day);
  u.uBranch.value.lerpColors(NIGHT.named.branch, DAY.named.branch, day);
  u.uJeep.value.lerpColors(NIGHT.named.jeep, DAY.named.jeep, day);
  u.uIsoWarm.value.lerpColors(NIGHT.named.isoWarm, DAY.named.isoWarm, day);
  u.uIsoZero.value.lerpColors(NIGHT.named.isoZero, DAY.named.isoZero, day);
  u.uIsoCold.value.lerpColors(NIGHT.named.isoCold, DAY.named.isoCold, day);
  u.uColdTint.value.lerpColors(NIGHT.named.coldTint, DAY.named.coldTint, day);
  for (let i = 0; i < 6; i++) {
    u.uHypso.value[i].lerpColors(NIGHT.hypso[i], DAY.hypso[i], day);
    u.uTempC.value[i].lerpColors(NIGHT.temp[i], DAY.temp[i], day);
  }
  const fogN = u.uFog.value.lerpColors(NIGHT.named.fog, NIGHT.named.fogCold, cold);
  const fogD = SCRATCH.lerpColors(DAY.named.fog, DAY.named.fogCold, cold);
  fogN.lerp(fogD, day);
  u.uMinor.value = NIGHT.src.minor + (DAY.src.minor - NIGHT.src.minor) * day;
  u.uShade.value = NIGHT.src.shade + (DAY.src.shade - NIGHT.src.shade) * day;
}

/** The index-contour alpha for the current theme blend (the scene scales it with the zoom). */
export function storyIndexAlpha(day: number): number {
  return NIGHT.src.index + (DAY.src.index - NIGHT.src.index) * day;
}

const SCRATCH = new Color();
