import { EXPEDITIONS, formatAltitude, getWaypoint, type Expedition, type Waypoint } from '@/entities/expedition';
import { STORIES } from '@/entities/story';
import type { MediaSlotId } from '@/shared/config';
import { HIGH_POINTS_COPY } from '../config/content';

/** The marks the High points chart draws (FINAL-DESIGN §4.5.1): trig triangles for summits and passes, lakes as water. */
export type HighPointKind = 'summit' | 'pass' | 'lake';

export interface HighPoint {
  readonly id: string;
  readonly name: string;
  readonly heightM: number;
  /** Renders "~" (and "about" for screen readers) exactly where the entity sets `approx`. */
  readonly approx: boolean;
  readonly kind: HighPointKind;
  /** The expedition's full name (card) and its short name (text twin). */
  readonly expedition: string;
  readonly route: string;
  readonly when?: string;
  readonly region?: string;
  /** `mode === 'solo'` only. Kun Tso's mode stays hidden until Q-51, so it is never marked solo. */
  readonly solo: boolean;
  /** The trek's journal on /stories, only when the expedition has a published story. */
  readonly storyHref?: string;
  /** The story's cover, for the card; the card shows it only when the registry says `existing`. */
  readonly photoSlot?: MediaSlotId;
  /** The single highest mark (strictly higher than every other). */
  readonly highest: boolean;
}

const KINDS: ReadonlySet<string> = new Set<HighPointKind>(['summit', 'pass', 'lake']);

function isMarkKind(kind: string): kind is HighPointKind {
  return KINDS.has(kind);
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type Draft = Omit<HighPoint, 'highest'>;

function base(exp: Expedition): Pick<Draft, 'expedition' | 'route' | 'when' | 'region' | 'solo' | 'storyHref'> {
  const story = exp.storyId ? STORIES.find((entry) => entry.id === exp.storyId) : undefined;
  return {
    expedition: exp.name,
    route: exp.shortName,
    when: exp.when,
    region: exp.region,
    solo: exp.mode === 'solo',
    // The /stories trek spreads are anchored by expedition id (`#annapurna`, `#kun-tso`).
    storyHref: story ? `/stories#${exp.id}` : undefined,
  };
}

/** The expedition's own high point, typed by its waypoint (a summit, a pass or a lake). */
function highPointOf(exp: Expedition): Draft | null {
  const { name, altitudeM, approx } = exp.highPoint;
  if (altitudeM === undefined) return null;
  const waypoint = getWaypoint(exp, name);
  if (!waypoint || !isMarkKind(waypoint.kind) || waypoint.showAltitude === false) return null;
  const story = exp.storyId ? STORIES.find((entry) => entry.id === exp.storyId) : undefined;
  return {
    id: slug(name),
    name,
    heightM: altitudeM,
    approx: Boolean(approx),
    kind: waypoint.kind,
    ...base(exp),
    photoSlot: story?.coverSlot,
  };
}

/**
 * Side-trip destinations he walked to (Tilicho Lake on the Annapurna Circuit). Places whose altitude is withheld
 * (Ice Lake, `showAltitude: false`, Q-52) or unknown (Blue and Green Lake) never qualify.
 */
function sideTripMarks(exp: Expedition): Draft[] {
  return exp.waypoints
    .filter(
      (wp): wp is Waypoint & { altitudeM: number; kind: HighPointKind } =>
        Boolean(wp.sideTrip) && isMarkKind(wp.kind) && wp.altitudeM !== undefined && wp.showAltitude !== false,
    )
    .map((wp) => ({
      id: slug(wp.name),
      name: wp.name,
      heightM: wp.altitudeM,
      approx: Boolean(wp.approx),
      kind: wp.kind,
      ...base(exp),
    }));
}

/**
 * High points, to scale: every finished expedition's high point plus its side-trip destinations, ascending by
 * height, read from `entities/expedition` (nothing typed here). Upcoming expeditions never appear: Dodital and Darwa
 * Top still says `upcoming` in the entity. OPEN QUESTION (owner, 2026-11-04): he says Dodital is done but gave no
 * height, date or details, so it stays out until the entity carries them.
 */
export function getHighPoints(): readonly HighPoint[] {
  const drafts = new Map<string, Draft>();
  for (const exp of EXPEDITIONS) {
    if (exp.status !== 'done') continue;
    const own = highPointOf(exp);
    for (const mark of own ? [own, ...sideTripMarks(exp)] : sideTripMarks(exp)) {
      if (!drafts.has(mark.id)) drafts.set(mark.id, mark);
    }
  }
  const sorted = [...drafts.values()].sort((a, b) => a.heightM - b.heightM || a.name.localeCompare(b.name));
  const top = sorted.at(-1);
  const runnerUp = sorted.at(-2);
  return sorted.map((mark) => ({
    ...mark,
    highest: mark === top && (!runnerUp || runnerUp.heightM < mark.heightM),
  }));
}

/** "~4,919 m" or "5,416 m" (the entity's own formatter). */
export function heightText(point: Pick<HighPoint, 'heightM' | 'approx'>): string {
  return formatAltitude(point.heightM, point.approx);
}

const SPOKEN_NUMBER = new Intl.NumberFormat('en');

/**
 * What a screen reader hears for a height: "about 4,919 metres" where the visible text reads "~4,919 m" (§4.5.1).
 * Unit words only, no facts; handed off to move into `HIGH_POINTS_COPY` (docs/redesign/life/build/handoffs/altitude.md).
 */
export function heightSpoken(point: Pick<HighPoint, 'heightM' | 'approx'>): string {
  const { about, metres } = HIGH_POINTS_COPY.spoken;
  return `${point.approx ? `${about} ` : ''}${SPOKEN_NUMBER.format(point.heightM)} ${metres}`;
}
