import { Button } from '@/shared/ui/button';

import { ENTRY_LINKS } from '../../config/copy';
import { RouteEntry, type StorySlot } from './RouteEntry';

/** Entry 1, Day 2 on the map (Ngadi to Syange): dark skies, early questions. */
export function OriginEntry({ slot }: { slot: StorySlot }) {
  return (
    <RouteEntry
      id="origin"
      slot={slot}
      extras={
        <Button variant="text" href={ENTRY_LINKS.origin.href}>
          {ENTRY_LINKS.origin.label}
        </Button>
      }
    />
  );
}
