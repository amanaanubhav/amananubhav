import { lazy, useCallback, useEffect, useRef, useSyncExternalStore, type ComponentType, type LazyExoticComponent } from 'react';

/*
 * The DOM side of the stage (§C.5). No three.js imports here: this module ships in the initial
 * chunk with StageSlot and StageCanvas, and the renderer chunk reads it after it loads.
 */

export type SceneId = 'relief-annapurna' | 'sky';

export interface SceneProps {
  id: SceneId;
  tier: 1 | 2;
  slot: HTMLElement | null;
  isDark: boolean;
}

export type SceneLoader = () => Promise<{ default: ComponentType<SceneProps> }>;

export interface StageSceneEntry {
  readonly id: SceneId;
  readonly load: SceneLoader;
  readonly Scene: LazyExoticComponent<ComponentType<SceneProps>>;
  readonly slot: HTMLElement;
  /** True while the slot intersects the viewport (rootMargin 50% 0px). */
  readonly visible: boolean;
  /**
   * The slot is the page's full-bleed stage (fixed, inset 0): the renderer moves its canvas inside
   * the slot (poster and canvas are one map element) and caps the DPR at 1.25.
   */
  readonly fullBleed: boolean;
  /** Arm the canvas on the next frame after boot instead of on idle (the home story, load-in-3d §4). */
  readonly eager: boolean;
}

export interface StageSceneOptions {
  fullBleed?: boolean;
  eager?: boolean;
}

/* ------------------------------------------------------------------------------------------------
 * Per-frame values. Written by page ScrollTriggers, read by scenes inside useFrame. Never React state.
 * ---------------------------------------------------------------------------------------------- */

const progress = new Map<SceneId, number>();
const params = new Map<SceneId, Record<string, number>>();
const textParams = new Map<SceneId, Record<string, string>>();
const bufferParams = new Map<SceneId, Record<string, Float32Array>>();

export const stageProgress: ReadonlyMap<SceneId, number> = progress;
/** Numeric params (booleans are stored as 1 / 0). */
export const stageParams: ReadonlyMap<SceneId, Readonly<Record<string, number>>> = params;
/** String params, e.g. `layer: 'alt' | 'temp'`. */
export const stageTextParams: ReadonlyMap<SceneId, Readonly<Record<string, string>>> = textParams;
/** Array params, e.g. the recede `rects` (copied into a Float32Array the scene reads). */
export const stageBufferParams: ReadonlyMap<SceneId, Readonly<Record<string, Float32Array>>> = bufferParams;

export type SceneParamValue = number | boolean | string | Float32Array | readonly number[];

export function setSceneProgress(id: SceneId, value: number): void {
  progress.set(id, Number.isFinite(value) ? value : 0);
}

function recordOf<T>(map: Map<SceneId, Record<string, T>>, id: SceneId): Record<string, T> {
  let record = map.get(id);
  if (!record) {
    record = {};
    map.set(id, record);
  }
  return record;
}

/**
 * Page -> scene, read by the scene inside useFrame (never React state). Numbers and booleans go to
 * `stageParams`, strings to `stageTextParams`, arrays to `stageBufferParams` (copied, so the caller
 * may reuse its array).
 */
export function setSceneParam(id: SceneId, key: string, value: SceneParamValue): void {
  if (typeof value === 'number') recordOf(params, id)[key] = Number.isFinite(value) ? value : 0;
  else if (typeof value === 'boolean') recordOf(params, id)[key] = value ? 1 : 0;
  else if (typeof value === 'string') recordOf(textParams, id)[key] = value;
  else {
    const record = recordOf(bufferParams, id);
    let buffer = record[key];
    if (!buffer || buffer.length < value.length) buffer = record[key] = new Float32Array(Math.max(value.length, 4));
    buffer.fill(0);
    buffer.set(value);
  }
}

/* ------------------------------------------------------------------------------------------------
 * Scene -> page frames. A scene emits one frame object per rendered frame (the same object, mutated
 * in place); DOM overlays (labels, readouts) subscribe and write transforms in the same tick.
 * ---------------------------------------------------------------------------------------------- */

const frameListeners = new Map<SceneId, Set<(frame: unknown) => void>>();
const lastFrames = new Map<SceneId, unknown>();

export function emitSceneFrame(id: SceneId, frame: unknown): void {
  lastFrames.set(id, frame);
  frameListeners.get(id)?.forEach((listener) => listener(frame));
}

