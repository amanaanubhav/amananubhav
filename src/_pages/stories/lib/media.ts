import { getMedia, type MediaSlotId } from '@/shared/config';

/**
 * Mirrors MediaSlot's own render rule (§D.2): data slots never render, and optional or hidden
 * placeholders render nothing. Lets a layout skip the wrapper cell of a slot that will be empty.
 */
export function isSlotShown(id: MediaSlotId): boolean {
  const entry = getMedia(id);
  if (!entry || entry.kind === 'data') return false;
  if (entry.status === 'placeholder' && (entry.optional || entry.hidden)) return false;
  return true;
}
