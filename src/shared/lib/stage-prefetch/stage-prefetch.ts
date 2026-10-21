/*
 * Early fetches for a stage scene's data (load-in-3d §4). Three-free and tiny, so the page can start the
 * downloads in parallel with the renderer chunk; the scene's loader takes the promise instead of fetching
 * again. Each promise is handed out once; a rejected prefetch makes the loader fall back to its own fetch.
 */

export type PrefetchKind = 'json' | 'buffer';

const pending = new Map<string, Promise<unknown>>();

/** Starts fetching `url` (once) and keeps the parsed body (JSON, or an ArrayBuffer) for `takePrefetched`. */
export function prefetch(url: string, kind: PrefetchKind): void {
  if (pending.has(url)) return;
  const promise = fetch(url).then((response) => {
    if (!response.ok) throw new Error(`prefetch: ${url} answered ${response.status}`);
    return kind === 'json' ? (response.json() as Promise<unknown>) : response.arrayBuffer();
  });
  promise.catch(() => {}); // surfaced (and retried) by the consumer
  pending.set(url, promise);
}

/** The prefetched body of `url`, handed out once, or undefined when nothing was prefetched. */
export function takePrefetched<T>(url: string): Promise<T> | undefined {
  const promise = pending.get(url);
  if (!promise) return undefined;
  pending.delete(url);
  return promise as Promise<T>;
}
