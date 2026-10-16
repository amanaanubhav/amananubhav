import { formatAltitude, getExpedition } from '@/entities/expedition';
import type { TrailItem } from '@/shared/ui/journal';

import type { HomeEntryId } from './copy';

/*
 * Two-lane trail marks per home entry (§G.1, D1 graft): squares are systems, triangles are summits,
 * dashed triangles are planned. Items with an unknown date carry no `date` (no <time> renders):
 * Sikahar (Q-02), the NYAS win (Q-29), Atlys (Q-10).
 */

const KUN_TSO = getExpedition('kun-tso');
const ANNAPURNA = getExpedition('annapurna');
const CHANDRASHILA = getExpedition('chandrashila');
const DODITAL = getExpedition('dodital');

const kunTsoHigh = KUN_TSO.highPoint.altitudeM;

export const ENTRY_TRAILS: Readonly<Partial<Record<HomeEntryId, readonly TrailItem[]>>> = {
  origin: [
    { lane: 'systems', label: 'Sikahar, Bihar' },
    { lane: 'systems', label: 'Delhi Public School', date: '2019', datetime: '2019' },
    { lane: 'systems', label: 'Founded DeuxStem', date: '2020', datetime: '2020' },
    { lane: 'systems', label: 'MIT LaunchX, full ride', date: '2022', datetime: '2022' },
    { lane: 'systems', label: 'NYAS Junior Academy winner, KANAD' },
  ],
  work: [
    { lane: 'systems', label: 'KIIT, Mathematics and Computer Science', date: '2023', datetime: '2023' },
    { lane: 'systems', label: 'GDG KIIT growth team', date: '2024', datetime: '2024' },
    { lane: 'systems', label: 'MLSA Project Wing', date: '2024', datetime: '2024' },
    { lane: 'systems', label: 'OceanBot', date: 'Jul 2025', datetime: '2025-07' },
    { lane: 'systems', label: 'YVOO, SIH qualifier', date: 'Sep 2025', datetime: '2025-09' },
    {
      lane: 'summit',
      label: `Kun Tso in winter${kunTsoHigh ? `, ${formatAltitude(kunTsoHigh, KUN_TSO.highPoint.approx)}` : ''}`,
      // Q-51 interim month
      date: KUN_TSO.when,
      datetime: '2025-11',
    },
    { lane: 'systems', label: 'The Trav Story', date: 'Nov 2025', datetime: '2025-11' },
    { lane: 'systems', label: 'DIVERT and Accolades', date: 'Dec 2025', datetime: '2025-12' },
  ],
  how: [
    { lane: 'systems', label: 'Brndo, remote', date: 'Jun 2026', datetime: '2026-06' },
    { lane: 'systems', label: 'Atlys, AI engineer' },
  ],
  pass: [
    {
      lane: 'summit',
      label: `${ANNAPURNA.shortName}, ${ANNAPURNA.mode ?? 'solo'}`,
      date: ANNAPURNA.when,
      datetime: ANNAPURNA.year ? String(ANNAPURNA.year) : undefined,
    },
    {
      lane: 'summit',
      label: `${CHANDRASHILA.shortName}, ${CHANDRASHILA.mode ?? 'solo'}`,
      date: CHANDRASHILA.when,
      datetime: CHANDRASHILA.year ? String(CHANDRASHILA.year) : undefined,
    },
  ],
};

/** `#next`: the planned trek, never dated before the trip (Q-48). */
export const NEXT_TRAIL: readonly TrailItem[] = [
  { lane: DODITAL.status === 'done' ? 'summit' : 'planned', label: 'Dodital and Darwa Top' },
];
