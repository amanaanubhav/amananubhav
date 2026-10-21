import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from 'three';

import { GLSL_DITHER, GLSL_RECEDE, GLSL_RECEDE_MASK } from './glsl';
import type { StoryUniforms } from './story-uniforms';

/*
 * The home story's three draw calls (design §6, §7, §9): the terrain (elevation fill, temperature
 * isotherms / frost / cold wash, contours, hillshade, aerial fog, the feathered sheet rim and the
 * recede, all in one pass, no textures), the route ribbon (main line + four side trips in one
 * mesh, revealed by `uDrawMain` / `uDrawTrip`), and the instanced markers (villages, pass, lakes,
 * peaks, ticks and the head). Colours are uniforms fed from STORY_PALETTE / THEME_PALETTE.
 */

/*
 * Terrain. The map ends as a soft island around the trek (`aFocus`: 1 near the route and the peaks,
 * feathering to 0 farther out), never as a sheet edge or a floating slab. The sheet rim (R29) uses a superellipse radius of degree 8 (the corners round off), so no
 * straight edge or corner reads at any angle: colour, lines and fog fade to the ground over the
 * outer band and the relief sinks to its base there, so no ridge silhouette marks the edge. The
 * fill is 70% stepped into 500 m bands on the index contours; temperature is modelled from altitude
 * (lapse rate), never measured; frost dots sit on a world grid (colder = more cells); isotherms are
 * one teal family (0 °C bold, -10 °C fine) plus a neutral +10 °C hairline for close zooms.
 * Ribbon: walked = solid core in a 2 px ground casing, in the theme's `signal` tone (R22: it holds 3:1
 * against the high tints, which `signal-line` does not in Night); jeep = dotted, thin, muted; still to
 * walk = a dashed ghost in a soft ground trench.
 */
const TERRAIN_VS = /* glsl */ `
uniform vec2 uResolution;
uniform float uRangeM;
uniform float uEx;
uniform float uDpr;
uniform vec2 uHalf;
${GLSL_RECEDE_MASK}
attribute float aHeightM;
attribute float aFocus;
attribute vec2 aGrad;
varying float vH;
varying float vMpp;
varying float vDepth;
varying float vMask;
varying float vSheet;
varying vec2 vPlane;
varying vec3 vN;
void main() {
  vec2 q = abs(position.xz) / uHalf;
  q *= q;
  q *= q;
  q *= q;
  float r = pow(q.x + q.y, 0.125);
  float sink = 1.0 - smoothstep(0.8, 1.0, r);
  float sheet = (1.0 - smoothstep(0.7, 0.99, r)) * aFocus;
  vSheet = sheet * sheet * (3.0 - 2.0 * sheet);
  vec3 p = vec3(position.x, position.y * uEx * sink, position.z);
  vN = normalize(vec3(-aGrad.x * uEx / uRangeM, 1.0, -aGrad.y * uEx / uRangeM));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 c0 = projectionMatrix * mv;
  float g = length(aGrad);
  vec2 gd = g > 1e-3 ? aGrad / g : vec2(1.0, 0.0);
  vec3 up = p + vec3(gd.x * 0.05, g * 0.05 / uRangeM * uEx * sink, gd.y * 0.05);
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(up, 1.0);
  vec2 sp = (c1.xy / c1.w - c0.xy / c0.w) * 0.5 * uResolution;
  vMpp = g * 0.05 / max(length(sp), 1e-4);
  vH = aHeightM;
  vDepth = -mv.z;
  vPlane = position.xz;
  vMask = c0.w > 0.0 ? recedeMaskAt((c0.xy / c0.w * 0.5 + 0.5) * uResolution * uDpr) : 0.0;
  gl_Position = c0;
}
`;

