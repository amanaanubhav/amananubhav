/*
 * GLSL chunks shared by the stage materials (§C.5). Written GLSL 1 style (`attribute`, `varying`,
 * `gl_FragColor`); three's ShaderMaterial prefixes them for WebGL2. Colors come straight from the
 * shared stage uniforms and are written without `colorspace_fragment`, so with the canvas's `flat`
 * setting the designed hexes render as they are.
 */

/** Relief transform: `position.y` holds the normalised height (0..1); the shader scales it. */
export const GLSL_RELIEF = /* glsl */ `
uniform float uExaggeration;
uniform float uRelief;
uniform float uDrape;
vec3 reliefPosition(vec3 p, float drape) {
  return vec3(p.x, p.y * uExaggeration * uRelief + drape, p.z);
}
`;

/**
 * Contours. `contourLine` draws an anti-aliased line (`fwidth`, about `widthPx` wide) at every
 * multiple of `interval`. `contourLayer` blends it into its average ink coverage as the lines crowd
 * closer than about 3 to 8 px (`linesPerPx` = metres per px / interval, smooth across the surface),
 * so steep ground reads as a tone, as a printed sheet does, and never sparkles.
 */
export const GLSL_CONTOUR = /* glsl */ `
float contourLine(float value, float interval, float widthPx) {
  float f = value / interval;
  float w = max(fwidth(f), 1e-5);
  float d = abs(fract(f + 0.5) - 0.5);
  float halfW = widthPx * 0.5;
  return 1.0 - smoothstep(w * (halfW - 0.5), w * (halfW + 0.5), d);
}
float contourLayer(float value, float interval, float widthPx, float metresPerPx) {
  float density = metresPerPx / interval;
  float tone = clamp(widthPx * density, 0.0, 1.0);
  return mix(contourLine(value, interval, widthPx), tone, smoothstep(0.12, 0.32, density));
}
`;

/** 4 x 4 ordered dither in 0..1 from the fragment coordinate. */
export const GLSL_DITHER = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
vec3 ditherColor(vec3 c, float amount) {
  return c + (bayer4(gl_FragCoord.xy) - 0.5) * amount;
}
`;

/** Depth fade toward paper between `uFadeNear` and `uFadeFar` (view-space distance). */
export const GLSL_DEPTH_FADE = /* glsl */ `
uniform float uFadeNear;
uniform float uFadeFar;
float depthFade(float viewDepth) {
  return smoothstep(uFadeNear, uFadeFar, viewDepth);
}
`;

/**
 * Screen-space helpers: `uResolution` is the slot size in CSS px, `uPxPerUnit` the CSS px per world
 * unit at view depth 1 (`slotHeight / (2 tan(fov / 2))`).
 */
export const GLSL_SCREEN = /* glsl */ `
uniform vec2 uResolution;
uniform float uPxPerUnit;
float worldPerPx(float viewDepth) {
  return viewDepth / max(uPxPerUnit, 1e-3);
}
`;

/** Soft disc mask (0..1) for a radius in 0..1 coordinates, anti-aliased with `fwidth`. */
export const GLSL_DISC = /* glsl */ `
float discMask(float r, float edge) {
  float w = max(fwidth(r), 1e-4);
  return 1.0 - smoothstep(edge - w, edge + w, r);
}
`;
