'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, ShaderMaterial, type Mesh } from 'three';

import { PROFILE_BOX, profileMapping, type ProfilePoint } from '@/shared/ui/charts';

import { GLSL_RELIEF } from './glsl';
import type { ReliefUniforms } from './relief-uniforms';
import type { RouteCurve } from './route';
import { PRIMITIVE_UPDATE_PRIORITY } from './route-ribbon';

const VERTEX = /* glsl */ `
${GLSL_RELIEF}
uniform float uUnroll;
uniform vec3 uProfileOrigin;
uniform vec3 uProfileRight;
uniform vec3 uProfileUp;
attribute vec2 aProfile;
attribute float aEdge;
varying float vEdge;
void main() {
  vec3 hang = reliefPosition(position, uDrape * aEdge);
  vec3 flat_ = uProfileOrigin + uProfileRight * (aProfile.x - 0.5) + uProfileUp * (0.5 - aProfile.y);
  vEdge = aEdge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(hang, flat_, uUnroll), 1.0);
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uSignal;
uniform float uCurtainAlpha;
varying float vEdge;
void main() {
  float w = max(fwidth(vEdge), 1e-5);
  float top = smoothstep(1.0 - 2.6 * w, 1.0 - 1.6 * w, vEdge);
  vec3 color = mix(uInk, uSignal, top);
  gl_FragColor = vec4(color, mix(0.08, 1.0, top) * uCurtainAlpha);
}
`;

/** Metres below the terrain's lowest point that the hanging curtain reaches (§G.8). */
const CURTAIN_DEPTH_M = 200;

function buildCurtainGeometry(curve: RouteCurve, points: readonly ProfilePoint[], bottomHn: number): BufferGeometry {
  const box = PROFILE_BOX.full;
  const mapping = profileMapping(points, box);
  const floorV = mapping.y(mapping.minM) / box.height;
  const n = curve.count;
  const position = new Float32Array(n * 2 * 3);
  const profile = new Float32Array(n * 2 * 2);
  const edge = new Float32Array(n * 2);
  const index = new Uint32Array((n - 1) * 6);

  for (let i = 0; i < n; i++) {
    const x = curve.xz[i * 2];
    const z = curve.xz[i * 2 + 1];
    const u = mapping.x(curve.plotIndex[i]) / box.width;
    // Top (route) then bottom (below the terrain); unrolled: the profile line and the plot floor.
    position.set([x, curve.hn[i], z, x, bottomHn, z], i * 6);
    profile.set([u, mapping.y(curve.altM[i]) / box.height, u, floorV], i * 4);
    edge[i * 2] = 1;
    edge[i * 2 + 1] = 0;
    if (i < n - 1) {
      const a = i * 2;
      index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aProfile', new BufferAttribute(profile, 2));
  geometry.setAttribute('aEdge', new BufferAttribute(edge, 1));
  geometry.setIndex(new BufferAttribute(index, 1));
  return geometry;
}

export interface SectionCurtainProps {
  /** The main route (its samples carry the profile's fractional waypoint index and altitude). */
  curve: RouteCurve;
  /** The same waypoints the DOM `ElevationProfile` plots (`profileMapping(points, PROFILE_BOX.full)`). */
  points: readonly ProfilePoint[];
  /** Normalised height of the terrain's lowest point (`frame.normHeight(frame.minM)`, usually 0). */
  floorHn: number;
  /** Metres per normalised unit (`maxM - minM`), to hang the curtain 200 m below the floor. */
  rangeM: number;
  uniforms: ReliefUniforms;
}

/**
 * The section curtain (§G.8): a vertical strip from the route down to 200 m below the terrain's
 * lowest point; `uUnroll` lerps every vertex onto a flat profile plane (`uProfileOrigin/Right/Up`,
 * set by the scene to face pose P4) at the positions of `profileMapping(points, PROFILE_BOX.full)`,
 * the mapping the DOM profile uses. Fill `uInk` at 8%, a 2 px `uSignal` top edge. Hidden while
 * `uCurtainAlpha` is 0; depth-tested while it hangs (the ground hides its lower part), drawn on top
 * once it has mostly unrolled.
 */
export function SectionCurtain({ curve, points, floorHn, rangeM, uniforms }: SectionCurtainProps) {
  const meshRef = useRef<Mesh>(null);
  const geometry = useMemo(
    () => buildCurtainGeometry(curve, points, floorHn - CURTAIN_DEPTH_M / Math.max(rangeM, 1)),
    [curve, points, floorHn, rangeM],
  );
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    [uniforms],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.visible = uniforms.uCurtainAlpha.value > 0.002;
    const flat = uniforms.uUnroll.value > 0.5;
    const curtainMaterial = mesh.material as ShaderMaterial;
    if (curtainMaterial.depthTest === flat) curtainMaterial.depthTest = !flat;
  }, PRIMITIVE_UPDATE_PRIORITY);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={1}
      visible={false}
    />
  );
}
