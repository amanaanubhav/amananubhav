import type { ReactNode } from 'react';

import { ACHIEVEMENTS } from '@/entities/achievement';
import type { MediaSlotId } from '@/shared/config';
import { BackButton } from '@/shared/ui/archive';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';

import { isTopRank } from '../lib/group-achievements';
import { HONORS_COPY } from '../config/copy';
import { AchievementsArchiveView } from './AchievementsArchiveView';

/**
 * The 1:1 120 px proof plates (§G.6), rendered on the server so the media registry stays out of the client
 * bundle. Every M-PROOF slot is optional, so MediaSlot renders nothing until Aman supplies the photo: no medal
 * art stands in for a missing proof.
 */
const PROOF_PLATES: Partial<Record<MediaSlotId, ReactNode>> = Object.fromEntries(
  ACHIEVEMENTS.flatMap((item) =>
    item.slotId ? [[item.slotId, <MediaSlot key={item.slotId} id={item.slotId} layout="thumb" ratio="1:1" caption="none" />]] : [],
  ),
);

/** /achievements: the summit register (§G.6). Server page; search and the register are a client island. */
export function AchievementsArchivePage() {
  const wins = ACHIEVEMENTS.filter((item) => isTopRank(item.rank)).length;

  return (
    <div className="pb-32 pt-24 md:pt-28">
      <header className="journal-grid">
        <div className="col-[content-start/content-end] lg:col-[2/span_3] lg:row-start-1">
          <BackButton />
        </div>
        <div className="col-[content-start/content-end] lg:col-[5/span_8] lg:row-start-2">
          <ChapterHeader as="h1">{HONORS_COPY.headline}</ChapterHeader>
        </div>
        <div className="col-[content-start/content-end] mt-4 lg:col-[2/span_3] lg:row-[2/span_2] lg:mt-0 lg:self-start lg:pt-4">
          <Log
            label={HONORS_COPY.logLabel}
            items={[
              { key: 'honors', value: ACHIEVEMENTS.length },
              { key: 'wins', value: wins },
            ]}
          />
        </div>
        <div className="col-[content-start/content-end] mt-6 lg:col-[5/span_6] lg:row-start-3 lg:mt-8">
          <p className="text-lead m-0 max-w-measure font-body text-ink [text-wrap:pretty]">{HONORS_COPY.body}</p>
        </div>
      </header>

      <AchievementsArchiveView plates={PROOF_PLATES} />
    </div>
  );
}
