import { useEffect, useSyncExternalStore } from 'react';

/** Distance (CSS px) inside which a dimmed chrome element counts as "near" the pointer (§C.8). */
const NEAR_PX = 80;

let dimmed = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

const getSnapshot = () => dimmed;
const getServerSnapshot = () => false;

/**
 * Dims every `[data-chrome]` element to 40% (the summit hold, §C.8). The CSS in globals.css keeps
 * hovered, focused (`:focus-within`) and `[data-near]` elements at full opacity.
 * Callers must reset to `false` when they leave the hold and on unmount.
 */
export function setChromeDimmed(on: boolean): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.chromeDim = on ? 'on' : 'off';
  }
  if (dimmed === on) return;
  dimmed = on;
  listeners.forEach((listener) => listener());
}

function distanceToRect(x: number, y: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}

function clearNear(): void {
  document.querySelectorAll('[data-chrome][data-near]').forEach((el) => el.removeAttribute('data-near'));
}

/**
 * Used once by the shell. While the chrome is dimmed, a passive, rAF-throttled `pointermove`
 * listener marks `[data-chrome]` elements within 80 px of the pointer with `data-near`.
 * No listener at all while the chrome is not dimmed.
 */
export function useChromeProximity(): void {
  const isDimmed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!isDimmed) return;
    let frame = 0;
    let x = 0;
    let y = 0;

    const update = () => {
      frame = 0;
      document.querySelectorAll<HTMLElement>('[data-chrome]').forEach((el) => {
        const near = distanceToRect(x, y, el.getBoundingClientRect()) <= NEAR_PX;
        if (near) el.setAttribute('data-near', '');
        else el.removeAttribute('data-near');
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frame) cancelAnimationFrame(frame);
      clearNear();
    };
  }, [isDimmed]);
}
