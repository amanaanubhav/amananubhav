import { getExpedition, type ExpeditionId } from '@/entities/expedition';
import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

/** Caption under the waypoint rail (§G.4). */
export const STORIES_TRACK_CAPTION = 'High point of each trek';

/** A rail item that reads its altitude from the expedition's high point, never a hard-coded number. */
function trekItem(
  id: string,
  label: string,
  expeditionId: ExpeditionId,
  kind: 'waypoint' | 'planned' = 'waypoint',
): SectionNavItem {
  const { highPoint } = getExpedition(expeditionId);
  return {
    id,
    label,
    waypoint: highPoint.name,
    altitudeM: highPoint.altitudeM,
    approx: highPoint.approx,
    kind,
  };
}

/** Section rail for /stories, in render order (§G.4). Ids are the section wrappers' ids. */
export const STORIES_SECTIONS: readonly SectionNavItem[] = [
  { id: 'atlas', label: 'Atlas' },
  trekItem('annapurna', 'Annapurna Circuit', 'annapurna'),
  trekItem('kun-tso', 'Kun Tso', 'kun-tso'),
  trekItem('chandrashila', 'Chandrashila', 'chandrashila'),
  trekItem('himachal', 'Himachal trails', 'yulla-kanda'),
  trekItem('dodital', 'Next: Dodital', 'dodital', 'planned'),
  { id: 'pack', label: 'The pack' },
  { id: 'adventures', label: 'Journal' },
];
