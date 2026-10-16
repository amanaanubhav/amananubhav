import type { CSSProperties } from 'react';
import { getMedia, mediaRatioValue, type MediaSlotId } from '@/shared/config';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { ContactSheetReveal } from './ContactSheetReveal';

export interface ContactSheetProps {
  frames: readonly MediaSlotId[];
  label: string;
}

/**
 * The field album's contact sheet (§G.2): justified rows, about 180 px tall on mobile and 260 px from 768 px,
 * each frame as wide as its true ratio. Every frame grows in proportion to its ratio, so a row keeps one height;
 * the trailing spacer stops the last row from stretching. On a phone the basis (150 px) is lower than the target
 * so most rows pair two frames and grow to roughly 150-210 px; --row-max caps a frame left alone on its row at
 * 1.3x the target, so a lone landscape or a 9:16 clip never stretches into a full-width feed plate. Frame numbers are the real sequence; captions are
 * the registry's drafts (Q-09); clips keep their in-view play/pause and their visible pause button.
 */
export function ContactSheet({ frames, label }: ContactSheetProps) {
  return (
    <ContactSheetReveal>
      <ol
        aria-label={label}
        className="m-0 flex list-none flex-wrap items-start gap-x-4 gap-y-8 p-0 [--row-h:150px] [--row-max:234px] after:grow-[1000] after:content-[''] md:[--row-h:260px] md:[--row-max:338px]"
      >
        {frames.map((id, index) => {
          const ratio = mediaRatioValue(getMedia(id).ratio);
          const style: CSSProperties = {
            flex: `${ratio} 1 calc(${ratio} * var(--row-h))`,
            maxWidth: `calc(${ratio} * var(--row-max))`,
          };
          const number = String(index + 1).padStart(2, '0');
          return (
            <li key={id} data-frame style={style} className="min-w-0">
              <p className="m-0 mb-2 font-data text-caption text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]">
                <VisuallyHidden>Frame </VisuallyHidden>
                {number}
              </p>
              <MediaSlot id={id} layout="album" reveal="none" className="max-w-none" />
            </li>
          );
        })}
      </ol>
    </ContactSheetReveal>
  );
}
