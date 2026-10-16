// G-12: the OG card, 1200 × 630. The ridge is the Annapurna Circuit's altitude profile (ANNAPURNA_ROUTE,
// commonly cited altitudes; x by great-circle distance between the drawing coordinates), drawn as the
// route in signal over seeded contour lines in ink at 18%. A lit tent marks base camp at the trailhead,
// where the route leaves from (the site's home chapter is "Base camp").
import { markFragment } from './mark.mjs';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const MARGIN_X = 72;
const BASE_Y = 596; // y of 0 m
const TOP_ALT_Y = 262; // y of the highest waypoint
const CONTOUR_LINES = 11;

const r1 = (n) => Math.round(n * 10) / 10;

function haversineKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Fritsch–Carlson monotone cubic: no overshoot above a summit or below a valley. */
function monotoneInterpolator(xs, ys) {
  const n = xs.length;
  const d = [];
  const m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i += 1) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i += 1) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i += 1) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i += 1;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };
}

/** Lays the route out on the card: one point per waypoint, plus a smooth ridge function y(x). */
export function ridgeLayout(route) {
  const usable = route.filter((w) => typeof w.altitudeM === 'number' && typeof w.lat === 'number');
  const cumulative = [0];
  for (let i = 1; i < usable.length; i += 1) cumulative.push(cumulative[i - 1] + haversineKm(usable[i - 1], usable[i]));
  const total = cumulative[cumulative.length - 1];
  const maxAlt = Math.max(...usable.map((w) => w.altitudeM));
  const scale = (BASE_Y - TOP_ALT_Y) / maxAlt;
  const points = usable.map((w, i) => ({
    name: w.name,
    kind: w.kind,
    altitudeM: w.altitudeM,
    x: MARGIN_X + (cumulative[i] / total) * (OG_WIDTH - MARGIN_X * 2),
    y: BASE_Y - w.altitudeM * scale,
  }));
  const ridgeY = monotoneInterpolator(
    points.map((p) => p.x),
    points.map((p) => p.y),
  );
  const summit = points.reduce((best, p) => (p.altitudeM > best.altitudeM ? p : best), points[0]);
  return { points, ridgeY, summit, start: points[0], end: points[points.length - 1] };
}

