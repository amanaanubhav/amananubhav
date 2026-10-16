import {
  Activity,
  Atom,
  Award,
  Backpack,
  Bike,
  Camera,
  Dumbbell,
  Fish,
  Footprints,
  Gamepad2,
  GitBranch,
  Laptop,
  Layers,
  Leaf,
  MapPin,
  MountainSnow,
  NotebookPen,
  Rocket,
  Route,
  ShieldCheck,
  SquareTerminal,
  Sun,
  Telescope,
  Tent,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FillGlyph, PendingFill } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { contourGeometry, filmGeometry, gridGeometry, starGeometry, waveGeometry } from './fills';

/** Named imports only, so the bundle carries these 25 icons and never the whole lucide set. */
const GLYPHS: Record<FillGlyph, LucideIcon> = {
  Route,
  MapPin,
  Layers,
  Fish,
  ShieldCheck,
  Leaf,
  GitBranch,
  SquareTerminal,
  Gamepad2,
  Activity,
  Sun,
  Waves,
  Rocket,
  Atom,
  Telescope,
  Dumbbell,
  Footprints,
  MountainSnow,
  Award,
  Bike,
  Camera,
  Laptop,
  NotebookPen,
  Tent,
  Backpack,
};

export interface MediaFillProps {
  kind: PendingFill;
  /** Seed for the procedural drawing, normally the slot id. */
  seed: string;
  glyph?: FillGlyph;
  className?: string;
}

const SVG_PROPS = {
  className: 'absolute inset-0 h-full w-full',
  preserveAspectRatio: 'xMidYMid slice',
  fill: 'none',
  focusable: 'false',
  'aria-hidden': true,
} as const;

const HAIRLINE = { vectorEffect: 'non-scaling-stroke', strokeWidth: 1 } as const;

function Drawing({ kind, seed }: { kind: PendingFill; seed: string }) {
  switch (kind) {
    case 'contour': {
      const { minor, index } = contourGeometry(seed);
      return (
        <svg viewBox="0 0 100 100" {...SVG_PROPS}>
          <g style={{ stroke: 'var(--ink-contour)' }} {...HAIRLINE}>
            {minor.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g style={{ stroke: 'var(--ink-contour-index)' }} {...HAIRLINE}>
            {index.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </svg>
      );
    }
    case 'stars': {
      const { faint, mid, bright } = starGeometry(seed);
      return (
        <svg viewBox="0 0 100 100" {...SVG_PROPS} stroke="currentColor" strokeLinecap="round">
          <path d={faint} strokeWidth={1.5} strokeOpacity={0.45} vectorEffect="non-scaling-stroke" />
          <path d={mid} strokeWidth={2.25} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
          <path d={bright} strokeWidth={3.25} strokeOpacity={0.95} vectorEffect="non-scaling-stroke" />
        </svg>
      );
    }
    case 'grid':
    case 'glyph': {
      const { thirds, cross } = gridGeometry();
      return (
        <svg viewBox="0 0 100 100" {...SVG_PROPS}>
          <path d={thirds} style={{ stroke: 'var(--ink-contour)' }} strokeDasharray="3 3" {...HAIRLINE} />
          {kind === 'grid' ? <path d={cross} style={{ stroke: 'var(--ink-contour-index)' }} {...HAIRLINE} /> : null}
        </svg>
      );
    }
    case 'wave':
      return (
        <svg viewBox="0 0 100 100" {...SVG_PROPS}>
          <g style={{ stroke: 'var(--ink-contour-index)' }} strokeLinecap="round" {...HAIRLINE}>
            {waveGeometry(seed).map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </svg>
      );
    case 'film': {
      const { frame, sprockets, play } = filmGeometry();
      return (
        <svg viewBox="0 0 90 160" {...SVG_PROPS}>
          <path d={sprockets} style={{ stroke: 'var(--ink-contour-index)' }} {...HAIRLINE} />
          <path d={frame} style={{ stroke: 'var(--ink-contour)' }} {...HAIRLINE} />
          <path d={play} style={{ stroke: 'var(--ink-contour-index)' }} strokeLinejoin="round" {...HAIRLINE} />
        </svg>
      );
    }
    default:
      return null;
  }
}

/**
 * Designed pending fill (G-16, §D.2): a deterministic drawing that stands where a photo, screen or clip
 * will go. Decorative (`aria-hidden`); the plate's caption says what belongs there. Absolutely positioned:
 * place it inside a positioned box (PlateFrame's plate is).
 */
export function MediaFill({ kind, seed, glyph, className }: MediaFillProps) {
  const Glyph = kind === 'glyph' && glyph ? GLYPHS[glyph] : null;
  return (
    <div aria-hidden="true" className={cn('plate-fill pointer-events-none absolute inset-0 text-ink', className)}>
      <Drawing kind={kind} seed={seed} />
      {Glyph ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Glyph className="size-12 text-ink-muted" strokeWidth={1.5} focusable="false" />
        </span>
      ) : null}
    </div>
  );
}
