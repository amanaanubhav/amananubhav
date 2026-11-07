'use client';

import { useFrame, useThree, type RootState } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Group, Mesh, PerspectiveCamera, Vector3, type Material } from 'three';

import { isBootDone } from '@/shared/lib/boot';
import { holdPlaceAcrossStatic } from '@/shared/lib/motion-tier';
import { takePrefetched } from '@/shared/lib/stage-prefetch';
import {
  emitSceneFrame,
  isSceneFrameHeld,
  setSceneFrameHeld,
  stageBufferParams,
  stageParams,
  stageProgress,
  stageTextParams,
  type SceneProps,
} from '@/shared/ui/stage';
import {
  SLOT_RENDER_PRIORITY,
  applyStoryTheme,
  setRecedeTheme,
  createStoryMarkers,
  createStoryRibbon,
  createStoryTerrain,
  createStoryTerrainCut,
  setTerrainFocus,
  createStoryUniforms,
  loadHeightfield,
  markStageFailed,
  markStageShown,
  renderIntoSlot,
  snapStageTheme,
  storyIndexAlpha,
  useSlotSize,
  useStageLive,
  type LoadedHeightfield,
  type SlotSize,
  type StoryMarkerKind,
  type StoryMarkers,
  type StoryUniforms,
} from '@/shared/ui/stage-three';

import { createCameraSample, createCameraTrack, type CameraTrack } from './story/camera';
import { buildNextSteps, loadNext, nextPoint, nextTangent, type NextData } from './story/next-scene';
import {
  NEXT_MAX_SPEED,
  NEXT_MOBILE_FRAME,
  NEXT_MOBILE_MAX_WIDTH,
  NEXT_PREFETCH_FROM,
  NEXT_REVEAL,
  NEXT_SPANS,
  NEXT_TREK_REVEAL,
  S_NEXT_REST,
  rideShareAt,
} from './story/next-timeline';
import { STORY_ROUTE_URL, STORY_TERRAIN_ID, type StoryFrame, type StoryMarkState } from './story/frame';
import { STORY_FREEZE_M, STORY_MARKS, STORY_OVERVIEW_PRIORITY, STORY_TEMPERATURE, modelledTempC } from './story/marks';
import type { StoryMarkDef } from './story/marks';
import {
  createStoryModel,
  createStoryState,
  sAtMain,
  storyAt,
  stripHeightM,
  stripNearest,
  stripPoint,
  stripTangent,
  type RouteData,
  type StoryModel,
  type StoryState,
  type XYZ,
} from './story/route';
import {
  ENTRANCE_SECONDS,
  REVEAL_SECONDS,
  S_DISSOLVE,
  S_END,
  S_OVERVIEW,
  STORY_CAMERA_KEYS,
  STORY_FRAME_X_DESKTOP,
  STORY_MOBILE_MAX_WIDTH,
  STORY_NUMERAL,
  type StoryAnchor,
} from './story/timeline';

/*
 * `relief-annapurna`: the home page's one storytelling map (design pass 3). A full-bleed relief of
 * the Annapurna massif; the page writes `progress = s / S_END` and the scene walks his route on it:
 * the camera flies the storyboard keys, the line draws as traversed (main circuit, four side trips
 * out and back), the elevation fill and the modelled temperature layers sit
 * on the terrain the whole time, and the map recedes softly under every text block the page lists.
 * Three draw calls (terrain, ribbon, markers). Labels are DOM, placed by the page from the frame
 * this scene emits (screen positions, priorities, the head readout).
 */

const KM_PER_UNIT = 3.42;
const EXAGGERATION = 2.6;
const DEG = Math.PI / 180;

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const kindOf = (def: StoryMarkDef): StoryMarkerKind | -1 =>
  def.kind === 'pass'
    ? 0
    : def.kind === 'stay' || def.kind === 'landmark'
      ? 1
      : def.kind === 'col'
        ? 2
        : def.kind === 'lake'
          ? 3
          : def.kind === 'peak'
            ? 4
            : def.kind === 'head'
              ? 5
              : def.kind === 'tick'
                ? 6
                : -1;

interface Mark extends XYZ {
  def: StoryMarkDef;
  /** Story position (vh) the head reaches it; trip marks: when its trip starts (`sTrip`). */
  sAt: number;
  sTrip: number;
  s1: number;
  /** False when the mark has no place on this route (a tick never crossed). */
  placed: boolean;
  /** Instance index in the marker mesh, or -1. */
  inst: number;
  state: StoryMarkState;
}

interface StoryData {
  hf: LoadedHeightfield;
  model: StoryModel;
  marks: Mark[];
  head: Mark;
  track: CameraTrack;
  group: Group;
  /** The story terrain and its own material (the #next handoff swaps in the cut variant, then restores it). */
  terrain: Mesh;
  terrainMaterial: Material;
  markers: StoryMarkers;
  bbox: [number, number, number, number];
  /** The climb act (vh): the summit numeral counts through it. */
  climb: { s0: number; s1: number };
  /** Camera anchors (world x, z) and the island's focus points (x, z pairs), for the #next part. */
  anchors: Readonly<Record<StoryAnchor, readonly [number, number]>>;
  focus: readonly number[];
  /** Every point of the walked lines (x, z pairs): the #next north tile keeps the story's heights under them. */
  walked: readonly number[];
  yOf(x: number, z: number): number;
  frame: StoryFrame;
  dispose(): void;
}

