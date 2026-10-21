import {
  ACTS,
  MARK_STRIDE,
  modelledTempC,
  STORY_MARKS,
  type StoryFrame,
  type StoryMark,
} from '../config/story-timeline';

/*
 * The DOM labels of the story map (§8): which marks are named at a given moment (priority), where each
 * label goes (four-way placement around its mark, clear of every text block, the chrome, the head and the
 * labels already placed) and how many (9 desktop, 5 mobile). The scene only projects; this module decides.
 * Pure functions plus the catalogue's printed facts (altitudes from entities/expedition, never DEM).
 */

export interface MarkText {
  readonly mark: StoryMark;
  /** Index into STORY_MARKS (and the frame's marks array). */
  readonly index: number;
  /** "~3,540 m", or '' (pass-through names, DEM-only values, unconfirmed lakes). */
  readonly alt: string;
  /** The cited altitude in metres (for the modelled °C at a named stop), if printed. */
  readonly altM?: number;
}

/** Printed altitude per STORY_MARKS entry (resolved on the server by `resolveMarkAltitudes`). */
export interface MarkAltitude {
  readonly alt: string;
  readonly altM?: number;
}

export function joinMarkTexts(alts: readonly MarkAltitude[]): MarkText[] {
  return STORY_MARKS.map((mark, index) => ({ mark, index, alt: alts[index]?.alt ?? '', altM: alts[index]?.altM }));
}

/* ------------------------------------------------------------------------------------------------
 * Priority (§8.2)
 * ---------------------------------------------------------------------------------------------- */

const OVERVIEW_SET: Readonly<Record<string, number>> = {
  'thorong-la': 10,
  'tilicho-lake': 8,
  'ice-lake': 8,
  manang: 7,
  besisahar: 7,
  'ranipauwa-muktinath': 7,
};

const tripOutStart = (trip: number): number =>
  ACTS.find((a) => a.trip === trip && a.out)?.s0 ?? Number.POSITIVE_INFINITY;
const JEEP_ACT = ACTS.find((a) => a.main === 'jeep');

const inWindow = (mark: StoryMark, s: number) => (mark.windows ?? []).some(([a, b]) => s >= a && s <= b);

export interface LabelContext {
  readonly s: number;
  readonly strip: number;
  readonly overview: boolean;
}

/** > 0: the mark wants a label at this priority; <= 0: no label. */
export function labelPriority(mark: StoryMark, sAt: number, dHead: number, ctx: LabelContext): number {
  const { s, strip, overview } = ctx;
  if (!mark.label) return -1;
  if (overview) return OVERVIEW_SET[mark.id] ?? (mark.role === 'peak' && inWindow(mark, s) ? 6 : -1);
  switch (mark.role) {
    case 'pass-through':
      return s >= sAt - 6 && s <= sAt + 38 ? 7 : -1;
    case 'stay':
      if (s < sAt - 6) return -1;
      if (s - sAt < 55) return 7.5;
      // Overnight stops persist near the head (about 15 km), quieter with age.
      return dHead < 4.5 ? 3 - Math.min(2, (s - sAt) / 300) : -1;
    case 'landmark':
      return s >= sAt - 6 ? 6.5 : -1;
    case 'col':
      return s < 110 ? 8 : s >= 1100 ? 10 : -1;
    case 'lake':
      if (mark.trip === undefined || s < tripOutStart(mark.trip)) return -1;
      return strip - 1 === mark.trip ? 12 : 5;
    case 'peak':
      return inWindow(mark, s) ? 6 : -1;
    case 'tick':
      return s >= sAt - 3 && s <= sAt + 36 ? 4.5 : -1;
    case 'note':
      return JEEP_ACT && s >= JEEP_ACT.s0 && s <= JEEP_ACT.s1 + (mark.tail ?? 0) ? 7 : -1;
    default:
      return -1;
  }
}

/* ------------------------------------------------------------------------------------------------
 * The head readout (§6.2): cited altitude at a named stop, "above N m" + modelled °C between stops,
 * nothing on the Blue, Green and Ice trips, nothing during the arrival or the overview.
 * ---------------------------------------------------------------------------------------------- */

