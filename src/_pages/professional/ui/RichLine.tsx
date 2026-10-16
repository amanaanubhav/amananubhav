import type { RichText } from '../config/copy';

/** Renders copy where `{ data }` parts are measurements: Plex Mono, tabular figures (§B.4.3), never split ("500 ms"). */
export function RichLine({ parts }: { parts: RichText }) {
  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          part
        ) : (
          <span key={index} className="whitespace-nowrap font-data text-[0.94em] text-ink [font-variant-numeric:tabular-nums_slashed-zero]">
            {part.data}
          </span>
        ),
      )}
    </>
  );
}
