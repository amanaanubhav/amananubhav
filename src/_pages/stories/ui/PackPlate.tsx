import type { CSSProperties } from 'react';
import { getExpedition } from '@/entities/expedition';
import { PlateFrame } from '@/shared/ui/journal';
import { PACK_COPY } from '../config/treks';

/*
 * G-08: the pack as an exploded view (§F). A pack silhouette, the seven categories of [S-EXP-GEAR] as
 * outline drawings on leader lines, and one weight bar for the whole pack with unlabelled ticks until the
 * gear list with weights arrives (Q-56). Theme-aware (CSS variables only), static, non-scaling strokes.
 */

const VIEW = 640;
const NON_SCALING = 'non-scaling-stroke' as const;
const INK: CSSProperties = { stroke: 'rgb(var(--c-ink))', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const LEADER: CSSProperties = { stroke: 'rgb(var(--c-ink-muted))', fill: 'none', strokeWidth: 1, strokeDasharray: '3 4' };
const TICK: CSSProperties = { stroke: 'rgb(var(--c-line-strong))', strokeWidth: 1 };

/** Outline drawings, about 52 units across, centred on the origin. */
const GLYPHS: Readonly<Record<(typeof PACK_COPY.categories)[number], string>> = {
  // tent with a door
  Shelter: 'M-26 18L0-20L26 18Z M0-20V18 M-8 18L0 5L8 18 M-32 18H32',
  // pot on a stove
  Kitchen: 'M-18-8H18V8Q18 14 12 14H-12Q-18 14-18 8Z M-23-8H23 M18-2H27 M-12 14L-16 23 M12 14L16 23 M-6-8Q-6-16 0-16Q6-16 6-8',
  // roll-top food bag
  Food: 'M-15-16H15L18 20Q18 24 14 24H-14Q-18 24-18 20Z M-15-16Q0-26 15-16 M-15-9H15 M-9 4H9',
  // shell jacket
  Clothing: 'M-10-22L-25-12L-21 22H21L25-12L10-22Q0-13-10-22Z M0-15V22 M-25-12L-31 10 M25-12L31 10',
  // bottle with a drop
  'Water treatment': 'M-7-25H7V-19Q15-15 15-5V21Q15 25 11 25H-11Q-15 25-15 21V-5Q-15-15-7-19Z M0 0Q6 8 6 12A6 6 0 0 1-6 12Q-6 8 0 0Z',
  // folded map with a dashed line
  Navigation: 'M-26-18L-9-24L9-18L26-24V18L9 24L-9 18L-26 24Z M-9-24V18 M9-18V24',
  // first-aid kit
  'First aid': 'M-22-12H22V20H-22Z M-8-12V-19H8V-12 M0-4V12 M-8 4H8',
};

interface Callout {
  name: (typeof PACK_COPY.categories)[number];
  /** Glyph centre. */
  x: number;
  y: number;
  /** Where the leader meets the pack. */
  ax: number;
  ay: number;
}

const CALLOUTS: readonly Callout[] = [
  { name: 'Shelter', x: 112, y: 112, ax: 262, ay: 196 },
  { name: 'Kitchen', x: 112, y: 226, ax: 250, ay: 270 },
  { name: 'Food', x: 112, y: 340, ax: 250, ay: 350 },
  { name: 'Clothing', x: 112, y: 454, ax: 256, ay: 440 },
  { name: 'Water treatment', x: 522, y: 140, ax: 380, ay: 210 },
  { name: 'Navigation', x: 522, y: 290, ax: 388, ay: 300 },
  { name: 'First aid', x: 522, y: 430, ax: 356, ay: 392 },
];

const PACK_BODY = 'M262 178Q320 162 378 178L396 452Q398 482 368 484H272Q242 482 244 452Z';
const PACK_DETAILS = [
  'M258 186Q320 120 382 186', // lid
  'M263 204Q320 190 377 204', // lid seam
  'M306 150Q320 134 334 150', // haul loop
  'M282 330H358L362 430Q362 446 346 446H294Q278 446 278 430Z', // front pocket
  'M252 262H388', // compression straps
  'M249 378H391',
  'M394 356Q414 384 402 446', // side pocket
  'M246 448L214 460 M394 448L426 460', // hip belt
];

const BAR = { x: 60, y: 556, w: 520, h: 22 };

/** G-08, `/stories#pack`: the 1:1 exploded-view diagram beside the pack photo slot (M-EXP-ANN-05). */
export function PackPlate({ className }: { className?: string }) {
  const packKg = getExpedition('annapurna').packKg;
  const kg = packKg ?? 0;
  const ticks = Array.from({ length: Math.max(0, kg - 1) }, (_, i) => BAR.x + ((i + 1) * BAR.w) / kg);

  return (
    <PlateFrame
      ratio="1:1"
      ticks
      grid
      className={className}
      caption="Diagram of what the pack carries, by category."
    >
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-labelledby="pack-plate-title pack-plate-desc"
        className="absolute inset-0 size-full"
      >
        <title id="pack-plate-title">The pack, exploded: seven categories of gear</title>
        <desc id="pack-plate-desc">
          {`A diagram of my pack with ${PACK_COPY.categories.join(', ').toLowerCase()} drawn around it on leader lines, and one weight bar for the whole ${packKg ? `${packKg} kg` : 'pack'}. Weights by category to come.`}
        </desc>

        <g aria-hidden="true">
          {CALLOUTS.map((c) => {
            const towardPack = c.ax > c.x ? 1 : -1;
            return (
              <g key={c.name}>
                <path d={`M${c.x + towardPack * 40} ${c.y}L${c.ax} ${c.ay}`} style={LEADER} vectorEffect={NON_SCALING} />
                <circle cx={c.ax} cy={c.ay} r={3.5} className="fill-ink" />
                <path d={GLYPHS[c.name]} transform={`translate(${c.x} ${c.y}) scale(1.15)`} style={INK} vectorEffect={NON_SCALING} />
                <text x={c.x} y={c.y + 58} textAnchor="middle" fontSize={26} className="fill-ink font-display font-semibold">
                  {c.name}
                </text>
              </g>
            );
          })}

          <path d={PACK_BODY} className="fill-ground" style={{ ...INK, fill: undefined }} vectorEffect={NON_SCALING} />
          {PACK_DETAILS.map((d) => (
            <path key={d} d={d} style={INK} vectorEffect={NON_SCALING} />
          ))}

          <text x={BAR.x + BAR.w} y={BAR.y - 12} textAnchor="end" fontSize={24} className="fill-ink font-data tabular">
            {packKg ? `${packKg} kg` : ''}
          </text>
          <rect
            x={BAR.x}
            y={BAR.y}
            width={BAR.w}
            height={BAR.h}
            style={{ fill: 'rgb(var(--c-ink) / 0.08)', stroke: 'rgb(var(--c-ink))', strokeWidth: 1.25 }}
            vectorEffect={NON_SCALING}
          />
          {ticks.map((x) => (
            <line key={x} x1={x} x2={x} y1={BAR.y} y2={BAR.y + 8} style={TICK} vectorEffect={NON_SCALING} />
          ))}
          <text x={BAR.x} y={BAR.y + BAR.h + 34} fontSize={25} className="fill-ink-muted font-body italic">
            Weights by category to come
          </text>
        </g>
      </svg>
    </PlateFrame>
  );
}
