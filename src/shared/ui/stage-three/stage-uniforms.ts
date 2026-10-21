import { Color } from 'three';

import { CONTOUR_ALPHA, THEME_PALETTE, hexToRgb01, type ThemeName } from '@/shared/config';
import { gsap } from '@/shared/lib/gsap';

/*
 * Theme uniforms shared by every stage material (§C.5). One object, so a material that spreads
 * `stageUniforms` into its `uniforms` follows Night/Day without a remount; ThemeUniforms (in the
 * renderer) tweens these values in place over 700 ms.
 *
 * Colors hold display sRGB in 0..1, exactly the hexes of §B.1 (no color-management conversion).
 * Shaders write them straight to the output (do not add `colorspace_fragment`), which with the
 * canvas's `flat` setting renders the designed hexes.
 */

function displayColor(hex: string): Color {
  const [r, g, b] = hexToRgb01(hex);
  const color = new Color();
  color.r = r;
  color.g = g;
  color.b = b;
  return color;
}

export interface ThemeUniformTargets {
  colors: Readonly<Record<StageColorUniform, readonly [number, number, number]>>;
  day: 0 | 1;
  contourMinor: number;
  contourIndex: number;
}

export type StageColorUniform = 'uPaper' | 'uInk' | 'uSignal' | 'uWater' | 'uSky';

/** Uniform values for one theme: paper = ground, signal = signal-line (graphics only), sky = ground-sky. */
export function themeUniformTargets(theme: ThemeName): ThemeUniformTargets {
  const palette = THEME_PALETTE[theme];
  return {
    colors: {
      uPaper: hexToRgb01(palette.ground),
      uInk: hexToRgb01(palette.ink),
      uSignal: hexToRgb01(palette['signal-line']),
      uWater: hexToRgb01(palette.water),
      uSky: hexToRgb01(palette['ground-sky']),
    },
    day: theme === 'day' ? 1 : 0,
    contourMinor: CONTOUR_ALPHA[theme].minor,
    contourIndex: CONTOUR_ALPHA[theme].index,
  };
}

const night = THEME_PALETTE.night;

export const stageUniforms = {
  /** Page ground ("paper"): clear color, depth fade target. */
  uPaper: { value: displayColor(night.ground) },
  /** Ink: contours, stars, labels' marks. */
  uInk: { value: displayColor(night.ink) },
  /** The route color (`--signal-line`): his route, the head marker, the tent glow. */
  uSignal: { value: displayColor(night['signal-line']) },
  /** Map water. */
  uWater: { value: displayColor(night.water) },
  /** The `/personal#sky` ground (`--ground-sky`). */
  uSky: { value: displayColor(night['ground-sky']) },
  /** 0 in Night, 1 in Day (tweened). */
  uDay: { value: 0 },
  /** Contour ink alpha for minor contours (CONTOUR_ALPHA). */
  uContourMinor: { value: CONTOUR_ALPHA.night.minor },
  /** Contour ink alpha for index contours (CONTOUR_ALPHA). */
  uContourIndex: { value: CONTOUR_ALPHA.night.index },
};

export type StageUniforms = typeof stageUniforms;

const STAGE_COLOR_KEYS: readonly StageColorUniform[] = ['uPaper', 'uInk', 'uSignal', 'uWater', 'uSky'];

/**
 * Puts the theme uniforms on `theme` at once and stops ThemeUniforms' 700 ms tween. A scene still rising
 * out of the ground calls it on a theme switch: its ground-identical frames then keep matching the page
 * ground, which the view transition swaps at once (load-in-3d §3).
 */
export function snapStageTheme(theme: ThemeName): void {
  const targets = themeUniformTargets(theme);
  for (const key of STAGE_COLOR_KEYS) {
    const color = stageUniforms[key].value;
    gsap.killTweensOf(color);
    [color.r, color.g, color.b] = targets.colors[key];
  }
  const scalars = [
    [stageUniforms.uDay, targets.day],
    [stageUniforms.uContourMinor, targets.contourMinor],
    [stageUniforms.uContourIndex, targets.contourIndex],
  ] as const;
  for (const [uniform, value] of scalars) {
    gsap.killTweensOf(uniform);
    uniform.value = value;
  }
}
