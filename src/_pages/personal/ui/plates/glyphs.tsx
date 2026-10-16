import type { ReactNode } from 'react';
import { Bike, Dumbbell, Footprints, MountainSnow, Telescope, Waves, type LucideIcon } from 'lucide-react';
import type { ActivityId } from '@/entities/activity';

/**
 * G-18 discipline glyphs: lucide where an honest icon exists, hand-drawn on the same 24-unit grid
 * with the same 1.5 stroke, round caps and joins where it does not. Decorative: the row or caption
 * beside the glyph names the discipline, so every glyph is `aria-hidden`.
 */
const LUCIDE = {
  gym: Dumbbell,
  run: Footprints,
  swim: Waves,
  trek: MountainSnow,
  astro: Telescope,
  ride: Bike,
  coast: Waves,
} satisfies Partial<Record<ActivityId, LucideIcon>>;

type LucideId = keyof typeof LUCIDE;
/** Every activity without a lucide icon must have a drawing (checked by the type). */
type DrawnId = Exclude<ActivityId, LucideId>;

const isLucide = (id: ActivityId): id is LucideId => id in LUCIDE;

/** Hand-drawn glyphs, as children of a 24 × 24 stroke-only svg. */
const DRAWN: Record<DrawnId, ReactNode> = {
  // A climbing hold: an irregular resin blob with its bolt hole.
  climb: (
    <>
      <path d="M4.6 15.4c-.9-3.4.7-7.1 3.8-8.9 3.1-1.9 7.6-1.7 9.6.9 2.1 2.6 1.2 6.4-1.5 8.7-2.7 2.3-6.6 3.5-9.3 2.6-1.3-.4-2.2-1.8-2.6-3.3Z" />
      <circle cx="12.4" cy="11.8" r="1.6" />
      <path d="M7.6 15.6c.9.6 2 .8 3.1.6" />
    </>
  ),
  // A boxing glove: fist, thumb along the front, laced cuff.
  box: (
    <>
      <path d="M8 18V9.5A5.5 5.5 0 0 1 13.5 4h.5A5 5 0 0 1 19 9v3.5a5.5 5.5 0 0 1-5.5 5.5Z" />
      <path d="M8 11H6.8a2.3 2.3 0 0 0 0 4.6h4.7" />
      <path d="M8 18v2.3c0 .4.3.7.7.7h7.6c.4 0 .7-.3.7-.7v-2.6" />
      <path d="M12 8.2c1.6-.6 3.4-.3 4.6.8" />
    </>
  ),
  // A football: the central pentagon and its seams.
  football: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.8l3 2.2-1.1 3.6h-3.8L9 11Z" />
      <path d="M12 8.8V5.5M15 11l3.1-1M13.9 14.6l1.9 2.7M10.1 14.6l-1.9 2.7M9 11l-3.1-1" />
    </>
  ),
  // A basketball hoop: backboard, target square, rim and net.
  basketball: (
    <>
      <path d="M4.5 3h15v8.5h-15Z" />
      <path d="M9.5 11.5V7.8h5v3.7" />
      <path d="M7 11.5h10M8.2 11.5 9.7 20h4.6l1.5-8.5M10.8 11.5l.5 8.5M13.2 11.5l-.5 8.5M9 15.6h6" />
    </>
  ),
  // Surfing (learning soon): a breaking wave over a line of swell.
  surf: (
    <>
      <path d="M3 16.5c3.4-.8 4.6-3.6 4.6-6.6a5.2 5.2 0 0 1 10.4 0c0 1.5-1 2.6-2.5 2.6s-2.6-1-2.6-2.4" />
      <path d="M2 20.5c1.7 0 2.5-1 4-1s2.3 1 4 1 2.5-1 4-1 2.3 1 4 1 2.3-1 4-1" />
    </>
  ),
};

export interface DisciplineGlyphProps {
  id: ActivityId;
  /** Rendered size in CSS px (default 24). */
  size?: number;
  className?: string;
}

/** The G-18 glyph for an activity: `currentColor`, 1.5 stroke on a 24-unit grid. */
export function DisciplineGlyph({ id, size = 24, className }: DisciplineGlyphProps) {
  if (isLucide(id)) {
    const Icon = LUCIDE[id];
    return <Icon size={size} strokeWidth={1.5} aria-hidden="true" focusable="false" className={className} />;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {DRAWN[id]}
    </svg>
  );
}
