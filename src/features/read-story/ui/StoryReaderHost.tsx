'use client';

import { closeStory, useSelectedStory } from '../model/story-reader-store';
import { StoryReaderModal } from './StoryReaderModal';

/** Mounted by the AppShell outside the `.dark` wrapper; no AnimatePresence, so close is instant (parity). */
export function StoryReaderHost() {
  const selectedStory = useSelectedStory();
  if (!selectedStory) return null;
  return <StoryReaderModal story={selectedStory} onClose={closeStory} />;
}
