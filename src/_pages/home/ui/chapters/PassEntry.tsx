import { STORIES } from '@/entities/story';
import { MediaSlot } from '@/shared/ui/media-slot';

import { ENTRY_LINKS } from '../../config/copy';
import { ReadJournalEntryButton } from './HomeActions';
import { RouteEntry, type StorySlot } from './RouteEntry';

/**
 * Entry 4, the cold climb (Days 11 to 13 on the map): everything on my back. Extras (§G.1): the ridge
 * photo `M-HERO-02` and the altimeter photo `M-ALTIMETER-01`, both optional (each renders nothing until its
 * file exists), then the journal entry, which opens the Annapurna story in the reader.
 */
export function PassEntry({ slot }: { slot: StorySlot }) {
  const story = STORIES.find((s) => s.id === ENTRY_LINKS.pass.storyId);
  return (
    <RouteEntry
      id="pass"
      slot={slot}
      extras={
        <>
          <MediaSlot id="M-HERO-02" sizes="400px" ratio="3:2" caption="short" className="w-full max-w-[400px]" />
          <MediaSlot id="M-ALTIMETER-01" sizes="200px" ratio="1:1" caption="none" className="w-[200px]" />
          {story ? <ReadJournalEntryButton label={ENTRY_LINKS.pass.label} story={story} /> : null}
        </>
      }
    />
  );
}
