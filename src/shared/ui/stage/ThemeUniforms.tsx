'use client';

import { useEffect, useRef } from 'react';

import { MOTION } from '@/shared/config';
import { gsap } from '@/shared/lib/gsap';
import { stageUniforms, themeUniformTargets, type StageColorUniform } from '@/shared/ui/stage-three';

const COLOR_KEYS: readonly StageColorUniform[] = ['uPaper', 'uInk', 'uSignal', 'uWater', 'uSky'];

/**
 * Tweens the shared stage uniforms to the current theme over 700 ms (§C.5 "Theme"), in parallel
 * with the DOM sweep. Scenes never remount on a theme change. Lives in the renderer chunk.
 */
export function ThemeUniforms({ isDark }: { isDark: boolean }) {
  const first = useRef(true);

  useEffect(() => {
    const targets = themeUniformTargets(isDark ? 'night' : 'day');
    const tweens: gsap.core.Tween[] = [];
    const instant = first.current;
    first.current = false;
    const vars = { duration: MOTION.dur.theme, ease: MOTION.ease.glide, overwrite: true } as const;

    for (const key of COLOR_KEYS) {
      const color = stageUniforms[key].value;
      const [r, g, b] = targets.colors[key];
      if (instant) {
        color.r = r;
        color.g = g;
        color.b = b;
      } else {
        tweens.push(gsap.to(color, { r, g, b, ...vars }));
      }
    }

    const scalars = [
      [stageUniforms.uDay, targets.day],
      [stageUniforms.uContourMinor, targets.contourMinor],
      [stageUniforms.uContourIndex, targets.contourIndex],
    ] as const;
    for (const [uniform, value] of scalars) {
      if (instant) uniform.value = value;
      else tweens.push(gsap.to(uniform, { value, ...vars }));
    }

    return () => {
      // Leave values where they are; the next run (or nothing, on unmount) takes over.
      tweens.forEach((tween) => tween.kill());
    };
  }, [isDark]);

  return null;
}
