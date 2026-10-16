import { ENTRY_LINKS } from '../../config/copy';
import { SecureContactButton } from './HomeActions';
import { LedgerGlyph } from './LedgerGlyph';
import { RouteEntry } from './RouteEntry';

/** Entry 6, Muktinath: write to me, privately. Opens the secure contact vault (the old chapter-6 action). */
export function WriteEntry() {
  return (
    <RouteEntry
      id="write"
      extras={
        <>
          <SecureContactButton variant="primary" label={ENTRY_LINKS.write.label} />
          <LedgerGlyph className="w-full max-w-[42ch]" />
        </>
      }
    />
  );
}
