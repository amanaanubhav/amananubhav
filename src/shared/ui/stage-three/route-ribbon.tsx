'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Mesh,
} from 'three';

import { GLSL_DISC, GLSL_RELIEF, GLSL_SCREEN } from './glsl';
import type { ReliefUniforms } from './relief-uniforms';
import type { RouteCurve } from './route';

/** Per-frame updates of primitives run after the scene's driver and before the slot render. */
export const PRIMITIVE_UPDATE_PRIORITY = 0.8;

/** Dashes per main-route length (§G.8: `step(0.5, fract(aDist * 60.0))`). */
const DASHES = 60;
const NO_TRIPS: readonly RouteCurve[] = [];
/** Below this alpha a part is hidden, so it costs no draw call. */
const HIDDEN_ALPHA = 0.002;

const RIBBON_VERTEX = /* glsl */ `
${GLSL_RELIEF}
${GLSL_SCREEN}
uniform float uDraw;
uniform float uSideDraw;
uniform float uRouteWidth;
attribute vec3 aTangent;
attribute float aDist;
attribute float aDash;
attribute float aSide;
attribute float aTrip;
varying float vDist;
varying float vDash;
varying float vDraw;
void main() {
  vec3 p = reliefPosition(position, uDrape);
  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 c0 = mvp * vec4(p, 1.0);
  vec4 c1 = mvp * vec4(p + aTangent * 0.05, 1.0);
  vec2 s = (c1.xy / c1.w - c0.xy / c0.w) * uResolution;
  vec2 dir = length(s) > 1e-6 ? normalize(s) : vec2(1.0, 0.0);
  vec2 n = vec2(-dir.y, dir.x);
  float widthPx = clamp(uRouteWidth * uPxPerUnit / max(c0.w, 1e-3), 2.2, 4.0);
  c0.xy += n * aSide * widthPx / uResolution * c0.w;
  vDist = aDist;
  vDash = aDash;
  vDraw = aTrip > 0.5 ? uSideDraw : uDraw;
  gl_Position = c0;
}
`;

const RIBBON_FRAGMENT = /* glsl */ `
uniform vec3 uSignal;
uniform float uGraph;
uniform float uRouteAlpha;
uniform float uGhost;
uniform float uFade;
varying float vDist;
varying float vDash;
varying float vDraw;
void main() {
  float reveal = 1.0 - smoothstep(vDraw - 0.004, vDraw, vDist);
  float f = fract(vDash);
  float w = max(fwidth(vDash), 1e-4);
  float dash = smoothstep(0.5 - w, 0.5 + w, f) * (1.0 - smoothstep(1.0 - w, 1.0, f));
  // The drawn route, plus a faint dashed ghost of the part still to come.
  float drawn = mix(1.0, dash, uGraph) * reveal * uRouteAlpha;
  float alpha = max(drawn, dash * (1.0 - reveal) * uGhost) * uFade;
  gl_FragColor = vec4(uSignal, alpha);
}
`;

const RING_VERTEX = /* glsl */ `
${GLSL_RELIEF}
${GLSL_SCREEN}
uniform float uDraw;
uniform float uSideDraw;
uniform float uGraph;
uniform float uRouteAlpha;
uniform float uGhost;
uniform float uFade;
attribute float aNodeDist;
attribute float aNodeTrip;
varying vec2 vUv;
varying float vShow;
void main() {
  vec3 c = reliefPosition((instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz, uDrape);
  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  mv.xy += position.xy * 11.0 * worldPerPx(-mv.z);
  vUv = position.xy * 2.0;
  float draw = aNodeTrip > 0.5 ? uSideDraw : uDraw;
  float reached = smoothstep(aNodeDist - 0.003, aNodeDist + 0.001, draw);
  vShow = max(reached * uGraph * uRouteAlpha, uGhost) * uFade;
  gl_Position = projectionMatrix * mv;
}
`;

