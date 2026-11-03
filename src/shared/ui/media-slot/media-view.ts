import { useSyncExternalStore } from 'react';

/**
 * The media view flag, read from the URL on the client after hydration (the server snapshot is `null`, so the
 * server HTML and hydration never differ):
 * - `?media=spec`: every slot shows its full spec plate and the spec overlay, in production too;
 * - `?media=live`: a development build shows what production renders for pending slots (strips, collapsed cells,
 *   generated covers) and hides the spec overlay.
 * Client components only.
 */
export type MediaView = 'spec' | 'live' | null;

const noopSubscribe = () => () => undefined;

function readView(): MediaView {
  try {
    const value = new URLSearchParams(window.location.search).get('media');
    return value === 'spec' || value === 'live' ? value : null;
  } catch {
    return null;
  }
}

export function useMediaView(): MediaView {
  return useSyncExternalStore(noopSubscribe, readView, () => null);
}
