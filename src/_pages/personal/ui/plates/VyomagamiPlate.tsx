import { DrawOnView } from '@/shared/ui/draw';
import { DATA, FAINT, INK, LABEL, LABEL_MUTED, MUTED, NS, PlateSvg, ROUTE, r1 } from './svg';

const W = 360;
const H = 240;
/** Plot box: altitude 0 to 40 km bottom to top; time runs left to right without a scale. */
const X0 = 52;
const X1 = 300;
const Y0 = 186;
const KM = (Y0 - 26) / 40;
const yAt = (km: number): number => r1(Y0 - km * KM);
/** The balloon ceiling and ignition altitude from the deck: about 30 km. */
const CEILING = yAt(30);
const IGNITION_X = 214;

/**
 * The air column: one tick per tenth of the atmosphere's mass, from a simple exponential model
 * (scale height 6.7 km, so the last tick, 99%, sits near 30 km). Illustrative, not a measurement.
 */
const AIR_TICKS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99]
  .map((f) => `M318 ${yAt(-6.7 * Math.log(1 - f))}h14`)
  .join('');

const BALLOON = `M${X0} ${Y0}L176 ${r1(CEILING + 9)}Q186 ${CEILING} 200 ${CEILING}H${IGNITION_X}`;
const BURN = `M${IGNITION_X} ${CEILING}C248 ${CEILING} 268 52 280 22`;

export interface VyomagamiPlateProps {
  className?: string;
}

/**
 * G-06 VYOMAGAMI plate: altitude against time for the balloon-first launch concept. A balloon lifts
 * the rocket to about 30 km, above roughly 99% of the atmosphere's mass, and the rocket ignites there.
 * Deck figures only: the time axis carries no numbers.
 */
export function VyomagamiPlate({ className }: VyomagamiPlateProps) {
  return (
    <DrawOnView className={className}>
      <PlateSvg
        width={W}
        height={H}
        title="VYOMAGAMI ascent: altitude against time"
        desc="Concept diagram. A balloon carries the rocket from the ground to about 30 km, above roughly 99% of the atmosphere's mass, and floats there; the rocket then ignites and climbs steeply off the top of the chart. A column on the right shows the air thinning with height. Time is not to scale."
      >
        <path
          d={`M${X0} ${yAt(10)}H${X1}M${X0} ${yAt(20)}H${X1}M${X0} ${yAt(40)}H${X1}`}
          style={{ ...FAINT, strokeWidth: 1 }}
          vectorEffect={NS}
        />
        <path
          d={`M${X0} ${CEILING}H${X1}`}
          style={{ ...MUTED, strokeWidth: 1, strokeDasharray: '3 4' }}
          vectorEffect={NS}
        />
        <path data-draw d={`M${X0} ${yAt(40) - 4}V${Y0}H${X1}`} style={{ ...INK, strokeWidth: 1 }} vectorEffect={NS} />
        <path data-draw d={`M318 ${yAt(40)}V${Y0}h14V${yAt(40)}`} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
        <path data-draw d={AIR_TICKS} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />

        <path data-draw d={BALLOON} style={ROUTE} vectorEffect={NS} />
        <path data-draw d={BURN} style={ROUTE} vectorEffect={NS} />
        <path data-draw-label d="M274.5 25.5L280 22l.4 6.6" style={ROUTE} vectorEffect={NS} />

        <g data-draw-label>
          <path d={`M${IGNITION_X} ${r1(CEILING - 4)}V${r1(CEILING - 14)}`} style={{ ...MUTED, strokeWidth: 1 }} vectorEffect={NS} />
          <circle cx={IGNITION_X} cy={r1(CEILING - 21)} r={7} style={{ ...INK, strokeWidth: 1.25 }} vectorEffect={NS} />
          <circle cx={IGNITION_X} cy={CEILING} r={4} style={{ ...INK, strokeWidth: 1.25 }} vectorEffect={NS} />
          <text x={IGNITION_X + 8} y={r1(CEILING + 16)} className={LABEL}>
            ignition, ~30 km
          </text>

          {[0, 10, 20, 30, 40].map((km) => (
            <text key={km} x={X0 - 6} y={yAt(km) + 4} textAnchor="end" className={DATA}>
              {km}
            </text>
          ))}
          <text x={X0 - 6} y={18} textAnchor="end" className={DATA}>
            km
          </text>
          <text x={X0 + 6} y={r1(CEILING - 6)} className={LABEL_MUTED}>
            above ~99% of the air
          </text>
          <text x={325} y={20} textAnchor="middle" className={LABEL_MUTED}>
            air
          </text>
          <text x={286} y={34} className={LABEL}>
            burn
          </text>

          <path
            d={`M${X0} ${Y0 + 6}v6H${IGNITION_X - 2}v-6M${IGNITION_X + 2} ${Y0 + 6}v6H${X1}v-6`}
            style={{ ...MUTED, strokeWidth: 1 }}
            vectorEffect={NS}
          />
          <text x={(X0 + IGNITION_X) / 2} y={Y0 + 27} textAnchor="middle" className={LABEL_MUTED}>
            balloon ascent
          </text>
          <text x={(IGNITION_X + X1) / 2} y={Y0 + 27} textAnchor="middle" className={LABEL_MUTED}>
            rocket
          </text>
          <text x={X0 + 18} y={18} className={LABEL_MUTED}>
            Concept diagram
          </text>
          <text x={X0} y={H - 8} className={LABEL_MUTED}>
            Time, not to scale
          </text>
        </g>
      </PlateSvg>
    </DrawOnView>
  );
}
