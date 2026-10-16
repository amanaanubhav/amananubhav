/** `requestIdleCallback` with a timeout and a `setTimeout` fallback (Safari). Returns a cancel function. */
export function onIdle(callback: () => void, timeoutMs: number = 2000): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(() => callback(), { timeout: timeoutMs });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, Math.min(timeoutMs, 200));
  return () => window.clearTimeout(handle);
}