function buildStory(hf: LoadedHeightfield, route: RouteData, u: StoryUniforms, tier: 1 | 2): StoryData {
  const tf = hf.frame;
  const yOf = (x: number, z: number) => tf.normHeight(hf.heightAtXZ(x, z)) * EXAGGERATION;
  const ground = {
    toXZ: tf.toXZ,
    heightM: hf.heightAtXZ,
    y: (m: number) => tf.normHeight(m) * EXAGGERATION,
  };
  const model = createStoryModel(route, ground);
  const { main, trips, acts } = model;
  const wp = (id: string): [number, number] => {
    const w = route.waypoints.find((p) => p.id === id);
    return w ? tf.toXZ(w.lon, w.lat) : [0, 0];
  };
  const p = { x: 0, y: 0, z: 0 };
  const tripOut = (i: number) => acts.find((a) => a.trip === i && a.out) ?? acts[0];
  const cell = tf.width / (hf.meta.cols - 1);

  const marks: Mark[] = STORY_MARKS.map((def) => {
    const m: Mark = {
      def,
      x: 0,
      y: 0,
      z: 0,
      sAt: 0,
      sTrip: 0,
      s1: 0,
      placed: true,
      inst: -1,
      state: {
        id: def.id,
        kind: def.kind,
        x: 0,
        y: 0,
        pri: -1,
        visible: false,
        here: false,
      },
    };
    const at = (strip: typeof main, l: number) => {
      stripPoint(strip, l, p);
      m.x = p.x;
      m.y = p.y;
      m.z = p.z;
    };
    if (def.kind === 'lake' || (def.trip !== undefined && def.kind === 'pass')) {
      const trip = def.trip ?? 0;
      const strip = trips[trip];
      const [x, z] = wp(def.id);
      const r = stripNearest(strip, x, z);
      const a = tripOut(trip);
      if (def.kind === 'lake') {
        m.x = x;
        m.z = z;
        m.y = yOf(x, z);
      } else at(strip, r.l);
      m.sAt = a.s0 + a.len * (r.l / strip.total);
      m.sTrip = a.s0;
    } else if (def.seg) {
      const [l0, l1] = main.segs[def.seg];
      const r = stripNearest(main, ...wp(def.id), l0, l1);
      at(main, r.l);
      m.sAt = sAtMain(model, r.l);
    } else if (def.kind === 'peak') {
      // Snap to the heightfield's highest sample nearby (the summit, not the waypoint's rounding).
      const [x0, z0] = wp(def.id);
      let best = -1;
      for (let j = -3; j <= 3; j++)
        for (let i = -3; i <= 3; i++) {
          const h = hf.heightAtXZ(x0 + i * cell, z0 + j * cell);
          if (h > best) {
            best = h;
            m.x = x0 + i * cell;
            m.z = z0 + j * cell;
          }
        }
      m.y = tf.normHeight(best) * EXAGGERATION;
    } else if (def.kind === 'tick') {
      const level = def.level === 'freeze' ? STORY_FREEZE_M : (def.level ?? 0);
      m.placed = false;
      for (let i = 1; i < main.n; i++) {
        if (main.hm[i - 1] < level && main.hm[i] >= level) {
          at(main, main.L[i]);
          m.sAt = sAtMain(model, main.L[i]);
          m.placed = true;
          break;
        }
      }
    }
    return m;
  });
  const head = marks.find((m) => m.def.kind === 'head') ?? marks[marks.length - 1];

  // Instanced markers: every placed mark with a marker kind (the head included).
  const points: { x: number; y: number; z: number; kind: StoryMarkerKind }[] = [];
  for (const m of marks) {
    const k = kindOf(m.def);
    if (k === -1 || !m.placed) continue;
    m.inst = points.length;
    points.push({ x: m.x, y: m.y, z: m.z, kind: k });
  }

  // Camera anchors (design §15.4).
  let bx0 = Infinity;
  let bx1 = -Infinity;
  let bz0 = Infinity;
  let bz1 = -Infinity;
  for (const c of [main, ...trips])
    for (let i = 0; i < c.n; i++) {
      bx0 = Math.min(bx0, c.x[i]);
      bx1 = Math.max(bx1, c.x[i]);
      bz0 = Math.min(bz0, c.z[i]);
      bz1 = Math.max(bz1, c.z[i]);
    }
  const cx = (bx0 + bx1) / 2;
  const cz = (bz0 + bz1) / 2;
  const mean = (...ids: string[]): [number, number] => {
    const ps = ids.map(wp);
    return [ps.reduce((a, b) => a + b[0], 0) / ps.length, ps.reduce((a, b) => a + b[1], 0) / ps.length];
  };
  const anchors: Record<StoryAnchor, [number, number]> = {
    circuit: [cx - 0.4, cz + 1.2],
    // A little east of the circuit's centre: the overview sits left of the legend, so Besisahar stays clear.
    overview: [cx + 0.4, cz + 0.5],
    basin: mean('mungji', 'blue-lake', 'green-lake', 'manang'),
    ice: mean('braka', 'ice-lake', 'mungji'),
    tilicho: mean('shri-kharka', 'tilicho-lake', 'tilicho-base-camp'),
  };

  u.uHalf.value.set(tf.width / 2, tf.depth / 2);
  // The island (R29): full strength within ~5 km of the route and the peaks, gone by ~15 km.
  const focus: number[] = [];
  for (const c of [main, ...trips]) for (let i = 0; i < c.n; i += 3) focus.push(c.x[i], c.z[i]);
  for (const m of marks) if (m.def.kind === 'peak') focus.push(m.x, m.z);
  setTerrainFocus(hf.geometry, { x: tf.width / 2, y: tf.depth / 2 }, focus, 2.5, 6.5);
  const walked: number[] = [];
  for (const c of [main, ...trips]) for (let i = 0; i < c.n; i++) walked.push(c.x[i], c.z[i]);
  u.uRangeM.value = tf.maxM - tf.minM;
  u.uEx.value = EXAGGERATION;
  u.uLapse.value.set(STORY_TEMPERATURE.refM, STORY_TEMPERATURE.refC, STORY_TEMPERATURE.perKm);

  const terrain = createStoryTerrain(hf.geometry, u, {
    hillshade: tier === 2,
    frost: tier === 2,
  });
  const terrainMaterial = terrain.material as Material;
  const ribbon = createStoryRibbon([main, ...trips], u);
  const markers = createStoryMarkers(points, u);
  const group = new Group();
  group.add(terrain, ribbon, markers.mesh);

  const frame: StoryFrame = {
    s: 0,
    width: 1,
    height: 1,
    dpr: 1,
    day: 1,
    place: '',
    live: false,
    light: 0,
    intro: true,
    overview: false,
    reduced: false,
    dissolve: 0,
    numeralM: STORY_NUMERAL.fromM,
    head: { x: 0, y: 0, visible: false },
    readout: null,
    marks: marks.map((m) => m.state),
    next: null,
  };

  return {
    hf,
    model,
    marks,
    head,
    track: createCameraTrack(STORY_CAMERA_KEYS, anchors),
    group,
    terrain,
    terrainMaterial,
    markers,
    bbox: [bx0, bx1, bz0, bz1],
    climb: acts.find((a) => a.climb) ?? acts[0],
    anchors,
    focus,
    walked,
    yOf,
    frame,
    dispose() {
      for (const mesh of [terrain, ribbon, markers.mesh] as Mesh[]) {
        if (mesh === terrain) mesh.material = terrainMaterial;
        mesh.geometry.dispose();
        (mesh.material as { dispose(): void }).dispose();
      }
    },
  };
}

async function loadStory(tier: 1 | 2, signal: AbortSignal): Promise<[LoadedHeightfield, RouteData]> {
  const opts = {
    tier,
    kmPerUnit: KM_PER_UNIT,
    exaggeration: EXAGGERATION,
    signal,
  } as const;
  // The page may have prefetched it with the renderer chunk (load-in-3d §4); else (or if that failed) fetch.
  const route = (takePrefetched<RouteData>(STORY_ROUTE_URL) ?? Promise.reject()).catch(() =>
    fetch(STORY_ROUTE_URL, { signal }).then((r) => {
      if (!r.ok) throw new Error(`route: ${STORY_ROUTE_URL} answered ${r.status}`);
      return r.json() as Promise<RouteData>;
    }),
  );
  // The story sheet (design §15.2: 83.75-84.57 E, 28.08-28.92 N, wider than the plan sheet so the rim fade
  // never lands on the route); the plan sheet's own field holds the whole route too, as a fallback.
  const hf = loadHeightfield(STORY_TERRAIN_ID, opts).catch(() => loadHeightfield('annapurna', opts));
  return Promise.all([hf, route]);
}

/* ------------------------------------------------------------------------------------------------
 * Per frame
 * ---------------------------------------------------------------------------------------------- */

interface Runtime {
  s: number;
  sInit: boolean;
  introDone: boolean;
  camInit: boolean;
  camTgt: Vector3;
  /** Shaders compiled (compileAsync settled): the scene may draw. */
  ready: boolean;
  /** The first (ground-identical) frame has been drawn and the slot marked live. */
  rendered: boolean;
  /** The entrance clock (s), advanced from the second drawn frame by at most 1/30 s per frame. */
  e: number;
  /** The relief has fully risen (the theme may tween again). */
  risen: boolean;
  fitK: number;
  fitFy: number;
  /** #next: the trek reveal's clock (0..1 of its sweep) and its opacity (the 200 ms fade-out). */
  trekT: number;
  trekA: number;
  /** #next: the data was ready on the previous frame (a late arrival restarts the flight from S_END). */
  nextSeen: boolean;
  /** #next: its meshes have been drawn once (invisibly), so the GPU driver's draw-time setup is done. */
  nextWarm: boolean;
  /** #next at rest: what the last drawn frame showed (camera, size, theme, pools, line state). */
  sig: Float64Array;
  /** When the last step ran (ms): a longer gap means the renderer idled (the plate left, the tab hid). */
  lastStep: number;
  /** Frames drawn (dev QA: a still rest view stops counting). */
  draws: number;
}

const EMPTY: Readonly<Record<string, number>> = {};
const EMPTY_TEXT: Readonly<Record<string, string>> = {};
const RECT_PAD = 14;
const CHROME_PAD = 6;
/** CSS-px rects [l, t, r, b] for this frame (reused). */
const rects: number[][] = Array.from({ length: 24 }, () => [0, 0, 0, 0]);
let rectCount = 0;

function collectRects(id: SceneProps['id'], w: number, h: number): void {
  const P = stageParams.get(id) ?? EMPTY;
  rectCount = 0;
  if (P.rectN !== undefined) {
    const buf = stageBufferParams.get(id)?.rects;
    const n = Math.min(10, Math.max(0, Math.floor(P.rectN)), buf ? Math.floor(buf.length / 4) : 0);
    const device = stageTextParams.get(id)?.rectUnits === 'device';
    const wdpr = window.devicePixelRatio || 1;
    for (let i = 0; i < n && buf; i++) {
      const r = rects[rectCount++];
      const [a, b, c, d] = [buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2], buf[i * 4 + 3]];
      if (device) {
        r[0] = a / wdpr;
        r[1] = h - d / wdpr;
        r[2] = c / wdpr;
        r[3] = h - b / wdpr;
      } else {
        r[0] = a;
        r[1] = b;
        r[2] = c;
        r[3] = d;
      }
    }
    return;
  }
  // Fallback until the page writes rects: text blocks and chrome that declare themselves.
  document.querySelectorAll<HTMLElement>('[data-recede], [data-recede-chrome]').forEach((el) => {
    if (rectCount >= rects.length) return;
    const b = el.getBoundingClientRect();
    if (b.bottom < -40 || b.top > h + 40 || b.width === 0) return;
    const pad = el.hasAttribute('data-recede') ? RECT_PAD : CHROME_PAD;
    const r = rects[rectCount++];
    r[0] = b.left - pad;
    r[1] = b.top - pad;
    r[2] = Math.min(w, b.right + pad);
    r[3] = b.bottom + pad;
  });
  const used = rects.slice(0, rectCount).sort((x, y) => (y[2] - y[0]) * (y[3] - y[1]) - (x[2] - x[0]) * (x[3] - x[1]));
  used.forEach((r, i) => (rects[i] = r));
  rectCount = Math.min(10, rectCount);
}

