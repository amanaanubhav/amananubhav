import { lazy, useCallback, useRef, useSyncExternalStore, type ComponentType, type LazyExoticComponent } from 'react';

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
}

/* ------------------------------------------------------------------------------------------------
 * Per-frame values. Written by page ScrollTriggers, read by scenes inside useFrame. Never React state.
 * ---------------------------------------------------------------------------------------------- */

const progress = new Map<SceneId, number>();
const params = new Map<SceneId, Record<string, number>>();

export const stageProgress: ReadonlyMap<SceneId, number> = progress;
export const stageParams: ReadonlyMap<SceneId, Readonly<Record<string, number>>> = params;

export function setSceneProgress(id: SceneId, value: number): void {
  progress.set(id, Number.isFinite(value) ? value : 0);
}

export function setSceneParam(id: SceneId, key: string, value: number): void {
  let record = params.get(id);
  if (!record) {
    record = {};
    params.set(id, record);
  }
  record[key] = value;
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

function registerScene(id: SceneId, load: SceneLoader, slot: HTMLElement): void {
  const entry: StageSceneEntry = { id, load, Scene: lazyScene(load), slot, visible: false };
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
export function useStageScene(id: SceneId, load: SceneLoader): (el: HTMLElement | null) => void {
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
      registerScene(id, load, el);
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
    [id, load],
  );
}
