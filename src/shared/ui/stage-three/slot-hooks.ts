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
 * Marks the slot live (`data-stage-live`: the scene has drawn its first frame, §C.5) the first time the
 * returned callback runs, typically `useSlotRender`'s `onRender` once the scene's data is ready. On
 * unmount it removes the live, shown and failed marks, so the slot's poster (or static map) returns.
 */
export function useStageLive(slot: HTMLElement | null): () => void {
  useEffect(
    () => () => {
      slot?.removeAttribute('data-stage-live');
      slot?.removeAttribute('data-stage-shown');
      slot?.removeAttribute('data-stage-failed');
    },
    [slot],
  );

  return useCallback(() => {
    if (slot && !slot.hasAttribute('data-stage-live')) slot.setAttribute('data-stage-live', '');
  }, [slot]);
}

/** The scene's map has risen far enough for its DOM labels (`data-stage-shown`, load-in-3d §3). */
export function markStageShown(slot: HTMLElement | null): void {
  if (slot && !slot.hasAttribute('data-stage-shown')) slot.setAttribute('data-stage-shown', '');
}

/** The scene cannot draw on this page view (chunk, data or render failure): `data-stage-failed`. */
export function markStageFailed(slot: HTMLElement | null): void {
  if (slot && !slot.hasAttribute('data-stage-failed')) slot.setAttribute('data-stage-failed', '');
}