const inWindow = (def: StoryMarkDef, s: number) => def.windows?.some(([a, b]) => s >= a && s <= b) ?? false;

interface SceneContext {
  uniforms: StoryUniforms;
  camera: PerspectiveCamera;
  rt: Runtime;
  scratch: {
    head: XYZ;
    tan: XYZ;
    /** #next: the ride head on the road, the camera's follow point on its smoothed copy, and that copy's tangent. */
    jeep: XYZ;
    rcam: XYZ;
    jtan: XYZ;
    cam: ReturnType<typeof createCameraSample>;
    tgt: Vector3;
    dir: Vector3;
    v: Vector3;
    q: Vector3;
    reduceQuery: MediaQueryList | null;
  };
  data: StoryData | null;
  story: StoryState | null;
  /** The #next part (north tile, route, track): loaded at idle once the story nears its end. */
  next: NextData | null;
  nextState: 'idle' | 'loading' | 'ready' | 'failed';
  nextAbort: AbortController | null;
  /** #next: failed loads so far (one retry at idle, then the static layout). */
  nextTries: number;
  /** #next: how long its build took on the main thread in all, and its longest step (ms; dev QA). */
  nextBuildMs: number;
  nextBuildSliceMs: number;
  /** The story terrain's cut variant (STORY_CUT), swapped in only while the handoff owns part of its box. */
  storyCut: Material | null;
  tier: 1 | 2;
}

function createSceneContext(): SceneContext {
  return {
    uniforms: createStoryUniforms(),
    camera: new PerspectiveCamera(30, 1, 0.5, 400),
    rt: {
      s: 0,
      sInit: false,
      introDone: false,
      camInit: false,
      camTgt: new Vector3(),
      ready: false,
      rendered: false,
      e: 0,
      risen: false,
      fitK: 1,
      fitFy: 0.22,
      trekT: 0,
      trekA: 0,
      nextSeen: false,
      nextWarm: false,
      sig: new Float64Array(SIG_LEN),
      lastStep: 0,
      draws: 0,
    },
    scratch: {
      head: { x: 0, y: 0, z: 0 },
      tan: { x: 0, y: 0, z: 0 },
      jeep: { x: 0, y: 0, z: 0 },
      rcam: { x: 0, y: 0, z: 0 },
      jtan: { x: 0, y: 0, z: 0 },
      cam: createCameraSample(),
      tgt: new Vector3(),
      dir: new Vector3(),
      v: new Vector3(),
      q: new Vector3(),
      reduceQuery: window.matchMedia('(prefers-reduced-motion: reduce)'),
    },
    data: null,
    story: null,
    next: null,
    nextState: 'idle',
    nextAbort: null,
    nextTries: 0,
    nextBuildMs: 0,
    nextBuildSliceMs: 0,
    storyCut: null,
    tier: 2,
  };
}

/** Wide boxes' vertical extents, sorted by top (reused; at most `rects.length`). */
const bandY0 = new Float32Array(24);
const bandY1 = new Float32Array(24);
const band: [number, number] = [0, 0];

/**
 * The tallest vertical band of the viewport that no wide box (wider than half the viewport: text blocks,
 * the navbar glass, the legend bar) covers, as [top, height]. Allocation-free.
 */
function freeBand(w: number, h: number): [number, number] {
  let n = 0;
  for (let i = 0; i < rectCount; i++) {
    const rc = rects[i];
    if (rc[2] - rc[0] <= w * 0.5 || rc[3] <= 0 || rc[1] >= h) continue;
    let j = n++;
    while (j > 0 && bandY0[j - 1] > rc[1]) {
      bandY0[j] = bandY0[j - 1];
      bandY1[j] = bandY1[j - 1];
      j--;
    }
    bandY0[j] = rc[1];
    bandY1[j] = rc[3];
  }
  let cur = 56;
  band[0] = 56;
  band[1] = 0;
  for (let i = 0; i < n; i++) {
    if (bandY0[i] - cur > band[1]) {
      band[0] = cur;
      band[1] = bandY0[i] - cur;
    }
    cur = Math.max(cur, bandY1[i]);
  }
  if (h - 8 - cur > band[1]) {
    band[0] = cur;
    band[1] = h - 8 - cur;
  }
  band[1] = Math.max(80, band[1]);
  return band;
}

/* ------------------------------------------------------------------------------------------------
 * #next (NEXT-DESIGN §5.2): lazy data, the trek's timed reveal, the still rest view
 * ---------------------------------------------------------------------------------------------- */

/** cubic-bezier(0.23, 1, 0.32, 1), the emphasised ease-out of the trek's one-time sweep (design §3.3). */
function easeReveal(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [x1, y1, x2, y2] = [0.23, 1, 0.32, 1];
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}

/**
 * Starts the #next load once (at idle): north tile + route, built off the live tree and compiled there, then added
 * to the story group. The meshes join the drawn group only once their programs have linked, so no story frame ever
 * blocks on a link (or runs the north tile's vertex shader) while the compile is pending. The story terrain's cut
 * variant (STORY_CUT) is compiled in the same pass and swapped in only while the handoff owns part of its box.
 * A failure retries once at idle; a second one publishes the static #next layout (see `publishNextStatic`).
 */
function startNextLoad(ctx: SceneContext, state: RootState): void {
  const d = ctx.data;
  if (!d || ctx.nextState !== 'idle') return;
  ctx.nextState = 'loading';
  const ac = new AbortController();
  ctx.nextAbort = ac;
  const idle = (cb: () => void) =>
    typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200);
  const fail = (error: unknown) => {
    if (ac.signal.aborted) return;
    if (process.env.NODE_ENV !== 'production') console.warn('relief-annapurna: #next data failed to load', error);
    if (ctx.nextTries < 1) {
      // One retry at idle a little later (a dropped request, a cold cache): the step restarts the load.
      ctx.nextTries += 1;
      setTimeout(() => {
        if (!ac.signal.aborted && ctx.nextState === 'failed') ctx.nextState = 'idle';
      }, 2500);
    } else publishNextStatic();
    ctx.nextState = 'failed';
  };
  idle(() => {
    if (ac.signal.aborted) return;
    loadNext(ctx.tier, KM_PER_UNIT, EXAGGERATION, ac.signal)
      .then(([hf, route]) => {
        if (ac.signal.aborted || ctx.data !== d) {
          hf.geometry.dispose();
          return;
        }
        // The build (the north heights, the strips, the marks) runs at idle, off the scroll's frames: one step per
        // idle callback, so no step is a long task.
        const step = ctx.tier === 1 ? 2 : 1;
        const steps = buildNextSteps(
          hf,
          route,
          {
            frame: d.hf.frame,
            heightM: d.hf.heightAtXZ,
            geometry: d.hf.geometry,
            grid: [Math.floor((d.hf.meta.cols - 1) / step) + 1, Math.floor((d.hf.meta.rows - 1) / step) + 1],
            focus: d.focus,
            walked: d.walked,
            overview: d.anchors.overview,
            exaggeration: EXAGGERATION,
          },
          ctx.uniforms,
          ctx.tier,
        );
        let busy = 0;
        let slice = 0;
        const built = (next: NextData) => {
          ctx.nextBuildMs = busy;
          ctx.nextBuildSliceMs = slice;
          ctx.next = next;
          const cut = createStoryTerrainCut(d.terrain, next.grow);
          ctx.storyCut = cut;
          // Compile detached: a temporary root holds the north group and a probe of the story terrain with its cut
          // material (the probe shares the story's geometry and is never drawn).
          const shown = [next.terrain, next.line.back, next.line.front, next.markers.mesh];
          shown.forEach((m) => (m.visible = true));
          const probe = new Mesh(d.terrain.geometry, cut);
          probe.frustumCulled = false;
          const holder = new Group();
          holder.add(next.group, probe);
          const done = () => {
            shown.forEach((m) => (m.visible = false));
            holder.remove(probe);
            if (ac.signal.aborted || ctx.next !== next || ctx.data !== d) return;
            d.group.add(next.group);
            ctx.uniforms.uCutBox.value.set(next.box[0], next.box[1], next.box[2], next.box[3]);
            ctx.nextState = 'ready';
          };
          state.gl.compileAsync(holder, ctx.camera, state.scene).then(done, done);
        };
        const pump = () => {
          if (ac.signal.aborted || ctx.data !== d) {
            hf.geometry.dispose();
            return;
          }
          let r: IteratorResult<undefined, NextData>;
          const t0 = performance.now();
          try {
            r = steps.next();
          } catch (error) {
            hf.geometry.dispose();
            fail(error);
            return;
          }
          const took = performance.now() - t0;
          busy += took;
          slice = Math.max(slice, took);
          if (!r.done) {
            idle(pump);
            return;
          }
          built(r.value);
        };
        idle(pump);
      })
      .catch(fail);
  });
}