const TERRAIN_FS = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uFog;
uniform float uMinor;
uniform float uMinorK;
uniform float uIndex;
uniform float uShade;
uniform vec3 uLight;
uniform vec3 uHypso[6];
uniform float uHypsoAt[6];
uniform vec3 uTempC[6];
uniform float uTempAt[6];
uniform float uFillMix;
uniform vec3 uLapse;
uniform vec3 uIsoWarm;
uniform vec3 uIsoZero;
uniform vec3 uIsoCold;
uniform vec3 uColdTint;
uniform float uIso;
uniform float uHatch;
uniform float uHatchK;
uniform float uWarmK;
uniform float uLive;
uniform float uReveal;
uniform float uRangeM;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uFade;
uniform float uDpr;
varying float vH;
varying float vMpp;
varying float vDepth;
varying float vMask;
varying float vSheet;
varying vec2 vPlane;
varying vec3 vN;
${GLSL_RECEDE}
${GLSL_DITHER}
float cline(float v, float iv, float wpx) {
  float f = v / iv;
  float w = max(fwidth(f), 1e-5);
  float d = abs(fract(f + 0.5) - 0.5);
  return 1.0 - smoothstep(w * (wpx * 0.5 - 0.5), w * (wpx * 0.5 + 0.5), d);
}
float clayer(float v, float iv, float wpx, float mpp) {
  float dn = mpp / iv;
  return mix(cline(v, iv, wpx), clamp(wpx * dn, 0.0, 1.0) * 0.6, smoothstep(0.06, 0.2, dn));
}
vec3 ramp(vec3 c[6], float a[6], float v) {
  vec3 o = c[0];
  for (int i = 1; i < 6; i++) o = mix(o, c[i], smoothstep(a[i - 1], a[i], v));
  return o;
}
float isoLine(float t, float lvl, float wpx) {
  float d = abs(t - lvl) / max(fwidth(t), 1e-4);
  return 1.0 - smoothstep(wpx * 0.5 - 0.5, wpx * 0.5 + 0.5, d);
}
void main() {
  float sheet = vSheet;
  float f = vH / 500.0;
  float w = max(fwidth(f), 1e-4);
  float hb = (floor(f) + 0.5 + smoothstep(1.0 - w, 1.0, fract(f))) * 500.0;
  vec3 fill = ramp(uHypso, uHypsoAt, mix(vH, hb, 0.7));
  float t = uLapse.y + uLapse.z * (vH - uLapse.x) * 0.001;
  if (uFillMix < 0.999) fill = mix(ramp(uTempC, uTempAt, t), fill, uFillMix);
  fill = mix(fill, uColdTint, clamp(-t / 20.0, 0.0, 1.0) * uHatch * 0.3 * uLive);
#ifdef HILLSHADE
  float shd = uShade * uLive;
  fill *= 1.0 - shd * 0.5 + shd * clamp(dot(normalize(vN), uLight), 0.0, 1.0);
#endif
  vec3 color = mix(uPaper, fill, sheet);
  float minor = clayer(vH, 100.0, 1.0, vMpp);
  float index = clayer(vH, 500.0, 1.6, vMpp);
  color = mix(color, uInk, max(index * uIndex, minor * uMinor * uMinorK * uLive) * sheet);
#ifdef FROST
  vec2 gp = vPlane * uHatchK;
  vec2 fp = fract(gp) - 0.5;
  vec2 gw2 = max(fwidth(gp), vec2(1e-5));
  vec3 h3 = fract(vec3(floor(gp).xyx) * vec3(0.1031, 0.1030, 0.0973));
  h3 += dot(h3, h3.yzx + 33.33);
  float dotm = (1.0 - smoothstep(0.7, 1.5, length(fp / gw2))) * step(fract((h3.x + h3.y) * h3.z), clamp(-t / 14.0, 0.0, 1.0) * 0.6);
  dotm *= 1.0 - smoothstep(0.2, 0.33, max(gw2.x, gw2.y));
  color = mix(color, uIsoZero, dotm * uHatch * 0.6 * sheet * uLive);
#endif
  float isoK = uIso * sheet * uLive * (1.0 - 0.75 * smoothstep(20.0, 70.0, vMpp));
  color = mix(color, uIsoWarm, isoLine(t, 10.0, uDpr) * isoK * 0.32 * uWarmK);
  color = mix(color, uIsoCold, isoLine(t, -10.0, uDpr) * isoK * 0.7);
  color = mix(color, uIsoZero, isoLine(t, 0.0, 2.0 * uDpr) * isoK * 0.95);
  color = mix(color, uFog, smoothstep(uFadeNear, uFadeFar, vDepth) * 0.78 * sheet);
  color = mix(uPaper, color, uFade);
  // The entrance: summits lead, valleys last; every height has risen at uReveal = 1. Mixed after the
  // recede, so uReveal = 0 is the ground exactly (no dither, no pool) and the pools only gain contrast.
  float rv = smoothstep(0.0, 1.0, uReveal * 1.7 - (1.0 - clamp(vH / uRangeM, 0.0, 1.0)) * 0.7);
  color += (bayer4(gl_FragCoord.xy) - 0.5) * 0.018 * sheet * rv;
  gl_FragColor = vec4(mix(uPaper, recede(color, uRecedePaper, vMask), rv), 1.0);
}
`;

/**
 * Writes `aFocus` on the terrain: 1 within `inner` world units of any focus point (the route, the
 * peaks), smoothly 0 beyond `outer`. A coarse distance grid (half-unit cells), sampled per vertex.
 */
export function setTerrainFocus(
  geometry: BufferGeometry,
  half: { x: number; y: number },
  points: ArrayLike<number>,
  inner: number,
  outer: number,
): void {
  const cell = 0.5;
  const gx = Math.ceil((half.x * 2) / cell) + 1;
  const gz = Math.ceil((half.y * 2) / cell) + 1;
  const grid = new Float32Array(gx * gz);
  for (let j = 0; j < gz; j++)
    for (let i = 0; i < gx; i++) {
      const x = -half.x + i * cell;
      const z = -half.y + j * cell;
      let best = Infinity;
      for (let k = 0; k < points.length; k += 2) best = Math.min(best, (points[k] - x) ** 2 + (points[k + 1] - z) ** 2);
      grid[j * gx + i] = Math.sqrt(best);
    }
  const pos = geometry.getAttribute('position');
  const focus = new Float32Array(pos.count);
  for (let v = 0; v < pos.count; v++) {
    const fx = Math.min(gx - 1.001, Math.max(0, (pos.getX(v) + half.x) / cell));
    const fz = Math.min(gz - 1.001, Math.max(0, (pos.getZ(v) + half.y) / cell));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const d =
      (grid[j * gx + i] * (1 - tx) + grid[j * gx + i + 1] * tx) * (1 - tz) +
      (grid[(j + 1) * gx + i] * (1 - tx) + grid[(j + 1) * gx + i + 1] * tx) * tz;
    const t = Math.min(1, Math.max(0, (d - inner) / (outer - inner)));
    focus[v] = 1 - t * t * (3 - 2 * t);
  }
  geometry.setAttribute('aFocus', new BufferAttribute(focus, 1));
}

export interface StoryTerrainOptions {
  /** Tier 2 only (R42 levers): hillshade and the frost stipple. */
  hillshade: boolean;
  frost: boolean;
}

/**
 * The terrain mesh over a displaced plane from `loadHeightfield` (the caller disposes the geometry).
 * The geometry needs an `aFocus` attribute (0..1 per vertex, see `setTerrainFocus`).
 */
export function createStoryTerrain(geometry: BufferGeometry, uniforms: StoryUniforms, opts: StoryTerrainOptions): Mesh {
  const defines: Record<string, string> = {};
  if (opts.hillshade) defines.HILLSHADE = '';
  if (opts.frost) defines.FROST = '';
  const mesh = new Mesh(
    geometry,
    new ShaderMaterial({ uniforms, vertexShader: TERRAIN_VS, fragmentShader: TERRAIN_FS, defines }),
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  return mesh;
}

/* ------------------------------------------------------------------------------------------------
 * Route ribbon
 * ---------------------------------------------------------------------------------------------- */

const RIBBON_VS = /* glsl */ `
uniform vec2 uResolution;
uniform float uDrawMain;
uniform vec4 uDrawTrip;
attribute vec3 aTangent;
attribute float aDist;
attribute float aSide;
attribute float aStrip;
attribute float aStyle;
varying float vDist;
varying float vDraw;
varying float vSide;
varying float vTrip;
varying float vJeep;
varying float vHalf;
void main() {
  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 c0 = mvp * vec4(position, 1.0);
  vec4 c1 = mvp * vec4(position + aTangent * 0.05, 1.0);
  vec2 sp = (c1.xy / c1.w - c0.xy / c0.w) * uResolution;
  vec2 dir = length(sp) > 1e-6 ? normalize(sp) : vec2(1.0, 0.0);
  float trip = step(0.5, aStrip);
  float jeep = step(1.5, aStyle);
  float halfW = mix(mix(4.6, 3.4, jeep), 3.9, trip);
  c0.xy += vec2(-dir.y, dir.x) * aSide * halfW * 2.0 / uResolution * c0.w;
  vec4 pick = vec4(equal(vec4(aStrip), vec4(1.0, 2.0, 3.0, 4.0)));
  vDraw = mix(uDrawMain, dot(uDrawTrip, pick), trip);
  vDist = aDist;
  vSide = aSide;
  vTrip = trip;
  vJeep = jeep;
  vHalf = halfW;
  gl_Position = c0;
}
`;

const RIBBON_FS = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uHeadC;
uniform vec3 uBranch;
uniform vec3 uJeep;
uniform float uDashK;
uniform float uFade;
uniform float uGhost;
uniform float uReveal;
varying float vDist;
varying float vDraw;
varying float vSide;
varying float vTrip;
varying float vJeep;
varying float vHalf;
${GLSL_RECEDE_MASK}
${GLSL_RECEDE}
void main() {
  float aa = max(fwidth(vDist), 1e-5);
  float reveal = 1.0 - smoothstep(vDraw - aa, vDraw + aa, vDist);
  float px = abs(vSide) * vHalf;
  float pw = max(fwidth(px), 0.5);
  float coreW = mix(mix(2.2, 1.0, vJeep), 1.5, vTrip);
  float core = 1.0 - smoothstep(coreW - pw, coreW + pw, px);
  float casing = 1.0 - smoothstep(coreW + 2.0 - pw, coreW + 2.0 + pw, px);
  float k = vDist * uDashK;
  float dots = step(fract(k * 1.6), 0.38);
  float dash = step(fract(k), 0.55);
  vec3 line = mix(mix(uHeadC, uJeep, vJeep), uBranch, vTrip);
  float walked = reveal * mix(1.0, dots, vJeep);
  float ghostCore = 1.0 - smoothstep(0.9 - pw, 0.9 + pw, px);
  float ghost = (1.0 - reveal) * ghostCore * mix(dash, dots, vJeep) * uGhost * mix(1.0, 0.75, vTrip);
  float gcase = (1.0 - reveal) * (1.0 - smoothstep(1.9 - pw, 1.9 + pw, px)) * 0.5;
  float ga = 1.0 - (1.0 - gcase) * (1.0 - ghost);
  vec3 gc = (ghost * line + (1.0 - ghost) * gcase * uPaper) / max(ga, 1e-4);
  vec3 c = mix(gc, mix(uPaper, line, max(core, 1.0 - walked)), reveal);
  float a = max(casing * walked, ga);
  c = mix(uPaper, c, uFade);
  a *= smoothstep(0.45, 0.9, uReveal);
  gl_FragColor = vec4(recede(c, uRecedePaper, recedeMaskAt(gl_FragCoord.xy)), a * uFade);
}
`;

