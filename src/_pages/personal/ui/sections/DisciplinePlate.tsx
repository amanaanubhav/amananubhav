import type { Activity, ActivityId } from '@/entities/activity';
import { getMedia } from '@/shared/config';
import { PlateFrame } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { DISCIPLINE_INTRO } from '../../config/content';
import { DisciplineGlyph } from '../plates';

function GlyphFill({ id, size }: { id: ActivityId; size: number }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-ink-muted">
      <DisciplineGlyph id={id} size={size} />
    </div>
  );
}

export interface DisciplinePlateProps {
  activity: Activity;
  /** sticky: the 420 px plate beside the training log; row: the 160 px plate on each mobile row. */
  variant: 'sticky' | 'row';
}

/**
 * The 4:5 plate of one discipline (§G.2). Always `ratio="4:5"` (the trek row's 3:2 photo is cropped, not
 * resized). Slots that render nothing until supplied (football and basketball are optional, surfing waits for
 * the lessons) get a designed glyph plate instead, so a selected row never shows an empty box; surfing reads
 * "Learning soon". A needed photo that is still pending passes the discipline's glyph as its `fill` (C-05): in
 * production that is a finished glyph plate (no "Photo to come" line, no survey grid), in the sticky panel and
 * on every phone row alike; the dev server and `?media=spec` keep the full pending plate.
 */
export function DisciplinePlate({ activity, variant }: DisciplinePlateProps) {
  const entry = getMedia(activity.slotId);
  const glyphSize = variant === 'sticky' ? 72 : 40;
  const soon = activity.status === 'soon';
  const withheld = entry.status === 'placeholder' && Boolean(entry.optional || entry.hidden);
  const sizes = variant === 'sticky' ? '(min-width: 1024px) 420px, 100vw' : '160px';

  // A designed glyph plate, not a photo placeholder: no "Photo to come" line (the row already says "Learning soon").
  if (withheld || soon) {
    return (
      <PlateFrame
        ratio="4:5"
        tone="pending"
        ticks
        grid
        caption={soon ? `${activity.name}: ${DISCIPLINE_INTRO.soonLabel.toLowerCase()}` : activity.name}
        captionHidden={variant === 'row'}
      >
        <GlyphFill id={activity.id} size={glyphSize} />
      </PlateFrame>
    );
  }

  return (
    <MediaSlot
      id={activity.slotId}
      ratio="4:5"
      sizes={sizes}
      captionText={activity.name}
      caption={variant === 'row' ? 'none' : 'short'}
      fill={<GlyphFill id={activity.id} size={glyphSize} />}
    />
  );
}
