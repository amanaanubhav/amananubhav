import type { Expedition, ExpeditionId } from '@/entities/expedition';
import { atlasPoint } from '../config/atlas.generated';

/** Serializable pin data handed to the client pin layer. */
export interface AtlasPinData {
  readonly expeditionId: ExpeditionId;
  /** The section the caption card's "Go to field note" scrolls to. */
  readonly sectionId: string;
  readonly label: string;
  readonly highPointName: string;
  readonly altitudeM?: number;
  readonly approx?: boolean;
  readonly status: 'done' | 'upcoming';
  readonly xPct: number;
  readonly yPct: number;
  /** The pin sits near the sheet's right edge: its label goes to the left, so the plate never clips it. */
  readonly labelStart: boolean;
}

/** Past this share of the sheet width a pin's label (to its right by default) would run off the plate. */
const LABEL_FLIP_X_PCT = 82;

/** Which rail section each expedition's caption card points to. */
const SECTION_OF: Readonly<Record<ExpeditionId, string>> = {
  annapurna: 'annapurna',
  'kun-tso': 'kun-tso',
  chandrashila: 'chandrashila',
  triund: 'himachal',
  kheerganga: 'himachal',
  'yulla-kanda': 'himachal',
  dodital: 'dodital',
};

/** One pin per expedition at its approximate trailhead, in reading order west to east (§G.4). */
export function buildAtlasPins(list: readonly Expedition[]): AtlasPinData[] {
  return list
    .filter((exp): exp is Expedition & { trailhead: { lat: number; lon: number } } => exp.trailhead !== undefined)
    .slice()
    .sort((a, b) => a.trailhead.lon - b.trailhead.lon)
    .map((exp) => {
      const { xPct, yPct } = atlasPoint(exp.trailhead.lon, exp.trailhead.lat);
      return {
        expeditionId: exp.id,
        sectionId: SECTION_OF[exp.id],
        label: exp.shortName,
        highPointName: exp.highPoint.name,
        altitudeM: exp.highPoint.altitudeM,
        approx: exp.highPoint.approx,
        status: exp.status,
        xPct: Math.round(xPct * 100) / 100,
        yPct: Math.round(yPct * 100) / 100,
        labelStart: xPct > LABEL_FLIP_X_PCT,
      };
    });
}
