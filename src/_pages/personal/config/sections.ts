import type { SectionNavItem } from '@/shared/ui/section-dot-nav';

/** A Life page stop: the rail item plus where the route map's link lands (the sky's lands on the plate, fix 19). */
export interface PersonalSection extends SectionNavItem {
  /** Route map / route-stop target; the rail and the contents sheet keep `#id`. */
  readonly routeHref: string;
}

/**
 * The Life page's six stops in render order (FINAL-DESIGN §2.1, Q-F5 sky second). Each h2 is its rail label. One
 * source for the rail, the dock "n of 6", the contents sheet and the route map (teaser and tag: Q-F2). "Next on the
 * route" (`#next`) closes the page but is not a stop.
 */
export const PERSONAL_SECTIONS = [
  { id: 'about', label: 'Origin', teaser: 'A roof in Sikahar, and where this started.', routeHref: '#about' },
  {
    id: 'sky',
    label: 'Night sky',
    teaser: "Tonight's sky over 25° N. Drag it.",
    tag: { label: 'Live', live: true },
    routeHref: '#sky-live',
  },
  {
    id: 'stem',
    label: 'Early builds',
    teaser: 'Five school builds, drawn as they work.',
    tag: { label: 'Try it' },
    routeHref: '#stem',
  },
  { id: 'business', label: 'Ventures', teaser: 'Four things I started.', routeHref: '#business' },
  { id: 'athletics', label: 'Altitude', teaser: 'My high points, to scale.', routeHref: '#athletics' },
  { id: 'gallery', label: 'Field album', teaser: 'Frames from the road and the trail.', routeHref: '#gallery' },
] as const satisfies readonly PersonalSection[];

export type PersonalSectionId = (typeof PERSONAL_SECTIONS)[number]['id'];

/** The route map's stops: every section below Origin. */
export const ROUTE_STOPS = PERSONAL_SECTIONS.slice(1);

/** Heading text of a section (its h2 is its rail label). */
export function sectionLabel(id: PersonalSectionId): string {
  return PERSONAL_SECTIONS.find((s) => s.id === id)?.label ?? id;
}