/**
 * The #next data could not load (twice): the page takes #next's static layout (the north sheet in flow, no
 * transition slot), the same switch the CSS makes for a static stage. A visitor inside or below the slot keeps
 * their place through the shared hold (`holdPlaceAcrossStatic`, the same one the tier and a failed 3D load use: an
 * absolute target through Lenis, so a clamp or scroll anchoring is never counted twice).
 */
function publishNextStatic(): void {
  const html = document.documentElement;
  if (html.hasAttribute('data-next-static')) return;
  holdPlaceAcrossStatic();
  html.setAttribute('data-next-static', '');
}

function disposeNext(ctx: SceneContext): void {
  ctx.nextAbort?.abort();
  ctx.nextAbort = null;
  if (ctx.next) {
    ctx.next.group.removeFromParent();
    ctx.next.dispose();
  }
  ctx.next = null;
  if (ctx.storyCut) {
    if (ctx.data && ctx.data.terrain.material === ctx.storyCut) ctx.data.terrain.material = ctx.data.terrainMaterial;
    ctx.storyCut.dispose();
    ctx.storyCut = null;
  }
  ctx.nextState = 'idle';
  ctx.nextTries = 0;
  ctx.rt.nextWarm = false;
  ctx.rt.nextSeen = false;
  ctx.uniforms.uCutMix.value = 0;
}

/** Floats the rest view's still check compares: camera (32), size (3), theme (3), pools (43), lines (5), marks (2). */
const SIG_LEN = 88;
const sigNow = new Float64Array(SIG_LEN);
/** The first signature entry that changed on the last check that found a change (dev QA), or -1. */
let sigWhy = -1;

/** Writes this frame's signature into `sigNow`; true when it differs from `last` beyond sub-pixel noise. */
function stillChanged(
  last: Float64Array,
  camera: PerspectiveCamera,
  u: StoryUniforms,
  next: NextData,
  storyAlpha: Float32Array,
  w: number,
  h: number,
  dpr: number,
): boolean {
  let k = 0;
  for (const v of camera.matrixWorld.elements) sigNow[k++] = v;
  for (const v of camera.projectionMatrix.elements) sigNow[k++] = v;
  sigNow[k++] = w;
  sigNow[k++] = h;
  sigNow[k++] = dpr;
  sigNow[k++] = u.uDay.value;
  sigNow[k++] = u.uRecedeDay.value;
  sigNow[k++] = u.uFillMix.value;
  sigNow[k++] = u.uRectN.value;
  for (let i = 0; i < 10; i++) {
    const r = u.uRects.value[i];
    const on = i < u.uRectN.value;
    sigNow[k++] = on ? r.x : 0;
    sigNow[k++] = on ? r.y : 0;
    sigNow[k++] = on ? r.z : 0;
    sigNow[k++] = on ? r.w : 0;
  }
  sigNow[k++] = u.uLabelN.value;
  let lr = 0;
  for (let i = 0; i < u.uLabelN.value; i++) {
    const r = u.uLabelRects.value[i];
    lr += (r.x + 3 * r.y + 7 * r.z + 11 * r.w) * (i + 1);
  }
  sigNow[k++] = lr;
  const L = next.lineU;
  sigNow[k++] = L.uJeepDraw.value;
  sigNow[k++] = L.uTrekDraw.value;
  sigNow[k++] = L.uTrekAlpha.value;
  sigNow[k++] = L.uNextAlpha.value;
  sigNow[k++] = u.uCutMix.value + u.uReveal.value;
  let a = 0;
  next.markers.alpha.forEach((v, i) => (a += v * (i + 1)));
  sigNow[k++] = a;
  let b = 0;
  storyAlpha.forEach((v, i) => (b += v * (i + 1)));
  sigNow[k++] = b;
  for (let i = 0; i < SIG_LEN; i++) {
    if (Math.abs(sigNow[i] - last[i]) > 1e-4 * Math.max(1, Math.abs(sigNow[i]))) {
      sigWhy = i;
      return true;
    }
  }
  return false;
}

/**
 * Draws the group into the whole canvas. The full-bleed stage holds the canvas inside the slot, so while the
 * plate scrolls away (the slot translated) the canvas moves with it and the frame needs no offset; the shared
 * slot render would offset it by the renderer's last measured canvas position, which lags during a scroll.
 */
function renderFull(state: RootState, camera: PerspectiveCamera, target: Group): void {
  const gl = state.gl;
  const { width, height } = state.size;
  gl.setViewport(0, 0, width, height);
  gl.setScissor(0, 0, width, height);
  gl.setScissorTest(true);
  gl.render(target, camera);
}

interface NextStepInput {
  /** The #next track drives the camera (s past S_END, or reduced motion past the story). */
  on: boolean;
  /** Story position (vh), up to S_NEXT_REST. */
  s: number;
  reduced: boolean;
  dt: number;
  w: number;
  h: number;
  mob: boolean;
  labelsOn: boolean;
  /** CSS px per world unit at the camera target. */
  pxPerUnit: number;
  /** The ride head on the road (world), written by the camera step. */
  jeep: XYZ;
  q: Vector3;
  /** The scene landed after a gap: the trek's reveal takes its end state for `s` at once. */
  snap: boolean;
}

/** The reveal front's radius (world units) at story position `s`: 0 at S_END, fast at first, eased into the last. */
function revealRadius(s: number): number {
  const [s0, s1] = NEXT_SPANS.reveal;
  const t = Math.min(1, Math.max(0, (s - s0) / (s1 - s0)));
  return NEXT_REVEAL.radius * (1 - (1 - t) * (1 - t));
}

/**
 * The #next layers for this frame: the handoff (from S_END the north tile owns its box, an exact stand-in for the
 * story tile, and the reveal front grows its own relief out of Muktinath), the road scrubbed behind the ride head,
 * the trek's one-time timed reveal, and the marks (alpha, label wish, projection; none before the front reaches it).
 */
