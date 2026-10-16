import { useId } from 'react';
import { DrawOnView } from '@/shared/ui/draw';
import { DATA, FAINT_INDEX, INK, LABEL, LABEL_MUTED, MUTED, NS, PlateSvg, ROUTE, polyline, r1 } from './svg';

const W = 360;
const H = 240;
/** Outer (cast iron) and inner (copper) walls of the chamber section. */
const OUT = { x0: 76, y0: 58, x1: 262, y1: 166 };
const IN = { x0: 86, y0: 68, x1: 252, y1: 156 };
/** Ports: air enters low on the hot side and leaves high on the cool side. */
const PORT_IN = { y0: 136, y1: 150 };
const PORT_OUT = { y0: 74, y1: 88 };

/** A rectangle outline with a gap on the left and right walls (the ports). */
function walledRect(r: { x0: number; y0: number; x1: number; y1: number }): string {
  return (
    `M${r.x0} ${PORT_IN.y0}V${r.y0}H${r.x1}V${PORT_OUT.y0}` +
    `M${r.x1} ${PORT_OUT.y1}V${r.y1}H${r.x0}V${PORT_IN.y1}`
  );
}

/** A corrugated baffle: a vertical zigzag from y0 to y1 at x. */
function baffle(x: number, y0: number, y1: number): string {
  const pts: Array<readonly [number, number]> = [];
  const steps = Math.round(Math.abs(y1 - y0) / 6);
  for (let i = 0; i <= steps; i += 1) {
    pts.push([x + (i % 2 === 0 ? -2.5 : 2.5), y0 + ((y1 - y0) * i) / steps]);
  }
  return polyline(pts);
}

/**
 * Heat hatching: 45° lines whose spacing opens from 3 units at the sunlit wall to 13 at the cool
 * wall, so density reads as temperature (clipped to the chamber interior).
 */
function heatHatch(): string {
  let d = '';
  let x = IN.x0;
  const span = IN.x1 - IN.x0 + (IN.y1 - IN.y0);
  while (x < IN.x1 + (IN.y1 - IN.y0)) {
    d += `M${r1(x)} ${IN.y0}l${-(IN.y1 - IN.y0)} ${IN.y1 - IN.y0}`;
    x += 3 + 10 * ((x - IN.x0) / span);
  }
  return d;
}

/** The same density ramp as a legend strip of vertical ticks. */
function legendHatch(x0: number, x1: number, y: number): string {
  let d = '';
  let x = x0;
  while (x <= x1) {
    d += `M${r1(x)} ${y}v8`;
    x += 3 + 10 * ((x - x0) / (x1 - x0));
  }
  return d;
}

const BAFFLES = [
  baffle(120, IN.y0, 130),
  baffle(154, IN.y1, 94),
  baffle(188, IN.y0, 130),
  baffle(222, IN.y1, 94),
].join('');

/** The air's path through the maze: under, over, under, over, out. */
const AIR = polyline([
  [22, 143],
  [137, 143],
  [137, 81],
  [171, 81],
  [171, 143],
  [205, 143],
  [205, 81],
  [338, 81],
]);

const HATCH = heatHatch();
const LEGEND = legendHatch(IN.x0, IN.x1, 180);

export interface PavanaPlateProps {
  className?: string;
}

/**
 * G-06 PAVANA plate: a cutaway of the solar-thermal capture chamber. A cast-iron wall with a copper
 * lining, a corrugated baffle maze, hatching that tightens toward the sunlit wall, and the air's path
 * through it. Every cost is marked "projected" (§G.2).
 */
export function PavanaPlate({ className }: PavanaPlateProps) {
  const clipId = `${useId()}-chamber`;
  return (
    <DrawOnView className={className}>
      <PlateSvg
        width={W}
        height={H}
        title="PAVANA capture chamber, cutaway"
        desc="Cutaway diagram of PAVANA's chamber: concentrated sunlight heats a cast-iron wall lined with copper; hatching inside is densest at the sunlit wall and opens toward the cool wall, a 250 to 400 °C difference in the design. Air enters low on the hot side, weaves under and over four corrugated baffles and leaves high on the cool side with CO2 removed. Projected cost: $94 to $232 per tonne of CO2. Not to scale."
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={IN.x0} y={IN.y0} width={IN.x1 - IN.x0} height={IN.y1 - IN.y0} />
          </clipPath>
        </defs>

        <path d={HATCH} clipPath={`url(#${clipId})`} style={{ ...FAINT_INDEX, strokeWidth: 1 }} vectorEffect={NS} />
        <path
          d={`M${OUT.x0} ${OUT.y0}H${OUT.x1}V${OUT.y1}H${OUT.x0}ZM${IN.x0} ${IN.y0}V${IN.y1}H${IN.x1}V${IN.y0}Z`}
          fillRule="evenodd"
          style={{ fill: 'var(--ink-contour)', stroke: 'none' }}
        />
        <path data-draw d={walledRect(OUT)} style={{ ...INK, strokeWidth: 1.5 }} vectorEffect={NS} />
        <path data-draw d={walledRect(IN)} style={{ ...INK, strokeWidth: 1 }} vectorEffect={NS} />
        <path data-draw d={BAFFLES} style={{ ...INK, strokeWidth: 1 }} vectorEffect={NS} />

        <path
          data-draw
          d="M30 28L76 104M46 26L76 104M62 26L76 104"
          style={{ ...MUTED, strokeWidth: 1, strokeDasharray: '2 4' }}
          vectorEffect={NS}
        />
        <path data-draw d={AIR} style={ROUTE} vectorEffect={NS} />
        <path data-draw-label d="M330 76l8 5-8 5" style={ROUTE} vectorEffect={NS} />

        <g data-draw-label>
          <text x={24} y={18} className={LABEL_MUTED}>
            concentrated sunlight
          </text>
          <text x={24} y={134} className={LABEL}>
            air in
          </text>
          <text x={W - 22} y={72} textAnchor="end" className={LABEL}>
            air out
          </text>
          <text x={W - 22} y={100} textAnchor="end" className={LABEL_MUTED}>
            less CO₂
          </text>
          <path d="M248 58L264 40H270" style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
          <text x={274} y={44} className={LABEL_MUTED}>
            cast iron
          </text>
          <path d="M252 124H270" style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
          <text x={274} y={128} className={LABEL_MUTED}>
            copper
          </text>

          <path d={LEGEND} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
          <text x={IN.x0 - 6} y={188} textAnchor="end" className={LABEL_MUTED}>
            hot
          </text>
          <text x={IN.x1 + 6} y={188} className={LABEL_MUTED}>
            cool
          </text>
          <text x={W / 2} y={206} textAnchor="middle" className={DATA}>
            design ΔT 250 to 400 °C
          </text>
          <text x={W / 2} y={228} textAnchor="middle" className={LABEL}>
            Projected <tspan className="font-data tabular">$94 to $232</tspan> per tonne of CO₂
          </text>
          <text x={W - 22} y={18} textAnchor="end" className={LABEL_MUTED}>
            Cutaway diagram
          </text>
        </g>
      </PlateSvg>
    </DrawOnView>
  );
}