function polyline(samples) {
  return samples.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y)}`).join('');
}

/**
 * The card's drawing (everything except the type) as one SVG string. `rand` is a seeded mulberry32.
 * Colors come from the Night palette; contour ink uses the token alpha (§B.1: 18%).
 */
export function ogArtworkSvg({ layout, palette, rand, contourRgba }) {
  const n = palette.night;
  const { points, ridgeY, summit, start, end } = layout;
  const [cr, cg, cb, minorAlpha] = contourRgba;
  const contourInk = `rgb(${cr} ${cg} ${cb} / ${minorAlpha})`;

  // Contours: the ridge's height above the frame bottom, stepped down line by line and roughened with
  // low-frequency seeded waves, so the face below the ridge reads as a stack of contour lines.
  const waves = Array.from({ length: CONTOUR_LINES }, () =>
    Array.from({ length: 3 }, (_, j) => ({ freq: (0.004 + rand() * 0.006) * (j + 1), phase: rand() * Math.PI * 2, amp: (3 + rand() * 4) / (j + 1) })),
  );
  const contourPaths = [];
  for (let k = 1; k <= CONTOUR_LINES; k += 1) {
    const keep = 1 - k / (CONTOUR_LINES + 1.6);
    const samples = [];
    for (let x = -4; x <= OG_WIDTH + 4; x += 6) {
      const height = OG_HEIGHT - ridgeY(x);
      let y = OG_HEIGHT - height * keep + 6 * k;
      for (const w of waves[k - 1]) y += w.amp * Math.sin(x * w.freq + w.phase) * keep;
      samples.push([x, Math.max(y, ridgeY(x) + 8)]);
    }
    contourPaths.push(`<path d="${polyline(samples)}"/>`);
  }

  // The route: the ridge itself between the trailhead and the end of the walk.
  const route = [];
  for (let x = start.x; x < end.x; x += 3) route.push([x, ridgeY(x)]);
  route.push([end.x, ridgeY(end.x)]);

  // The waypoint ticks: small ink dots where the commonly cited altitudes sit on the line.
  const ticks = points
    .filter((p) => p !== summit && p !== start)
    .map((p) => `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="3" fill="${n.ground}" stroke="${n.signal}" stroke-width="2"/>`)
    .join('');

  // The lit tent at the trailhead: a low ridge tent (wider than tall, so it never reads as the trig
  // mark), ink outline with a pole tip, a signal door for the lamp inside, standing on a short ground line.
  const tw = 48;
  const th = 25;
  const tx = start.x + tw / 2 - 2;
  const ty = ridgeY(start.x) - 1.5;
  const tent = [
    '<g stroke-linejoin="round" stroke-linecap="round">',
    `<path d="M${r1(tx - tw / 2)} ${r1(ty)}L${r1(tx)} ${r1(ty - th)}L${r1(tx + tw / 2)} ${r1(ty)}Z" fill="${n.ground}" stroke="${n.ink}" stroke-width="2"/>`,
    `<path d="M${r1(tx)} ${r1(ty - th)}L${r1(tx)} ${r1(ty - th - 5)}" stroke="${n.ink}" stroke-width="2"/>`,
    `<path d="M${r1(tx - 8)} ${r1(ty)}L${r1(tx)} ${r1(ty - th + 9)}L${r1(tx + 8)} ${r1(ty)}Z" fill="${n.signal}"/>`,
    '</g>',
  ].join('');

  // The summit: the trig mark (G-11) standing on the pass.
  const markSide = 22;
  const summitMark = markFragment({ x: summit.x - markSide / 2, y: summit.y - markSide - 8, side: markSide, color: n.signal });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">`,
    `<g fill="none" stroke="${contourInk}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${contourPaths.join('')}</g>`,
    `<path d="${polyline(route)}" fill="none" stroke="${n['signal-line']}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    ticks,
    tent,
    summitMark,
    `</svg>`,
  ].join('');
}

/** Where the summit label sits (shared by the next/og layout and the sharp fallback). */
export function summitLabelBox(layout) {
  const width = 300;
  return { right: OG_WIDTH - Math.min(OG_WIDTH - 24, layout.summit.x + width / 2), top: layout.summit.y - 76, width };
}

export const OG_TEXT = {
  name: 'Aman Anubhav',
  tagline: 'Everything I need, I carry.',
  role: 'AI engineer. Solo high-altitude trekker.',
};

export function formatMetres(m) {
  return new Intl.NumberFormat('en').format(m);
}

/** The next/og element tree (plain objects, no JSX: satori accepts React-element-shaped objects). */
export function ogElement({ h, artworkDataUri, layout, palette }) {
  const n = palette.night;
  const label = summitLabelBox(layout);
  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: n.ground,
        color: n.ink,
      },
    },
    h('img', { src: artworkDataUri, width: OG_WIDTH, height: OG_HEIGHT, style: { position: 'absolute', left: 0, top: 0 } }),
    h(
      'div',
      { style: { position: 'absolute', left: MARGIN_X, top: 62, display: 'flex', flexDirection: 'column', width: 760 } },
      h('div', { style: { fontFamily: 'Archivo', fontWeight: 700, fontSize: 80, letterSpacing: -2, lineHeight: 1 } }, OG_TEXT.name),
      h('div', { style: { fontFamily: 'Literata', fontWeight: 400, fontSize: 46, lineHeight: 1.15, marginTop: 26 } }, OG_TEXT.tagline),
      h(
        'div',
        { style: { fontFamily: 'Literata', fontWeight: 400, fontSize: 28, lineHeight: 1.3, marginTop: 14, color: n['ink-muted'] } },
        OG_TEXT.role,
      ),
    ),
    h(
      'div',
      {
        style: {
          position: 'absolute',
          right: label.right,
          top: label.top,
          width: label.width,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          fontFamily: 'Archivo',
          fontWeight: 600,
          fontSize: 24,
          color: n.ink,
        },
      },
      h('span', {}, `${layout.summit.name} ${formatMetres(layout.summit.altitudeM)}`),
      h('span', { style: { fontSize: 19, marginLeft: 5, color: n['ink-muted'] } }, 'm'),
    ),
  );
}

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The fallback card: the same artwork with the type as SVG text (system fonts if Archivo/Literata are absent). */
export function ogFallbackSvg({ artworkSvg, layout, palette }) {
  const n = palette.night;
  const label = summitLabelBox(layout);
  const labelCentre = OG_WIDTH - label.right - label.width / 2;
  const inner = artworkSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">`,
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${n.ground}"/>`,
    inner,
    `<text x="${MARGIN_X}" y="134" fill="${n.ink}" font-family="Archivo, 'Arial Narrow', Arial, sans-serif" font-weight="700" font-size="80" letter-spacing="-2">${escapeXml(OG_TEXT.name)}</text>`,
    `<text x="${MARGIN_X}" y="214" fill="${n.ink}" font-family="Literata, Georgia, serif" font-size="46">${escapeXml(OG_TEXT.tagline)}</text>`,
    `<text x="${MARGIN_X}" y="262" fill="${n['ink-muted']}" font-family="Literata, Georgia, serif" font-size="28">${escapeXml(OG_TEXT.role)}</text>`,
    `<text x="${r1(labelCentre)}" y="${r1(label.top + 26)}" text-anchor="middle" fill="${n.ink}" font-family="Archivo, Arial, sans-serif" font-weight="600" font-size="24">${escapeXml(`${layout.summit.name} ${formatMetres(layout.summit.altitudeM)}`)}<tspan dx="5" fill="${n['ink-muted']}" font-size="19">m</tspan></text>`,
    `</svg>`,
  ].join('');
}