/** Subscribes to a scene's frames; returns the unsubscribe function. */
export function subscribeSceneFrame<T>(id: SceneId, listener: (frame: T) => void): () => void {
  let set = frameListeners.get(id);
  if (!set) {
    set = new Set();
    frameListeners.set(id, set);
  }
  const wrapped = listener as (frame: unknown) => void;
  set.add(wrapped);
  return () => {
    set.delete(wrapped);
  };
}

/** The last frame a scene emitted (undefined before its first frame). */
export function lastSceneFrame<T>(id: SceneId): T | undefined {
  return lastFrames.get(id) as T | undefined;
}

/** Calls `listener` with every frame of `id` while mounted (the latest listener, no resubscribe). */
export function useSceneFrame<T>(id: SceneId, listener: (frame: T) => void): void {
  const ref = useRef(listener);
  useEffect(() => {
    ref.current = listener;
  });
  useEffect(() => subscribeSceneFrame<T>(id, (frame) => ref.current(frame)), [id]);
}

/* ------------------------------------------------------------------------------------------------
 * Scene registry: which scenes the current page shows, their slots and visibility.
 * ---------------------------------------------------------------------------------------------- */

const lazyScenes = new WeakMap<SceneLoader, LazyExoticComponent<ComponentType<SceneProps>>>();

function lazyScene(load: SceneLoader): LazyExoticComponent<ComponentType<SceneProps>> {
  let Scene = lazyScenes.get(load);
  if (!Scene) {
    Scene = lazy(load);
    lazyScenes.set(load, Scene);
  }
  return Scene;
}

let entries: readonly StageSceneEntry[] = [];
const listeners = new Set<() => void>();

function commit(next: readonly StageSceneEntry[]): void {
  entries = next;
  listeners.forEach((listener) => listener());
}

function registerScene(id: SceneId, load: SceneLoader, slot: HTMLElement, fullBleed: boolean, eager: boolean): void {
  const entry: StageSceneEntry = { id, load, Scene: lazyScene(load), slot, visible: false, fullBleed, eager };
  commit([...entries.filter((e) => e.id !== id), entry]);
}

function unregisterScene(id: SceneId, slot: HTMLElement): void {
  if (!entries.some((e) => e.id === id && e.slot === slot)) return;
  commit(entries.filter((e) => !(e.id === id && e.slot === slot)));
}

function setSceneVisible(id: SceneId, slot: HTMLElement, visible: boolean): void {
  const current = entries.find((e) => e.id === id && e.slot === slot);
  if (!current || current.visible === visible) return;
  commit(entries.map((e) => (e === current ? { ...e, visible } : e)));
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const EMPTY: readonly StageSceneEntry[] = [];
const getSnapshot = () => entries;
const getServerSnapshot = () => EMPTY;

/** Registered scenes, live (the renderer maps them to `<group visible>` hosts). */
export function useStageEntries(): readonly StageSceneEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Cheap per-frame check for the renderer's ticker. */
export function hasVisibleScene(): boolean {
  return entries.some((e) => e.visible);
}

/**
 * Registers `id` while the returned ref callback holds an element, and tracks its visibility.
 * `load` must be a module-level constant (`() => import('../scenes/X')`) so the lazy scene is
 * created once and never remounts between renders.
 */
export function useStageScene(
  id: SceneId,
  load: SceneLoader,
  options: StageSceneOptions = {},
): (el: HTMLElement | null) => void {
  const fullBleed = options.fullBleed === true;
  const eager = options.eager === true;
  const state = useRef<{ el: HTMLElement | null; observer: IntersectionObserver | null }>({
    el: null,
    observer: null,
  });

  return useCallback(
    (el: HTMLElement | null) => {
      const current = state.current;
      if (current.el === el) return;

      if (current.el) {
        current.observer?.disconnect();
        unregisterScene(id, current.el);
        current.el = null;
        current.observer = null;
      }
      if (!el) return;

      current.el = el;
      registerScene(id, load, el, fullBleed, eager);
      if (typeof IntersectionObserver === 'undefined') {
        setSceneVisible(id, el, true);
        return;
      }
      const observer = new IntersectionObserver(
        (records) => {
          const last = records[records.length - 1];
          if (last) setSceneVisible(id, el, last.isIntersecting);
        },
        { rootMargin: '50% 0px' },
      );
      observer.observe(el);
      current.observer = observer;
    },
    [id, load, fullBleed, eager],
  );
}
