'use client';

import { useEffect, useMemo } from 'react';
import { ShaderMaterial, type BufferGeometry } from 'three';

import { GLSL_CONTOUR, GLSL_DEPTH_FADE, GLSL_DITHER, GLSL_RELIEF, GLSL_SCREEN } from './glsl';
import type { ReliefUniforms } from './relief-uniforms';

/** Where the edge fade starts, as a fraction of the half tile (squircle radius). */
const EDGE_FADE_START = 0.86;

const VERTEX = /* glsl */ `
${GLSL_RELIEF}
${GLSL_SCREEN}
uniform float uRangeM;
attribute float aHeightM;
attribute vec2 aGrad;
varying float vHeightM;
varying float vMetresPerPx;
varying float vDepth;
varying vec3 vWorld;
varying vec2 vPlane;
void main() {
  vec4 world = modelMatrix * vec4(reliefPosition(position, 0.0), 1.0);
  vec4 mv = viewMatrix * world;
  vec4 c0 = projectionMatrix * mv;
  // On-screen contour density: project a short step up the gradient (it rises with the relief).
  float g = length(aGrad);
  vec2 gd = g > 1e-3 ? aGrad / g : vec2(1.0, 0.0);
  float eps = 0.05;
  vec3 up = position + vec3(gd.x * eps, g * eps / uRangeM, gd.y * eps);
  vec4 c1 = projectionMatrix * viewMatrix * modelMatrix * vec4(reliefPosition(up, 0.0), 1.0);
  vec2 s = (c1.xy / c1.w - c0.xy / c0.w) * 0.5 * uResolution;
  vMetresPerPx = g * eps / max(length(s), 1e-4);
  vHeightM = aHeightM;
  vDepth = -mv.z;
  vWorld = world.xyz;
  vPlane = position.xz;
  gl_Position = c0;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uInk;
uniform float uContourMinor;
uniform float uContourIndex;
uniform float uInterval;
uniform float uIntervalHalf;
uniform float uDim;
uniform float uFade;
uniform float uHillshade;
uniform vec2 uHalfSize;
varying float vHeightM;
varying float vMetresPerPx;
varying float vDepth;
varying vec3 vWorld;
varying vec2 vPlane;
${GLSL_CONTOUR}
${GLSL_DEPTH_FADE}
${GLSL_DITHER}
void main() {
  float minor = contourLayer(vHeightM, uInterval, 1.0, vMetresPerPx);
  float half_ = contourLayer(vHeightM + uInterval * 0.5, uInterval, 1.0, vMetresPerPx) * uIntervalHalf;
  float index = contourLayer(vHeightM, uInterval * 5.0, 1.7, vMetresPerPx);
  // The tile dissolves into the ground over its outer ~14% (a superellipse of degree 8: the corners
  // round off, so no slab edge or corner reads at any tilt, while the route's ends stay inked).
  vec2 q = abs(vPlane) / uHalfSize;
  q *= q;
  q *= q;
  float sheet = 1.0 - smoothstep(${EDGE_FADE_START.toFixed(2)}, 1.0, pow(dot(q, q), 0.125));
  float ink = max(index * uContourIndex, max(minor, half_) * uContourMinor) * uDim * sheet;
  vec3 color = mix(uPaper, uInk, clamp(ink, 0.0, 1.0));
#ifdef HILLSHADE
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  n *= sign(n.y + 1e-6);
  float shade = dot(n, normalize(vec3(-1.0, 1.4, -1.0)));
  color = clamp(color + 0.06 * clamp((shade - 0.72) / 0.28, -1.0, 1.0) * uHillshade * sheet, 0.0, 1.0);
#endif
  color = mix(color, uPaper, depthFade(vDepth) * 0.7);
  color = mix(uPaper, color, uFade);
  gl_FragColor = vec4(ditherColor(color, 0.02 * sheet), 1.0);
}
`;

export interface ContourTerrainProps {
  /** The displaced plane from `loadHeightfield` (owned and disposed by the caller). */
  geometry: BufferGeometry;
  uniforms: ReliefUniforms;
  /** Tier 2 only (§C.4): ±6% lightness from a north-west light. */
  hillshade: boolean;
}

/**
 * The contour terrain (D2 §7.1, §C.5): minor contours every `uInterval`, index contours every five,
 * `fwidth` anti-aliasing, ink mixed into paper with the theme's contour alphas, optional hillshade,
 * depth fade toward paper, 2% ordered dither. No lights, no shadows, no `discard`; opaque.
 */
export function ContourTerrain({ geometry, uniforms, hillshade }: ContourTerrainProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        defines: hillshade ? { HILLSHADE: '' } : {},
      }),
    [uniforms, hillshade],
  );
  useEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />;
}
