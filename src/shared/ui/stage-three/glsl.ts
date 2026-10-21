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

/**
 * The local recede under text (design §9). `uRects` hold up to 10 rectangles in device px with a
 * bottom-left origin (x0, y0, x1, y1), padded by the page; the mask is the max of rounded-rect SDFs
 * with a smoothstep feather (`uFeather`, device px), so a pool slides in with its text and leaves
 * with it. The terrain evaluates it per vertex, the ribbon and markers per fragment.
 */
export const GLSL_RECEDE_MASK = /* glsl */ `
uniform vec4 uRects[10];
uniform float uRectN;
uniform float uFeather;
uniform float uRadius;
float sdRoundRect(vec2 p, vec4 r, float rad) {
  vec2 h = max((r.zw - r.xy) * 0.5 - rad, vec2(0.0));
  vec2 q = abs(p - (r.xy + r.zw) * 0.5) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
}
float recedeMaskAt(vec2 px) {
  float m = 0.0;
  for (int i = 0; i < 10; i++) {
    if (float(i) >= uRectN) break;
    m = max(m, 1.0 - smoothstep(0.0, uFeather, sdRoundRect(px, uRects[i], uRadius)));
  }
  return m * m * (3.0 - 2.0 * m);
}
`;

/**
 * Soft-knee recede (design §9), mixed in by the mask `m`, hue kept with 20% desaturation. Night:
 * luminance below `uKnee` passes, above it compresses toward `uLumCap` (text keeps 4.5:1). Day: the
 * mirror, darker than `uKneeDay` lifts toward `uLumFloor`. `uDay` blends the two (theme tween).
 * Apply after the dither so the bound holds per pixel.
 */
export const GLSL_RECEDE = /* glsl */ `
uniform float uLumCap;
uniform float uLumFloor;
uniform float uKnee;
uniform float uKneeDay;
uniform float uDay;
float lumLin(vec3 l) { return dot(l, vec3(0.2126, 0.7152, 0.0722)); }
vec3 recede(vec3 c, vec3 paper, float m) {
  if (m <= 0.0) return c;
  vec3 lin = pow(max(c, 0.0), vec3(2.2));
  vec3 pl = pow(paper, vec3(2.2));
  float L = max(lumLin(lin), 1e-5);
  vec3 r = mix(lin, vec3(L), 0.2);
  float Ln = L < uKnee ? L : uKnee + (uLumCap - uKnee) * (1.0 - exp(-(L - uKnee) / (uLumCap - uKnee)));
  float Ld = L > uKneeDay ? L : uKneeDay - (uKneeDay - uLumFloor) * (1.0 - exp(-(uKneeDay - L) / (uKneeDay - uLumFloor)));
  vec3 down = r * (Ln / L);
  vec3 up = mix(r, pl, clamp((Ld - L) / max(lumLin(pl) - L, 1e-5), 0.0, 1.0));
  return pow(mix(lin, mix(down, up, uDay), m), vec3(1.0 / 2.2));
}
`;
