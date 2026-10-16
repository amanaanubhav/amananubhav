import { getExpedition, getWaypoint, type Expedition } from '@/entities/expedition';
import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

import { getStoryPoint, type HomeEntryId } from './copy';

/** Every home section that carries a waypoint: the hero, the six entries and `#next`. */
export type HomeSectionId = 'home' | HomeEntryId | 'next';

export interface HomeWaypoint {
  readonly name: string;
  readonly altitudeM?: number;
  readonly approx?: boolean;
  readonly planned?: boolean;
}

const ANNAPURNA = getExpedition('annapurna');
const DODITAL = getExpedition('dodital');

/** Altitudes are read by name from the expedition entity, never hard-coded (§G.1). */
function waypoint(exp: Expedition, name: string, planned = false): HomeWaypoint {
  const wp = getWaypoint(exp, name);
  return { name, altitudeM: wp?.altitudeM, approx: wp?.approx, planned };
}

/** The camp each home section stands at, Besisahar to Darwa Top (§G.1 table). */
export const HOME_WAYPOINTS: Readonly<Record<HomeSectionId, HomeWaypoint>> = {
  home: waypoint(ANNAPURNA, 'Besisahar'),
  origin: waypoint(ANNAPURNA, 'Khudi'),
  work: waypoint(ANNAPURNA, 'Chame'),
  how: waypoint(ANNAPURNA, 'Manang'),
  pass: waypoint(ANNAPURNA, 'Thorong La'),
  ask: waypoint(ANNAPURNA, 'Muktinath'),
  write: waypoint(ANNAPURNA, 'Muktinath'),
  next: waypoint(DODITAL, 'Darwa Top', true),
};

function item(id: HomeSectionId, label: string): SectionNavItem {
  const wp = HOME_WAYPOINTS[id];
  return {
    id,
    label,
    waypoint: wp.name,
    altitudeM: wp.altitudeM,
    approx: wp.approx,
    kind: wp.planned ? 'planned' : 'waypoint',
  };
}

/**
 * Waypoint rail of the home page. Labels are the `STORY_POINTS` titles; `#meander` stays the wrapper
 * id of the six entries (the "Read my story" target and old anchors) but is not a rail item.
 */
export const HOME_SECTIONS: readonly SectionNavItem[] = [
  item('home', 'Base camp'),
  item('origin', getStoryPoint('origin').title),
  item('work', getStoryPoint('work').title),
  item('how', getStoryPoint('how').title),
  item('pass', getStoryPoint('pass').title),
  item('ask', getStoryPoint('ask').title),
  item('write', getStoryPoint('write').title),
  item('next', 'Next base camp'),
];

/** Rail caption: "Altitude: Annapurna Circuit, solo, 2026". */
export const HOME_TRACK = {
  caption: `Altitude: ${ANNAPURNA.shortName}${ANNAPURNA.mode ? `, ${ANNAPURNA.mode}` : ''}${ANNAPURNA.when ? `, ${ANNAPURNA.when}` : ''}`,
} as const;
