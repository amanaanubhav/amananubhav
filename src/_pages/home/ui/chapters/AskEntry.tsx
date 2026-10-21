import { ENTRY_LINKS } from '../../config/copy';
import { OpenTerminalButton } from './HomeActions';
import { RouteEntry, type StorySlot } from './RouteEntry';
import { TerminalPreview } from './TerminalPreview';

/** Entry 5, the release down to Muktinath: ask me anything. Opens the AI terminal (the old chapter-5 action). */
export function AskEntry({ slot }: { slot: StorySlot }) {
  return (
    <RouteEntry
      id="ask"
      slot={slot}
      extras={
        <>
          <OpenTerminalButton label={ENTRY_LINKS.ask.label} />
          <TerminalPreview className="w-full max-w-[42ch]" />
        </>
      }
    />
  );
}