const RING_FRAGMENT = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uSignal;
varying vec2 vUv;
varying float vShow;
${GLSL_DISC}
void main() {
  float r = length(vUv);
  float outer = discMask(r, 0.86);
  float inner = discMask(r, 0.6);
  vec3 color = mix(uSignal, uPaper, inner);
  gl_FragColor = vec4(color, outer * vShow);
}
`;

const HEAD_VERTEX = /* glsl */ `
${GLSL_RELIEF}
${GLSL_SCREEN}
uniform vec3 uHead;
varying vec2 vUv;
void main() {
  vec3 c = reliefPosition(uHead, uDrape);
  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  mv.xy += position.xy * 14.0 * worldPerPx(-mv.z);
  vUv = position.xy * 2.0;
  gl_Position = projectionMatrix * mv;
}
`;

const HEAD_FRAGMENT = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uSignal;
uniform float uHeadAlpha;
varying vec2 vUv;
${GLSL_DISC}
void main() {
  float r = length(vUv);
  // 12 px disc in signal inside a 1 px paper outline (14 px quad).
  float outer = discMask(r, 0.98);
  float core = discMask(r, 0.84);
  gl_FragColor = vec4(mix(uPaper, uSignal, core), outer * uHeadAlpha);
}
`;

function overlayMaterial(uniforms: ReliefUniforms, vertexShader: string, fragmentShader: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    // The ribbon's screen-space offset decides its winding; never cull it.
    side: DoubleSide,
  });
}