function stepNext(nx: NextData, r: Runtime, u: StoryUniforms, camera: PerspectiveCamera, o: NextStepInput): void {
  const { on, s, w, h } = o;
  const L = nx.lineU;
  const handoff = on ? sstep(S_END, NEXT_SPANS.reveal[1], s) : 0;
  u.uCutMix.value = on ? 1 : 0;
  nx.terrain.visible = on;
  const grow = nx.grow.value;
  grow.x = on ? revealRadius(s) : 0;
  grow.y = NEXT_REVEAL.band;
  // The front's reach at a world point, as the north tile's shader computes it (0 ahead of it, 1 behind it).
  const reached = (x: number, z: number) => 1 - sstep(grow.x - grow.y, grow.x, Math.hypot(x - grow.z, z - grow.w));

  // The trek: revealed once by time at NEXT_TREK_REVEAL.at; back above `resetBelow` it fades out and resets.
  const R = NEXT_TREK_REVEAL;
  if (!on) {
    r.trekT = 0;
    r.trekA = 0;
  } else if (o.reduced || (o.snap && s >= R.at)) {
    r.trekT = 1;
    r.trekA = 1;
  } else if (o.snap && s < R.resetBelow) {
    r.trekT = 0;
    r.trekA = 0;
  } else if (s >= R.at) {
    r.trekA = 1;
    r.trekT = Math.min(1, r.trekT + (o.dt * 1000) / R.ms);
  } else if (s < R.resetBelow) {
    r.trekA = Math.max(0, r.trekA - (o.dt * 1000) / R.outMs);
    if (r.trekA <= 0) r.trekT = 0;
  }
  const trekShare = easeReveal(r.trekT);
  const rideShare = on ? rideShareAt(s) : 0;
  L.uNextAlpha.value = on ? 1 : 0;
  L.uNextPxK.value = o.pxPerUnit;
  L.uJeepDraw.value = rideShare * nx.ride.total;
  // A hair past the end once complete, so the last dot is never cut by the reveal's edge.
  L.uTrekDraw.value = trekShare * nx.trek.total * (r.trekT >= 1 ? 1.01 : 1);
  L.uTrekAlpha.value = r.trekA;
  const lineOn = on && (rideShare > 0 || r.trekA > 0);
  nx.line.back.visible = lineOn;
  nx.line.front.visible = lineOn;

  // Marks: alpha and label wish per kind (design §3.2-§3.4), hidden behind ridges, projected for the labels.
  const cam = camera.position;
  const occluded = (x: number, y: number, z: number) => {
    for (let i = 1; i < 14; i++) {
      const t = (i / 14) * 0.93;
      const px = cam.x + (x - cam.x) * t;
      const pz = cam.z + (z - cam.z) * t;
      if (nx.yOf(px, pz) > cam.y + (y - cam.y) * t + 0.03) return true;
    }
    return false;
  };
  const trekAt = (share: number) => (r.trekA > 0 && trekShare >= share - 0.002 ? r.trekA : 0);
  for (const m of nx.marks) {
    const def = m.def;
    let alpha = 0;
    let pri = -1;
    switch (def.kind) {
      case 'circuit-end':
        // From S_END (no gap after the story's labels), while the road leaves it.
        pri = s >= S_END && s <= 1745 ? def.pri : -1;
        break;
      case 'jeep-start':
        alpha = sstep(m.sAt - 40, m.sAt - 20, s);
        pri = s >= m.sAt - 35 && s <= m.sAt + 80 ? def.pri : -1;
        break;
      case 'road':
        alpha = sstep(m.sAt - 35, m.sAt - 25, s);
        pri = s >= m.sAt - 30 && s <= m.sAt + 25 ? def.pri : -1;
        break;
      case 'via':
        alpha = sstep(m.sAt - 35, m.sAt - 25, s);
        pri = s >= m.sAt - 30 && s <= 1960 ? def.pri : -1;
        break;
      case 'trailhead':
        alpha = sstep(1925, 1945, s);
        pri = s >= 1930 ? def.pri : -1;
        break;
      case 'camp':
        alpha = trekAt(m.share);
        pri = alpha > 0.5 && !(def.desktopOnly && o.mob) ? def.pri : -1;
        break;
      case 'goal':
        alpha = trekAt(0.98);
        pri = alpha > 0.5 ? def.pri : -1;
        break;
      case 'summit':
        alpha = sstep(1870, 1890, s);
        pri = s >= 1880 ? def.pri : -1;
        break;
    }
    if (!on) {
      alpha = 0;
      pri = -1;
    }
    // Nothing stands on ground the front has not reached (its relief is still rising there).
    const k = def.kind === 'circuit-end' ? 1 : reached(m.x, m.z);
    alpha *= k;
    if (k < 0.5) pri = -1;
    const occ = (alpha > 0 || pri > 0) && occluded(m.x, m.y, m.z);
    if (m.inst >= 0) nx.markers.alpha[m.inst] = occ ? 0 : alpha;
    const ms = m.state;
    ms.pri = o.labelsOn ? pri : -1;
    if (ms.pri > 0) {
      o.q.set(m.x, m.y, m.z).project(camera);
      ms.x = (o.q.x * 0.5 + 0.5) * w;
      ms.y = (-o.q.y * 0.5 + 0.5) * h;
      ms.visible = !occ && o.q.z < 1 && ms.x > 6 && ms.x < w - 6 && ms.y > 6 && ms.y < h - 6;
    } else ms.visible = false;
  }
  // The ride head: a steel ring that pulls away from Muktinath, where the walked line ends, and settles into
  // Humkhola's mark.
  const [r0] = NEXT_SPANS.ride;
  const headA = on && !o.reduced ? sstep(r0 - 10, r0 + 4, s) * (1 - sstep(1950, 1972, s)) : 0;
  nx.markers.alpha[nx.headInst] = headA;
  if (headA > 0) nx.markers.setPosition(nx.headInst, o.jeep.x, o.jeep.y, o.jeep.z);
  nx.markers.mesh.visible = on;
  nx.markers.commit();

  const f = nx.frame;
  f.handoff = handoff;
  f.rest = on && s >= S_NEXT_REST - 0.5;
  f.trek = r.trekA > 0 ? trekShare : 0;
}

