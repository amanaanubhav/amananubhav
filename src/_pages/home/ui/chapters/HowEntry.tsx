import { QUIET_ROOM_LINE } from '../../config/copy';
import { EntryStaticPlate } from './EntryStaticPlate';
import { RouteEntry } from './RouteEntry';

/** Entry 3, Manang: how I work. The calmest entry; its extra line waits for Aman's OK (Q-90). */
export function HowEntry() {
  return (
    <RouteEntry
      id="how"
      extras={
        QUIET_ROOM_LINE.confirmed ? (
          <p className="text-lead m-0 font-body italic text-ink-muted">{QUIET_ROOM_LINE.text}</p>
        ) : undefined
      }
      staticPlate={<EntryStaticPlate id="how" />}
    />
  );
}
