'use client';

import { useFrame } from '@react-three/fiber';
import { damp, damp3 } from 'maath/easing';
import { useEffect, useRef, useState } from 'react';
import { Box3, PerspectiveCamera, Vector3 } from 'three';

import { ANNAPURNA_ROUTE, ANNAPURNA_SIDE_TRIPS } from '@/entities/expedition';
import { stageProgress, type SceneProps } from '@/shared/ui/stage';
import {
  ContourTerrain,
  RouteRibbon,
  SCENE_DRIVER_PRIORITY,
  SectionCurtain,
  TentMark,
  buildRouteCurve,
  createReliefUniforms,
  loadHeightfield,
  useSlotRender,
  useSlotSize,
  useStageLive,
  type LoadedHeightfield,
  type ReliefUniforms,
  type RouteCurve,
} from '@/shared/ui/stage-three';

/*
 * `relief-annapurna` (§G.1, §G.8): the contour relief of the Annapurna circuit in the `#meander`
 * slot. The page writes p = t / 6.6 through `setSceneProgress`; each frame this scene damps a local
 * copy, maps it back to t and sets uniforms and the camera pose from t alone (no React state per
 * frame). Seven draw calls at most: terrain, curtain, ribbon, rings, tent glow, tent, head.
 */

const T_MAX = 6.6;
const FOV = 35;
const TAN = Math.tan((FOV * Math.PI) / 360);
const DEG = Math.PI / 180;
const MAX_YAW = 25 * DEG;
const SMOOTH = 0.25;
/** P4's tilt: the §C.5 limit, so the side elevation stays oblique. */
const P4_TILT = 58 * DEG;
/** Where the camera starts back from P4 to P0 (the table's 5.6, brought forward for the tilt rate). */
const RETURN_START = 5.4;
const Y = new Vector3(0, 1, 0);
const NORTH = new Vector3(0, 0, -1);
/** Chrome over the slot (QA round 1): the rail zone at >= 1024 px and the bottom legend strip. */
const RAIL_ZONE = 256;
const RAIL_MIN_VIEWPORT = 1024;
const LEGEND_STRIP = 56;
/** Framed routes keep this margin to the safe area's edge (1 = touching). */
const MARGIN = 1.22;
const MIN_DIST = 4;
/** Where P1 pulls the head toward (safe-area NDC: left of centre), and how hard (0..1). */
const HEAD_X = -0.22;
const HEAD_Y = 0.24;
const HEAD_PULL = 0.6;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, w: number) => a + (b - a) * w;

/**
 * A camera pose, kept both as positions and in orbit terms (target, horizontal forward, tilt from
 * straight down, distance), so poses blend in orbit space: tilt then changes at a known rate.
 */
interface Pose {
  pos: Vector3;
  tgt: Vector3;
  fwd: Vector3;
  tilt: number;
  dist: number;
}
const newPose = (): Pose => ({ pos: new Vector3(), tgt: new Vector3(), fwd: new Vector3(0, 0, -1), tilt: 0, dist: 1 });

/**
 * The part of the slot no chrome covers: the camera's principal point sits at its centre (a view
 * offset), and poses frame into it with `tan` (half height per unit of depth) and `aspect`.
 */
interface SafeView {
  tan: number;
  aspect: number;
}

interface Rig {
  hf: LoadedHeightfield;
  main: RouteCurve;
  sides: RouteCurve[];
  /** Mean heading (first to last waypoint), horizontal unit. */
  heading: Vector3;
  /** Bbox centre of the route (main and side trips) and its half extent along the heading. */
  center: Vector3;
  alongHalf: number;
  draw: { chame: number; manang: number; pass: number };
  pass: Vector3;
  /** The tent at Manang: (x, normalised height, z). */
  tent: Vector3;
  /** 1.5 km of route as a fraction of the main route. */
  ahead: number;
  /** Framing samples (x, normalised height, z): whole route, Besisahar to Chame, to Manang + trips. */
  frames: [Float32Array, Float32Array, Float32Array];
  /** P1's heads: Chame, Manang (x, normalised height, z). */
  heads: [Vector3, Vector3];
}

/** Rotates `heading` toward `dir` about the vertical, by at most ±25° (§C.5). */
function clampYaw(dir: Vector3, heading: Vector3, out: Vector3): Vector3 {
  const sin = heading.z * dir.x - heading.x * dir.z;
  const cos = heading.x * dir.x + heading.z * dir.z;
  const angle = Math.max(-MAX_YAW, Math.min(MAX_YAW, Math.atan2(sin, cos)));
  return out.copy(heading).applyAxisAngle(Y, angle);
}

