/**
 * Data contracts for generated map sheets and star charts (DESIGN-SPEC §D.2). Type-only, so the
 * generated modules (`*.generated.ts`) and build scripts can import them with `import type`.
 */

export interface SheetLabel {
  /** Position in viewBox units. */
  x: number;
  y: number;
  text: string;
  kind: 'pass' | 'peak' | 'village' | 'town' | 'water' | 'area' | 'note';
  altitudeM?: number;
  approx?: boolean;
  anchor?: 'start' | 'middle' | 'end';
  /** 1 = kept on mobile (`labels="priority"`). */
  priority: 1 | 2 | 3;
}

export interface SheetRoute {
  id: string;
  /** SVG path in viewBox units. */
  d: string;
  lengthPx: number;
  nodes: readonly { x: number; y: number; name: string }[];
  kind: 'main' | 'side-trip' | 'planned' | 'done';
}

export interface ContourSheetData {
  id: string;
  viewBox: readonly [number, number];
  /** One path d per contour level. */
  minor: readonly string[];
  index: readonly string[];
  water?: readonly string[];
  routes: readonly SheetRoute[];
  labels: readonly SheetLabel[];
  graticule?: readonly { x?: number; y?: number; text: string }[];
  scaleBar?: { x: number; y: number; lengthPx: number; text: string };
  northArrow?: { x: number; y: number };
  /** The one warm object (G-09). */
  tent?: { x: number; y: number };
  sheetTitle?: string;
  source: 'terrain-tiles' | 'procedural' | 'stub';
  attribution?: string;
}

export interface StarChartData {
  id: string;
  viewBox: readonly [number, number];
  /** [x, y, radius, tint]; tint -1..1 (blue..warm), from B-V. */
  stars: readonly (readonly [x: number, y: number, r: number, tint: number])[];
  /** Constellation stick figures (path d). */
  lines?: readonly string[];
  horizon?: string;
  graticule?: readonly string[];
  /** Cardinal letters, a few star names (Literata italic). */
  labels: readonly SheetLabel[];
  source: 'catalogue' | 'procedural' | 'stub';
  /** e.g. '25° N, January, 21:00 IST'. */
  caption: string;
}
