// Pure GPX helpers for the notebook routes (scripts/routes/build-trek-routes.mjs). Dev-only; never imported by src/.
// No dependencies: a small regex reader, a spike filter, a median elevation filter, Douglas-Peucker and snapping.
//
// Privacy (Q-48): the reader keeps latitude, longitude and elevation only. <time>, <metadata>, <name>, <desc>,
// <extensions> (heart rate, cadence, temperature) and every attribute but lat/lon are never read, so they cannot
// reach the output.

const R_EARTH_M = 6371008.8;
const RAD = Math.PI / 180;

/** Great-circle distance in metres between [lon, lat] pairs. */
export function haversineM(a, b) {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

// The attribute itself, not a longer name ending in it (`data-lat`, `foo:lat`): preceded by whitespace or the start.
const attr = (tag, name) => {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`).exec(tag);
  return m ? Number(m[1]) : Number.NaN;
};

/**
 * Reads every <trkpt> in document order (all <trk> and <trkseg> joined). Falls back to <rtept> when the file has no
 * track points. A point's body never runs into the next point, so one left unclosed keeps its own elevation and does
 * not swallow the next one. Returns { points: { lon, lat, ele? }[], kind: 'trk' | 'rte' | 'none', skipped, unclosed,
 * truncated } (truncated: no closing </gpx>, so the file was probably cut short and the track may be partial).
 */
export function parseGpx(text) {
  const truncated = !/<\/gpx\s*>/i.test(text);
  for (const kind of ['trk', 'rte']) {
    const tag = `${kind}pt`;
    const re = new RegExp(
      `<${tag}\\b([^>]*?)(\\/>|>((?:(?!<${tag}\\b)[\\s\\S])*?)(<\\/${tag}\\s*>|(?=<${tag}\\b)|$))`,
      'g',
    );
    const points = [];
    let skipped = 0;
    let unclosed = 0;
    for (const m of text.matchAll(re)) {
      if (m[2] !== '/>' && !m[4]) unclosed += 1;
      const lat = attr(m[1], 'lat');
      const lon = attr(m[1], 'lon');
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        skipped += 1;
        continue;
      }
      const eleMatch = m[3] ? /<ele\b[^>]*>\s*([-+0-9.eE]+)\s*<\/ele\s*>/.exec(m[3]) : null;
      const ele = eleMatch ? Number(eleMatch[1]) : Number.NaN;
      points.push({ lon, lat, ele: Number.isFinite(ele) ? ele : undefined });
    }
    if (points.length > 0 || skipped > 0) return { points, kind, skipped, unclosed, truncated };
  }
  return { points: [], kind: 'none', skipped: 0, unclosed: 0, truncated };
}

/** Drops exact repeats (a paused watch logs the same fix many times). */
export function dedupe(points) {
  const out = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.lon === p.lon && last.lat === p.lat) {
      if (last.ele === undefined && p.ele !== undefined) last.ele = p.ele;
      continue;
    }
    out.push({ ...p });
  }
  return out;
}

/**
 * GPS spikes: a point more than `limitM` from both neighbours, where the neighbours are closer to each other than
 * the point is to either of them (an out-and-back jump, not a sparse but straight log). Repeats until stable.
 */
export function dropSpikes(points, limitM = 60) {
  let pts = points;
  let dropped = 0;
  for (let pass = 0; pass < 5; pass += 1) {
    const keep = [];
    let changed = false;
    for (let i = 0; i < pts.length; i += 1) {
      if (i === 0 || i === pts.length - 1) {
        keep.push(pts[i]);
        continue;
      }
      const prev = keep[keep.length - 1];
      const next = pts[i + 1];
      const p = [pts[i].lon, pts[i].lat];
      const dPrev = haversineM([prev.lon, prev.lat], p);
      const dNext = haversineM(p, [next.lon, next.lat]);
      const dSkip = haversineM([prev.lon, prev.lat], [next.lon, next.lat]);
      if (dPrev > limitM && dNext > limitM && dSkip < Math.min(dPrev, dNext)) {
        dropped += 1;
        changed = true;
        continue;
      }
      keep.push(pts[i]);
    }
    pts = keep;
    if (!changed) break;
  }
  return { points: pts, dropped };
}

/**
 * Fills missing elevations by linear interpolation along the index (the ends take the nearest known value); returns
 * false when no point has one. Linear time: one backward pass finds each point's next known index, one forward pass
 * fills.
 */
export function fillElevation(points) {
  const n = points.length;
  const nextKnown = new Int32Array(n);
  let after = -1;
  for (let i = n - 1; i >= 0; i -= 1) {
    if (points[i].ele !== undefined) after = i;
    nextKnown[i] = after;
  }
  if (after === -1) return false; // after the loop, `after` is the first known index
  let before = -1;
  for (let i = 0; i < n; i += 1) {
    if (points[i].ele !== undefined) {
      before = i;
      continue;
    }
    const next = nextKnown[i];
    if (before === -1) points[i].ele = points[next].ele;
    else if (next === -1) points[i].ele = points[before].ele;
    else {
      const t = (i - before) / (next - before);
      points[i].ele = points[before].ele + t * (points[next].ele - points[before].ele);
    }
  }
  return true;
}

/** Median filter over `window` points (odd), applied to elevation only. */
export function medianElevation(points, window = 5) {
  const half = Math.floor(window / 2);
  const src = points.map((p) => p.ele);
  return points.map((p, i) => {
    const slice = src.slice(Math.max(0, i - half), Math.min(src.length, i + half + 1)).sort((a, b) => a - b);
    return { ...p, ele: slice[Math.floor(slice.length / 2)] };
  });
}

/** Cumulative distance in km at each point. */
export function cumulativeKm(points) {
  const km = [0];
  for (let i = 1; i < points.length; i += 1) {
    km.push(km[i - 1] + haversineM([points[i - 1].lon, points[i - 1].lat], [points[i].lon, points[i].lat]) / 1000);
  }
  return km;
}

/** Elevation gain in metres with a hysteresis band: a climb counts once it rises `bandM` above the last low. */
export function gainM(points, bandM = 5) {
  if (points.length === 0) return 0;
  let gain = 0;
  let ref = points[0].ele;
  for (const p of points) {
    if (p.ele >= ref + bandM) {
      gain += p.ele - ref;
      ref = p.ele;
    } else if (p.ele <= ref - bandM) {
      ref = p.ele;
    }
  }
  return gain;
}

/** Local metres (equirectangular about the mean latitude), with elevation as the third axis. */
function toLocal(points) {
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const kx = Math.cos(lat0 * RAD) * R_EARTH_M * RAD;
  const ky = R_EARTH_M * RAD;
  return points.map((p) => [p.lon * kx, p.lat * ky, p.ele ?? 0]);
}

function segDist3(p, a, b) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) / len2));
  return Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1], p[2] - a[2] - t * d[2]);
}

/** Douglas-Peucker in 3D (metres), iterative; returns the kept indices in order. */
function dpIndices(local, tolM) {
  const n = local.length;
  if (n <= 2) return local.map((_, i) => i);
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = -1;
    let idx = -1;
    for (let i = s + 1; i < e; i += 1) {
      const d = segDist3(local[i], local[s], local[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx >= 0 && maxD > tolM) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i += 1) if (keep[i]) out.push(i);
  return out;
}

/**
 * Simplifies at `tolM` (horizontal and vertical, so the profile keeps its shape) and raises the tolerance until at
 * most `maxPoints` remain. The highest point is always kept. Returns { points, tolM }.
 */
export function simplify(points, tolM = 12, maxPoints = 300) {
  const local = toLocal(points);
  let tol = tolM;
  let idx = dpIndices(local, tol);
  while (idx.length > maxPoints) {
    tol *= 1.25;
    idx = dpIndices(local, tol);
  }
  let top = 0;
  for (let i = 1; i < points.length; i += 1) if ((points[i].ele ?? -Infinity) > (points[top].ele ?? -Infinity)) top = i;
  if (!idx.includes(top)) {
    idx = [...idx, top].sort((a, b) => a - b);
    if (idx.length > maxPoints) {
      // Drop the kept vertex (not an end, not the top) that matters least.
      let worst = -1;
      let worstD = Infinity;
      for (let k = 1; k < idx.length - 1; k += 1) {
        if (idx[k] === top) continue;
        const d = segDist3(local[idx[k]], local[idx[k - 1]], local[idx[k + 1]]);
        if (d < worstD) {
          worstD = d;
          worst = k;
        }
      }
      idx.splice(worst, 1);
    }
  }
  return { points: idx.map((i) => points[i]), tolM: tol };
}

/**
 * Snaps [lon, lat] onto the polyline in walking order. On a line that passes the stop more than once (an out-and-back
 * day), the first pass wins: among the passes from `fromKm` on that come within max(50 m, 1.5x) of the nearest, the
 * earliest is taken, at its own closest approach. When nothing ahead of `fromKm` comes within 200 m and half the
 * distance of the nearest pass behind it, the stop is snapped behind and flagged. Returns { km, offsetM, backward }.
 */
export function snapToTrack(points, km, target, fromKm = 0) {
  if (points.length === 1) return { km: 0, offsetM: haversineM([points[0].lon, points[0].lat], target), backward: false };
  const kx = Math.cos(target[1] * RAD) * R_EARTH_M * RAD;
  const ky = R_EARTH_M * RAD;
  const tp = [target[0] * kx, target[1] * ky];
  const cands = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = [points[i].lon * kx, points[i].lat * ky];
    const b = [points[i + 1].lon * kx, points[i + 1].lat * ky];
    const d = [b[0] - a[0], b[1] - a[1]];
    const len2 = d[0] ** 2 + d[1] ** 2;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((tp[0] - a[0]) * d[0] + (tp[1] - a[1]) * d[1]) / len2));
    cands.push({ km: km[i] + t * (km[i + 1] - km[i]), offsetM: Math.hypot(tp[0] - a[0] - t * d[0], tp[1] - a[1] - t * d[1]) });
  }
  const pick = (list) => {
    if (list.length === 0) return null;
    const minOff = Math.min(...list.map((c) => c.offsetM));
    const slack = minOff + Math.max(50, minOff * 0.5);
    let k = list.findIndex((c) => c.offsetM <= slack);
    while (k + 1 < list.length && list[k + 1].offsetM <= list[k].offsetM) k += 1;
    return list[k];
  };
  const ahead = pick(cands.filter((c) => c.km >= fromKm - 1e-9));
  const nearest = pick(cands);
  if (!ahead || (ahead.offsetM > 200 && ahead.offsetM > 2 * nearest.offsetM)) return { ...nearest, backward: true };
  return { ...ahead, backward: false };
}

export const round = (v, d) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};