function buildRibbonGeometry(main: RouteCurve, sideTrips: readonly RouteCurve[]): BufferGeometry {
  const strips = [main, ...sideTrips];
  const vertexCount = strips.reduce((sum, c) => sum + c.count * 2, 0);
  const indexCount = strips.reduce((sum, c) => sum + (c.count - 1) * 6, 0);
  const position = new Float32Array(vertexCount * 3);
  const tangent = new Float32Array(vertexCount * 3);
  const dist = new Float32Array(vertexCount);
  const altM = new Float32Array(vertexCount);
  const dash = new Float32Array(vertexCount);
  const side = new Float32Array(vertexCount);
  const trip = new Float32Array(vertexCount);
  const index = new Uint32Array(indexCount);
  const t = new Vector3();
  let v = 0;
  let k = 0;

  strips.forEach((curve, s) => {
    const base = v;
    const dashScale = (curve.length / Math.max(main.length, 1e-6)) * DASHES;
    for (let i = 0; i < curve.count; i++) {
      curve.tangentAt(curve.dist[i], t);
      for (const sign of [-1, 1]) {
        position.set([curve.xz[i * 2], curve.hn[i], curve.xz[i * 2 + 1]], v * 3);
        tangent.set([t.x, 0, t.z], v * 3);
        dist[v] = curve.dist[i];
        altM[v] = curve.altM[i];
        dash[v] = curve.dist[i] * dashScale;
        side[v] = sign;
        trip[v] = s === 0 ? 0 : 1;
        v++;
      }
    }
    for (let i = 0; i < curve.count - 1; i++) {
      const a = base + i * 2;
      index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k);
      k += 6;
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aTangent', new BufferAttribute(tangent, 3));
  geometry.setAttribute('aDist', new BufferAttribute(dist, 1));
  // Altitude in metres (the profile's values) for altitude-keyed styling; unused by the default shader.
  geometry.setAttribute('aAltM', new BufferAttribute(altM, 1));
  geometry.setAttribute('aDash', new BufferAttribute(dash, 1));
  geometry.setAttribute('aSide', new BufferAttribute(side, 1));
  geometry.setAttribute('aTrip', new BufferAttribute(trip, 1));
  geometry.setIndex(new BufferAttribute(index, 1));
  return geometry;
}

function buildRings(main: RouteCurve, sideTrips: readonly RouteCurve[], material: ShaderMaterial): InstancedMesh {
  // Main-route waypoints, then each side trip's nodes after its shared start (Manang).
  const rings: { x: number; hn: number; z: number; dist: number; trip: number }[] = main.nodes.map((n) => ({
    x: main.xz[n.sample * 2],
    hn: main.hn[n.sample],
    z: main.xz[n.sample * 2 + 1],
    dist: n.dist,
    trip: 0,
  }));
  for (const curve of sideTrips) {
    for (const n of curve.nodes.slice(1)) {
      rings.push({ x: curve.xz[n.sample * 2], hn: curve.hn[n.sample], z: curve.xz[n.sample * 2 + 1], dist: n.dist, trip: 1 });
    }
  }
  const geometry = new PlaneGeometry(1, 1);
  geometry.setAttribute('aNodeDist', new InstancedBufferAttribute(Float32Array.from(rings, (r) => r.dist), 1));
  geometry.setAttribute('aNodeTrip', new InstancedBufferAttribute(Float32Array.from(rings, (r) => r.trip), 1));
  const mesh = new InstancedMesh(geometry, material, rings.length);
  const m = new Matrix4();
  rings.forEach((r, i) => mesh.setMatrixAt(i, m.makeTranslation(r.x, r.hn, r.z)));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return mesh;
}

export interface RouteRibbonProps {
  main: RouteCurve;
  /** Side trips, each starting at its branch waypoint; drawn by `uSideDraw`. */
  sideTrips?: readonly RouteCurve[];
  uniforms: ReliefUniforms;
}

/**
 * The route (§G.8): one ribbon geometry for the main route and its side trips (one draw call;
 * attributes `aDist` 0..1 and `aAltM`), revealed by alpha along `aDist` (`uDraw`, never
 * `discard`), dashed while `uGraph` is 1, with a dashed ghost of the rest at `uGhost`; the
 * waypoint rings as one InstancedMesh; a head marker in signal with a 1 px paper outline that
 * follows `uDraw`. Overlays draw on top of the terrain (no depth test), in a fixed order.
 */
export function RouteRibbon({ main, sideTrips = NO_TRIPS, uniforms }: RouteRibbonProps) {
  const objects = useMemo(() => {
    const ribbonGeometry = buildRibbonGeometry(main, sideTrips);
    const ribbonMaterial = overlayMaterial(uniforms, RIBBON_VERTEX, RIBBON_FRAGMENT);
    const ringMaterial = overlayMaterial(uniforms, RING_VERTEX, RING_FRAGMENT);
    const rings = buildRings(main, sideTrips, ringMaterial);
    const headGeometry = new PlaneGeometry(1, 1);
    const headMaterial = overlayMaterial(uniforms, HEAD_VERTEX, HEAD_FRAGMENT);
    return { ribbonGeometry, ribbonMaterial, ringMaterial, rings, headGeometry, headMaterial };
  }, [main, sideTrips, uniforms]);

  useEffect(
    () => () => {
      objects.ribbonGeometry.dispose();
      objects.ribbonMaterial.dispose();
      objects.rings.geometry.dispose();
      objects.rings.dispose();
      objects.ringMaterial.dispose();
      objects.headGeometry.dispose();
      objects.headMaterial.dispose();
    },
    [objects],
  );

  const ribbonRef = useRef<Mesh>(null);
  const headRef = useRef<Mesh>(null);
  const ringsRef = useRef<InstancedMesh>(null);

  useFrame(() => {
    main.pointAt(uniforms.uDraw.value, uniforms.uHead.value);
    // Parts at zero alpha are hidden, so they cost no draw call (the plan sheet before the route).
    const route = uniforms.uRouteAlpha.value * uniforms.uFade.value;
    const ghost = uniforms.uGhost.value * uniforms.uFade.value > HIDDEN_ALPHA;
    const drawn = Math.max(uniforms.uDraw.value, uniforms.uSideDraw.value) > 0;
    if (ribbonRef.current) ribbonRef.current.visible = (route > HIDDEN_ALPHA && drawn) || ghost;
    if (ringsRef.current) ringsRef.current.visible = route * uniforms.uGraph.value > HIDDEN_ALPHA || ghost;
    if (headRef.current) headRef.current.visible = uniforms.uHeadAlpha.value > HIDDEN_ALPHA;
  }, PRIMITIVE_UPDATE_PRIORITY);

  return (
    <>
      <mesh
        ref={ribbonRef}
        geometry={objects.ribbonGeometry}
        material={objects.ribbonMaterial}
        frustumCulled={false}
        renderOrder={2}
      />
      <primitive ref={ringsRef} object={objects.rings} />
      <mesh
        ref={headRef}
        geometry={objects.headGeometry}
        material={objects.headMaterial}
        frustumCulled={false}
        renderOrder={6}
      />
    </>
  );
}
