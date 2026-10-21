import { formatAltitude, getExpedition, getWaypoint, type Expedition } from '@/entities/expedition';

import { PEAK_ALTITUDES_M, STORY_MARKS, type StoryMark } from '../config/story-timeline';
import type { MarkAltitude } from './story-labels';

/*
 * The printed altitude of every story mark (server side, so the client never ships the entity): the site's
 * or a commonly cited value from entities/expedition, marked "~" when approximate. A DEM sample is never
 * printed (R26); pass-through names, Mungji, Ice Lake (until Aman confirms) and the approximate Blue and
 * Green Lake carry no altitude.
 */

const PRINTABLE_SOURCES = new Set<string>(['commonly-cited', 'bio', 'gpx']);

function cited(exp: Expedition, mark: StoryMark): { m: number; approx: boolean } | undefined {
  if (mark.noAltitude || mark.approx || mark.role === 'pass-through' || !mark.label) return undefined;
  if (mark.role === 'peak') {
    const m = PEAK_ALTITUDES_M[mark.id];
    return m === undefined ? undefined : { m, approx: true };
  }
  for (const name of mark.entity ?? []) {
    const wp = getWaypoint(exp, name);
    if (!wp) continue;
    if (wp.altitudeM === undefined || wp.showAltitude === false || !PRINTABLE_SOURCES.has(wp.source)) return undefined;
    return { m: wp.altitudeM, approx: wp.approx === true };
  }
  return undefined;
}

export function resolveMarkAltitudes(): MarkAltitude[] {
  const exp = getExpedition('annapurna');
  return STORY_MARKS.map((mark) => {
    const c = cited(exp, mark);
    return c ? { alt: formatAltitude(c.m, c.approx), altM: c.m } : { alt: '' };
  });
}
