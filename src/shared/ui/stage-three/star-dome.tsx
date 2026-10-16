'use client';

import { useEffect, useMemo } from 'react';
import { BufferAttribute, BufferGeometry, Matrix3, ShaderMaterial } from 'three';

import { bvToRgb } from '@/shared/lib/astro';

import { GLSL_DISC } from './glsl';
import type { StarCatalogue } from './sky-data';
import { stageUniforms } from './stage-uniforms';

/*
 * The sky (§G.8): stars on a celestial sphere rotated into the observer's horizon frame by a mat3
 * (`equatorialToHorizontalMatrix`, columns map RA/Dec unit vectors to east, up, south = three's
 * x, y, z), an alt-az graticule with the horizon, and constellation lines. Three draw calls.
 */

const SKY_RADIUS = 50;
/** Star core radius in sprite coordinates (0..1) before the halo widens the sprite. */
const STAR_CORE_EDGE = 0.9;

export function createSkyUniforms() {
  return {
    ...stageUniforms,
    /** Equatorial (J2000 unit vector) to horizontal (east, up, south). */
    uEqToHor: { value: new Matrix3() },
    /** Device pixels per CSS px (the canvas DPR), for point sizes. */
    uPixelRatio: { value: 1 },
    uTime: { value: 0 },
    /** 1 at tier 2 (±6% brightness, slow, per-star phase), 0 otherwise. */
    uTwinkle: { value: 0 },
    /** Constellation line alpha: 0.12, raised to 0.35 when shown. */
    uConstellationAlpha: { value: 0.12 },
  };
}

export type SkyUniforms = ReturnType<typeof createSkyUniforms>;

const HORIZON_GLSL = /* glsl */ `
float aboveHorizon(float y) { return smoothstep(-0.01, 0.025, y); }
`;

const STAR_VERTEX = /* glsl */ `
uniform mat3 uEqToHor;
uniform float uPixelRatio;
uniform float uTime;
uniform float uTwinkle;
attribute float aMag;
attribute vec3 aTint;
attribute float aPhase;
varying float vAlpha;
varying vec3 vTint;
varying float vHalo;
varying float vCore;
${HORIZON_GLSL}
void main() {
  vec3 dir = uEqToHor * position;
  float m = clamp((aMag + 1.5) / 7.0, 0.0, 1.0);
  float twinkle = 1.0 + 0.06 * uTwinkle * sin(uTime * (0.6 + aPhase * 0.5) + aPhase * 6.2832);
  float extinction = mix(0.6, 1.0, smoothstep(0.0, 0.35, dir.y));
  // Faint stars stay legible at DPR 1: at least ~1.8 px and 60% alpha.
  vAlpha = mix(1.0, 0.6, m) * twinkle * extinction * aboveHorizon(dir.y);
  vTint = aTint;
  // Stars brighter than mag 1.5 carry a soft halo; the sprite grows to hold it, the core does not.
  vHalo = clamp((1.5 - aMag) / 2.5, 0.0, 1.0);
  float spread = 1.0 + 1.6 * vHalo;
  vCore = ${STAR_CORE_EDGE.toFixed(2)} / spread;
  gl_PointSize = clamp(mix(6.0, 1.8, m), 1.8, 6.0) * spread * uPixelRatio;
  gl_Position = projectionMatrix * viewMatrix * vec4(dir * ${SKY_RADIUS.toFixed(1)}, 1.0);
}
`;

const STAR_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform float uDay;
varying float vAlpha;
varying vec3 vTint;
varying float vHalo;
varying float vCore;
${GLSL_DISC}
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float core = discMask(r, vCore);
  float g = clamp(1.0 - r, 0.0, 1.0);
  float halo = vHalo * 0.42 * g * g;
  vec3 color = mix(uInk, vTint, 0.12 * (1.0 - 0.6 * uDay));
  gl_FragColor = vec4(color, max(core, halo) * clamp(vAlpha, 0.0, 1.0));
}
`;

const GRID_VERTEX = /* glsl */ `
attribute float aStrong;
varying float vStrong;
void main() {
  vStrong = aStrong;
  gl_Position = projectionMatrix * viewMatrix * vec4(position * ${SKY_RADIUS.toFixed(1)}, 1.0);
}
`;

const GRID_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform float uContourMinor;
uniform float uContourIndex;
varying float vStrong;
void main() {
  gl_FragColor = vec4(uInk, mix(uContourMinor, uContourIndex, vStrong));
}
`;

const LINE_VERTEX = /* glsl */ `
uniform mat3 uEqToHor;
varying float vHorizon;
${HORIZON_GLSL}
void main() {
  vec3 dir = uEqToHor * position;
  vHorizon = aboveHorizon(dir.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(dir * ${SKY_RADIUS.toFixed(1)}, 1.0);
}
`;

