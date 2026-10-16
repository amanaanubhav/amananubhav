import type { ReactNode } from 'react';
import { STORIES, getFeaturedStories } from '@/entities/story';
import { SectionDotNav } from '@/shared/ui/section-dot-nav';
import { STORIES_SECTIONS, STORIES_TRACK_CAPTION } from '../config/sections';
import { TREKS } from '../config/treks';
import { AtlasSection } from './AtlasSection';
import { HimachalSpread } from './HimachalSpread';
import { PackSection } from './PackSection';
import { StoriesShowcase } from './StoriesShowcase';
import { StoryCover } from './StoryCover';
import { TrekSpread } from './TrekSpread';

/** Covers of the stacked cards, rendered here on the server so the media registry stays off the client. */
const COVERS: Readonly<Record<string, ReactNode>> = Object.fromEntries(
  getFeaturedStories(STORIES, 3).map((story) => [story.id, <StoryCover key={story.id} story={story} />]),
);

const [ANNAPURNA, KUN_TSO, CHANDRASHILA, DODITAL] = TREKS;

/**
 * Journal, `/stories` (§G.4): the atlas, every trek with its profile, the pack, then the long reads.
 * No WebGL in phase 1. Server component; client islands are the rail, the atlas pins, the reader
 * buttons and the stacked cards with their index.
 */
export function StoriesPage() {
  return (
    <>
      <SectionDotNav sections={STORIES_SECTIONS} track={{ caption: STORIES_TRACK_CAPTION }} />
      <div className="flex flex-col gap-32 lg:gap-48">
        <AtlasSection />
        <TrekSpread trek={ANNAPURNA} />
        <TrekSpread trek={KUN_TSO} />
        <TrekSpread trek={CHANDRASHILA} />
        <HimachalSpread />
        <TrekSpread trek={DODITAL} />
        <PackSection />
        <StoriesShowcase covers={COVERS} />
      </div>
    </>
  );
}