/** One strip of the ribbon: draped points (world x, y, z), the length along it and a style per point. */
export interface RibbonStrip {
  readonly n: number;
  readonly x: ArrayLike<number>;
  readonly y: ArrayLike<number>;
  readonly z: ArrayLike<number>;
  /** Length along the strip at each point (world units). */
  readonly L: ArrayLike<number>;
  /** 0 walked, 2 not walked (jeep). */
  readonly style: ArrayLike<number>;
}

/** Strip 0 is the main line; strips 1..4 the side trips (revealed by `uDrawTrip.xyzw`). */
export function createStoryRibbon(strips: readonly RibbonStrip[], uniforms: StoryUniforms, drape = 0.02): Mesh {
  const vc = strips.reduce((a, c) => a + c.n * 2, 0);
  const ic = strips.reduce((a, c) => a + Math.max(0, c.n - 1) * 6, 0);
  const pos = new Float32Array(vc * 3);
  const tan = new Float32Array(vc * 3);
  const dist = new Float32Array(vc);
  const side = new Float32Array(vc);
  const stripId = new Float32Array(vc);
  const style = new Float32Array(vc);
  const index = new Uint32Array(ic);
  let v = 0;
  let k = 0;
  strips.forEach((c, s) => {
    const base = v;
    for (let i = 0; i < c.n; i++) {
      const i0 = Math.max(0, i - 3);
      const i1 = Math.min(c.n - 1, i + 4);
      let tx = c.x[i1] - c.x[i0];
      let tz = c.z[i1] - c.z[i0];
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl;
      tz /= tl;
      for (const sd of [-1, 1]) {
        pos[v * 3] = c.x[i];
        pos[v * 3 + 1] = c.y[i] + drape;
        pos[v * 3 + 2] = c.z[i];
        tan[v * 3] = tx;
        tan[v * 3 + 2] = tz;
        dist[v] = c.L[i];
        side[v] = sd;
        stripId[v] = s;
        style[v] = c.style[i];
        v++;
      }
    }
    for (let i = 0; i < c.n - 1; i++) {
      const a = base + i * 2;
      index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k);
      k += 6;
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(pos, 3));
  geometry.setAttribute('aTangent', new BufferAttribute(tan, 3));
  geometry.setAttribute('aDist', new BufferAttribute(dist, 1));
  geometry.setAttribute('aSide', new BufferAttribute(side, 1));
  geometry.setAttribute('aStrip', new BufferAttribute(stripId, 1));
  geometry.setAttribute('aStyle', new BufferAttribute(style, 1));
  geometry.setIndex(new BufferAttribute(index, 1));
  const mesh = new Mesh(
    geometry,
    new ShaderMaterial({
      uniforms,
      vertexShader: RIBBON_VS,
      fragmentShader: RIBBON_FS,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -40,
      side: DoubleSide,
    }),
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return mesh;
}

/* ------------------------------------------------------------------------------------------------
 * Markers (one instanced draw, the head included)
 * ---------------------------------------------------------------------------------------------- */

/** Marker kinds: 0 pass-through ring, 1 overnight disc, 2 pass, 3 lake, 4 peak, 5 head, 6 tick. */
export type StoryMarkerKind = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MARKER_VS = /* glsl */ `
uniform float uPxScale;
attribute float aKind;
attribute float aAlpha;
varying vec2 vUv;
varying float vKind;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float px = aKind < 0.5 ? 9.0 : aKind < 1.5 ? 11.0 : aKind < 2.5 ? 18.0 : aKind < 3.5 ? 13.0 : aKind < 4.5 ? 12.0 : aKind < 5.5 ? 48.0 : 8.0;
  mv.xy += position.xy * px * (-mv.z) * uPxScale;
  vUv = position.xy * 2.0;
  vKind = aKind;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * mv;
}
`;

const MARKER_FS = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec3 uHeadC;
uniform vec3 uBranch;
uniform float uTime;
uniform float uPulse;
uniform float uFade;
uniform float uReveal;
varying vec2 vUv;
varying float vKind;
varying float vAlpha;
${GLSL_RECEDE_MASK}
${GLSL_RECEDE}
float disc(float r, float e) {
  float w = max(fwidth(r), 1e-4);
  return 1.0 - smoothstep(e - w, e + w, r);
}
float sdTri(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  if (vAlpha <= 0.0) discard;
  float r = length(vUv);
  vec3 c;
  float a;
  if (vKind < 0.5) {
    c = mix(uPaper, mix(uSignal, uPaper, disc(r, 0.42)), disc(r, 0.8));
    a = disc(r, 1.0);
  } else if (vKind < 1.5) {
    c = mix(uPaper, uSignal, disc(r, 0.62));
    a = disc(r, 0.95);
  } else if (vKind < 2.5) {
    c = mix(mix(uPaper, uSignal, disc(r, 0.82) - disc(r, 0.64)), uSignal, disc(r, 0.36));
    a = disc(r, 0.96);
  } else if (vKind < 3.5) {
    c = mix(uPaper, uBranch, disc(r, 0.7));
    a = disc(r, 0.95);
  } else if (vKind < 4.5) {
    float d = sdTri(vUv - vec2(0.0, -0.1), 0.6);
    float w = max(fwidth(d), 1e-4);
    c = mix(uPaper, uInk, 1.0 - smoothstep(0.09 - w, 0.09 + w, abs(d)));
    a = (1.0 - smoothstep(0.12 - w, 0.12 + w, d)) * 0.85;
  } else if (vKind < 5.5) {
    float ring = disc(r, 0.27);
    c = mix(uPaper, uHeadC, disc(r, 0.19));
    a = ring;
    float p = fract(uTime / 2.4);
    float band = disc(abs(r - (0.27 + 0.68 * p)), 0.035);
    c = mix(c, uHeadC, band * (1.0 - ring));
    a = max(a, band * (1.0 - p) * 0.7 * uPulse);
  } else {
    c = mix(uPaper, uInk, disc(r, 0.5));
    a = disc(r, 0.9);
  }
  c = mix(uPaper, c, uFade);
  a *= smoothstep(0.45, 0.9, uReveal);
  gl_FragColor = vec4(recede(c, uRecedePaper, recedeMaskAt(gl_FragCoord.xy)), a * vAlpha * uFade);
}
`;

export interface StoryMarkers {
  readonly mesh: InstancedMesh;
  /** Per-instance alpha (0 hides it); call `commit()` after writing. */
  readonly alpha: Float32Array;
  setPosition(i: number, x: number, y: number, z: number): void;
  commit(): void;
}

export function createStoryMarkers(
  points: readonly { x: number; y: number; z: number; kind: StoryMarkerKind }[],
  uniforms: StoryUniforms,
): StoryMarkers {
  const geometry = new PlaneGeometry(1, 1);
  const kinds = new Float32Array(points.map((p) => p.kind));
  const alpha = new Float32Array(points.length);
  const alphaAttr = new InstancedBufferAttribute(alpha, 1);
  alphaAttr.setUsage(DynamicDrawUsage);
  geometry.setAttribute('aKind', new InstancedBufferAttribute(kinds, 1));
  geometry.setAttribute('aAlpha', alphaAttr);
  const mesh = new InstancedMesh(
    geometry,
    new ShaderMaterial({
      uniforms,
      vertexShader: MARKER_VS,
      fragmentShader: MARKER_FS,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
    points.length,
  );
  const m = new Matrix4();
  const setPosition = (i: number, x: number, y: number, z: number) => {
    mesh.setMatrixAt(i, m.makeTranslation(x, y + 0.012, z));
    mesh.instanceMatrix.needsUpdate = true;
  };
  points.forEach((p, i) => setPosition(i, p.x, p.y, p.z));
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return {
    mesh,
    alpha,
    setPosition,
    commit: () => {
      alphaAttr.needsUpdate = true;
    },
  };
}
