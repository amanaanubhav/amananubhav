import { getMedia } from '@/shared/config';
import type { MediaSlotId } from '@/shared/config';
import { pendingMode } from './layout';
import type { MediaLayout } from './layout';

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Whether `<MediaSlot id={id} layout={layout} />` renders anything in this build's HTML (MediaSlot's own rule):
 * data slots and optional or hidden placeholders never do; a needed placeholder does in development, and in
 * production unless its layout collapses it (`inset`, `thumb`, `album`, `grid`, `astro`). Use it to drop a wrapper
 * that would otherwise stand empty (a sequence's container, its heading, a spread's plate). For single grid or
 * album cells prefer `empty:hidden` on the cell: the cell then also comes back for `?media=spec`. Server-safe; it
 * reads the registry, so call it from server components (or code that already holds the registry).
 */
export function isMediaSlotShown(id: MediaSlotId, layout: MediaLayout = 'standard'): boolean {
  const entry = getMedia(id);
  if (!entry || entry.kind === 'data') return false;
  if (entry.status !== 'placeholder') return true;
  if (entry.optional || entry.hidden) return false;
  return IS_DEV || pendingMode(layout, false) !== 'none';
}