const NUMBER = new Intl.NumberFormat('en');
const READOUT_ROLES = new Set(['stay', 'landmark', 'col', 'lake']);
const HERE_ROLES = new Set(['stay', 'pass-through', 'landmark', 'col']);

export function formatTempC(c: number): string {
  const sign = c < 0 ? '−' : c > 0 ? '+' : '';
  return `${sign}${Math.abs(c)} °C`;
}

export interface Readout {
  /** The altitude part ("~3,540 m" or "above 3,500 m"). */
  readonly alt: string;
  readonly temp: string;
  /** The named stop the head is at (its label carries the °C and turns signal), if any. */
  readonly here: number;
}

const NONE: Readout = { alt: '', temp: '', here: -1 };

export function headReadout(frame: StoryFrame, texts: readonly MarkText[], ctx: LabelContext): Readout {
  if (ctx.overview || frame.intro < 1 || frame.live <= 0) return NONE;
  const { strip } = frame;
  const m = frame.marks;
  // "Here": the named place the head stands at (main line places, or the lake of the current trip).
  let here = -1;
  let hd = 0.09;
  for (const t of texts) {
    const mark = t.mark;
    if (!mark.label) continue;
    const onMain = strip === 0 && mark.trip === undefined && HERE_ROLES.has(mark.role);
    const onTrip = mark.role === 'lake' && strip - 1 === mark.trip;
    if (!onMain && !onTrip) continue;
    const d = m[t.index * MARK_STRIDE + 4];
    if (d < hd) {
      hd = d;
      here = t.index;
    }
  }
  // Blue, Green and Ice: approximate positions or an unconfirmed altitude, so no number at all.
  if (strip >= 1 && strip <= 3) return { ...NONE, here };
  let best: MarkText | undefined;
  let bd = 0.12;
  for (const t of texts) {
    if (t.altM === undefined || !READOUT_ROLES.has(t.mark.role)) continue;
    const d = m[t.index * MARK_STRIDE + 4];
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  if (best && best.altM !== undefined) {
    return { alt: best.alt, temp: formatTempC(modelledTempC(best.altM)), here };
  }
  const contour = Math.max(500, Math.floor(frame.headAltM / 500) * 500);
  return { alt: `above ${NUMBER.format(contour)} m`, temp: formatTempC(modelledTempC(frame.headAltM)), here };
}

/* ------------------------------------------------------------------------------------------------
 * Placement (§8.2): greedy by priority, four tries per label, obstacles = text, chrome, head, labels.
 * ---------------------------------------------------------------------------------------------- */

export type Box = readonly [number, number, number, number];

export interface PlaceInput {
  /** STORY_MARKS index, or -1 for the head readout. */
  readonly index: number;
  readonly role: StoryMark['role'] | 'head';
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
 * Places the candidates (any order; sorted here by priority) in a `vw` x `vh` viewport. Returns the
 * placed labels (top-left corners, CSS px); at most `cap`.
 */
export function placeLabels(
  candidates: PlaceInput[],
  obstacles: readonly Box[],
  vw: number,
  vh: number,
  cap: number,
): Placed[] {
  const placed: Box[] = obstacles.slice();
  const out: Placed[] = [];
  candidates.sort((a, b) => b.priority - a.priority);
  for (const c of candidates) {
    if (out.length >= cap) break;
    if (c.x < 6 || c.x > vw - 6 || c.y < 6 || c.y > vh - 6) continue;
    for (const [lx, ly] of tries(c)) {
      const r: Box = [lx - 3, ly - 2, lx + c.w + 3, ly + c.h + 2];
      if (r[0] < 4 || r[2] > vw - 4 || r[1] < 4 || r[3] > vh - 4) continue;
      if (placed.some((q) => overlaps(r, q))) continue;
      placed.push(r);
      out.push({ index: c.index, x: lx, y: ly });
      break;
    }
  }
  return out;
}
