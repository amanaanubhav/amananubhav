import { Button } from '@/shared/ui/button';

import { ENTRY_LINKS } from '../../config/copy';
import { EntryStaticPlate } from './EntryStaticPlate';
import { RouteEntry } from './RouteEntry';

/** Entry 1, Khudi: dark skies, early questions. */
export function OriginEntry() {
  return (
    <RouteEntry
      id="origin"
      extras={
        <Button variant="text" href={ENTRY_LINKS.origin.href}>
          {ENTRY_LINKS.origin.label}
        </Button>
      }
      staticPlate={<EntryStaticPlate id="origin" />}
    />
  );
}
