// Geometry helpers for the poster builder: smoothing, contour tracing (d3-contour), polyline
// simplification and compact SVG path serialisation (1-decimal coordinates).
import { contours } from 'd3-contour';

/** Separable Gaussian blur of a cols x rows grid (edges clamped). sigma in grid cells; 0 = copy. */
export function gaussianBlur(values, cols, rows, sigma) {
  if (!sigma || sigma <= 0) return Float64Array.from(values);
  const radius = Math.ceil(sigma * 3);
  const kernel = [];
  let sum = 0;
  for (let k = -radius; k <= radius; k += 1) {
    const w = Math.exp(-(k * k) / (2 * sigma * sigma));
    kernel.push(w);
    sum += w;
  }
  for (let k = 0; k < kernel.length; k += 1) kernel[k] /= sum;
  const tmp = new Float64Array(cols * rows);
  const out = new Float64Array(cols * rows);
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const ii = Math.min(cols - 1, Math.max(0, i + k));
        acc += values[j * cols + ii] * kernel[k + radius];
      }
      tmp[j * cols + i] = acc;
    }
  }
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const jj = Math.min(rows - 1, Math.max(0, j + k));
        acc += tmp[jj * cols + i] * kernel[k + radius];
      }
      out[j * cols + i] = acc;
    }
  }
  return out;
}

/**
 * Contour lines at one level, as polylines in grid coordinates (sample i sits at i + 0.5, d3-contour's
 * convention). d3-contour returns closed rings that run along the grid border where the level is cut by
 * the edge; those border runs are removed, so a contour that leaves the sheet ends at the sheet edge
 * instead of tracing it. Each result is { points, closed }.
 */
export function contourLines(values, cols, rows, level) {
  const geometry = contours().size([cols, rows]).smooth(true).contour(values, level);
  const onBorder = ([x, y]) => x <= 0 || y <= 0 || x >= cols || y >= rows;
  const lines = [];
  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      const pts = ring.slice(0, -1); // d3 repeats the first point at the end
      if (pts.length < 2) continue;
      const firstBorder = pts.findIndex(onBorder);
      if (firstBorder < 0) {
        lines.push({ points: pts, closed: true });
        continue;
      }
      // Rotate so the walk starts on the border, then split into interior runs.
      const rotated = pts.slice(firstBorder).concat(pts.slice(0, firstBorder));
      let run = [];
      for (const p of rotated) {
        if (onBorder(p)) {
          if (run.length >= 2) lines.push({ points: run, closed: false });
          run = [];
        } else {
          run.push(p);
        }
      }
      if (run.length >= 2) lines.push({ points: run, closed: false });
    }
  }
  return lines;
}

function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas-Peucker simplification (iterative). For closed lines, pass the open point list. */
export function simplify(points, tolerance) {
  if (points.length <= 2 || tolerance <= 0) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = 0;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const d = perpendicularDistance(points[i], points[first], points[last]);
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (index >= 0 && maxD > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Closed rings: split at the point farthest from the start so DP keeps the ring's shape. */
export function simplifyClosed(points, tolerance) {
  if (points.length <= 3) return points.slice();
  let far = 0;
  let maxD = -1;
  for (let i = 1; i < points.length; i += 1) {
    const d = Math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1]);
    if (d > maxD) {
      maxD = d;
      far = i;
    }
  }
  const a = simplify(points.slice(0, far + 1), tolerance);
  const b = simplify(points.slice(far).concat([points[0]]), tolerance);
  return a.concat(b.slice(1, -1));
}

export function polylineLength(points, closed = false) {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  if (closed && points.length > 2) {
    const a = points[points.length - 1];
    len += Math.hypot(points[0][0] - a[0], points[0][1] - a[1]);
  }
  return len;
}

/* ------------------------------------------------------------------------------------------------
 * Compact path serialisation, in integer tenths so relative steps never drift.
 * --------------------------------------------------------------------------------------------- */

