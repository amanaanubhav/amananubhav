import { useEffect, useState } from 'react';

/**
 * A module loaded once, on demand, through a dynamic `import()`, so its code stays out of every route's
 * initial scripts (§J.2). After it resolves, `get()` returns it synchronously.
 */
export interface LazyModule<T> {
  /** The loaded value, or `null` until `load()` has resolved. */
  get(): T | null;
  /** Starts the import once; a failed load (offline) clears itself so the next call retries. */
  load(): Promise<T>;
}

export function lazyModule<T>(factory: () => Promise<T>): LazyModule<T> {
  let value: T | null = null;
  let pending: Promise<T> | null = null;
  return {
    get: () => value,
    load: () =>
      (pending ??= factory().then(
        (loaded) => {
          value = loaded;
          return loaded;
        },
        (error: unknown) => {
          pending = null;
          throw error;
        },
      )),
  };
}

function onIdle(callback: () => void, timeoutMs: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

/**
 * The loaded value of `mod`, or `null` while it loads. `needed`: load it now (the UI is opening).
 * `warm`: otherwise fetch it when the browser is idle, so a later open renders in the same commit
 * (shared `layoutId` morphs and enter animations stay intact).
 */
export function useLazyModule<T>(mod: LazyModule<T>, { needed, warm }: { needed: boolean; warm: boolean }): T | null {
  const [value, setValue] = useState<T | null>(() => mod.get());

  useEffect(() => {
    if (value !== null || (!needed && !warm)) return;
    let cancelled = false;
    const run = () => {
      mod.load().then(
        (loaded) => {
          // Functional form: `loaded` may itself be a function (a component).
          if (!cancelled) setValue(() => loaded);
        },
        () => {
          // Offline or a stale deployment: stay closed; the next open retries.
        },
      );
    };
    if (needed) {
      run();
      return () => {
        cancelled = true;
      };
    }
    const cancelIdle = onIdle(run, 4000);
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [mod, needed, warm, value]);

  return value;
}

/**
 * Starts `load` (a dynamic `import()`) once the browser is idle while `enabled`, so a code-split UI that opens
 * later finds its chunk already fetched. Failures are ignored: the UI's own loader retries when it opens.
 */
export function useIdlePreload(load: () => Promise<unknown>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    return onIdle(() => {
      load().catch(() => {});
    }, 4000);
  }, [load, enabled]);
}
