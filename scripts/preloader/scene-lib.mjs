// Helpers for the preloader's scene (scripts/preloader/scene.mjs): a seeded random source, value noise, compact
// path encoders, shadow faces, snowlines with couloirs, contour terraces and the generated symbols.
let seed = 0;
export function reseed(s) { seed = s; }
export function rnd() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const rr = (a, b) => a + (b - a) * rnd();
export const R = Math.round;
export const f1 = (n) => Math.round(n * 10) / 10;
export const sstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function noise() {
  const v = Array.from({ length: 1024 }, () => rnd() * 2 - 1);
  return (x) => {
    const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
    const a = v[((i % 1024) + 1024) % 1024], b = v[(((i + 1) % 1024) + 1024) % 1024];
    return a + (b - a) * t;
  };
}
export function fbm(n, x, oct = 4, g = 0.5) {
  let a = 1, fr = 1, s = 0, nm = 0;
  for (let o = 0; o < oct; o++) { s += a * n(x * fr + o * 31.7); nm += a; a *= g; fr *= 2.07; }
  return s / nm;
}
const join = (s) => s.replace(/ -/g, '-');
/** Relative, integer path through points (the cheapest encoding for long silhouettes). */
export const line = (pts) => {
  let px = R(pts[0][0]), py = R(pts[0][1]);
  const ds = [];
  for (let i = 1; i < pts.length; i++) {
    const x = R(pts[i][0]), y = R(pts[i][1]);
    if (x === px && y === py) continue;
    const [dx, dy] = [x - px, y - py], last = ds.at(-1);
    // Collinear runs (a flat tread sampled every 3 units) become one segment.
    const same = last && dx * last[1] === dy * last[0];
    if (same && Math.sign(dx) === Math.sign(last[0]) && Math.sign(dy) === Math.sign(last[1])) {
      last[0] += dx; last[1] += dy;
    } else ds.push([dx, dy]);
    px = x; py = y;
  }
  return join(`M${R(pts[0][0])} ${R(pts[0][1])}l` + ds.map(([x, y]) => `${x} ${y}`).join(' '));
};
/** The same in tenths, for small shapes. */
export const lineF = (pts) => join('M' + pts.map(([x, y]) => f1(x) + ' ' + f1(y)).join(' '));
export const closedTo = (pts, H) => line(pts) + `V${H}H${R(pts[0][0])}Z`;
/** One circle as a path (two arcs), so a crown of overlapping circles is one `d`. */
export const circ = ([x, y, r]) => {
  const a = `a${f1(r)} ${f1(r)} 0 1 0`;
  return join(`M${f1(x - r)} ${f1(y)}${a} ${f1(2 * r)} 0${a} ${f1(-2 * r)} 0`);
};
/** Many small marks as one path of relative moves (dots with round caps: `h0`). */
export function dots(pts) {
  pts.sort((a, b) => a[0] - b[0]);
  let px = 0, py = 0, d = '';
  for (const [x0, y0] of pts) {
    const x = R(x0), y = R(y0);
    d += d ? `m${x - px} ${y - py}h0` : `M${x} ${y}h0`;
    px = x; py = y;
  }
  return join(d);
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export const cv = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))) / m; };

/* ---------------------------------------------------------------- shadow faces */
/**
 * The shaded right flank of each summit (light from the upper left). Each face lies between two ragged lines
 * that fall from the skyline and converge: the summit's spur, drifting right as it drops, and the gully below
 * the next col, drifting left. They meet inside the mountain, so a face narrows into its couloir.
 */
export function faces(pts, H, nz, { win = 14, depth = 0.5, min = 4 } = {}) {
  let d = '';
  const peaks = [];
  for (let i = win; i < pts.length - win; i++) {
    const y = pts[i][1];
    let isPeak = true;
    for (let k = i - win; k <= i + win; k++) if (pts[k][1] < y) { isPeak = false; break; }
    if (!isPeak) continue;
    let j = i, mn = i;
    while (j < pts.length - 1 && pts[j + 1][1] > pts[mn][1] - 10) { j++; if (pts[j][1] > pts[mn][1]) mn = j; }
    j = mn;
    if (j - i < min) continue;
    const run = pts.slice(i, j + 1).filter(([x]) => x - pts[i][0] <= 240);
    if (run.length < min) continue;
    const [xs, ys] = run[0];
    const [xc, yc] = run.at(-1);
    const w = xc - xs;
    peaks.push([xs, ys, w]);
    const foot = [xs + w * rr(0.45, 0.65), Math.max(yc + 0.2 * (H - yc), ys + (H - ys) * depth * rr(0.8, 1.1))];
    const edge = (a, b, amp, ph) => {
      const out = [];
      for (let k = 1; k < 6; k++) {
        const t = k / 6;
        const jag = amp * fbm(nz, ph + k * 0.8) + 0.05 * Math.abs(b[1] - a[1]) * (k % 2 ? 1 : -1) * rnd();
        out.push([a[0] + (b[0] - a[0]) * t + jag * Math.sin(t * Math.PI), a[1] + (b[1] - a[1]) * Math.pow(t, 0.9)]);
      }
      return out;
    };
    const spur = edge(run[0], foot, 0.12 * w, xs / 31);
    const gully = edge(run.at(-1), foot, 0.1 * w, xc / 29);
    d += line([...run, ...gully, foot, ...spur.reverse()]) + 'Z';
    i = j;
  }
  return { d, peaks };
}

