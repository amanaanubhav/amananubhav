// Build-time label QA for the contour sheets: does a cartographic label's text clear the drawn routes, and
// does it stay inside the plate, at every size the plate is shown at?
//
// The sheet's labels are HTML set at a fixed 14 px over an SVG that scales (ContourSheet / SheetLabels in
// src/shared/ui/map), so a label that clears a route on a 590 px desktop plate can sit on it on a 300 px
// one. This mirrors SheetLabels' box model closely enough to catch that (glyph widths are an Archivo
// average, not measured), and checks a range of plate scales in px per viewBox unit.
//
//   marker      pass/peak: 10 px survey triangle centred on (x, y); village/town: 6 px dot
//   gap         6 px between the marker and the name (gap-1.5); 4 px above the name for anchor 'middle'
//   ink         per glyph: caps, figures and ascenders 5.5 px above the line centre, x-height 2.6 px;
//               baseline 5 px below, descenders 7 px
//
// Scales: 0.30 (lg 1024 hero column), 0.36 (phones), 0.43 (1280), 0.51 (1440), 0.75, 1.

const FONT_PX = 14;
const CHAR_EM = 0.49; // Archivo average advance at text-caption, measured off the round-1 screenshots
export const PLATE_SCALES = [0.3, 0.36, 0.43, 0.51, 0.75, 1];

/** Samples an SVG path made of M, L and C commands (what routePath writes) into points. */
function samplePath(d) {
  const tokens = d.match(/[MLC]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const pts = [];
  let cmd = '';
  let cur = [0, 0];
  for (let i = 0; i < tokens.length; ) {
    if (/[MLC]/.test(tokens[i])) cmd = tokens[i++];
    const num = () => Number(tokens[i++]);
    if (cmd === 'M' || cmd === 'L') {
      cur = [num(), num()];
      pts.push(cur);
    } else if (cmd === 'C') {
      const c1 = [num(), num()];
      const c2 = [num(), num()];
      const end = [num(), num()];
      const p0 = cur;
      for (let s = 1; s <= 24; s += 1) {
        const t = s / 24;
        const u = 1 - t;
        pts.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * end[k]));
      }
      cur = end;
    } else {
      i += 1;
    }
  }
  // Densify to at most 1 viewBox unit between points, so straight L legs are checked along their length.
  const dense = pts.slice(0, 1);
  for (let k = 1; k < pts.length; k += 1) {
    const [a, b] = [pts[k - 1], pts[k]];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
    for (let j = 1; j <= n; j += 1) dense.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  return dense;
}

/** Distance from point p to the axis-aligned box b = [x0, y0, x1, y1] (0 inside). */
function pointBoxDistance(p, b) {
  const dx = Math.max(b[0] - p[0], 0, p[0] - b[2]);
  const dy = Math.max(b[1] - p[1], 0, p[1] - b[3]);
  return Math.hypot(dx, dy);
}

/** Ink extent of one glyph: caps, figures and ascenders reach 5.5 px above centre, x-height 2.6 px; descenders 7 px below. */
function glyphY(ch) {
  const top = /[A-Z0-9bdfhiklt]/.test(ch) ? -5.5 : -2.6;
  const bottom = /[gjpqy,]/.test(ch) ? 7 : 5;
  return [top, bottom];
}

/** The label's ink as one box per glyph, in px relative to its (x, y), mirroring SheetLabels' transforms. */
function inkBoxes(l) {
  const marker = l.kind === 'pass' || l.kind === 'peak' ? 'peak' : l.kind === 'village' || l.kind === 'town' ? 'dot' : null;
  const half = marker === 'peak' ? 5 : 3;
  const alt = typeof l.altitudeM === 'number' ? ` ${l.approx ? '~' : ''}${Math.round(l.altitudeM).toLocaleString('en')} m` : '';
  const text = l.text + alt;
  const cw = CHAR_EM * FONT_PX;
  const width = text.length * cw;
  const anchor = l.anchor ?? (marker ? 'start' : 'middle');
  let x0;
  let dy = 0;
  if (!marker) x0 = anchor === 'start' ? 4 : anchor === 'end' ? -4 - width : -width / 2;
  else if (anchor === 'start') x0 = half + 6;
  else if (anchor === 'end') x0 = -half - 6 - width;
  else {
    x0 = -width / 2;
    dy = half + 4 + FONT_PX / 2; // the name's centre line, under the marker
  }
  return [...text].flatMap((ch, i) => {
    if (ch === ' ') return [];
    const [top, bottom] = glyphY(ch);
    return [[x0 + i * cw, dy + top, x0 + (i + 1) * cw, dy + bottom]];
  });
}

/**
 * For each marked label (passes, peaks, villages, towns), the smallest gap in px between its name and any
 * route centre line, minus half a 2.5 px route stroke, and whether the name runs off the viewBox, across
 * PLATE_SCALES. Notes and water labels sit on purpose over open ground and are not checked.
 */
export function labelClearance(data, scales = PLATE_SCALES) {
  const [w, h] = data.viewBox;
  const routes = data.routes.map((r) => samplePath(r.d));
  const out = [];
  for (const l of data.labels) {
    if (!['pass', 'peak', 'village', 'town'].includes(l.kind)) continue;
    const boxes = inkBoxes(l);
    const box = [0, 1, 2, 3].map((k) => (k < 2 ? Math.min : Math.max)(...boxes.map((b) => b[k])));
    let minGap = Infinity;
    let worstScale = scales[0];
    const clipped = [];
    for (const s of scales) {
      // Route points into the label's px frame at this plate scale.
      for (const pts of routes) {
        for (const p of pts) {
          const q = [(p[0] - l.x) * s, (p[1] - l.y) * s];
          if (pointBoxDistance(q, box) - 1.25 >= minGap) continue;
          const gap = Math.min(...boxes.map((b) => pointBoxDistance(q, b))) - 1.25;
          if (gap < minGap) {
            minGap = gap;
            worstScale = s;
          }
        }
      }
      const left = l.x * s + box[0];
      const right = l.x * s + box[2];
      if (left < 0 || right > w * s || l.y * s + box[1] < 0 || l.y * s + box[3] > h * s) clipped.push(s);
    }
    out.push({ text: l.text, minGap: Math.round(minGap * 10) / 10, worstScale, clipped });
  }
  return out;
}

/** Prints one line per label and returns false when any name touches a route or leaves the plate. */
export function reportClearance(sheetName, data, minPx = 0.5) {
  let ok = true;
  for (const r of labelClearance(data)) {
    const bad = r.minGap < minPx || r.clipped.length > 0;
    if (bad) ok = false;
    const clip = r.clipped.length ? `, clipped at ${r.clipped.join(', ')} px/unit` : '';
    console.log(`  ${bad ? 'WARN' : 'ok  '} ${sheetName} label "${r.text}": ${r.minGap} px from the nearest route (at ${r.worstScale} px/unit)${clip}`);
  }
  return ok;
}