/** A tenths integer as the shortest SVG number: 12 -> "1.2", -5 -> "-.5", 30 -> "3". */
function tenths(t) {
  if (t === 0) return '0';
  const neg = t < 0;
  const a = Math.abs(t);
  const whole = Math.floor(a / 10);
  const frac = a % 10;
  const body = frac === 0 ? String(whole) : whole === 0 ? `.${frac}` : `${whole}.${frac}`;
  return neg ? `-${body}` : body;
}

/** Joins SVG numbers with the fewest separators ("1.2-3.4.5"). */
function joinNumbers(nums) {
  let out = '';
  let prev = '';
  for (const n of nums) {
    if (prev === '') out += n;
    else if (n.startsWith('-')) out += n;
    else if (n.startsWith('.') && prev.includes('.')) out += n;
    else out += ` ${n}`;
    prev = n;
  }
  return out;
}

/** 1-decimal absolute number for absolute commands. */
export const r1 = (v) => Math.round(v * 10) / 10;

/**
 * One path `d` from many polylines (viewBox units): `M` absolute start, then relative `l` steps;
 * closed rings end with `z`. Steps that round to zero are dropped.
 */
export function polylinesToPath(lines) {
  let d = '';
  for (const { points, closed } of lines) {
    const T = [];
    for (const [x, y] of points) {
      const p = [Math.round(x * 10), Math.round(y * 10)];
      const last = T[T.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) T.push(p);
    }
    if (closed && T.length > 1) {
      const [a, b] = [T[0], T[T.length - 1]];
      if (a[0] === b[0] && a[1] === b[1]) T.pop();
    }
    if (T.length < 2) continue;
    const head = joinNumbers([tenths(T[0][0]), tenths(T[0][1])]);
    const steps = [];
    for (let i = 1; i < T.length; i += 1) steps.push(tenths(T[i][0] - T[i - 1][0]), tenths(T[i][1] - T[i - 1][1]));
    d += `M${head}l${joinNumbers(steps)}${closed ? 'z' : ''}`;
  }
  return d;
}

/**
 * A smooth route through its nodes: centripetal Catmull-Rom (alpha 0.5, the curve the relief scene
 * builds from the same waypoints) as absolute cubic Béziers, 1-decimal. Consecutive duplicate nodes
 * are merged. Returns { d, length } with the length measured on the curve.
 */
export function routePath(nodes) {
  const pts = [];
  for (const n of nodes) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(n[0] - last[0], n[1] - last[1]) > 0.05) pts.push(n);
  }
  if (pts.length === 1) return { d: `M${r1(pts[0][0])} ${r1(pts[0][1])}`, length: 0 };
  if (pts.length === 2) {
    const [a, b] = pts;
    return { d: `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`, length: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  }
  const fmt = (p) => `${r1(p[0])} ${r1(p[1])}`;
  let d = `M${fmt(pts[0])}`;
  let length = 0;
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const p0 = pts[i - 1] ?? [2 * pts[i][0] - pts[i + 1][0], 2 * pts[i][1] - pts[i + 1][1]];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    // Barry-Goldman centripetal parameterisation, converted to Bézier control points.
    const t01 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) ** 0.5 || 1e-6;
    const t12 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) ** 0.5 || 1e-6;
    const t23 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) ** 0.5 || 1e-6;
    const m1 = [0, 1].map(
      (k) => t12 * ((p1[k] - p0[k]) / t01 - (p2[k] - p0[k]) / (t01 + t12) + (p2[k] - p1[k]) / t12),
    );
    const m2 = [0, 1].map(
      (k) => t12 * ((p2[k] - p1[k]) / t12 - (p3[k] - p1[k]) / (t12 + t23) + (p3[k] - p2[k]) / t23),
    );
    const c1 = [p1[0] + m1[0] / 3, p1[1] + m1[1] / 3];
    const c2 = [p2[0] - m2[0] / 3, p2[1] - m2[1] / 3];
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
    let prev = p1;
    for (let s = 1; s <= 24; s += 1) {
      const t = s / 24;
      const u = 1 - t;
      const q = [0, 1].map((k) => u * u * u * p1[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p2[k]);
      length += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      prev = q;
    }
  }
  return { d, length };
}