/** One frame: story, camera, uniforms, marks; render into the slot; emit the frame to the page. */
function stepStory(
  ctx: SceneContext,
  id: SceneProps['id'],
  slot: HTMLElement | null,
  size: SlotSize,
  markLive: () => void,
  state: RootState,
  delta: number,
): void {
  const d = ctx.data;
  const st0 = ctx.story;
  if (!d || !st0 || !slot) return;
  const { rt: r, uniforms: u, camera, scratch } = ctx;
  const { model, marks, head: headMark, frame } = d;
  const { head, tan, cam, tgt, dir, v, q } = scratch;
  const now = performance.now();
  const dt = Math.min(0.1, Math.max(0, delta));
  // The entrance clock starts on the frame after the first drawn one (that frame carries the uploads), and
  // never under the first-load curtain: until it leaves, the scene draws ground-identical frames only, so
  // the relief rises as the land falls away (preloader design §6.1). A long frame slows the rise instead of
  // making it jump.
  if (r.rendered && isBootDone()) r.e += Math.min(dt, 1 / 30);
  const w = size.width;
  const h = size.height;
  const mob = w <= STORY_MOBILE_MAX_WIDTH;
  // #next only: tablets (up to NEXT_MOBILE_MAX_WIDTH) blend into the phone framing over the handoff (one-column copy).
  const tab = !mob && w <= NEXT_MOBILE_MAX_WIDTH;
  const P = stageParams.get(id) ?? EMPTY;
  const T = stageTextParams.get(id) ?? EMPTY_TEXT;

  // ---- scroll -> s, damped (tau 0.32 s: the scrub settles in about 0.75 s)
  const progress = P.progress ?? stageProgress.get(id) ?? 0;
  // Above 1 (up to S_NEXT_REST / S_END): the #next transition and rest view.
  const sRaw = Math.min(S_NEXT_REST / S_END, Math.max(0, progress)) * S_END;
  // After a gap (the renderer idled: the plate left the view, the tab was hidden) the scene lands where the page
  // is instead of flying the stale distance (and the trek's reveal lands in its state); only past the story's end,
  // the story keeps its own behaviour.
  const gap = r.lastStep > 0 && now - r.lastStep > 300;
  r.lastStep = now;
  const snap = gap && r.rendered && (sRaw > S_END || r.s > S_END);
  // Until the first frame is drawn the scene follows the scroll exactly: the entrance reveals where the
  // visitor already is (a scroll during the load, a restored position), never a catch-up walk.
  if (!r.sInit || !r.rendered || snap) {
    r.s = sRaw;
    r.sInit = true;
  } else {
    let sNext = r.s + (sRaw - r.s) * (1 - Math.exp(-dt / 0.32));
    // Past S_END only: a speed limit on the part of the step that lies in the transition (NEXT_MAX_SPEED vh/s, a
    // long frame counts as 1/30 s), so a key jump (End, Home, a rail link) flies the corridor at about a normal
    // scroll's pace instead of crossing it in a few frames (fix2 verify P2). The story's own steps are untouched.
    const cap = NEXT_MAX_SPEED * Math.min(dt, 1 / 30);
    if (sNext > r.s) sNext = Math.min(sNext, Math.max(r.s, S_END) + cap);
    else if (r.s - cap > S_END) sNext = Math.max(sNext, r.s - cap);
    r.s = sNext;
    if (Math.abs(sRaw - r.s) < 0.01) r.s = sRaw;
  }
  // #next: its data loads at idle once the story nears its end (or on a deep link). Until it is ready the
  // story's overview holds; a late arrival flies the transition on from S_END.
  if (ctx.nextState === 'idle' && sRaw >= NEXT_PREFETCH_FROM) startNextLoad(ctx, state);
  const nx = ctx.nextState === 'ready' ? ctx.next : null;
  // A late arrival flies the transition on from S_END only while the visitor is inside it; at the rest view (a deep
  // link, the rail, a restored scroll) the scene lands there directly and the trek's reveal plays once.
  if (nx && !r.nextSeen && r.s > S_END) r.s = sRaw >= S_NEXT_REST - 0.5 ? sRaw : S_END;
  r.nextSeen = nx !== null;
  const reduced =
    (P.reduced ?? 0) > 0.5 ||
    scratch.reduceQuery?.matches === true ||
    document.documentElement.dataset.motion === 'off';
  // Past S_END the #next track takes the camera and the story holds its end state (`s`, `sc` stop at S_END).
  // Reduced motion: the story's calm final state, or past the story the still rest view.
  const nextOn = nx !== null && (reduced ? sRaw > S_END : r.s > S_END);
  const sAll = nextOn ? (reduced ? S_NEXT_REST : r.s) : reduced ? S_OVERVIEW + 60 : Math.min(r.s, S_END);
  const s = Math.min(sAll, S_END);
  const sc = reduced ? 0 : s; // reduced: the final state, seen from the calm establishing pose

  // ---- the entrance (load-in-3d §3): the relief rises out of the ground, already 3D, never holding the
  // walk back (R8). `time` is only the ambient sway's clock (0 = navigation start).
  const t0 = P.t0 ?? (window as Window & { __t0?: number }).__t0 ?? 0;
  const time = (now - t0) / 1000;
  const intro = reduced || r.introDone ? 1 : Math.min(1, r.e / ENTRANCE_SECONDS);
  if (intro >= 1) r.introDone = true;
  const introOn = intro < 1 && sRaw < 2;
  // Ease in-out: the frames right after the ground change least, and no frame carries a big step.
  const reveal = reduced ? 1 : sstep(0, 1, r.e / REVEAL_SECONDS);
  if (reveal >= 1) r.risen = true;
  const st = storyAt(model, s, model.introL * sstep(0.3, 1, intro), st0);
  const overview = s >= S_OVERVIEW;
  const strip = st.strip === 0 ? model.main : model.trips[st.strip - 1];
  stripPoint(strip, st.l, head);
  const headAlt = stripHeightM(strip, st.l);

  // ---- recede rects (CSS px) -> device px, bottom-left
  collectRects(id, w, h);
  const dpr = state.gl.getPixelRatio();
  for (let i = 0; i < 10; i++) {
    const rc = rects[i];
    if (i < rectCount) u.uRects.value[i].set(rc[0] * dpr, (h - rc[3]) * dpr, rc[2] * dpr, (h - rc[1]) * dpr);
  }
  u.uRectN.value = rectCount;
  u.uFeather.value = (mob ? 64 : 112) * dpr;
  u.uRadius.value = 26 * dpr;
  // Compact pools under the #next map labels (the label layer's boxes, one frame behind; none in the story).
  const lbuf = stageBufferParams.get(id)?.labelRects;
  const ln = nextOn && lbuf ? Math.min(8, Math.max(0, Math.floor(P.labelN ?? 0)), Math.floor(lbuf.length / 4)) : 0;
  for (let i = 0; i < ln && lbuf; i++) {
    const k = i * 4;
    u.uLabelRects.value[i].set(lbuf[k] * dpr, (h - lbuf[k + 3]) * dpr, lbuf[k + 2] * dpr, (h - lbuf[k + 1]) * dpr);
  }
  u.uLabelN.value = ln;
  u.uLabelFeather.value = 18 * dpr;

  // ---- camera
  // Ambient life; it settles into the still rest view (no drift and no sun jitter at rest).
  const amb = reduced ? 0 : 1 - sstep(NEXT_SPANS.settle[0], NEXT_SPANS.settle[1], sAll);
  if (nx && nextOn) nx.track(sAll, cam);
  else d.track(sc, cam);
  const az = (cam.az + amb * 1.1 * Math.sin((time * 2 * Math.PI) / 19)) * DEG;
  const pitch = (cam.pitch + amb * 0.6 * Math.sin((time * 2 * Math.PI) / 27)) * DEG;
  const mHero = 1 - sstep(10, 110, sc);
  // The entrance's settle: a short dolly in (ease-out), at the hero pose only (a deep scroll gets none).
  const settle = 1 + 0.04 * (1 - intro) ** 3 * mHero;
  const mOver = sstep(1430, 1535, sc);
  // Mobile (design §11): a wider, higher establishing shot, the walking framing, then the overview
  // framed into the free band above entry 6 (B14: the text never sits over the receded overview).
  if (mob && mOver > 0 && !nextOn) {
    // The largest free vertical band between the wide boxes (text blocks, the navbar, the legend bar):
    // above entry 6, below it, or between blocks, so the overview never sits under the text (B14).
    const [top, span] = freeBand(w, h);
    // Projected height of the route's bbox with the current fit.
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const [x, z] of [
      [d.bbox[0], d.bbox[2]],
      [d.bbox[1], d.bbox[2]],
      [d.bbox[0], d.bbox[3]],
      [d.bbox[1], d.bbox[3]],
    ]) {
      q.set(x, d.yOf(x, z), z).project(camera);
      const sy = (-q.y * 0.5 + 0.5) * h;
      y0 = Math.min(y0, sy);
      y1 = Math.max(y1, sy);
    }
    const want = Number.isFinite(y1 - y0) ? Math.min(2.6, Math.max(0.7, (r.fitK * (y1 - y0)) / (span * 0.86))) : 1;
    const k = r.rendered ? 1 - Math.exp(-dt / 0.3) : 1;
    r.fitK += (want - r.fitK) * k;
    r.fitFy += ((top + span / 2) / h - r.fitFy) * k;
  } else if (!nextOn) {
    r.fitK += (1 - r.fitK) * (1 - Math.exp(-dt / 0.3));
  }
  // Hero: the whole circuit in the band between the navbar and the headline (the copy sits low, above the
  // legend bar), so Besisahar is not under the h1.
  const mobK = (1.5 + 1.0 * mHero + 0.9 * mOver) * (1 + (r.fitK - 1) * mOver);
  const mobFy = (0.34 - 0.16 * mHero) * (1 - mOver) + r.fitFy * mOver;
  // #next on phones and tablets: from the overview's fit to the subject framing (x 0.5, y 0.36, dist x 1.2) over the
  // handoff, the zoom blended in log space (a steady zoom on top of the track's own log-space dolly).
  const hN = nextOn ? sstep(S_END, NEXT_SPANS.handoff[1], sAll) : 0;
  const zoom = mob ? mobK * (NEXT_MOBILE_FRAME.zoom / mobK) ** hN : tab ? NEXT_MOBILE_FRAME.zoom ** hN : 1;
  const dist = cam.dist * zoom * settle;
  const fov = cam.fov + (mob ? 8 : tab ? 8 * hN : 0);
  const follow = reduced ? 0 : cam.follow;
  stripTangent(strip, st.l, tan);
  let fh: XYZ = head;
  let ft: XYZ = tan;
  if (nx && nextOn) {
    // The ride head on the road (its mark), and the camera's follow point on the road's smoothed copy.
    const rl = rideShareAt(sAll) * nx.ride.total;
    nextPoint(nx.ride, rl, scratch.jeep);
    nextPoint(nx.rideCam, rl, scratch.rcam);
    nextTangent(nx.rideCam, rl, scratch.jtan);
    fh = scratch.rcam;
    ft = scratch.jtan;
  }
  tgt.set(cam.ax, 0, cam.az_);
  v.set(fh.x + ft.x * cam.lead, 0, fh.z + ft.z * cam.lead);
  tgt.lerp(v, follow);
  tgt.y = (nx && nextOn ? nx.yOf(tgt.x, tgt.z) : d.yOf(tgt.x, tgt.z)) * 0.7;
  if (!r.camInit || !r.rendered || snap) {
    r.camTgt.copy(tgt);
    r.camInit = true;
  } else r.camTgt.lerp(tgt, 1 - Math.exp(-dt / 0.4));
  // At the #next rest view the damped target lands exactly (sub-pixel), so the still view stops redrawing.
  if (nextOn && sAll >= S_NEXT_REST && r.camTgt.distanceToSquared(tgt) < 1e-6) r.camTgt.copy(tgt);
  dir.set(Math.sin(az) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(az) * Math.cos(pitch));
  camera.position.copy(r.camTgt).addScaledVector(dir, -dist);
  if (nx && nextOn) {
    // A floor under the #next camera, 1.2 world units over the ground (the keys keep it above 4; a guard only).
    const floorY = nx.yOf(camera.position.x, camera.position.z) + 1.2;
    if (camera.position.y < floorY) camera.position.y = floorY;
  }
  camera.up.set(0, 1, 0);
  camera.lookAt(r.camTgt);
  camera.fov = fov;
  camera.aspect = w / h;
  const fx = mob ? 0.5 : tab ? STORY_FRAME_X_DESKTOP + (NEXT_MOBILE_FRAME.x - STORY_FRAME_X_DESKTOP) * hN : STORY_FRAME_X_DESKTOP;
  const fy = mob ? mobFy + (NEXT_MOBILE_FRAME.y - mobFy) * hN : tab ? 0.5 + (NEXT_MOBILE_FRAME.y - 0.5) * hN : 0.5;
  camera.setViewOffset(w, h, -(fx - 0.5) * w, -(fy - 0.5) * h, w, h);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const tanH = Math.tan((fov * DEG) / 2);
  const pxPerUnit = h / (2 * tanH * dist);

  // ---- uniforms
  const day = u.uDay.value;
  u.uResolution.value.set(w, h);
  u.uDpr.value = dpr;
  u.uPxScale.value = (2 * tanH) / h;
  u.uTime.value = time;
  u.uPulse.value = reduced ? 0 : 1;
  u.uDrawMain.value = st.drawn;
  u.uDrawTrip.value.set(st.trips[0], st.trips[1], st.trips[2], st.trips[3]);
  u.uDashK.value = pxPerUnit / 9;
  u.uHatchK.value = pxPerUnit / 6;
  u.uMinorK.value = 1 - sstep(16, 30, dist);
  // Establishing shot: the whole circuit reads as the promise of the walk (.7), settling to .4.
  u.uGhost.value = overview ? 0.4 : 0.7 - 0.3 * sstep(10, 100, s);
  u.uIndex.value = storyIndexAlpha(day) * (1 - 0.4 * sstep(30, 60, dist / zoom));
  u.uWarmK.value = overview ? 0 : 1 - sstep(13, 17, dist / zoom);
  u.uFadeNear.value = dist * 0.9;
  u.uFadeFar.value = dist * 2.6;
  // Temperature strengthens with the climb; at the overview it rests at half.
  const cold = overview ? 0.5 : sstep(1200, 5200, headAlt);
  const temp = T.layer === 'temp';
  u.uIso.value = temp ? 1 : 0.38 + 0.62 * cold;
  u.uHatch.value = temp ? 1 : 0.12 + 0.88 * cold;
  u.uFillMix.value += ((temp ? 0 : 1) - u.uFillMix.value) * (1 - Math.exp(-dt / 0.12));
  applyStoryTheme(u, day, sstep(2500, 5400, headAlt)); // the light cools with altitude
  const sunAz = (150 + amb * 8 * Math.sin(time / 9)) * DEG;
  const sunEl = (38 - 10 * sstep(3000, 5400, headAlt)) * DEG;
  u.uLight.value.set(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunAz) * Math.cos(sunEl));
  // The map no longer dissolves (NEXT-DESIGN §3.1): it flies on into #next. `dissolve` still fades the story's
  // legend (0.4) and labels (0.5) on the page.
  const dissolve = sstep(S_DISSOLVE, S_END, r.s);
  u.uFade.value = 1;
  u.uLive.value = 1;
  u.uReveal.value = r.rendered ? reveal : reduced ? 1 : 0;

  // ---- the stop the head is at, and its readout (cited altitude, or the last 500 m contour)
  let here: Mark | null = null;
  let hd = 0.09;
  let best: Mark | null = null;
  let bd = 0.12;
  for (const m of marks) {
    const k = m.def.kind;
    const dd = Math.hypot(m.x - head.x, m.z - head.z);
    const onStrip =
      ((k === 'stay' || k === 'pass' || k === 'landmark' || k === 'col') &&
        st.strip === 0 &&
        m.def.trip === undefined) ||
      (k === 'lake' && st.strip - 1 === m.def.trip);
    if (onStrip && m.def.name && dd < hd) {
      hd = dd;
      here = m;
    }
    if (m.def.altM !== null && (k === 'stay' || k === 'landmark' || k === 'col' || k === 'lake') && dd < bd) {
      bd = dd;
      best = m;
    }
  }
  const hereNow = here !== null && !overview && intro >= 1;
  // No numbers on the Blue, Green and Ice branches (approximate positions), during the arrival,
  // at the overview or under reduced motion.
  const readoutOn = !(st.strip >= 1 && st.strip <= 3) && !introOn && !overview && !reduced;
  if (readoutOn) {
    const at = best?.def.altM ?? null;
    frame.readout = frame.readout ?? { at: null, altM: 0, tempC: 0 };
    frame.readout.at = best && at !== null ? best.def.id : null;
    frame.readout.altM = at ?? Math.max(500, Math.floor(headAlt / 500) * 500);
    frame.readout.tempC = modelledTempC(at ?? headAlt);
  } else frame.readout = null;

  // ---- label priorities (design §8.2), marker alpha, occlusion, projection
  const labelsOn = (P.labels ?? 1) > 0.5;
  const camPos = camera.position;
  const occluded = (x: number, y: number, z: number) => {
    for (let i = 1; i < 14; i++) {
      const t = (i / 14) * 0.93;
      const px = camPos.x + (x - camPos.x) * t;
      const pz = camPos.z + (z - camPos.z) * t;
      if (d.yOf(px, pz) > camPos.y + (y - camPos.y) * t + 0.03) return true;
    }
    return false;
  };
  headMark.x = head.x;
  headMark.y = head.y;
  headMark.z = head.z;
  if (headMark.inst >= 0) d.markers.setPosition(headMark.inst, head.x, head.y, head.z);
  for (const m of marks) {
    const def = m.def;
    const ms = m.state;
    let pri = -1;
    if (m.placed && labelsOn) {
      switch (def.kind) {
        case 'head':
          pri = overview || reduced || hereNow || introOn || !frame.readout ? -1 : 11;
          break;
        case 'pass':
          pri = s >= m.sAt - 6 && s <= m.sAt + 38 ? 7 : -1;
          break;
        case 'stay':
          pri =
            s < m.sAt - 6
              ? -1
              : s - m.sAt < 55
                ? 7.5
                : Math.hypot(m.x - head.x, m.z - head.z) < 4.5
                  ? 3 - Math.min(2, (s - m.sAt) / 300)
                  : -1;
          break;
        case 'landmark':
          pri = s >= m.sAt - 6 ? 6.5 : -1;
          break;
        case 'col':
          pri = s < 110 ? 8 : s >= 1100 ? 10 : -1;
          break;
        case 'lake':
          pri = def.name && s >= m.sTrip ? (st.strip - 1 === def.trip ? 12 : 5) : -1;
          break;
        case 'peak':
          pri = inWindow(def, s) ? 6 : -1;
          break;
        case 'tick':
          pri = s >= m.sAt - 3 && s <= m.sAt + 36 ? 4.5 : -1;
          break;
        case 'note':
          pri = s >= m.sAt && s <= m.s1 ? 7 : -1;
          break;
      }
      if (overview && def.kind !== 'head') {
        pri = STORY_OVERVIEW_PRIORITY[def.id] ?? (def.kind === 'peak' && inWindow(def, s) ? 6 : -1);
      }
    }
    if (nextOn) pri = -1; // past the story: the #next labels take over
    ms.pri = pri;
    ms.here = m === here && hereNow;

    let alpha = 0;
    if (m.inst >= 0) {
      if (def.kind === 'head') alpha = overview || reduced ? 0 : 1;
      else if (def.kind === 'peak') alpha = 0.8;
      else if (def.kind === 'lake') alpha = s >= m.sTrip || overview ? 1 : 0.55;
      else if (def.kind === 'tick') alpha = pri > 0 ? 1 : 0;
      else alpha = s >= m.sAt - 1 || overview ? 1 : 0;
      // Past the story the circuit's marks leave (Muktinath stays: the circuit's end, design §3.2 K2).
      if (nextOn && def.id !== 'ranipauwa-muktinath') alpha *= 1 - sstep(S_END, S_END + 50, sAll);
    }
    const occ = def.kind !== 'head' && (alpha > 0 || pri > 0) && occluded(m.x, m.y, m.z);
    if (m.inst >= 0) d.markers.alpha[m.inst] = occ ? 0 : alpha;
    if (pri > 0 || def.kind === 'head') {
      q.set(m.x, m.y, m.z).project(camera);
      ms.x = (q.x * 0.5 + 0.5) * w;
      ms.y = (-q.y * 0.5 + 0.5) * h;
      ms.visible = !occ && q.z < 1 && ms.x > 6 && ms.x < w - 6 && ms.y > 6 && ms.y < h - 6;
    } else ms.visible = false;
  }
  d.markers.commit();
  if (nx) {
    stepNext(nx, r, u, camera, {
      on: nextOn,
      s: sAll,
      reduced,
      dt,
      w,
      h,
      mob: mob || tab,
      labelsOn,
      pxPerUnit,
      jeep: scratch.jeep,
      q,
      snap,
    });
  }
  // The story terrain carries the cut (a `discard`) only while the north tile owns its box (past S_END): before
  // S_END, and whenever the north data is not ready, it draws with its own program, exactly as the story always has.
  const cutOn = nx !== null && ctx.storyCut !== null && u.uCutMix.value > 0;
  d.terrain.material = cutOn && ctx.storyCut ? ctx.storyCut : d.terrainMaterial;

  // ---- render (not before the shaders are compiled). The first drawn frame is the ground exactly (uReveal 0)
  // and marks the slot live: the canvas is shown on that frame, with no crossfade, and the rise starts on the
  // next one. At the #next rest view the scene draws only when something it shows has changed (a pool moved,
  // the theme, the size, the trek's reveal); otherwise it skips the draw and holds the canvas (design §5.2).
  let drawn = false;
  let hold = false;
  const plateY = P.plateY ?? 0;
  if (r.ready) {
    let draw = true;
    if (nx && nextOn && sAll >= S_NEXT_REST - 0.5 && r.rendered) {
      const changed = stillChanged(r.sig, camera, u, nx, d.markers.alpha, w, h, dpr);
      // Skip only when the canvas still shows the last frame (this frame was held: no clear ran).
      if (!changed && isSceneFrameHeld(id)) draw = false;
      hold = !changed;
    }
    if (draw) {
      if (plateY !== 0) {
        renderFull(state, camera, d.group);
        drawn = true;
      } else drawn = renderIntoSlot(state, slot, camera, d.group);
      if (drawn) {
        r.draws += 1;
        if (nx && nextOn) r.sig.set(sigNow);
      }
    }
    // Once the #next data is ready (still inside the story), draw its meshes once on top with every fragment
    // discarded (no handoff, no line, no marks yet) and no clear: the driver's draw-time shader work happens now,
    // not on the first frame of the handoff.
    if (drawn && nx && !nextOn && !r.nextWarm) {
      r.nextWarm = true;
      const meshes = [nx.terrain, nx.line.back, nx.line.front, nx.markers.mesh];
      const was = meshes.map((m) => m.visible);
      meshes.forEach((m) => (m.visible = true));
      const autoClear = state.gl.autoClear;
      state.gl.autoClear = false;
      renderIntoSlot(state, slot, camera, nx.group);
      // The story terrain's cut program too, with the cut taking every pixel (a huge box, full mix): nothing lands.
      if (ctx.storyCut) {
        const box = u.uCutBox.value.clone();
        const mix = u.uCutMix.value;
        u.uCutBox.value.set(-1e9, -1e9, 1e9, 1e9);
        u.uCutMix.value = 1;
        d.terrain.material = ctx.storyCut;
        renderIntoSlot(state, slot, camera, d.terrain);
        d.terrain.material = d.terrainMaterial;
        u.uCutBox.value.copy(box);
        u.uCutMix.value = mix;
      }
      state.gl.autoClear = autoClear;
      meshes.forEach((m, i) => (m.visible = was[i]));
    }
  }
  setSceneFrameHeld(id, hold && r.rendered);
  if (drawn && !r.rendered) {
    r.rendered = true;
    markLive();
  }
  if (r.rendered && u.uReveal.value >= 0.6) markStageShown(slot);

  // ---- scene -> page
  frame.s = sAll;
  frame.width = w;
  frame.height = h;
  frame.dpr = dpr;
  frame.day = st.act.day;
  frame.place = overview ? '' : st.act.place;
  frame.live = r.rendered;
  frame.light = u.uReveal.value;
  frame.intro = intro < 1;
  frame.overview = overview;
  frame.reduced = reduced;
  frame.dissolve = dissolve;
  const climb = d.climb;
  frame.next = nx ? nx.frame : null;
  frame.numeralM =
    s >= climb.s1
      ? STORY_NUMERAL.toM
      : Math.round(
          (STORY_NUMERAL.fromM + (STORY_NUMERAL.toM - STORY_NUMERAL.fromM) * sstep(climb.s0 + 10, climb.s1, s)) / 2,
        ) * 2;
  frame.head.x = headMark.state.x;
  frame.head.y = headMark.state.y;
  frame.head.visible = !overview && !reduced && headMark.state.visible;
  emitSceneFrame(id, frame);
  if (process.env.NODE_ENV !== 'production') {
    // QA handle (dev builds only): the last frame, draw stats and the story state.
    (window as Window & { __story?: unknown }).__story = {
      frame,
      calls: state.gl.info.render.calls,
      triangles: state.gl.info.render.triangles,
      drawn: st.drawn,
      l: st.l,
      strip: st.strip,
      dpr,
      /** #next: frames drawn so far (a still rest view stops counting), state and the damped s. */
      draws: r.draws,
      next: {
        state: ctx.nextState,
        on: nextOn,
        s: sAll,
        held: hold,
        why: sigWhy,
        warm: r.nextWarm,
        buildMs: ctx.nextBuildMs,
        buildSliceMs: ctx.nextBuildSliceMs,
        cut: d.terrain.material === ctx.storyCut,
        /** The north tile's reveal radius (world units) and whether this frame landed after a gap. */
        reveal: ctx.next ? ctx.next.grow.value.x : 0,
        snap,
      },
      /** RGBA of a CSS-px block of the canvas (rendered now), top row first. */
      pixels(x: number, y: number, bw: number, bh: number) {
        const ctx3 = state.gl.getContext();
        renderIntoSlot(state, slot, camera, d.group);
        const W = Math.round(bw * dpr);
        const Hh = Math.round(bh * dpr);
        const buf = new Uint8Array(W * Hh * 4);
        ctx3.readPixels(Math.round(x * dpr), Math.round((h - y - bh) * dpr), W, Hh, ctx3.RGBA, ctx3.UNSIGNED_BYTE, buf);
        return { W, H: Hh, data: Array.from(buf) };
      },
      bench(n = 90) {
        const gl = state.gl;
        const ctx3 = gl.getContext();
        const px = new Uint8Array(4);
        const ts: number[] = [];
        for (let i = 0; i < n; i++) {
          const t = performance.now();
          renderIntoSlot(state, slot, camera, d.group);
          ctx3.readPixels(0, 0, 1, 1, ctx3.RGBA, ctx3.UNSIGNED_BYTE, px);
          ts.push(performance.now() - t);
        }
        ts.sort((x, y) => x - y);
        return { median: ts[n >> 1], p90: ts[Math.floor(n * 0.9)] };
      },
    };
  }
}

