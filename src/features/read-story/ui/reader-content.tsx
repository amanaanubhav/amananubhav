import type { ReactNode } from 'react';

import { formatAltitude, type Expedition } from '@/entities/expedition';
import type { Story } from '@/entities/story';
import type { ProfilePoint } from '@/shared/ui/charts';
import type { LogEntry } from '@/shared/ui/journal';

/**
 * A trek's profile points, every waypoint in walking order (side trips included). The same list the story
 * card's cover draws (`_pages/stories` `trekProfilePoints`), so the card-to-reader morph lands on the same
 * line (§G.4). Altitudes the registry withholds (`showAltitude: false`) are dropped, never printed.
 */
export function routeProfilePoints(expedition: Expedition): ProfilePoint[] {
  return expedition.waypoints.map((wp) => ({
    name: wp.name,
    altitudeM: wp.showAltitude === false ? undefined : wp.altitudeM,
    approx: wp.approx,
    distanceKm: wp.distanceKm,
    kind: wp.kind,
  }));
}

/** Words for the profile's `<desc>`: start, end and high point, never an invented number. */
export function routeProfileDesc(expedition: Expedition, points: readonly ProfilePoint[]): string {
  const first = points[0]?.name;
  const last = points[points.length - 1]?.name;
  const { name, altitudeM, approx } = expedition.highPoint;
  const span = first && last && first !== last ? `From ${first} to ${last}. ` : '';
  const high = altitudeM !== undefined ? `High point ${name}, ${formatAltitude(altitudeM, approx)}.` : `High point ${name}.`;
  return `${span}${high}`;
}

const ALTITUDE = new Intl.NumberFormat('en');

/** One "high point" value, as on the trek spreads: "5,000 m Kun Tso" (the name alone when the altitude is unknown). */
function highPointValue(high: Expedition['highPoint'] | undefined): ReactNode {
  if (!high) return undefined;
  if (high.altitudeM === undefined) return high.name ? <span className="font-body">{high.name}</span> : undefined;
  return (
    <>
      {ALTITUDE.format(high.altitudeM)}
      <span className="ml-[0.2em] text-[0.875em] text-ink-muted">m</span>
      {high.name ? <span className="ml-[0.5em] font-body text-ink-muted">{high.name}</span> : null}
    </>
  );
}

/** The reader's field log (§H.8): date, category, place, then the expedition facts; unknown rows are dropped. */
export function storyLog(story: Story, expedition: Expedition | undefined): LogEntry[] {
  const high = expedition?.highPoint;
  return [
    { key: 'date', value: story.date },
    { key: 'category', value: story.category, mono: false },
    { key: 'place', value: story.place, mono: false },
    { key: 'days', value: expedition?.days },
    { key: 'distance', value: expedition?.distanceKm, unit: 'km' },
    { key: 'high point', value: highPointValue(high), approx: high?.altitudeM !== undefined && high.approx },
    { key: 'pack', value: expedition?.packKg, unit: 'kg' },
  ];
}

const EXTERNAL_ANCHOR = /<a\b([^>]*?)\bhref="(https?:\/\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g;

const HEADING_TAG = /<(\/?)h([1-6])(?=[\s>])/gi;

/**
 * Story HTML starts its sections at h3 (it was written for a page with an h2 above); in the reader the title is
 * the h1, so the top level moves up to h2 and the rest follows (no skipped levels, axe `heading-order`).
 */
function promoteHeadings(html: string): string {
  let top = 7;
  for (const match of html.matchAll(HEADING_TAG)) top = Math.min(top, Number(match[2]));
  const shift = top - 2;
  if (top > 6 || shift <= 0) return html;
  return html.replace(HEADING_TAG, (_m, slash: string, level: string) => `<${slash}h${Number(level) - shift}`);
}

/**
 * Prepares story HTML (semantic tags from `entities/story`, no classes) for the reader: headings start at h2
 * under the title, `pre` blocks scroll on their own (`data-lenis-prevent`), external links open in a new tab
 * and say so to screen readers.
 */
export function prepareStoryHtml(html: string): string {
  return promoteHeadings(html)
    .replace(/<pre(?=[\s>])/g, '<pre data-lenis-prevent')
    .replace(EXTERNAL_ANCHOR, (match, before: string, href: string, after: string, inner: string) => {
      if (/\btarget=/.test(before + after)) return match;
      return (
        `<a${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">` +
        `${inner}<span class="sr-only"> (opens in a new tab)</span></a>`
      );
    });
}
