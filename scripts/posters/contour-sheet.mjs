// Contour layers for a sheet: traces the heightfield at each level with d3-contour, projects the lines
// into the sheet's viewBox, simplifies them and serialises one path `d` per level.
import { contourLines, gaussianBlur, polylineLength, polylinesToPath, simplify, simplifyClosed } from './geometry.mjs';

/**
 * @param {{ meta: { cols: number; rows: number; bbox: number[]; minM: number; maxM: number }; heights: Float64Array }} field
 * @param {{ project: (lon: number, lat: number) => number[] }} projection
 * @param {readonly [number, number]} viewBox
 * @param {{ minorStep: number; indexStep: number; sigma: number; tolerance: number; minLength: number; minSpacing?: number; indexMinSpacing?: number }} opts
 *
 * Cartographic generalisation: where the slope is so steep that neighbouring contours would sit closer
 * than `minSpacing` viewBox units (`indexMinSpacing` for index contours, measured between minor
 * intervals), the contour is interrupted, as printed topographic maps do on cliffs and steep walls. It
 * keeps the drawing legible at plate size and the module small.
 */
export function contourLayers(field, projection, viewBox, opts) {
  const { cols, rows, bbox } = field.meta;
  const [west, south, east, north] = bbox;
  const [w, h] = viewBox;
  const values = gaussianBlur(field.heights, cols, rows, opts.sigma);
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  // Slope in metres per viewBox unit, from central differences on the smoothed grid.
  const [x0, y0] = projection.project(west, north);
  const [x1, y1] = projection.project(east, south);
  const cellX = (x1 - x0) / (cols - 1);
  const cellY = (y1 - y0) / (rows - 1);
  const slope = new Float64Array(cols * rows);
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const l = values[j * cols + Math.max(0, i - 1)];
      const r = values[j * cols + Math.min(cols - 1, i + 1)];
      const t = values[Math.max(0, j - 1) * cols + i];
      const b = values[Math.min(rows - 1, j + 1) * cols + i];
      const gx = (r - l) / ((Math.min(cols - 1, i + 1) - Math.max(0, i - 1)) * cellX);
      const gy = (b - t) / ((Math.min(rows - 1, j + 1) - Math.max(0, j - 1)) * cellY);
      slope[j * cols + i] = Math.hypot(gx, gy);
    }
  }
  const slopeAt = (u, v) => {
    const i = Math.max(0, Math.min(cols - 1, Math.round(u - 0.5)));
    const j = Math.max(0, Math.min(rows - 1, Math.round(v - 0.5)));
    return slope[j * cols + i];
  };
  const toSheet = ([u, v]) => {
    const lon = west + ((u - 0.5) / (cols - 1)) * (east - west);
    const lat = north - ((v - 0.5) / (rows - 1)) * (north - south);
    return projection.project(lon, lat);
  };
  // Lines leave the sheet at its edge: cut runs that stray more than 1 unit outside the viewBox.
  const outside = ([x, y]) => x < -1 || y < -1 || x > w + 1 || y > h + 1;

  const minor = [];
  const index = [];
  const levels = [];
  for (let level = Math.ceil(lo / opts.minorStep) * opts.minorStep; level <= hi; level += opts.minorStep) {
    if (level <= 0) continue;
    levels.push(level);
  }
  let lineCount = 0;
  for (const level of levels) {
    const lines = [];
    const isIndex = level % opts.indexStep === 0;
    const spacing = isIndex ? opts.indexMinSpacing : opts.minSpacing;
    const maxSlope = spacing ? opts.minorStep / spacing : Infinity;
    for (const line of contourLines(values, cols, rows, level)) {
      // Interrupted points become null and split the line like the sheet edge does.
      const pts = line.points.map((p) => (slopeAt(p[0], p[1]) > maxSlope ? null : toSheet(p)));
      const runs = [];
      if (pts.some((p) => p === null || outside(p))) {
        let run = [];
        for (const p of pts) {
          if (p === null || outside(p)) {
            if (run.length >= 2) runs.push({ points: run, closed: false });
            run = [];
          } else run.push(p);
        }
        if (run.length >= 2) runs.push({ points: run, closed: false });
        // A closed ring cut once: its first and last runs are one line across the start point.
        if (line.closed && runs.length >= 2 && pts[0] !== null && !outside(pts[0]) && pts[pts.length - 1] !== null && !outside(pts[pts.length - 1])) {
          const tail = runs.pop();
          runs[0] = { points: tail.points.concat(runs[0].points), closed: false };
        }
      } else runs.push({ points: pts, closed: line.closed });
      for (const run of runs) {
        if (polylineLength(run.points, run.closed) < opts.minLength) continue;
        const points = run.closed ? simplifyClosed(run.points, opts.tolerance) : simplify(run.points, opts.tolerance);
        if (points.length < (run.closed ? 3 : 2)) continue;
        lines.push({ points, closed: run.closed });
      }
    }
    if (lines.length === 0) continue;
    lineCount += lines.length;
    const d = polylinesToPath(lines);
    if (isIndex) index.push(d);
    else minor.push(d);
  }
  return { minor, index, lineCount, levels: levels.length };
}

/**
 * Tries each rung of a coarsening ladder (more smoothing, more simplification, fewer tiny loops) and
 * returns the first whose rendered module fits the byte cap.
 */
export function fitToCap(render, ladder, capBytes) {
  let last;
  for (const rung of ladder) {
    const out = render(rung);
    last = { ...out, rung };
    if (out.bytes <= capBytes) return last;
  }
  throw new Error(`no rung fits ${capBytes} B (smallest ${last?.bytes} B)`);
}
