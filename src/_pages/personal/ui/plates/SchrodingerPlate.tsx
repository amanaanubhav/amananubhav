import { hashSeed, mulberry32 } from '@/shared/lib/random';
import { DrawOnView } from '@/shared/ui/draw';
import { DATA, INK, LABEL, LABEL_MUTED, MUTED, NS, PlateSvg, ROUTE, r1 } from './svg';

const W = 360;
const H = 240;
const CX = 180;
const CY = 120;
/** Pixels per Bohr radius. */
const A0 = 8.5;
const DOTS = 1500;
/** Radius of the drawn bound, in Bohr radii: an illustrative region around the nucleus. */
const BOUND_A0 = 3.2;

/** Shortest decimal form: "0.5" -> ".5", "-0.5" -> "-.5". */
const num = (v: number): string => String(v === 0 ? 0 : v).replace(/^(-?)0\./, '$1.');

/**
 * About 1,500 seeded samples of a hydrogen 2p orbital, projected onto the page plane:
 * r from the radial density r^4 e^-r (a sum of five exponentials), cos(theta) from cos^2,
 * phi uniform. Ordered nearest-neighbour so the path is written as short relative moves.
 */
function orbitalSamples(): Array<readonly [number, number]> {
  const rand = mulberry32(hashSeed('schrodinger-2p'));
  const pts: Array<readonly [number, number]> = [];
  while (pts.length < DOTS) {
    let r = 0;
    for (let k = 0; k < 5; k += 1) r -= Math.log(1 - rand());
    const c = Math.cbrt(2 * rand() - 1);
    const s = Math.sqrt(1 - c * c);
    const phi = 2 * Math.PI * rand();
    const x = CX + r * s * Math.cos(phi) * A0;
    const y = CY - r * c * A0;
    if (x < 24 || x > W - 24 || y < 16 || y > H - 16) continue;
    pts.push([Math.round(x), Math.round(y)]);
  }
  const left = pts.slice(1);
  const ordered = [pts[0]];
  while (left.length > 0) {
    const [x, y] = ordered[ordered.length - 1];
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < left.length; i += 1) {
      const d = (left[i][0] - x) ** 2 + (left[i][1] - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    ordered.push(left.splice(best, 1)[0]);
  }
  return ordered;
}

/** One path of zero-length segments (`m dx dy h0`); round caps turn each into a dot. */
function dotsPath(points: ReadonlyArray<readonly [number, number]>): string {
  let d = '';
  let px = 0;
  let py = 0;
  points.forEach(([x, y], i) => {
    if (i === 0) {
      d += `M${x} ${y}h0`;
    } else {
      const dy = num(y - py);
      d += `m${num(x - px)}${dy.startsWith('-') ? '' : ' '}${dy}h0`;
    }
    px = x;
    py = y;
  });
  return d;
}

const CLOUD = dotsPath(orbitalSamples());
const BOUND_R = BOUND_A0 * A0;

export interface SchrodingerPlateProps {
  className?: string;
}

/**
 * G-06 Schrödinger plate: an electron's probability cloud around a nucleus, drawn as about 1,500
 * seeded points in one path, with the dotted Bekenstein bound that the school paper used to pin the
 * electron's position down. A diagram, not data.
 */
export function SchrodingerPlate({ className }: SchrodingerPlateProps) {
  const scaleY = H - 22;
  return (
    <DrawOnView className={className}>
      <PlateSvg
        width={W}
        height={H}
        title="Electron probability cloud with the Bekenstein bound"
        desc="Diagram of an electron's 2p orbital around a nucleus, drawn as 1,500 sampled positions that cluster in two lobes. A dotted circle close around the nucleus marks the Bekenstein bound, the limit the paper used to narrow down where the electron can be. Illustrative, not measured."
      >
        <g data-draw-label>
          <path
            d={CLOUD}
            style={{ ...INK, strokeWidth: 1.8, opacity: 0.66 }}
            vectorEffect={NS}
          />
        </g>
        <path d={`M${CX - 6} ${CY}H${CX + 6}M${CX} ${CY - 6}V${CY + 6}`} style={{ ...INK, strokeWidth: 1 }} vectorEffect={NS} />
        <circle cx={CX} cy={CY} r={2.6} className="fill-current" />
        <circle
          data-draw
          cx={CX}
          cy={CY}
          r={BOUND_R}
          style={{ ...ROUTE, strokeDasharray: '0 5' }}
          vectorEffect={NS}
        />
        <g data-draw-label>
          <path
            d={`M${r1(CX + BOUND_R * 0.72)} ${r1(CY + BOUND_R * 0.72)}L${CX + 72} ${CY + 46}H${CX + 78}`}
            style={{ ...MUTED, strokeWidth: 1 }}
            vectorEffect={NS}
          />
          <text x={CX + 82} y={CY + 50} className={LABEL}>
            Bekenstein
          </text>
          <text x={CX + 82} y={CY + 65} className={LABEL}>
            bound
          </text>
          <path d={`M${CX - 4} ${CY + 3}L${CX - 72} ${CY + 54}H${CX - 80}`} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
          <text x={CX - 84} y={CY + 58} textAnchor="end" className={LABEL}>
            nucleus
          </text>
          <text x={24} y={30} className={LABEL_MUTED}>
            2p orbital, 1,500 samples
          </text>
          <path
            d={`M${W - 24 - A0 * 5} ${scaleY}H${W - 24}M${W - 24 - A0 * 5} ${scaleY - 3}v6M${W - 24} ${scaleY - 3}v6`}
            style={{ ...MUTED, strokeWidth: 1 }}
            vectorEffect={NS}
          />
          <text x={W - 24 - (A0 * 5) / 2} y={scaleY - 7} textAnchor="middle" className={DATA}>
            5 a₀
          </text>
          <text x={24} y={scaleY + 4} className={LABEL_MUTED}>
            Diagram
          </text>
        </g>
      </PlateSvg>
    </DrawOnView>
  );
}