/** Pose looking along `fwd` at `tgt`, tilted `tilt` from straight down, `dist` away. */
function orbit(out: Pose, tgt: Vector3, fwd: Vector3, tilt: number, dist: number): Pose {
  out.tgt.copy(tgt);
  out.fwd.copy(fwd);
  out.tilt = tilt;
  out.dist = dist;
  out.pos.copy(tgt).addScaledVector(fwd, -Math.sin(tilt) * dist).addScaledVector(Y, Math.cos(tilt) * dist);
  return out;
}

/** Fills a pose's orbit terms from its `pos` and `tgt` (horizontal forward falls back to `fallback`). */
function fromLook(out: Pose, fallback: Vector3): Pose {
  const dx = out.tgt.x - out.pos.x;
  const dy = out.tgt.y - out.pos.y;
  const dz = out.tgt.z - out.pos.z;
  const horiz = Math.hypot(dx, dz);
  if (horiz > 1e-6) out.fwd.set(dx / horiz, 0, dz / horiz);
  else out.fwd.copy(fallback);
  out.tilt = Math.atan2(horiz, -dy);
  out.dist = Math.hypot(horiz, dy);
  return out;
}

const blendTgt = new Vector3();
const blendFwd = new Vector3();

/**
 * Blends two poses in orbit space: target linear, yaw by the shorter angle, tilt linear, distance
 * geometric. Tilt therefore moves at exactly `|b.tilt - a.tilt|` per unit of `w` (§C.5 tilt rate).
 */
function blend(a: Pose, b: Pose, w: number, out: Pose): void {
  const yaw = Math.atan2(a.fwd.z * b.fwd.x - a.fwd.x * b.fwd.z, a.fwd.x * b.fwd.x + a.fwd.z * b.fwd.z);
  blendFwd.copy(a.fwd).applyAxisAngle(Y, yaw * w);
  blendTgt.lerpVectors(a.tgt, b.tgt, w);
  const dist = Math.exp(lerp(Math.log(Math.max(a.dist, 1e-3)), Math.log(Math.max(b.dist, 1e-3)), w));
  orbit(out, blendTgt, blendFwd, lerp(a.tilt, b.tilt, w), dist);
}

const fitR = new Vector3();
const fitU = new Vector3();
const fitV = new Vector3();
const fitE = new Vector3();
const fitBase = new Vector3();
const fitHead = new Vector3();

/** Point `i` of `points` (x, normalised height, z triples), heights scaled by `ex`, minus `from`. */
function pointOf(points: Float32Array, i: number, ex: number, from: Vector3): Vector3 {
  return fitE.set(points[i], points[i + 1] * ex, points[i + 2]).sub(from);
}

/** Smallest distance at which every point sits inside the safe view around `tgt`. */
function fitDist(points: Float32Array, ex: number, tgt: Vector3, view: SafeView): number {
  let dist = MIN_DIST;
  for (let i = 0; i < points.length; i += 3) {
    const e = pointOf(points, i, ex, tgt);
    const z = e.dot(fitV);
    dist = Math.max(
      dist,
      (Math.abs(e.dot(fitR)) * MARGIN) / (view.tan * view.aspect) - z,
      (Math.abs(e.dot(fitU)) * MARGIN) / view.tan - z,
    );
  }
  return dist;
}

/**
 * Frames route `points` from direction (`fwd`, `tilt`) inside the safe view (QA round 1: the route,
 * not the tile, is the subject), pulling `head` toward HEAD_X/HEAD_Y so it stays clear of the chrome.
 */