export default function ReliefAnnapurnaScene({ id, tier, slot, isDark }: SceneProps) {
  const ctxRef = useRef<SceneContext | null>(null);
  if (ctxRef.current === null) ctxRef.current = createSceneContext();
  const size = useSlotSize(slot);
  const markLive = useStageLive(slot);
  const [group, setGroup] = useState<Group | null>(null);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const ac = new AbortController();
    let built: StoryData | null = null;
    ctx.tier = tier;
    loadStory(tier, ac.signal)
      .then(([hf, route]) => {
        if (ac.signal.aborted) {
          hf.geometry.dispose();
          return;
        }
        built = buildStory(hf, route, ctx.uniforms, tier);
        ctx.data = built;
        ctx.story = createStoryState(built.model);
        setGroup(built.group);
      })
      .catch((error: unknown) => {
        // Missing data: the slot is marked failed and the page shows its static map; nothing else breaks.
        if (ac.signal.aborted) return;
        markStageFailed(slot);
        if (process.env.NODE_ENV !== 'production') console.warn('relief-annapurna: story data failed to load', error);
      });
    return () => {
      ac.abort();
      // The #next part hangs off the story's group and world frame: it is rebuilt with the story.
      disposeNext(ctx);
      if (ctx.data === built) ctx.data = null;
      built?.dispose();
    };
  }, [tier, slot]);

  // A held frame belongs to this scene's last draw: never leave the renderer holding after it unmounts.
  useEffect(() => () => setSceneFrameHeld(id, false), [id]);

  // Compile the three programs before the first frame, in parallel where the driver allows
  // (KHR_parallel_shader_compile); the scene draws once they are ready (a rejection still lets it draw).
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!group || !ctx) return;
    let done = false;
    const ready = () => {
      if (!done) ctx.rt.ready = true;
    };
    gl.compileAsync(group, ctx.camera, scene).then(ready, ready);
    return () => {
      done = true;
    };
  }, [group, gl, scene]);

  // The pools under text take the target theme at once (the map's colours tween for 700 ms). Until the
  // relief has risen, the map's colours snap too, so its ground-identical frames always match the page
  // ground (which the view transition swaps at once).
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    setRecedeTheme(ctx.uniforms, isDark);
    if (!ctx.rt.risen) snapStageTheme(isDark ? 'night' : 'day');
  }, [isDark]);

  useFrame((state, delta) => {
    const ctx = ctxRef.current;
    if (ctx) stepStory(ctx, id, slot, size.current, markLive, state, delta);
  }, SLOT_RENDER_PRIORITY);

  return group ? <primitive object={group} /> : null;
}
