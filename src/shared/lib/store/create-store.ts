import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(callback: () => void): () => void;
  /** React hook: subscribes the calling component; the server snapshot is the initial value. */
  use(): T;
}

/** Tiny module-level external store for feature-owned global UI state. */
export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  const get = () => state;
  const getServerSnapshot = () => initial;

  const set: Store<T>['set'] = (value) => {
    const next = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
    if (Object.is(next, state)) return;
    state = next;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  };

  function use(): T {
    return useSyncExternalStore(subscribe, get, getServerSnapshot);
  }

  return { get, set, subscribe, use };
}
