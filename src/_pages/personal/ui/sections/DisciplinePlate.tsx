import type { ReactNode } from 'react';
import type { Activity, ActivityId } from '@/entities/activity';
import { getMedia } from '@/shared/config';
import { PlateFrame } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { DISCIPLINE_INTRO } from '../../config/content';
import { DisciplineGlyph } from '../plates';

/** Disciplines whose pending plate shows the hand-drawn G-18 glyph instead of the registry's lucide fill (§E.2). */
const HAND_DRAWN: ReadonlySet<ActivityId> = new Set<ActivityId>(['climb', 'box', 'football', 'basketball', 'surf']);

function GlyphFill({ id, size }: { id: ActivityId; size: number }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-ink-muted">
      <DisciplineGlyph id={id} size={size} />
    </div>
  );
}

/** Visible line under a pending 160 px row plate (the full "Photo to come: ..." stays the accessible caption). */
const ROW_PENDING_LABEL = 'Photo to come';

/**
 * Mobile row plates hide their caption (the row beside them names the discipline), which left a pending plate
 * with nothing visible saying what belongs there. Row plates get one visible, aria-hidden line under the plate;
 * the sticky desktop plate already shows its caption.
 */
function RowCaption({
  variant,
  text,
  children,
}: {
  variant: DisciplinePlateProps['variant'];
  text?: string;
  children: ReactNode;
}) {
  if (variant !== 'row' || !text) return <>{children}</>;
  return (
    <div className="min-w-0">
      {children}
      <p aria-hidden="true" className="m-0 mt-2 truncate font-body text-caption italic text-ink-muted">
        {text}
      </p>
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
 * "Learning soon".
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
    <RowCaption variant={variant} text={entry.status === 'placeholder' ? ROW_PENDING_LABEL : undefined}>
      <MediaSlot
        id={activity.slotId}
        ratio="4:5"
        sizes={sizes}
        captionText={activity.name}
        caption={variant === 'row' ? 'none' : 'short'}
        fill={HAND_DRAWN.has(activity.id) ? <GlyphFill id={activity.id} size={glyphSize} /> : undefined}
      />
    </RowCaption>
  );
}
