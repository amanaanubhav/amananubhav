'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';

export interface SlotSize {
  /** CSS px. */
  width: number;
  height: number;
}

/**
 * The slot's size in CSS px, kept current by a ResizeObserver (no layout read per frame). Read
 * `ref.current` inside `useFrame`.
 */
export function useSlotSize(slot: HTMLElement | null): RefObject<SlotSize> {
  const size = useRef<SlotSize>({ width: 1, height: 1 });

  useEffect(() => {
    if (!slot) return;
    const apply = (width: number, height: number) => {
      size.current.width = Math.max(1, width);
      size.current.height = Math.max(1, height);
    };
    apply(slot.clientWidth, slot.clientHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((records) => {
      const box = records[records.length - 1]?.contentRect;
      if (box) apply(box.width, box.height);
    });
    observer.observe(slot);
    return () => observer.disconnect();
  }, [slot]);

  return size;
}

/**
 * Marks the slot live (`data-stage-live`, which fades the SSR poster out, §C.5) the first time the
 * returned callback runs, typically `useSlotRender`'s `onRender` once the scene's data is ready;
 * removes the attribute on unmount so the poster returns.
 */
export function useStageLive(slot: HTMLElement | null): () => void {
  useEffect(
    () => () => {
      slot?.removeAttribute('data-stage-live');
    },
    [slot],
  );

  return useCallback(() => {
    if (slot && !slot.hasAttribute('data-stage-live')) slot.setAttribute('data-stage-live', '');
  }, [slot]);
}
