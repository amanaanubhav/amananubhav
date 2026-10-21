import { QUIET_ROOM_LINE } from '../../config/copy';
import { RouteEntry, type StorySlot } from './RouteEntry';

/** Entry 3, Day 5 on the map (into the Manang basin): how I work. Its extra line waits for Aman's OK (Q-90). */
export function HowEntry({ slot }: { slot: StorySlot }) {
  return (
    <RouteEntry
      id="how"
      slot={slot}
      extras={
        QUIET_ROOM_LINE.confirmed ? (
          <p className="text-lead m-0 font-body italic text-ink">{QUIET_ROOM_LINE.text}</p>
        ) : undefined
      }
    />
  );
}
