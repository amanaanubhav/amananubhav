'use client';

import { useSyncExternalStore } from 'react';

export interface SpecOverlayProps {
  id: string;
  status: string;
  ratio: string;
  minPx?: { w: number; h: number };
}

const IS_DEV = process.env.NODE_ENV !== 'production';

const noopSubscribe = () => () => undefined;

function readQueryFlag(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('media') === 'spec';
  } catch {
    return false;
  }
}

/**
 * Media spec overlay (§D.2): slot id, status, ratio and minimum pixels in a corner of every plate.
 * Always on in development builds; in production only with `?media=spec`, read on the client after hydration
 * (the server snapshot is `false`, so the server HTML and hydration never differ).
 */
export function SpecOverlay({ id, status, ratio, minPx }: SpecOverlayProps) {
  const flagged = useSyncExternalStore(noopSubscribe, readQueryFlag, () => false);
  const visible = IS_DEV || flagged;

  if (!visible) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1 top-1 z-[2] max-w-[calc(100%-0.5rem)] truncate rounded-control border border-line bg-surface px-1.5 py-0.5 font-data text-[11px] leading-tight text-ink-muted"
    >
      {id} · {status} · {ratio}
      {minPx ? ` · ≥ ${minPx.w}×${minPx.h}` : ''}
    </span>
  );
}
