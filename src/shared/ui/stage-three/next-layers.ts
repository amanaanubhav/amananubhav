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
  Vector4,
} from 'three';

import { GLSL_NORTH_RIM_LIFT, GLSL_RECEDE, GLSL_RECEDE_MASK } from './glsl';
import { TERRAIN_FS } from './story-layers';
import type { StoryUniforms } from './story-uniforms';

/*
 * The home `#next` layers (docs/redesign/next-trek/NEXT-DESIGN.md §3.3, §5.2; BUILD-REPORT "Transition fixes"),
 * drawn in the story's own canvas and world frame: the north tile (Muktinath, the road corridor to Marpha, the Kali
 * Gandaki and the north side of Annapurna I, finer than the story tile), one line mesh for the planned road
 * (steel dashes: the corridor and the jeep leg, one line) and the expected trek (oxblood dots), drawn twice (ridges
 * hide it to 30%, then the visible part at full strength), and the instanced marks. Colours are the shared story
 * uniforms (`uJeep` = map-jeep steel, `uSignal` = signal-line oxblood, `uPaper` = ground): no colour is written here.
 */

/*
 * The north tile's vertex shader: TERRAIN_VS's relief, normals, line density and recede, plus the handoff.
 *
 * From S_END the north tile owns its whole box (the story tile is cut there by a plain world-space box, no dither).
 * Before the reveal reaches a vertex, the vertex is an exact stand-in for the story tile: the story tile's drawn
 * surface at that point (`aStory`: metres, normalised height and gradient, sampled from the story mesh as drawn),
 * its rim sink and its island; beyond the story tile, nothing (sunk flat, ground colour). Behind the reveal front
 * (`uGrow`: radius, soft band, centre at Muktinath) the vertex morphs to this tile's own look: its own heights
 * (`aKeep` = 0 keeps the story's along the walked circuit, so its line stays draped), its island (`aFocus`) and its
 * own rim. Where the story tile lies under this tile's rim (its east edge and the east of its south edge) the rim
 * keeps the story tile's heights, sink and island, so the two tiles meet without a seam. `aSkirt` drops a skirt
 * under the edge that fills any sub-pixel crack against the story tile. `vPlane` is in world units so the frost
 * stipple lines up across the seam.
 */
const NORTH_VS = /* glsl */ `
uniform vec2 uResolution;
uniform float uRangeM;
uniform float uEx;
uniform float uDpr;
uniform vec4 uRimN;
uniform float uRimZ;
uniform vec2 uStoryHalf;
uniform vec4 uGrow;
${GLSL_NORTH_RIM_LIFT}
${GLSL_RECEDE_MASK}
attribute float aHeightM;
attribute float aFocus;
attribute float aFocusS;
attribute vec2 aGrad;
attribute vec4 aStory;
attribute float aKeep;
attribute float aSkirt;
varying float vH;
varying float vMpp;
varying float vDepth;
varying float vMask;
varying float vSheet;
varying vec2 vPlane;
varying vec3 vN;
float rimR(vec2 p, vec2 hv) {
  vec2 q = abs(p) / hv;
  q *= q;
  q *= q;
  q *= q;
  return pow(q.x + q.y, 0.125);
}
void main() {
  vec2 world = (modelMatrix * vec4(position.x, 0.0, position.z, 1.0)).xz;
  // This tile's rim: centred at uRimZ (local z), half extents x, north, south (NorthTerrainOptions.rim).
  float dz = position.z - uRimZ;
  float rN = rimR(vec2(position.x, dz), vec2(uRimN.x, dz < 0.0 ? uRimN.y : uRimN.z));
  float rS = rimR(world, uStoryHalf);
  float cover = 1.0 - smoothstep(0.97, 1.0, rS);
  // The story tile at this point, exactly as it draws it (TERRAIN_VS).
  float sinkS = mix(1.0 - smoothstep(0.8, 1.0, rS), 1.0, northRimLift(world, uStoryHalf, uGrow));
  float sheetS = (1.0 - smoothstep(0.7, 0.99, rS)) * aFocusS;
  // This tile's own look: over the story tile its rim band keeps the story's (the two meet there); off it, a wide
  // fade and sink to its own edge (the west cuts the Dhaulagiri side), so no ridge silhouette marks the edge.
  float w = 1.0 - smoothstep(0.7, 0.99, rN);
  float sinkOwn = mix(1.0 - smoothstep(0.7, 1.0, rN), mix(sinkS, 1.0, w), cover);
  float sheetOwn = mix((1.0 - smoothstep(0.6, 0.99, rN)) * aFocus, mix(sheetS, aFocus, w), cover);
  // The reveal: 0 ahead of the front (the story's look), 1 behind it (this tile's own).
  float k = 1.0 - smoothstep(uGrow.x - uGrow.y, uGrow.x, distance(world, uGrow.zw));
  float sink = mix(sinkS * cover, sinkOwn, k);
  float sheet = mix(sheetS * cover, sheetOwn, k);
  float kH = k * aKeep * mix(1.0, w, cover);
  float hM = mix(aStory.x, aHeightM, kH);
  vec2 grad = mix(aStory.zw, aGrad, kH);
  vSheet = sheet * sheet * (3.0 - 2.0 * sheet);
  vec3 p = vec3(position.x, mix(aStory.y, position.y, kH) * uEx * sink - aSkirt * 0.12, position.z);
  vN = normalize(vec3(-grad.x * uEx / uRangeM, 1.0, -grad.y * uEx / uRangeM));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 c0 = projectionMatrix * mv;
  float g = length(grad);
  vec2 gd = g > 1e-3 ? grad / g : vec2(1.0, 0.0);
  vec3 up = p + vec3(gd.x * 0.05, g * 0.05 / uRangeM * uEx * sink, gd.y * 0.05);
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(up, 1.0);
  vec2 sp = (c1.xy / c1.w - c0.xy / c0.w) * 0.5 * uResolution;
  vMpp = g * 0.05 / max(length(sp), 1e-4);
  vH = hM;
  vDepth = -mv.z;
  vPlane = world;
  vMask = c0.w > 0.0 ? recedeMaskAt((c0.xy / c0.w * 0.5 + 0.5) * uResolution * uDpr) : 0.0;
  gl_Position = c0;
}
`;

