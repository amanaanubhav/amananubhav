import { Button } from '@/shared/ui/button';

import { ENTRY_LINKS } from '../../config/copy';
import { RouteEntry, type StorySlot } from './RouteEntry';

/** Entry 2, Days 3 and 4 on the map (the valley turns west): the work. */
export function WorkEntry({ slot }: { slot: StorySlot }) {
  return (
    <RouteEntry
      id="work"
      slot={slot}
      extras={
        <Button variant="text" href={ENTRY_LINKS.work.href}>
          {ENTRY_LINKS.work.label}
        </Button>
      }
    />
  );
}