function fit(out: Pose, points: Float32Array, ex: number, fwd: Vector3, tilt: number, view: SafeView, head?: Vector3): Pose {
  const s = Math.sin(tilt);
  const c = Math.cos(tilt);
  fitV.set(fwd.x * s, -c, fwd.z * s);
  fitR.set(-fwd.z, 0, fwd.x);
  fitU.set(fwd.x * c, s, fwd.z * c);
  let a0 = Infinity;
  let a1 = -Infinity;
  let b0 = Infinity;
  let b1 = -Infinity;
  fitBase.set(points[0], points[1] * ex, points[2]);
  for (let i = 0; i < points.length; i += 3) {
    const e = pointOf(points, i, ex, fitBase);
    a0 = Math.min(a0, e.dot(fitR));
    a1 = Math.max(a1, e.dot(fitR));
    b0 = Math.min(b0, e.dot(fitU));
    b1 = Math.max(b1, e.dot(fitU));
  }
  fitBase.addScaledVector(fitR, (a0 + a1) / 2).addScaledVector(fitU, (b0 + b1) / 2);
  const tgt = out.tgt.copy(fitBase);
  let dist = fitDist(points, ex, tgt, view);
  if (head) {
    // A fixed point (it contracts: the shift grows by HEAD_PULL x |HEAD_*| of the view per unit).
    const h = fitHead.copy(head).setY(head.y * ex).sub(fitBase);
    for (let i = 0; i < 4; i++) {
      const hh = (dist + h.dot(fitV)) * view.tan;
      tgt
        .copy(fitBase)
        .addScaledVector(fitR, (h.dot(fitR) - HEAD_X * hh * view.aspect) * HEAD_PULL)
        .addScaledVector(fitU, (h.dot(fitU) - HEAD_Y * hh) * HEAD_PULL);
      dist = fitDist(points, ex, tgt, view);
    }
  }
  return orbit(out, tgt, fwd, tilt, dist);
}

/** Every 6th sample of each curve up to `upTo` (and its last one), as (x, normalised height, z). */
function samplesOf(curves: readonly RouteCurve[], upTo = 1): Float32Array {
  const out: number[] = [];
  for (const curve of curves) {
    let last = 0;
    for (let i = 0; i < curve.count && curve.dist[i] <= upTo + 1e-6; i++) last = i;
    for (let i = 0; i <= last; i = i < last ? Math.min(i + 6, last) : last + 1) {
      out.push(curve.xz[i * 2], curve.hn[i], curve.xz[i * 2 + 1]);
    }
  }
  return Float32Array.from(out);
}

function buildRig(hf: LoadedHeightfield): Rig {
  const { frame, heightAtXZ } = hf;
  const main = buildRouteCurve(ANNAPURNA_ROUTE, frame, { heightAtXZ });
  const sides = ANNAPURNA_SIDE_TRIPS.map((trip) => buildRouteCurve(trip, frame, { heightAtXZ, density: 40 }));

  const first = new Vector3(main.xz[0], 0, main.xz[1]);
  const last = new Vector3(main.xz[(main.count - 1) * 2], 0, main.xz[(main.count - 1) * 2 + 1]);
  const heading = last.clone().sub(first).normalize();

  const whole = samplesOf([main, ...sides]);
  const center = new Box3().setFromArray(whole).getCenter(new Vector3()).setY(0);
  let alongHalf = 0;
  for (let i = 0; i < main.count; i++) {
    const d = heading.x * (main.xz[i * 2] - center.x) + heading.z * (main.xz[i * 2 + 1] - center.z);
    alongHalf = Math.max(alongHalf, Math.abs(d));
  }

  const passDist = main.nodeDist('Thorong La') ?? 0.85;
  const pass = main.pointAt(passDist, new Vector3());
  const routeKm = main.length * frame.kmPerUnit;
  const manang = main.nodeDist('Manang') ?? 0.6;
  const chame = main.nodeDist('Chame') ?? 0.3;
  const toManang = samplesOf([main], manang);
  const trips = samplesOf(sides);

  return {
    hf,
    main,
    sides,
    heading,
    center,
    alongHalf,
    draw: { chame, manang, pass: passDist },
    pass,
    tent: main.pointAt(manang, new Vector3()),
    ahead: routeKm > 0 ? 1.5 / routeKm : 0.01,
    frames: [whole, samplesOf([main], chame), Float32Array.of(...toManang, ...trips)],
    heads: [main.pointAt(chame, new Vector3()), main.pointAt(manang, new Vector3())],
  };
}

/** Route reveal along the main route by t (§G.1 table). */
function drawAt(t: number, d: Rig['draw']): number {
  if (t < 1) return 0;
  if (t < 2) return lerp(0, d.chame, smooth(1, 2, t));
  if (t < 3) return lerp(d.chame, d.manang, smooth(2, 2.7, t));
  if (t < 4) return lerp(d.manang, d.pass, smooth(3, 4, t));
  if (t < 4.6) return d.pass;
  return lerp(d.pass, 1, smooth(4.6, 5.3, t));
}

function reliefAt(t: number): number {
  if (t < 1) return 0.05;
  if (t < 2) return lerp(0.05, 0.35, t - 1);
  if (t < 3) return lerp(0.35, 0.6, t - 2);
  if (t < 4) return lerp(0.6, 1, t - 3);
  return 1;
}

