import { DrawOnView } from '@/shared/ui/draw';
import { INK, LABEL, LABEL_MUTED, MUTED, NS, PlateSvg, ROUTE, WATER, polyline, r1 } from './svg';

const W = 360;
const H = 240;
/** Channel centre line and the bladeless column's section. */
const CY = 120;
const BX = 140;
const A = 18;
const BANK = 88;

/**
 * A streamline of ideal flow past a cylinder (stream function psi = y (1 - a^2 / r^2)), solved for
 * y at each x by bisection. `psi` is the line's offset from the centre line far upstream.
 */
function streamlinePoints(psi: number, x0 = 22, x1 = W - 22, step = 9): Array<readonly [number, number]> {
  const pts: Array<readonly [number, number]> = [];
  const sign = Math.sign(psi);
  const p = Math.abs(psi);
  for (let x = x0; x <= x1 + 0.01; x += step) {
    const dx = x - BX;
    let lo = p;
    let hi = p + 2 * A;
    for (let i = 0; i < 28; i += 1) {
      const y = (lo + hi) / 2;
      const f = y - (A * A * y) / (dx * dx + y * y) - p;
      if (f < 0) lo = y;
      else hi = y;
    }
    pts.push([x, r1(CY - sign * ((lo + hi) / 2))]);
  }
  return pts;
}

const streamline = (psi: number): string => polyline(streamlinePoints(psi));

/** A small clockwise or anticlockwise spiral: one shed vortex of the wake. */
function vortex(cx: number, cy: number, dir: 1 | -1): string {
  const pts: Array<readonly [number, number]> = [];
  for (let i = 0; i <= 22; i += 1) {
    const t = (i / 22) * Math.PI * 3.2;
    const r = 1 + (i / 22) * 6;
    pts.push([cx + r * Math.cos(t), cy + dir * r * Math.sin(t)]);
  }
  return polyline(pts);
}

const FLOW = [18, 32, 48, 66, -18, -32, -66].map((psi) => streamline(psi)).join('');
/** The fish's line follows the flow below the column: nothing spins in its way. */
const FISH_PTS = streamlinePoints(-48, 22, 310);
const FISH = polyline(FISH_PTS);
const [FISH_X, FISH_Y] = FISH_PTS[FISH_PTS.length - 1];
const WAKE = [
  vortex(196, CY - 7, 1),
  vortex(226, CY + 7, -1),
  vortex(256, CY - 7, 1),
  vortex(286, CY + 7, -1),
].join('');

/** Bank lines with short hatch ticks on the land side. */
function bank(y: number, side: 1 | -1): string {
  let d = `M14 ${y}H${W - 14}`;
  for (let x = 20; x < W - 14; x += 10) d += `M${x} ${y}l-5 ${side * 6}`;
  return d;
}

export interface RakshakPlateProps {
  className?: string;
}

/**
 * G-06 RAKSHAK plate: idealised flow lines bending around a bladeless column in a river channel, the
 * column swaying in its own wake of shed vortices, and the path a fish takes past it with no blades to
 * strike. A diagram of the idea; no efficiency figure is shown (Q-43).
 */
export function RakshakPlate({ className }: RakshakPlateProps) {
  return (
    <DrawOnView className={className}>
      <PlateSvg
        width={W}
        height={H}
        title="RAKSHAK: river flow around a bladeless harvester"
        desc="Diagram in plan view of a river channel. Flow lines bend smoothly around a round bladeless column; behind it the wake sheds alternating vortices that make the column sway across the flow, which is where the energy comes from. A highlighted line shows a fish swimming past with no blades in its way. Idealised flow, not a measurement."
      >
        <path d={bank(CY - BANK, -1)} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
        <path d={bank(CY + BANK, 1)} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />

        <path data-draw d={FLOW} style={{ ...WATER, strokeWidth: 1, opacity: 0.75 }} vectorEffect={NS} />
        <path data-draw d={WAKE} style={{ ...WATER, strokeWidth: 1 }} vectorEffect={NS} />

        <circle cx={BX} cy={CY} r={A} style={{ ...INK, strokeWidth: 1.5 }} vectorEffect={NS} />
        <circle cx={BX} cy={CY} r={A - 6} style={{ ...INK, strokeWidth: 1, strokeDasharray: '2 3' }} vectorEffect={NS} />
        <path
          d={`M${BX} ${CY - A - 6}v-12m-3.5 3.5 3.5-3.5 3.5 3.5M${BX} ${CY + A + 6}v12m-3.5-3.5 3.5 3.5 3.5-3.5`}
          style={{ ...INK, strokeWidth: 1.25 }}
          vectorEffect={NS}
        />

        <path data-draw d={FISH} style={ROUTE} vectorEffect={NS} />
        <path
          data-draw-label
          d={`M${FISH_X + 4} ${FISH_Y}c4-4.5 10-4.5 14 0c-4 4.5-10 4.5-14 0Zm14 0 5-4v8Z`}
          style={{ ...INK, strokeWidth: 1.25 }}
          vectorEffect={NS}
        />

        <g data-draw-label>
          <text x={24} y={CY - BANK + 16} className="font-body italic fill-water">
            river flow
          </text>
          <path d={`M96 ${CY - BANK + 12}h20m-4-3.5 4 3.5-4 3.5`} style={{ ...WATER, strokeWidth: 1 }} vectorEffect={NS} />
          <path
            d={`M${BX + 13} ${CY - 13}L228 ${CY - BANK + 12}H234`}
            style={{ ...MUTED, strokeWidth: 1 }}
            vectorEffect={NS}
          />
          <text x={W - 22} y={CY - BANK + 16} textAnchor="end" className={LABEL}>
            bladeless column
          </text>
          <text x={W - 22} y={CY + BANK - 10} textAnchor="end" className={LABEL}>
            fish pass, nothing to strike
          </text>
          <text x={22} y={H - 4} className={LABEL_MUTED}>
            Diagram, idealised flow
          </text>
        </g>
      </PlateSvg>
    </DrawOnView>
  );
}