/** The reveal front of the north tile: x radius, y soft band (world units), zw centre (world x, z). */
export interface NorthGrowUniform {
  readonly value: Vector4;
}

export function createNorthGrowUniform(): NorthGrowUniform {
  return { value: new Vector4(0, 1, 0, 0) };
}

export interface NorthTerrainOptions {
  /** Tier 2 only: hillshade and the frost stipple (as the story tile). */
  hillshade: boolean;
  frost: boolean;
  /**
   * The north plane's rim (its local units): half width `x`, the north and south half depths from its centre `z`.
   * The tile reaches farther north than the route's lattice; its rim keeps that lattice's centre, so only the north
   * fade grows (the island ends well inside it).
   */
  rim: { x: number; north: number; south: number; z: number };
  /** The reveal front (written per frame by the scene). */
  grow: NorthGrowUniform;
}

/**
 * The north tile over its displaced plane. The geometry needs `aFocus` (this map's island: the story's points
 * and the next route's), `aFocusS` (the story tile's own island at each vertex), `aStory` (the story tile's drawn
 * surface at each vertex: metres, normalised height, gradient), `aKeep` (1 where this tile shows its own heights)
 * and `aSkirt` (1 on the skirt), and `position.y` in the STORY tile's normalised height. Place the mesh in the
 * story's world frame (position, scale.x).
 */