interface FrameState {
  ready: boolean;
  p: number;
  cam: Pose;
  goal: Pose;
  poses: [Pose, Pose, Pose, Pose, Pose];
  v: Vector3;
  w: Vector3;
  up: Vector3;
  /** P1's two framings (to Chame, to Manang), blended. */
  pa: Pose;
  pb: Pose;
  /** The view offset last applied (CSS px), so the projection is rebuilt only on change. */
  offset: [number, number, number, number];
}

function createFrameState(): FrameState {
  return {
    ready: false,
    p: 0,
    cam: newPose(),
    goal: newPose(),
    poses: [newPose(), newPose(), newPose(), newPose(), newPose()],
    v: new Vector3(),
    w: new Vector3(),
    up: new Vector3(),
    pa: newPose(),
    pb: newPose(),
    offset: [0, 0, 0, 0],
  };
}

/** Writes the goal pose for t and the profile plane (which faces pose P4). */
function solvePoses(rig: Rig, s: FrameState, u: ReliefUniforms, t: number, view: SafeView): void {
  const [p0, p1, p2, p3, p4] = s.poses;
  const ex = u.uExaggeration.value * u.uRelief.value;
  const { v, w } = s;
  const { aspect } = view;

  // P0: plan, straight down, north up, framing the whole route (shown as a ghost) in the safe area.
  // (A plan view is read north-up; the ±25° yaw rule governs the oblique poses.)
  fit(p0, rig.frames[0], ex, NORTH, 0, view);

  // P1: oblique overview, 32° tilt along the mean heading, framing the route drawn so far
  // (Besisahar to Chame in entry 2, then to Manang with the side trips) with its head left-centre.
  fit(s.pa, rig.frames[1], ex, rig.heading, 32 * DEG, view, rig.heads[0]);
  fit(s.pb, rig.frames[2], ex, rig.heading, 32 * DEG, view, rig.heads[1]);
  // The Chame-to-Manang reframe completes with entry 2, so entry 3 holds P1 still (§G.1: the calmest entry).
  blend(s.pa, s.pb, smooth(1.4, 2, t), p1);

  // P2: route-follow: 3 units behind and 2.4 above the head, looking 1.5 km ahead (tilt <= 58°).
  const f = u.uDraw.value;
  const head = rig.main.pointAt(f, v);
  head.y = head.y * ex + u.uDrape.value;
  clampYaw(rig.main.tangentAt(f, w), rig.heading, p2.fwd);
  rig.main.pointAt(Math.min(1, f + rig.ahead), p2.tgt);
  p2.tgt.y = p2.tgt.y * ex + u.uDrape.value;
  p2.pos.copy(head).addScaledVector(p2.fwd, -3).addScaledVector(Y, 2.4);
  fromLook(p2, p2.fwd);
  clampYaw(p2.fwd, rig.heading, p2.fwd); // the look-ahead point can turn it a few degrees further
  // Tilt from the nominal geometry (3 back, 2.4 up, 1.5 km ahead), not from the ground under the
  // head, so terrain bumps never tip the camera (and the tilt rate stays within §C.5).
  const nominal = Math.atan2(3 + rig.ahead * rig.main.length, 2.4);
  orbit(p2, p2.tgt, p2.fwd, Math.min(nominal, P4_TILT), p2.dist);

  // P3: summit: Thorong La on the left third, 50° tilt, slight yaw.
  const d3 = 7;
  clampYaw(w.copy(rig.heading).applyAxisAngle(Y, 12 * DEG), rig.heading, p3.fwd);
  v.copy(rig.pass).setY(rig.pass.y * ex);
  w.crossVectors(p3.fwd, Y).normalize();
  v.addScaledVector(w, (d3 * view.tan * aspect) / 3);
  orbit(p3, v, p3.fwd, 50 * DEG, d3);

  // P4: side elevation, perpendicular to the mean heading (tilt held at the 58° limit).
  const d4 = Math.max((rig.alongHalf * 1.15) / (view.tan * aspect), 6);
  w.crossVectors(Y, rig.heading).normalize();
  v.copy(rig.center).setY(ex * 0.35);
  orbit(p4, v, w, P4_TILT, d4);

  // The unrolled profile: a 2:1 plane facing P4, in the lower part of the view.
  v.subVectors(p4.tgt, p4.pos).normalize();
  const up = s.up.copy(Y).addScaledVector(v, -v.y).normalize();
  const right = w.crossVectors(v, up).normalize();
  const halfH = d4 * view.tan;
  const width = Math.min(1.72 * halfH * aspect, 2.3 * halfH);
  u.uProfileRight.value.copy(right).multiplyScalar(width);
  u.uProfileUp.value.copy(up).multiplyScalar(width / 2);
  u.uProfileOrigin.value.copy(p4.tgt).addScaledVector(up, -halfH + width / 4 + halfH * 0.12);

  // Poses blend in orbit space (tilt linear in the blend weight). Peak tilt rates, in degrees per
  // segment: P0-P1 32 x 1.5 = 48; P1-P2 (about 23) x 1.5 / 0.8 = 43; P2-P3 and P3-P4 under 40;
  // P4-P0 58 / 1.2 = 48. All under §C.5's 1° per 2% of a segment (50 per segment).
  if (t < 1) blend(p0, p0, 0, s.goal);
  else if (t < 2) blend(p0, p1, smooth(1, 2, t), s.goal);
  else if (t < 3) blend(p1, p1, 0, s.goal);
  else if (t < 4) blend(p1, p2, smooth(3, 3.8, t), s.goal);
  else if (t < 4.6) blend(p2, p3, smooth(4, 4.3, t), s.goal);
  else if (t < RETURN_START) blend(p3, p4, smooth(4.6, 5, t), s.goal);
  // Back to plan, linear from the moment the canvas profile has faded (5.3 to 5.4) to the end.
  else blend(p4, p0, clamp01((t - RETURN_START) / (T_MAX - RETURN_START)), s.goal);
}

