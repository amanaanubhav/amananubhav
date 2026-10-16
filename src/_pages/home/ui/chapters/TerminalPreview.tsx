import { TERMINAL_PREVIEW } from '../../config/copy';

/**
 * G-21 terminal preview: three static lines (the title bar, `> who`, and the first line of the offline
 * `who` reply) in Plex Mono on `surface`. Data, not decoration: it shows exactly what the terminal says.
 */
export function TerminalPreview({ className }: { className?: string }) {
  return (
    <figure className={className} aria-label="Terminal preview">
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <div className="border-b border-line px-4 py-2">
          <span className="font-data text-caption text-ink-muted">{TERMINAL_PREVIEW.title}</span>
        </div>
        <div className="space-y-1 px-4 py-3 font-data text-caption text-ink">
          <p className="m-0">
            <span aria-hidden="true" className="mr-2 text-signal">
              &gt;
            </span>
            <span className="sr-only">You type: </span>
            {TERMINAL_PREVIEW.prompt}
          </p>
          <p className="m-0 text-ink-muted [text-wrap:pretty]">
            <span className="sr-only">It answers: </span>
            {TERMINAL_PREVIEW.reply}
          </p>
        </div>
      </div>
    </figure>
  );
}