const LINE_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform float uConstellationAlpha;
varying float vHorizon;
void main() {
  gl_FragColor = vec4(uInk, uConstellationAlpha * vHorizon);
}
`;

function unit(ra: number, dec: number, out: Float32Array, at: number): void {
  const c = Math.cos(dec);
  out[at] = c * Math.cos(ra);
  out[at + 1] = c * Math.sin(ra);
  out[at + 2] = Math.sin(dec);
}

function buildStars(catalogue: StarCatalogue): BufferGeometry {
  const n = catalogue.starCount;
  const position = new Float32Array(n * 3);
  const mag = new Float32Array(n);
  const tint = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = catalogue.stars;
    unit(s[i * 4], s[i * 4 + 1], position, i * 3);
    mag[i] = s[i * 4 + 2];
    tint.set(bvToRgb(s[i * 4 + 3]), i * 3);
    phase[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aMag', new BufferAttribute(mag, 1));
  geometry.setAttribute('aTint', new BufferAttribute(tint, 3));
  geometry.setAttribute('aPhase', new BufferAttribute(phase.map(Math.abs), 1));
  return geometry;
}

/** Alt-az graticule (every 15° of altitude, 30° of azimuth) plus the horizon (strong). */
function buildGraticule(): BufferGeometry {
  const points: number[] = [];
  const strong: number[] = [];
  const rad = Math.PI / 180;
  const at = (altDeg: number, azDeg: number) => {
    const alt = altDeg * rad;
    const az = azDeg * rad; // from north through east
    // (east, up, south)
    return [Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az)];
  };
  const segment = (a: number[], b: number[], s: number) => {
    points.push(...a, ...b);
    strong.push(s, s);
  };
  for (let alt = 0; alt < 90; alt += 15) {
    for (let az = 0; az < 360; az += 3) segment(at(alt, az), at(alt, az + 3), alt === 0 ? 1 : 0);
  }
  for (let az = 0; az < 360; az += 30) {
    for (let alt = 0; alt < 90; alt += 3) segment(at(alt, az), at(alt + 3, az), 0);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(Float32Array.from(points), 3));
  geometry.setAttribute('aStrong', new BufferAttribute(Float32Array.from(strong), 1));
  return geometry;
}

function buildLines(segments: Float32Array): BufferGeometry {
  const n = segments.length / 4;
  const position = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    unit(segments[i * 4], segments[i * 4 + 1], position, i * 6);
    unit(segments[i * 4 + 2], segments[i * 4 + 3], position, i * 6 + 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  return geometry;
}

export interface StarDomeProps {
  catalogue: StarCatalogue;
  uniforms: SkyUniforms;
}

/**
 * Stars as one `Points` (core size from magnitude, 1.8 to 6 px at the DPR cap, alpha 0.6 to 1, a soft
 * halo around stars brighter than mag 1.5; `uInk` tinted by B-V at
 * most 12%; faded below the horizon), the graticule and horizon as one `LineSegments` in contour
 * ink, and the constellation lines as one `LineSegments` (`uConstellationAlpha`). In Day the same
 * materials print ink on paper.
 */
export function StarDome({ catalogue, uniforms }: StarDomeProps) {
  const objects = useMemo(() => {
    const blend = { uniforms, transparent: true, depthTest: false, depthWrite: false } as const;
    return {
      stars: buildStars(catalogue),
      grid: buildGraticule(),
      lines: catalogue.segments ? buildLines(catalogue.segments) : null,
      starMaterial: new ShaderMaterial({ ...blend, vertexShader: STAR_VERTEX, fragmentShader: STAR_FRAGMENT }),
      gridMaterial: new ShaderMaterial({ ...blend, vertexShader: GRID_VERTEX, fragmentShader: GRID_FRAGMENT }),
      lineMaterial: new ShaderMaterial({ ...blend, vertexShader: LINE_VERTEX, fragmentShader: LINE_FRAGMENT }),
    };
  }, [catalogue, uniforms]);

  useEffect(
    () => () => {
      objects.stars.dispose();
      objects.grid.dispose();
      objects.lines?.dispose();
      objects.starMaterial.dispose();
      objects.gridMaterial.dispose();
      objects.lineMaterial.dispose();
    },
    [objects],
  );

  return (
    <>
      <lineSegments geometry={objects.grid} material={objects.gridMaterial} frustumCulled={false} renderOrder={0} />
      {objects.lines && (
        <lineSegments geometry={objects.lines} material={objects.lineMaterial} frustumCulled={false} renderOrder={1} />
      )}
      <points geometry={objects.stars} material={objects.starMaterial} frustumCulled={false} renderOrder={2} />
    </>
  );
}