/*
 * One relief scene exists at a time (one slot per page), so its uniforms and camera live at module
 * scope: plain three.js objects written every frame, holding no GPU resources.
 */
const uniforms = createReliefUniforms();
const camera = new PerspectiveCamera(FOV, 1, 0.05, 200);
const safeView: SafeView = { tan: TAN, aspect: 1 };

/**
 * The chrome over the slot, in CSS px: the rail zone (the right 256 px of the viewport at >= 1024 px)
 * and the legend strip along the bottom. Measured on resize only (the slot is sticky, so scrolling
 * never moves it sideways); read inside `useFrame`.
 */
function useChromeInsets(slot: HTMLElement | null) {
  const insets = useRef({ right: 0, bottom: LEGEND_STRIP });
  useEffect(() => {
    if (!slot) return;
    const measure = () => {
      const rect = slot.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const rail = vw >= RAIL_MIN_VIEWPORT ? rect.right - (vw - RAIL_ZONE) : 0;
      insets.current.right = Math.min(Math.max(0, rail), rect.width * 0.45);
      insets.current.bottom = Math.min(LEGEND_STRIP, rect.height * 0.2);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(slot);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [slot]);
  return insets;
}

export default function ReliefAnnapurnaScene({ id, tier, slot }: SceneProps) {
  const [rig, setRig] = useState<Rig | null>(null);
  const state = useRef<FrameState | null>(null);
  const size = useSlotSize(slot);
  const insets = useChromeInsets(slot);
  const markLive = useStageLive(slot);

  useEffect(() => {
    const controller = new AbortController();
    let built: Rig | null = null;
    loadHeightfield('annapurna', { tier, signal: controller.signal })
      .then((hf) => {
        if (controller.signal.aborted) {
          hf.geometry.dispose();
          return;
        }
        try {
          built = buildRig(hf);
        } catch (error) {
          hf.geometry.dispose();
          throw error;
        }
        setRig(built);
      })
      .catch((error: unknown) => {
        // Missing or malformed data: the slot keeps its SSR poster (§C.5).
        if (!controller.signal.aborted && process.env.NODE_ENV !== 'production') {
          console.warn('relief-annapurna: heightfield unavailable; keeping the poster.', error);
        }
      });
    return () => {
      controller.abort();
      built?.hf.geometry.dispose();
    };
  }, [tier]);

  useEffect(() => {
    if (!slot || !rig) return;
    slot.setAttribute('data-stage-source', rig.hf.meta.source === 'procedural' ? 'illustrative' : 'measured');
    return () => slot.removeAttribute('data-stage-source');
  }, [slot, rig]);

  useFrame((_, rawDelta) => {
    if (!rig) return;
    const s = (state.current ??= createFrameState());
    const u = uniforms;
    const delta = Math.min(Math.max(rawDelta, 0), 0.1);
    const goal = clamp01(stageProgress.get(id) ?? 0);
    if (s.ready) damp(s, 'p', goal, SMOOTH, delta);
    else s.p = goal;
    const t = s.p * T_MAX;

    const { width, height } = size.current;
    const aspect = width / height;
    // The principal point sits at the centre of the safe area (slot minus rail zone and legend), so
    // every pose frames its subject clear of the chrome; the rest of the slot is bleed.
    const { right, bottom } = insets.current;
    const o = s.offset;
    if (o[0] !== width || o[1] !== height || o[2] !== right || o[3] !== bottom) {
      o.splice(0, 4, width, height, right, bottom);
      camera.aspect = aspect;
      camera.setViewOffset(width, height, right / 2, bottom / 2, width, height);
    } else if (Math.abs(camera.aspect - aspect) > 1e-4) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    const safeH = Math.max(1, height - bottom);
    safeView.tan = (TAN * safeH) / height;
    safeView.aspect = Math.max(1, width - right) / safeH;
    u.uResolution.value.set(width, height);
    u.uPxPerUnit.value = height / (2 * TAN);
    u.uHalfSize.value.set(rig.hf.frame.width / 2, rig.hf.frame.depth / 2);
    u.uRangeM.value = rig.hf.frame.maxM - rig.hf.frame.minM;

    const relief = reliefAt(t);
    const routeAlpha = smooth(0.85, 1.05, t);
    u.uRelief.value = relief;
    u.uDim.value = 1 - 0.45 * smooth(2, 2.5, t) * (1 - smooth(3, 3.5, t));
    u.uIntervalHalf.value = smooth(4, 4.2, t) * (1 - smooth(4.6, 4.8, t));
    u.uDraw.value = drawAt(t, rig.draw);
    u.uSideDraw.value = smooth(2.3, 2.9, t);
    u.uGraph.value = 1 - smooth(3, 3.4, t);
    u.uRouteAlpha.value = routeAlpha;
    u.uHeadAlpha.value = routeAlpha;
    u.uTent.value = smooth(2.1, 2.6, t) * (1 - smooth(3, 3.5, t));
    u.uUnroll.value = smooth(4.75, 5.25, t);
    // The canvas profile is gone before the camera leaves P4 (the plane is placed facing P4).
    u.uCurtainAlpha.value = smooth(4.6, 4.72, t) * (1 - smooth(5.3, RETURN_START, t));
    u.uFade.value = 1 - 0.7 * smooth(5.3, 5.6, t) * (1 - smooth(5.8, 6.3, t));
    u.uTentAt.value.copy(rig.tent);

    solvePoses(rig, s, u, t, safeView);
    if (s.ready) {
      damp3(s.cam.pos, s.goal.pos, SMOOTH, delta);
      damp3(s.cam.tgt, s.goal.tgt, SMOOTH, delta);
      damp3(s.cam.fwd, s.goal.fwd, SMOOTH, delta);
    } else {
      s.cam.pos.copy(s.goal.pos);
      s.cam.tgt.copy(s.goal.tgt);
      s.cam.fwd.copy(s.goal.fwd);
      s.ready = true;
    }

    // No roll: near plan view the screen-up is the forward heading, otherwise world up.
    const view = s.v.subVectors(s.cam.tgt, s.cam.pos);
    const dist = view.length();
    const horiz = Math.hypot(view.x, view.z) / Math.max(dist, 1e-6);
    const k = smooth(0.08, 0.35, horiz);
    camera.position.copy(s.cam.pos);
    camera.up.copy(s.cam.fwd).multiplyScalar(1 - k).addScaledVector(Y, k).normalize();
    camera.lookAt(s.cam.tgt);

    u.uFadeNear.value = dist;
    u.uFadeFar.value = dist * 2.4;
    u.uHillshade.value = smooth(0.15, 0.5, relief) * smooth(0.07, 0.3, horiz);
  }, SCENE_DRIVER_PRIORITY);

  useSlotRender(slot, rig ? camera : null, { onRender: markLive });

  if (!rig) return null;
  return (
    <>
      <ContourTerrain geometry={rig.hf.geometry} uniforms={uniforms} hillshade={tier === 2} />
      <SectionCurtain
        curve={rig.main}
        points={ANNAPURNA_ROUTE}
        floorHn={0}
        rangeM={rig.hf.frame.maxM - rig.hf.frame.minM}
        uniforms={uniforms}
      />
      <RouteRibbon main={rig.main} sideTrips={rig.sides} uniforms={uniforms} />
      <TentMark uniforms={uniforms} />
    </>
  );
}
