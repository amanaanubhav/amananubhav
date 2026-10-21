import type { StoryFrame, StoryMarkState } from '../ui/scenes/story/frame';
import { STORY_MARKS, type StoryMarkDef } from '../ui/scenes/story/marks';

/*
 * The DOM labels of the story map (§8.2), page side: the scene projects every mark each frame and says
 * which ones want a label (priority, visibility, "here"); this module formats the printed text and places
 * the labels greedily by priority, each trying four positions around its mark, clear of every text block,
 * the chrome, the walker and the labels already placed, capped at 9 (5 on phones). Pure functions.
 */

const NUMBER = new Intl.NumberFormat('en');

/** "~3,540 m" for a mark with a cited altitude ('' for none). Pass-through names never carry one. */
export function markAltitude(mark: StoryMarkDef): string {
  if (mark.altM === null || mark.kind === 'pass' || mark.approxPlace) return '';
  return `${mark.approxAlt ? '~' : ''}${NUMBER.format(mark.altM)} m`;
}

/** "−8 °C" with a real minus sign. */
export function formatTempC(c: number): string {
  const sign = c < 0 ? '−' : c > 0 ? '+' : '';
  return `${sign}${Math.abs(Math.round(c))} °C`;
}

/**
 * The readout's altitude text: the stop's cited altitude when the head is at a named stop, else the last
 * 500 m contour crossed ("above 3,500 m"). A DEM value is never printed.
 */
export function readoutAltitude(frame: StoryFrame): string {
  const r = frame.readout;
  if (!r) return '';
  if (r.at) {
    const mark = STORY_MARKS.find((m) => m.id === r.at);
    if (mark) {
      const alt = markAltitude(mark);
      if (alt) return alt;
    }
  }
  return `above ${NUMBER.format(Math.max(500, Math.floor(r.altM / 500) * 500))} m`;
}

export type Box = readonly [number, number, number, number];
export type LabelRole = StoryMarkState['kind'];

export interface PlaceInput {
  /** STORY_MARKS index (the head readout has its own index too: the 'head' mark). */
  readonly index: number;
  readonly role: LabelRole;
  readonly priority: number;
  /** Anchor in CSS px. */
  readonly x: number;
  readonly y: number;
  /** Measured label size in CSS px. */
  readonly w: number;
  readonly h: number;
}

export interface Placed {
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

const overlaps = (r: Box, q: Box) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1];

function tries(p: PlaceInput): [number, number][] {
  const { x, y, w, h } = p;
  if (p.role === 'peak') return [[x - w / 2, y - h - 10]];
  if (p.role === 'head') {
    return [
      [x + 16, y - h - 12],
      [x - w - 16, y - h - 12],
      [x + 16, y + 12],
    ];
  }
  const gap = p.role === 'col' ? 14 : 10;
  return [
    [x + gap, y - h / 2],
    [x - w - gap, y - h / 2],
    [x - w / 2, y - h - gap],
    [x - w / 2, y + gap],
  ];
}

/**
 * Places the candidates (sorted here by priority, highest first) in a `vw` x `vh` viewport, avoiding
 * `obstacles`. Returns the placed labels' top-left corners in CSS px; at most `cap`.
 */
export function placeLabels(
  candidates: PlaceInput[],
  obstacles: readonly Box[],
  vw: number,
  vh: number,
  cap: number,
): Placed[] {
  const taken: Box[] = obstacles.slice();
  const out: Placed[] = [];
  candidates.sort((a, b) => b.priority - a.priority);
  for (const c of candidates) {
    if (out.length >= cap) break;
    if (c.w <= 0 || c.x < 6 || c.x > vw - 6 || c.y < 6 || c.y > vh - 6) continue;
    for (const [lx, ly] of tries(c)) {
      const r: Box = [lx - 3, ly - 2, lx + c.w + 3, ly + c.h + 2];
      if (r[0] < 4 || r[2] > vw - 4 || r[1] < 4 || r[3] > vh - 4) continue;
      if (taken.some((q) => overlaps(r, q))) continue;
      taken.push(r);
      out.push({ index: c.index, x: lx, y: ly });
      break;
    }
  }
  return out;
}
