'use client';

import { useEffect, useRef } from 'react';

/**
 * Declarative setInterval. The latest callback is always invoked; the timer is
 * (re)started only when `delay` changes. Pass `null` to pause.
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