/* ---------------------------------------------------------------- snowlines (design v2.4) */
/**
 * The rock below the snow, as one closed path: its top edge is the snowline, a two-scale fbm edge (3 and 9 units)
 * that sits higher on steep faces and lower on gentle shoulders, broken by couloirs. Couloirs are spaced by a
 * jittered Poisson draw (minimum gap 40), 5-30 wide and 10-80 long, asymmetric, leaning down the local fall line;
 * about one in four forks. Each big face also gets a dark rock band or two crossing its snow.
 * `sky` = skyline points (even x step), `base(i)` = the snowline before noise, H = the layer height.
 */
export function snowRock(sky, base, H, nz, { gapMean = 95, kSteep = 26, bands = [], stats } = {}) {
  const n = sky.length, step = sky[1][0] - sky[0][0];
  const slope = sky.map((_, i) => {
    const a = sky[Math.max(0, i - 2)], b = sky[Math.min(n - 1, i + 2)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  });
  const sMean = slope.reduce((s, v) => s + Math.abs(v), 0) / n;
  const edge = sky.map(([x, y], i) => {
    const e = base(i) + 3 * fbm(nz, x / 7, 2) + 9 * fbm(nz, x / 55 + 300, 3) - kSteep * (Math.abs(slope[i]) - sMean);
    return Math.max(y, e);
  });
  const eAt = (x) => {
    const i = Math.min(n - 2, Math.max(0, Math.floor(x / step))), t = x / step - i;
    return edge[i] * (1 - t) + edge[i + 1] * t;
  };
  const skyAt = (x) => sky[Math.min(n - 1, Math.max(0, R(x / step)))][1];
  // Couloirs
  const cs = [];
  for (let x = rr(10, 40); x < sky.at(-1)[0] - 20;) {
    const w = 5 + 25 * Math.pow(rnd(), 1.8);
    const deep = eAt(x) - skyAt(x);
    if (deep > 8) {
      const L = Math.min(10 + 70 * Math.pow(rnd(), 1.3), (H - eAt(x)) * 0.55);
      const i = R(x / step), fall = Math.sign(slope[Math.min(n - 1, i)]) || 1;
      const a = rr(0.3, 0.7);
      cs.push({ x, wl: w * a, wr: w * (1 - a), L, lean: fall * L * rr(0.12, 0.42), fork: rnd() < 0.25 });
    }
    x += 40 + -Math.log(1 - rnd()) * (gapMean - 40);
  }
  if (stats) {
    stats.w.push(...cs.map((c) => c.wl + c.wr));
    for (let k = 1; k < cs.length; k++) stats.gap.push(cs[k].x - cs[k - 1].x);
  }
  const pts = [];
  let c = 0;
  for (let i = 0; i < n; i++) {
    const x = sky[i][0];
    const cc = cs[c];
    if (cc && x >= cc.x - cc.wl) {
      const xl = cc.x - cc.wl, xr = cc.x + cc.wr, e = eAt(cc.x), { L, lean } = cc;
      pts.push([xl, eAt(xl)], [xl + 0.3 * cc.wl + lean * 0.3, e + L * 0.38]);
      pts.push([cc.x - 0.1 * cc.wl + lean * 0.7, e + L * 0.8]);
      if (cc.fork) {
        const s = (cc.wl + cc.wr) * 0.3;
        pts.push([cc.x + lean - s, e + L], [cc.x + lean * 0.6, e + L * 0.55], [cc.x + lean + s * 0.6, e + L * 0.78]);
      } else pts.push([cc.x + lean, e + L]);
      pts.push([cc.x + 0.2 * cc.wr + lean * 0.6, e + L * 0.55], [xr - 0.15 * cc.wr + lean * 0.2, e + L * 0.2]);
      pts.push([xr, eAt(xr)]);
      while (i < n - 1 && sky[i + 1][0] <= xr) i++;
      c++;
      continue;
    }
    pts.push([x, edge[i]]);
  }
  let d = line(pts) + `V${H + 20}H${R(pts[0][0])}Z`;
  // Rock bands crossing the snow of the big faces: thin slanted strips, ragged at the edges.
  for (const [xs, w] of bands) {
    // A rock rib: a band of dark rock falling from the ridge down the fall line, wide at the top and tapering out.
    const x0 = xs + w * rr(0.15, 0.55), top = skyAt(x0), deep = eAt(x0) - top;
    if (deep < 22) continue;
    const L = deep * rr(0.5, 0.85) + 8, lean = L * rr(0.15, 0.4), th = rr(7, 12), y0 = top + rr(3, 8);
    d += line([[x0 - th * 0.4, y0], [x0 + th * 0.6, y0 + 2], [x0 + lean * 0.5 + th * 0.45, y0 + L * 0.5],
      [x0 + lean + 1, y0 + L], [x0 + lean * 0.55 - th * 0.35, y0 + L * 0.55], [x0 - th * 0.2, y0 + L * 0.2]]) + 'Z';
  }
  return d;
}

/* ---------------------------------------------------------------- contour terraces (design v2.4) */
/**
 * Terraced fields on a hill seen from across the valley: bands that follow the hill's surface `top(x)` at
 * growing depth (spacing 6 → 11 units downslope, ±30 %), irregular lengths with tapered ends, at most `n` bands,
 * one of them broken by a gap (a tree clump or a house; returned in `gaps`). Each band is two quadratic halves.
 */
export function terraces(top, cx, span, { n = 6, d0 = 8, th = 3.2, stats } = {}) {
  let d = '', depth = d0, prev = 0;
  const gaps = [], gapsY = [], lens = [];
  for (let k = 0; k < n; k++) {
    let half;
    do half = span * rr(0.45, 1); while (prev && Math.abs(half - prev) / prev < 0.12);
    prev = half;
    const off = span * rr(-0.2, 0.2);
    const x0 = cx + off - half, x1 = cx + off + half;
    const band = (a, b) => {
      // Contours are level on the ground, so seen from across the valley they bow far less than the skyline.
      const m = (a + b) / 2, y = (x) => Math.max(top(x) + 4, top(cx) + (top(x) - top(cx)) * 0.45 + depth);
      const q = (u, v) => { const c = (u + v) / 2; return [c, 2 * y(c) - (y(u) + y(v)) / 2]; };
      const [ca, cb] = [q(a, m), q(m, b)], t = th * rr(0.8, 1.2);
      const P = (x, yy) => `${R(x)} ${R(yy)}`;
      return (
        `M${P(a, y(a))}Q${P(...ca)} ${P(m, y(m))}Q${P(...cb)} ${P(b, y(b))}` +
        `Q${P(cb[0], cb[1] + t)} ${P(m, y(m) + t)}Q${P(ca[0], ca[1] + t)} ${P(a + 4, y(a) + t * 0.4)}Z`
      ).replace(/ -/g, '-');
    };
    if (k === 2) {
      const g = cx + off + rr(-0.3, 0.3) * half, gw = rr(8, 15);
      d += band(x0, g - gw / 2) + band(g + gw / 2, x1);
      gaps.push(g); gapsY.push(top(g) + depth);
    } else d += band(x0, x1);
    lens.push(2 * half);
    const gap = (6 + 5 * (k / Math.max(1, n - 1))) * rr(0.62, 1.38);
    if (stats) stats.push(gap);
    depth += gap + th;
  }
  return { d, gaps, gapsY, lens };
}

/* ---------------------------------------------------------------- symbols (origin at the base, y up is negative) */
/** Conifer with drooping tiers (blue pine / fir), origin at the base, height H, half-width W. */
export function conifer(H, W, n, trunk = 1.3, droop = 0.75) {
  const top = -H, bot = -H * 0.13;
  const segs = [];
  let prevY = top;
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const yb = top + (bot - top) * Math.pow(t, 0.9);
    const w = W * (0.2 + 0.8 * t) * rr(0.86, 1.1);
    segs.push({ c: [w * 0.55, yb - (yb - prevY) * droop], p: [w, yb] });
    if (k < n) segs.push({ p: [w * 0.34, yb - (yb - prevY) * 0.1] });
    prevY = yb;
  }
  segs.push({ p: [trunk, bot] }); segs.push({ p: [trunk, 0] });
  const P = (x, y) => `${f1(x)} ${f1(y)}`;
  let d = `M0 ${f1(top)}`;
  for (const s of segs) d += s.c ? `Q${P(...s.c)} ${P(...s.p)}` : `L${P(...s.p)}`;
  d += `L${P(-trunk, 0)}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    const tgt = i > 0 ? segs[i - 1].p : [0, top];
    d += s.c ? `Q${P(-s.c[0], s.c[1])} ${P(-tgt[0], tgt[1])}` : `L${P(-tgt[0], tgt[1])}`;
  }
  return join(d + 'Z');
}
/**
 * A broadleaf crown as a cluster of overlapping masses, denser at the core and lumpy at the rim: the
 * silhouette of a real canopy rather than one lobe. Returns the circles (for bloom placement) and the path.
 */
export function crown(cx, cy, rx, ry, n, rMin, rMax, flat = 0) {
  const cs = [];
  for (let k = 0; k < n; k++) {
    const a = rr(0, Math.PI * 2), q = Math.sqrt(rr(0.05, 1));
    const r = rr(rMin, rMax) * (1 - 0.35 * q * q);
    let y = cy + Math.sin(a) * ry * q;
    if (flat && y > cy) y = cy + (y - cy) * (1 - flat);
    cs.push([R(cx + Math.cos(a) * rx * q), R(y), R(r)]);
  }
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI * rr(0.1, 0.9), r = rr(rMin, rMax) * 0.62;
    cs.push([R(cx + Math.cos(a) * rx * 1.02), R(cy + Math.sin(a) * ry * 0.95), Math.max(2, R(r))]);
  }
  return { cs, d: cs.map(circ).join('') };
}
/** Bloom: sparse clumps of two or three flower heads on the crown's outermost masses (three of five directions). */
export function bloom(cs, cx, cy) {
  let d = '';
  const dirs = [-170, -125, -85, -45, -8]
    .map((deg) => (deg * Math.PI) / 180)
    .filter((_, i) => i !== 1 + Math.floor(rnd() * 3));
  dirs.splice(Math.floor(rnd() * dirs.length), 1);
  for (const a of dirs) {
    const ux = Math.cos(a), uy = Math.sin(a);
    const reach = (c) => (c[0] - cx) * ux + (c[1] - cy) * uy + c[2];
    const [x, y, r] = cs.reduce((best, c) => (reach(c) > reach(best) ? c : best));
    const bx = x + ux * r * 0.8, by = y + uy * r * 0.8;
    const m = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < m; k++) d += `M${f1(bx + rr(-2.2, 2.2))} ${f1(by + rr(-1.8, 1.8))}h0`;
  }
  return join(d);
}
/** A blade or culm as a curved sliver from (x0, y0) through control c to the tip, `w` wide at the base. */
function sliver([x0, y0], [cx, cy], [tx, ty], w, bulge = 0) {
  const nx = -(ty - y0), ny = tx - x0, l = Math.hypot(nx, ny) || 1;
  const ox = (nx / l) * bulge, oy = (ny / l) * bulge;
  const P = (x, y) => `${f1(x)} ${f1(y)}`;
  return `M${P(x0 - w / 2, y0)}Q${P(cx + ox, cy + oy)} ${P(tx, ty)}Q${P(cx - ox, cy - oy)} ${P(x0 + w / 2, y0)}Z`;
}
/** Banana: 5-7 arching blades from a short pseudostem, one of them torn into two narrower strips. */
export function banana() {
  let d = 'M-1.8 0-1.2-12H1.2L1.8 0Z';
  const n = 6, torn = 1 + Math.floor(rnd() * 4);
  for (let k = 0; k < n; k++) {
    const a = (-160 + (140 * k) / (n - 1) + rr(-8, 8)) * (Math.PI / 180);
    const L = rr(13, 18), up = k === 3 ? 1 : 0;
    const tx = Math.cos(a) * L * (up ? 0.3 : 1), ty = -12 + Math.sin(a) * L * (up ? 1.2 : 0.55) + (up ? 0 : rr(4, 8));
    const c = [Math.cos(a) * L * 0.55, -12 + Math.sin(a) * L * 0.95 - 3];
    if (k === torn) {
      d += sliver([0, -12], c, [tx, ty], 1.2, 1.4) + sliver([0, -12], [c[0], c[1] + 2], [tx * 0.9, ty + 3], 1, 1.2);
    } else d += sliver([0, -12], c, [tx, ty], 1.4, up ? 1.6 : 2.6);
  }
  return join(d);
}
/** Bamboo: 5 thin culms that lean out and arc over at the top, with feathery leaf tufts of short slivers. */
export function bamboo() {
  let d = '';
  const n = 5;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1) - 0.5, b = t * 6 + rr(-0.6, 0.6), h = rr(36, 48) * (1 - Math.abs(t) * 0.45);
    const lean = t * 1.1 + rr(-0.1, 0.1), side = Math.sign(lean) || 1;
    const tip = [b + lean * h * 0.75 + side * 7, -h + rr(3, 7)];
    const c = [b + lean * h * 0.35, -h * 0.95];
    d += sliver([b, 0], c, tip, 1.3, 0.3);
    for (let j = 0; j < 2; j++) {
      const s = 0.6 + j * 0.2, x = b + (c[0] - b) * s * 1.2 + side * j * 1.5, y = -h * s * 0.98;
      d += sliver([x, y], [x + side * 3, y - 1], [x + side * rr(5, 8), y + rr(1, 4)], 0.8, 0.9);
    }
  }
  return join(d);
}
