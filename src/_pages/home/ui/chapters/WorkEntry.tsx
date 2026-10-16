import { Button } from '@/shared/ui/button';

import { ENTRY_LINKS } from '../../config/copy';
import { EntryStaticPlate } from './EntryStaticPlate';
import { RouteEntry } from './RouteEntry';

/** Entry 2, Chame: the work. The route appears as a dashed graph on the relief. */
export function WorkEntry() {
  return (
    <RouteEntry
      id="work"
      extras={
        <Button variant="text" href={ENTRY_LINKS.work.href}>
          {ENTRY_LINKS.work.label}
        </Button>
      }
      staticPlate={<EntryStaticPlate id="work" />}
    />
  );
}
