import { ENTRY_LINKS } from '../../config/copy';
import { SecureContactButton } from './HomeActions';
import { LedgerGlyph } from './LedgerGlyph';
import { RouteEntry, type StorySlot } from './RouteEntry';

/**
 * Entry 6, beside the whole-route overview: write to me, privately. Opens the Vault (the old
 * chapter-6 action). Nothing is layered over it: the map sits beside it and then dissolves in place.
 */
export function WriteEntry({ slot }: { slot: StorySlot }) {
  return (
    <RouteEntry
      id="write"
      slot={slot}
      extras={
        <>
          <SecureContactButton variant="primary" label={ENTRY_LINKS.write.label} />
          <LedgerGlyph className="w-full max-w-[42ch]" />
        </>
      }
    />
  );
}
