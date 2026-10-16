import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/*
 * The G-05 stroke system (§F): one sheet per blueprint; boxes with a small radius and 1.25 px ink strokes; labels
 * in Plex Mono, notes in Literata italic; the request path in `signal-line` at 2 px with arrowheads (the route pact,
 * §B.1 rule 2). Every stroke is non-scaling, so line weights hold at any plate size. Colors come only from Tailwind
 * theme roles and CSS variables, never hex.
 *
 * Two layouts per blueprint: `landscape` (1200 × 900, 4:3) where the plate is wide, and `portrait` (840 × 1120,
 * 3:4) where it is narrow (phones, and the narrower desktop columns).
 * The plate picks the layout with CSS (BlueprintFigure); each layout is complete server markup.
 *
 * Draw hooks: strokes carry `data-draw` and labels `data-draw-label` (DrawOnView, §D.2). `data-pass` groups them
 * for the hero's three-pass draw: `frame` (ticks and ink edges), `node` (boxes and labels), `signal` (the path).
 *
 * Text sizes are in sheet units, set from the narrowest plate each layout is shown at so the on-screen sizes meet
 * G-05a (labels Plex Mono 13 px, notes Literata italic 14 px; §B.4.3): portrait from 313 px wide (360 px phones,
 * 0.373 px per unit), landscape from 461 px (project plates at 1440 px, 0.384 px per unit). One scale serves both:
 * 35 units of mono read 13 px or more, 38 units of italic 14 px or more.
 */

export type SheetVariant = 'landscape' | 'portrait';

export const SHEETS: Readonly<Record<SheetVariant, { readonly width: number; readonly height: number }>> = {
  landscape: { width: 1200, height: 900 },
  portrait: { width: 840, height: 1120 },
};
export const TYPE = { label: 35, sub: 38, note: 38 } as const;

type Pass = 'frame' | 'node' | 'signal';

const STROKE = { strokeWidth: 1.25, vectorEffect: 'non-scaling-stroke' as const, fill: 'none' };

export interface BlueprintProps {
  className?: string;
  /** Default 'landscape' (4:3). 'portrait' (3:4) is the narrow-plate layout. */
  variant?: SheetVariant;
}

/** Per-layout id, so both layouts can sit in one document (title, desc and pattern ids stay unique). */
export function sheetId(base: string, variant: SheetVariant = 'landscape'): string {
  return variant === 'portrait' ? `${base}-p` : base;
}

/* ── The sheet ──────────────────────────────────────────────────────────────────────────────────── */

interface SheetProps {
  /** Unique per page and layout (see sheetId): prefixes the title, desc and pattern ids. */
  id: string;
  title: string;
  desc: string;
  variant?: SheetVariant;
  className?: string;
  /** Extra <defs> (e.g. a hatch pattern). */
  defs?: ReactNode;
  children: ReactNode;
}

