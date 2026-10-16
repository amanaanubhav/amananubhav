'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { PlaneGeometry, ShaderMaterial, SphereGeometry, type Group } from 'three';

import { GLSL_RELIEF, GLSL_SCREEN } from './glsl';
import type { ReliefUniforms } from './relief-uniforms';
import { PRIMITIVE_UPDATE_PRIORITY } from './route-ribbon';

const DOME_VERTEX = /* glsl */ `
${GLSL_RELIEF}
${GLSL_SCREEN}
uniform vec3 uTentAt;
varying float vShade;
void main() {
  vec3 c = reliefPosition(uTentAt, uDrape);
  float size = 7.0 * worldPerPx(-(viewMatrix * vec4(c, 1.0)).z);
  vec3 p = c + position * vec3(size, size * 0.85, size);
  vShade = 0.5 + 0.5 * dot(normal, normalize(vec3(-1.0, 1.0, -0.6)));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const DOME_FRAGMENT = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uTent;
varying float vShade;
void main() {
  gl_FragColor = vec4(mix(uInk, uPaper, (1.0 - vShade) * 0.28), uTent);
}
`;

const GLOW_VERTEX = /* glsl */ `
${GLSL_RELIEF}
${GLSL_SCREEN}
uniform vec3 uTentAt;
varying vec2 vUv;
void main() {
  vec4 mv = viewMatrix * vec4(reliefPosition(uTentAt, uDrape), 1.0);
  mv.xy += position.xy * 72.0 * worldPerPx(-mv.z);
  vUv = position.xy * 2.0;
  gl_Position = projectionMatrix * mv;
}
`;

const GLOW_FRAGMENT = /* glsl */ `
uniform vec3 uSignal;
uniform float uTent;
varying vec2 vUv;
void main() {
  float r = clamp(length(vUv), 0.0, 1.0);
  float glow = (1.0 - r) * (1.0 - r);
  gl_FragColor = vec4(uSignal, glow * 0.55 * uTent);
}
`;

export interface TentMarkProps {
  /** Reads `uTentAt` (x, normalised height, z) and `uTent` (0..1). */
  uniforms: ReliefUniforms;
}

/**
 * The tent at Manang (§G.8): a small four-sided dome (20 triangles) in `uInk` over a soft
 * `uSignal` glow, both at intensity `uTent` and held at a constant on-screen size (about 14 px
 * dome, 72 px glow) whatever the camera distance.
 */
export function TentMark({ uniforms }: TentMarkProps) {
  const objects = useMemo(() => {
    const domeGeometry = new SphereGeometry(1, 4, 3, Math.PI / 4, Math.PI * 2, 0, Math.PI / 2);
    const glowGeometry = new PlaneGeometry(1, 1);
    const common = { uniforms, transparent: true, depthTest: false, depthWrite: false } as const;
    const domeMaterial = new ShaderMaterial({ ...common, vertexShader: DOME_VERTEX, fragmentShader: DOME_FRAGMENT });
    const glowMaterial = new ShaderMaterial({ ...common, vertexShader: GLOW_VERTEX, fragmentShader: GLOW_FRAGMENT });
    return { domeGeometry, glowGeometry, domeMaterial, glowMaterial };
  }, [uniforms]);

  useEffect(
    () => () => {
      objects.domeGeometry.dispose();
      objects.glowGeometry.dispose();
      objects.domeMaterial.dispose();
      objects.glowMaterial.dispose();
    },
    [objects],
  );

  // Hidden while unlit, so the two draws cost nothing outside the calm entry.
  const groupRef = useRef<Group>(null);
  useFrame(() => {
    if (groupRef.current) groupRef.current.visible = uniforms.uTent.value > 0.002;
  }, PRIMITIVE_UPDATE_PRIORITY);

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={objects.glowGeometry} material={objects.glowMaterial} frustumCulled={false} renderOrder={4} />
      <mesh geometry={objects.domeGeometry} material={objects.domeMaterial} frustumCulled={false} renderOrder={5} />
    </group>
  );
}
