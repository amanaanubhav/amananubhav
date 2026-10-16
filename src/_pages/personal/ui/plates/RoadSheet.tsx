import { useId } from 'react';
import type { RoadPlace, Ride } from '../../config/content';
import { DrawOnView } from '@/shared/ui/draw';
import { INK, LABEL, LABEL_MUTED, MUTED, NS, ROUTE, WATER, polyline } from './svg';

const W = 640;
const H = 360;

/**
 * Schematic node positions (viewBox units). Hand-placed against a simplified Odisha coast: Puri on
 * the shore, Bhubaneswar about 60 km inland to the north, Chandaka's forest just north-west of the
 * city. Q-59 adds places here when it adds them to `RoadPlace`.
 */
const PLACES: Readonly<Record<RoadPlace, { x: number; y: number; name: string; kind: 'city' | 'town' | 'area' }>> = {
  bhubaneswar: { x: 300, y: 128, name: 'Bhubaneswar', kind: 'city' },
  // Puri sits on the shore almost due south of Bhubaneswar (about 60 km).
  puri: { x: 330, y: 290, name: 'Puri', kind: 'town' },
  chandaka: { x: 214, y: 92, name: 'Chandaka', kind: 'area' },
};

/** Hand-simplified coastline, north-east to south-west, passing just south-east of Puri. */
const COAST: ReadonlyArray<readonly [number, number]> = [
  [640, 96],
  [592, 128],
  [540, 166],
  [484, 200],
  [436, 232],
  [398, 262],
  [352, 290],
  [300, 318],
  [236, 346],
  [204, 360],
];

const COAST_D = polyline(COAST);

/**
 * Water lining (the engraver's convention): copies of the coast stepped out to sea along the
 * coast's normal, fading with distance.
 */
const LINING = [8, 16, 25, 35].map((k, i) => ({
  d: polyline(COAST.map(([x, y]) => [x + k * 0.518, y + k * 0.855] as const)),
  opacity: [0.55, 0.43, 0.31, 0.19][i],
}));

/** Opacity builds with frequency: 3 = the ride repeated most, drawn most opaque. */
const FREQ_OPACITY: Record<Ride['frequency'], number> = { 1: 0.4, 2: 0.7, 3: 1 };
const FREQ_WORD: Record<Ride['frequency'], string> = { 1: 'now and then', 2: 'often', 3: 'most often' };

export interface RoadSheetProps {
  rides: readonly Ride[];
  className?: string;
}

/**
 * G-10 road sheet (16:9): a taillight map of the rides on a schematic Odisha coast. Each ride is a
 * straight `signal-line` trail between two schematic nodes; the more often it is ridden, the more
 * opaque it is. Labelled "schematic": the coast is hand-simplified and nothing is to scale.
 */
export function RoadSheet({ rides, className }: RoadSheetProps) {
  // Type is set in viewBox units, so it shrinks with the sheet; the breakpoint steps keep the labels
  // between about 12 and 18 CSS px from a phone-width sheet to the wide desktop plate.
  const id = useId();
  const used = new Set<RoadPlace>();
  rides.forEach((ride) => {
    used.add(ride.from);
    used.add(ride.to);
  });
  const desc =
    rides.length > 0
      ? `Schematic map of the Odisha coast on the Bay of Bengal. Rides: ${rides
          .map((ride) => `${ride.label} (${FREQ_WORD[ride.frequency]})`)
          .join('; ')}. Lines are more opaque for rides repeated more often. Not to scale.`
      : 'Schematic map of the Odisha coast on the Bay of Bengal. No rides listed yet. Not to scale.';
  const legend = ([3, 2, 1] as const).filter((f) => rides.some((ride) => ride.frequency === f));

  return (
    <DrawOnView className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        className="block h-auto w-full text-ink [font-size:24px] sm:[font-size:15px] md:[font-size:12px]"
      >
        <title id={`${id}-t`}>Road sheet: my rides around Bhubaneswar</title>
        <desc id={`${id}-d`}>{desc}</desc>
        {LINING.map((line) => (
          <path key={line.opacity} d={line.d} style={{ ...WATER, strokeWidth: 1, opacity: line.opacity }} vectorEffect={NS} />
        ))}
        <path d={COAST_D} style={{ ...INK, strokeWidth: 1.25 }} vectorEffect={NS} />

        {rides.map((ride) => {
          const a = PLACES[ride.from];
          const b = PLACES[ride.to];
          return (
            <path
              key={ride.id}
              data-draw
              d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
              style={{ ...ROUTE, opacity: FREQ_OPACITY[ride.frequency] }}
              vectorEffect={NS}
            >
              <title>{`${ride.label}, ${FREQ_WORD[ride.frequency]}`}</title>
            </path>
          );
        })}

        <g data-draw-label>
          {(Object.keys(PLACES) as RoadPlace[]).map((key) => {
            const place = PLACES[key];
            const active = used.has(key);
            if (place.kind === 'area') {
              return (
                <g key={key} opacity={active ? 1 : 0.6}>
                  <circle cx={place.x} cy={place.y} r={3.5} style={{ ...MUTED, strokeWidth: 1.25 }} vectorEffect={NS} />
                  <text x={place.x - 10} y={place.y - 10} textAnchor="end" className="font-body italic fill-ink-muted">
                    {place.name}
                  </text>
                </g>
              );
            }
            return (
              <g key={key} opacity={active ? 1 : 0.6}>
                <circle cx={place.x} cy={place.y} r={place.kind === 'city' ? 5 : 4} className="fill-current" />
                <text
                  x={place.x + (place.kind === 'city' ? 12 : -12)}
                  y={place.y + (place.kind === 'city' ? -8 : 5)}
                  textAnchor={place.kind === 'city' ? 'start' : 'end'}
                  className={place.kind === 'city' ? `${LABEL} font-semibold` : LABEL}
                >
                  {place.name}
                </text>
              </g>
            );
          })}

          <text x={436} y={318} className="font-body italic fill-water" fontSize="1.15em">
            Bay of Bengal
          </text>

          <path d="M588 24v34M582 36l6-12 6 12" style={{ ...INK, strokeWidth: 1.25 }} vectorEffect={NS} />
          <text x={588} y={76} textAnchor="middle" className={LABEL_MUTED}>
            N
          </text>

          {legend.map((f, i) => (
            <g key={f} transform={`translate(24 ${276 + i * 34})`}>
              <path d="M0 0H32" style={{ ...ROUTE, opacity: FREQ_OPACITY[f] }} vectorEffect={NS} />
              <text x={42} y={0} dominantBaseline="central" className={LABEL_MUTED}>
                {FREQ_WORD[f]}
              </text>
            </g>
          ))}
          <text x={24} y={34} className={LABEL_MUTED}>
            Odisha, schematic
          </text>
        </g>
      </svg>
    </DrawOnView>
  );
}