/** The blueprint sheet: `<svg role="img">` with title and desc, a faint 60-unit survey grid and corner ticks. */
export function Sheet({ id, title, desc, variant = 'landscape', className, defs, children }: SheetProps) {
  const { width, height } = SHEETS[variant];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      className={cn('block h-full w-full select-none', className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{desc}</desc>
      <defs>
        <pattern id={`${id}-grid`} width={60} height={60} patternUnits="userSpaceOnUse">
          <path d="M60 0H0V60" style={{ stroke: 'var(--ink-contour)' }} {...STROKE} strokeWidth={1} />
        </pattern>
        {defs}
      </defs>
      <rect width={width} height={height} fill={`url(#${id}-grid)`} opacity={0.6} />
      <CornerTicks width={width} height={height} />
      {children}
    </svg>
  );
}

/** 10 px registration crosses at the corners (§B.6: blueprint plates only). */
function CornerTicks({ width, height }: { width: number; height: number }) {
  const ticks: readonly (readonly [number, number])[] = [
    [30, 30],
    [width - 30, 30],
    [30, height - 30],
    [width - 30, height - 30],
  ];
  return (
    <g aria-hidden="true">
      {ticks.map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x - 14} ${y}H${x + 14}M${x} ${y - 14}V${y + 14}`}
          className="stroke-line-strong"
          {...STROKE}
          strokeWidth={1}
          data-draw=""
          data-pass="frame"
        />
      ))}
    </g>
  );
}

/* ── Nodes ──────────────────────────────────────────────────────────────────────────────────────── */

interface BoxProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  /** A second, italic line inside the box. */
  sub?: string;
  dashed?: boolean;
  /** Fill the box with a hatch pattern id (e.g. a frozen layer). */
  hatch?: string;
  pass?: Pass;
}

/** A node: a 6-unit radius box with a mono label (and an optional italic second line). */
export function Box({ x, y, w = 200, h = 100, label, sub, dashed = false, hatch, pass = 'node' }: BoxProps) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} className="fill-ground" />
      {hatch ? <rect x={x} y={y} width={w} height={h} rx={6} fill={`url(#${hatch})`} /> : null}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className="stroke-ink"
        {...STROKE}
        strokeDasharray={dashed ? '8 6' : undefined}
        data-draw=""
        data-pass={pass}
      />
      <g data-draw-label="" data-pass={pass}>
        <text
          x={cx}
          y={sub ? cy - 21 : cy}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={TYPE.label}
          className="fill-ink font-data"
        >
          {label}
        </text>
        {sub ? (
          <text
            x={cx}
            y={cy + 19}
            dominantBaseline="central"
            textAnchor="middle"
            fontSize={TYPE.sub}
            className="fill-ink-muted font-body italic"
          >
            {sub}
          </text>
        ) : null}
      </g>
    </g>
  );
}

/* ── Edges ──────────────────────────────────────────────────────────────────────────────────────── */

export type Direction = 'right' | 'left' | 'up' | 'down';

/** A filled arrowhead whose tip sits at (x, y), pointing `dir`. */
export function arrowHead(x: number, y: number, dir: Direction, size = 18): string {
  const s = size;
  const w = size * 0.5;
  switch (dir) {
    case 'right':
      return `M${x} ${y}L${x - s} ${y - w}L${x - s} ${y + w}Z`;
    case 'left':
      return `M${x} ${y}L${x + s} ${y - w}L${x + s} ${y + w}Z`;
    case 'down':
      return `M${x} ${y}L${x - w} ${y - s}L${x + w} ${y - s}Z`;
    case 'up':
      return `M${x} ${y}L${x - w} ${y + s}L${x + w} ${y + s}Z`;
  }
}

export type Tip = readonly [x: number, y: number, dir: Direction];

interface EdgeProps {
  d: string;
  /** Arrowheads at these tips. */
  tips?: readonly Tip[];
  dashed?: boolean;
  pass?: Pass;
}

/** A supporting connection in ink (tools, memory, training data, feedback). */
export function Edge({ d, tips = [], dashed = false, pass = 'frame' }: EdgeProps) {
  return (
    <g>
      <path
        d={d}
        className="stroke-ink"
        {...STROKE}
        strokeDasharray={dashed ? '10 8' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-draw=""
        data-pass={pass}
      />
      {tips.length > 0 ? (
        <path
          d={tips.map(([x, y, dir]) => arrowHead(x, y, dir, 16)).join('')}
          className="fill-ink"
          data-draw-label=""
          data-pass={pass}
        />
      ) : null}
    </g>
  );
}

/** The request path: 2 px `signal-line`, round caps, with arrowheads. Nothing else on a plate uses this color. */
export function SignalPath({ d, tips = [] }: { d: string; tips?: readonly Tip[] }) {
  return (
    <g>
      <path
        d={d}
        className="route-line stroke-signal-line"
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-draw=""
        data-pass="signal"
      />
      {tips.length > 0 ? (
        <path
          d={tips.map(([x, y, dir]) => arrowHead(x, y, dir)).join('')}
          className="signal-mark fill-signal-line"
          data-draw-label=""
          data-pass="signal"
        />
      ) : null}
    </g>
  );
}

/* ── Text ───────────────────────────────────────────────────────────────────────────────────────── */

interface NoteProps {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  pass?: Pass;
  /** A ground-colored halo behind the glyphs, for a note that has to cross faint lines (a street grid). */
  halo?: boolean;
}

/** An annotation in Literata italic, muted ink. */
export function Note({ x, y, children, anchor = 'start', size = TYPE.note, pass = 'frame', halo = false }: NoteProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      className={cn('fill-ink-muted font-body italic', halo && 'stroke-ground')}
      style={halo ? { paintOrder: 'stroke' } : undefined}
      strokeWidth={halo ? 10 : undefined}
      strokeLinejoin={halo ? 'round' : undefined}
      data-draw-label=""
      data-pass={pass}
    >
      {children}
    </text>
  );
}

/** A free-standing mono label in ink (a layer name, a gate). */
export function Label({ x, y, children, anchor = 'middle', size = TYPE.label, pass = 'node' }: NoteProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      className="fill-ink font-data"
      data-draw-label=""
      data-pass={pass}
    >
      {children}
    </text>
  );
}

/** A plain ink stroke (outlines, streets, glyph lines) with the shared stroke settings. */
export function Line({
  d,
  dashed,
  pass = 'frame',
  tone = 'ink',
}: {
  d: string;
  dashed?: string;
  pass?: Pass;
  tone?: 'ink' | 'muted' | 'strong';
}) {
  const color = tone === 'ink' ? 'stroke-ink' : tone === 'strong' ? 'stroke-line-strong' : 'stroke-ink-muted';
  return (
    <path
      d={d}
      className={color}
      {...STROKE}
      strokeDasharray={dashed}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-draw=""
      data-pass={pass}
    />
  );
}
