'use client';

import { useBootDone } from '@/shared/lib/boot';
import { lazyModule, useLazyModule } from '@/shared/lib/lazy';

import { closeStory, useSelectedStory } from '../model/story-reader-store';

/** The reader (with the media registry, plates and charts it needs) is its own chunk, off every route's initial JS (§J.2). */
const readerChunk = lazyModule(() => import('./StoryReaderModal').then((m) => m.renderStoryReader));

/**
 * Mounted by the AppShell outside the `.dark` wrapper (themed through `:root[data-theme]`); no
 * AnimatePresence, so close is instant. Keyed by story so a new story always opens at its top.
 * The chunk is fetched when the browser is idle after boot, so opening a story renders the reader in
 * the same commit and the cover and title morph from the card; a click before that opens it on load.
 */
export function StoryReaderHost() {
  const selectedStory = useSelectedStory();
  const bootDone = useBootDone();
  const renderStoryReader = useLazyModule(readerChunk, { needed: selectedStory !== null, warm: bootDone });
  if (!selectedStory || !renderStoryReader) return null;
  return renderStoryReader(selectedStory, closeStory);
}