export function createNorthTerrain(geometry: BufferGeometry, uniforms: StoryUniforms, opts: NorthTerrainOptions): Mesh {
  const defines: Record<string, string> = { NORTH_TILE: '' };
  if (opts.hillshade) defines.HILLSHADE = '';
  if (opts.frost) defines.FROST = '';
  const mesh = new Mesh(
    geometry,
    new ShaderMaterial({
      // The story's uniform objects by reference (theme tweens, per-frame values), with this tile's own rim.
      uniforms: {
        ...uniforms,
        uRimN: { value: new Vector4(opts.rim.x, opts.rim.north, opts.rim.south, 0) },
        uRimZ: { value: opts.rim.z },
        uStoryHalf: uniforms.uHalf,
        uGrow: opts.grow,
      },
      vertexShader: NORTH_VS,
      fragmentShader: TERRAIN_FS,
      defines,
    }),
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  return mesh;
}

/**
 * Adds a skirt to a heightfield plane (built row-major, `gx` x `gz` vertices, as `loadHeightfield`): a copy of each
 * edge vertex (all its attributes) with `aSkirt` = 1, joined to the edge by two triangles per edge segment. The
 * shader drops it under the edge. Returns a new geometry; the caller disposes both.
 */
export function addSkirt(source: BufferGeometry, gx: number, gz: number): BufferGeometry {
  const ring: number[] = [];
  for (let i = 0; i < gx; i++) ring.push(i); // north edge, west to east
  for (let j = 1; j < gz; j++) ring.push(j * gx + gx - 1); // east edge, north to south
  for (let i = gx - 2; i >= 0; i--) ring.push((gz - 1) * gx + i); // south edge, east to west
  for (let j = gz - 2; j > 0; j--) ring.push(j * gx); // west edge, south to north
  const base = gx * gz;
  const count = base + ring.length;
  const out = new BufferGeometry();
  for (const [name, attr] of Object.entries(source.attributes)) {
    const size = attr.itemSize;
    const arr = (attr as BufferAttribute).array as Float32Array;
    const dst = new Float32Array(count * size);
    dst.set(arr.subarray(0, base * size));
    ring.forEach((v, k) => dst.set(arr.subarray(v * size, v * size + size), (base + k) * size));
    out.setAttribute(name, new BufferAttribute(dst, size));
  }
  const skirt = new Float32Array(count);
  skirt.fill(1, base);
  out.setAttribute('aSkirt', new BufferAttribute(skirt, 1));
  const src = source.getIndex();
  const n0 = src ? src.count : 0;
  // Both windings: a crack can be seen from over either tile (the material is front-sided).
  const index = new Uint32Array(n0 + ring.length * 12);
  if (src) index.set(src.array as ArrayLike<number>);
  let k = n0;
  for (let r = 0; r < ring.length; r++) {
    const a = ring[r];
    const b = ring[(r + 1) % ring.length];
    const a2 = base + r;
    const b2 = base + ((r + 1) % ring.length);
    index.set([a, a2, b, b, a2, b2, a, b, a2, b, b2, a2], k);
    k += 12;
  }
  out.setIndex(new BufferAttribute(index, 1));
  // The plane's own sphere, a little larger (the skirt hangs under it): never a full recompute over every vertex.
  if (!source.boundingSphere) source.computeBoundingSphere();
  if (source.boundingSphere) {
    out.boundingSphere = source.boundingSphere.clone();
    out.boundingSphere.radius *= 1.1;
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------
 * The next line: the planned road (dashes: the corridor and the jeep leg) and the expected trek (dots), one
 * geometry, two passes
 * ---------------------------------------------------------------------------------------------- */

/** The next line's own per-frame uniforms (shared by both passes). */
export function createNextLineUniforms() {
  return {
    /** CSS px per world unit at the camera target (the pattern's scale, like the story's `uDashK`). */
    uNextPxK: { value: 60 },
    /** Drawn length of the road (world units, scrubbed with the ride head) and of the trek (time-based). */
    uJeepDraw: { value: 0 },
    uTrekDraw: { value: 0 },
    /** The trek's opacity (its 200 ms fade-out when the visitor scrolls back up). */
    uTrekAlpha: { value: 0 },
    /** The whole next line's opacity (0 before the handoff). */
    uNextAlpha: { value: 0 },
  };
}
export type NextLineUniforms = ReturnType<typeof createNextLineUniforms>;

const LINE_VS = /* glsl */ `
uniform vec2 uResolution;
attribute vec3 aTangent;
attribute float aDist;
attribute float aSide;
attribute float aKind;
varying float vDist;
varying float vSide;
varying float vKind;
varying float vHalf;
void main() {
  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 c0 = mvp * vec4(position, 1.0);
  vec4 c1 = mvp * vec4(position + aTangent * 0.05, 1.0);
  vec2 sp = (c1.xy / c1.w - c0.xy / c0.w) * uResolution;
  vec2 dir = length(sp) > 1e-6 ? normalize(sp) : vec2(1.0, 0.0);
  // Half width in CSS px: the road's 0.75 px core + 1 px casing, the trek's 1.6 px dot + 2 px casing, + AA.
  float halfW = mix(2.6, 4.4, aKind);
  c0.xy += vec2(-dir.y, dir.x) * aSide * halfW * 2.0 / uResolution * c0.w;
  vDist = aDist;
  vSide = aSide;
  vKind = aKind;
  vHalf = halfW;
  gl_Position = c0;
}
`;

/*
 * Road (planned: the corridor from Muktinath and the jeep leg): dashes 7 px on, 5 px off, 1.5 px wide, butt caps, a 1 px
 * ground casing, map-jeep steel.
 * Trek (expected, on foot): round dots 3.2 px on a 6.5 px pitch, a 2 px ground casing, signal-line oxblood.
 * Distances are CSS px at the target depth; where the pattern would alias (far, foreshortened) it melts into a
 * thin continuous line of the same colour.
 */
const LINE_FS = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uSignal;
uniform vec3 uJeep;
uniform float uNextPxK;
uniform float uJeepDraw;
uniform float uTrekDraw;
uniform float uTrekAlpha;
uniform float uNextAlpha;
uniform float uReveal;
varying float vDist;
varying float vSide;
varying float vKind;
varying float vHalf;
${GLSL_RECEDE_MASK}
${GLSL_RECEDE}
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
void main() {
  float trek = step(0.5, vKind);
  float da = max(fwidth(vDist), 1e-5);
  float drawTo = mix(uJeepDraw, uTrekDraw, trek);
  float drawn = 1.0 - smoothstep(drawTo - da, drawTo + da, vDist);
  if (drawn <= 0.0) discard;
  float across = abs(vSide) * vHalf;
  float along = vDist * uNextPxK;
  float aw = max(fwidth(along), 1e-4);
  float d;
  float casingW;
  if (trek > 0.5) {
    d = length(vec2(mod(along, 6.5) - 3.25, across)) - 1.6;
    casingW = 2.0;
  } else {
    d = sdBox(vec2(mod(along, 12.0) - 3.5, across), vec2(3.5, 0.75));
    casingW = 1.0;
  }
  // Pattern -> continuous line as the on-screen period falls under ~3 px (no shimmer in the distance).
  float solid = smoothstep(0.3, 0.5, aw / mix(12.0, 6.5, trek));
  float lineW = mix(0.75, 1.0, trek);
  d = mix(d, across - lineW, solid);
  float core = 1.0 - smoothstep(-0.5, 0.5, d);
  float casing = 1.0 - smoothstep(-0.5, 0.5, d - casingW);
  vec3 line = mix(uJeep, uSignal, trek);
  vec3 c = mix(uPaper, line, core);
  float a = max(core, casing * 0.75) * drawn * mix(1.0, uTrekAlpha, trek) * uNextAlpha;
#ifdef OCCLUDED
  a *= 0.3;
#endif
  a *= smoothstep(0.45, 0.9, uReveal);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(recede(c, uRecedePaper, recedeMaskAt(gl_FragCoord.xy)), a);
}
`;

/** A draped polyline in story world units: points and the length along it. */
export interface NextLineStrip {
  readonly n: number;
  readonly x: ArrayLike<number>;
  readonly y: ArrayLike<number>;
  readonly z: ArrayLike<number>;
  readonly L: ArrayLike<number>;
}

export interface NextLine {
  /** Behind ridges (30%), then the visible part (depth-tested); add both. */
  readonly back: Mesh;
  readonly front: Mesh;
  dispose(): void;
}

/** The road strip (kind 0: the corridor then the jeep leg, one length) and the trek strip (kind 1), drawn twice. */
export function createNextLine(
  road: NextLineStrip,
  trek: NextLineStrip,
  uniforms: StoryUniforms,
  line: NextLineUniforms,
  drape = 0.02,
): NextLine {
  const strips = [road, trek];
  const vc = strips.reduce((a, c) => a + c.n * 2, 0);
  const ic = strips.reduce((a, c) => a + Math.max(0, c.n - 1) * 6, 0);
  const pos = new Float32Array(vc * 3);
  const tan = new Float32Array(vc * 3);
  const dist = new Float32Array(vc);
  const side = new Float32Array(vc);
  const kind = new Float32Array(vc);
  const index = new Uint32Array(ic);
  let v = 0;
  let k = 0;
  strips.forEach((c, s) => {
    const base = v;
    for (let i = 0; i < c.n; i++) {
      const i0 = Math.max(0, i - 2);
      const i1 = Math.min(c.n - 1, i + 2);
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
        kind[v] = s;
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
  geometry.setAttribute('aKind', new BufferAttribute(kind, 1));
  geometry.setIndex(new BufferAttribute(index, 1));
  const material = (occluded: boolean) =>
    new ShaderMaterial({
      uniforms: { ...uniforms, ...line },
      vertexShader: LINE_VS,
      fragmentShader: LINE_FS,
      defines: occluded ? { OCCLUDED: '' } : {},
      transparent: true,
      depthTest: !occluded,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -40,
      side: DoubleSide,
    });
  const back = new Mesh(geometry, material(true));
  const front = new Mesh(geometry, material(false));
  back.frustumCulled = false;
  front.frustumCulled = false;
  back.renderOrder = 4;
  front.renderOrder = 5;
  return {
    back,
    front,
    dispose() {
      geometry.dispose();
      (back.material as ShaderMaterial).dispose();
      (front.material as ShaderMaterial).dispose();
    },
  };
}

/* ------------------------------------------------------------------------------------------------
 * Next marks (one instanced draw)
 * ---------------------------------------------------------------------------------------------- */

/**
 * 0 road village (steel ring), 1 the jeep's start (steel disc), 2 the trailhead (oxblood disc), 3 a camp
 * (oxblood ring), 4 the goal (oxblood outline triangle: planned), 5 a summit (the story's peak glyph in
 * oxblood), 6 the ride head (steel ring).
 */
export type NextMarkerKind = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MARKS_VS = /* glsl */ `
uniform float uPxScale;
attribute float aKind;
attribute float aAlpha;
varying vec2 vUv;
varying float vKind;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float px = aKind < 0.5 ? 9.0 : aKind < 1.5 ? 11.0 : aKind < 2.5 ? 11.0 : aKind < 3.5 ? 8.0 : aKind < 4.5 ? 16.0 : aKind < 5.5 ? 16.0 : 12.0;
  mv.xy += position.xy * px * (-mv.z) * uPxScale;
  vUv = position.xy * 2.0;
  vKind = aKind;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * mv;
}
`;

const MARKS_FS = /* glsl */ `
uniform vec3 uPaper;
uniform vec3 uSignal;
uniform vec3 uJeep;
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
  if (vKind < 0.5 || vKind > 5.5) {
    // A steel ring on a ground fill (road villages; the ride head a little larger).
    c = mix(uPaper, mix(uJeep, uPaper, disc(r, 0.42)), disc(r, 0.8));
    a = disc(r, 1.0);
  } else if (vKind < 1.5) {
    c = mix(uPaper, uJeep, disc(r, 0.62));
    a = disc(r, 0.95);
  } else if (vKind < 2.5) {
    c = mix(uPaper, uSignal, disc(r, 0.62));
    a = disc(r, 0.95);
  } else if (vKind < 3.5) {
    c = mix(uPaper, mix(uSignal, uPaper, disc(r, 0.4)), disc(r, 0.8));
    a = disc(r, 1.0);
  } else {
    // Triangles: the goal is an outline (planned), the summit the story's peak glyph; both oxblood.
    float d = sdTri(vUv - vec2(0.0, -0.1), vKind < 4.5 ? 0.5 : 0.6);
    float w = max(fwidth(d), 1e-4);
    float stroke = vKind < 4.5 ? 0.11 : 0.09;
    c = mix(uPaper, uSignal, 1.0 - smoothstep(stroke - w, stroke + w, abs(d)));
    a = (1.0 - smoothstep(stroke + 0.03 - w, stroke + 0.03 + w, d)) * (vKind < 4.5 ? 0.95 : 0.85);
  }
  a *= smoothstep(0.45, 0.9, uReveal) * vAlpha;
  if (a <= 0.0) discard;
  gl_FragColor = vec4(recede(c, uRecedePaper, recedeMaskAt(gl_FragCoord.xy)), a);
}
`;

export interface NextMarkers {
  readonly mesh: InstancedMesh;
  /** Per-instance alpha (0 hides it); call `commit()` after writing. */
  readonly alpha: Float32Array;
  setPosition(i: number, x: number, y: number, z: number): void;
  commit(): void;
  dispose(): void;
}

export function createNextMarkers(
  points: readonly { x: number; y: number; z: number; kind: NextMarkerKind }[],
  uniforms: StoryUniforms,
): NextMarkers {
  const geometry = new PlaneGeometry(1, 1);
  const alpha = new Float32Array(points.length);
  const alphaAttr = new InstancedBufferAttribute(alpha, 1);
  alphaAttr.setUsage(DynamicDrawUsage);
  geometry.setAttribute('aKind', new InstancedBufferAttribute(new Float32Array(points.map((p) => p.kind)), 1));
  geometry.setAttribute('aAlpha', alphaAttr);
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: MARKS_VS,
    fragmentShader: MARKS_FS,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new InstancedMesh(geometry, material, points.length);
  const m = new Matrix4();
  const setPosition = (i: number, x: number, y: number, z: number) => {
    mesh.setMatrixAt(i, m.makeTranslation(x, y + 0.012, z));
    mesh.instanceMatrix.needsUpdate = true;
  };
  points.forEach((p, i) => setPosition(i, p.x, p.y, p.z));
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  return {
    mesh,
    alpha,
    setPosition,
    commit: () => {
      alphaAttr.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      // The InstancedMesh's own instanceMatrix buffer.
      mesh.dispose();
    },
  };
}

/**
 * The island weight (as `setTerrainFocus`) at arbitrary points: 1 within `inner` world units of any focus point,
 * smoothly 0 beyond `outer`. `xz` holds the query points (x, z pairs, story world units); returns one value each.
 * A coarse distance grid over the queries' extent (half-unit cells), sampled bilinearly. Only the points within
 * reach of a cell are searched (buckets of `outer` + 1): a cell farther than that from every point takes that
 * distance, which gives the same 0 as the true one (its neighbours are all beyond `outer` too).
 */
export function focusAt(xz: ArrayLike<number>, points: ArrayLike<number>, inner: number, outer: number): Float32Array {
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (let i = 0; i < xz.length; i += 2) {
    x0 = Math.min(x0, xz[i]);
    x1 = Math.max(x1, xz[i]);
    z0 = Math.min(z0, xz[i + 1]);
    z1 = Math.max(z1, xz[i + 1]);
  }
  const cell = 0.5;
  const gx = Math.ceil((x1 - x0) / cell) + 2;
  const gz = Math.ceil((z1 - z0) / cell) + 2;
  const grid = new Float32Array(gx * gz);
  // Buckets of the points over the grid's extent (a point outside it lands in the edge bucket; still exact).
  const reach = outer + 1;
  const bx = Math.max(1, Math.ceil((gx * cell) / reach));
  const bz = Math.max(1, Math.ceil((gz * cell) / reach));
  const buckets: number[][] = Array.from({ length: bx * bz }, () => []);
  const bucketOf = (x: number, z: number) =>
    Math.min(bz - 1, Math.max(0, Math.floor((z - z0) / reach))) * bx + Math.min(bx - 1, Math.max(0, Math.floor((x - x0) / reach)));
  for (let k = 0; k < points.length; k += 2) buckets[bucketOf(points[k], points[k + 1])].push(points[k], points[k + 1]);
  for (let j = 0; j < gz; j++)
    for (let i = 0; i < gx; i++) {
      const x = x0 + i * cell;
      const z = z0 + j * cell;
      let best = reach * reach;
      const cb = Math.min(bx - 1, Math.max(0, Math.floor((x - x0) / reach)));
      const rb = Math.min(bz - 1, Math.max(0, Math.floor((z - z0) / reach)));
      for (let r = Math.max(0, rb - 1); r <= Math.min(bz - 1, rb + 1); r++)
        for (let c = Math.max(0, cb - 1); c <= Math.min(bx - 1, cb + 1); c++) {
          const b = buckets[r * bx + c];
          for (let k = 0; k < b.length; k += 2) {
            const dx = b[k] - x;
            const dz = b[k + 1] - z;
            const d2 = dx * dx + dz * dz;
            if (d2 < best) best = d2;
          }
        }
      grid[j * gx + i] = Math.sqrt(best);
    }
  const out = new Float32Array(xz.length / 2);
  for (let v = 0; v < out.length; v++) {
    const fx = Math.min(gx - 1.001, Math.max(0, (xz[v * 2] - x0) / cell));
    const fz = Math.min(gz - 1.001, Math.max(0, (xz[v * 2 + 1] - z0) / cell));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const d =
      (grid[j * gx + i] * (1 - tx) + grid[j * gx + i + 1] * tx) * (1 - tz) +
      (grid[(j + 1) * gx + i] * (1 - tx) + grid[(j + 1) * gx + i + 1] * tx) * tz;
    const t = Math.min(1, Math.max(0, (d - inner) / (outer - inner)));
    out[v] = 1 - t * t * (3 - 2 * t);
  }
  return out;
}
