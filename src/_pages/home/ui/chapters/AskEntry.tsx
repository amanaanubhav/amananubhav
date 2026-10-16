import type { ReactNode } from 'react';

import { ENTRY_LINKS } from '../../config/copy';
import { OpenTerminalButton } from './HomeActions';
import { RouteEntry } from './RouteEntry';
import { TerminalPreview } from './TerminalPreview';

/**
 * Entry 5, Muktinath: ask me anything. Opens the AI terminal (the old chapter-5 action). At tier 0 it
 * carries the DOM elevation profile that the stage would otherwise cross-fade in.
 */
export function AskEntry({ staticProfile }: { staticProfile?: ReactNode }) {
  return (
    <RouteEntry
      id="ask"
      extras={
        <>
          <OpenTerminalButton label={ENTRY_LINKS.ask.label} />
          <TerminalPreview className="w-full max-w-[42ch]" />
        </>
      }
      staticPlate={staticProfile}
    />
  );
}
