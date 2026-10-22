// The preloader's scene (docs/redesign/preloader/design.md §3 and v2): six depth layers of inline SVG, generated
// with a fixed seed so every build writes the same markup. Light comes from the upper left; colours are CSS
// variables (src/widgets/preloader/ui/scene.css), so one markup serves Night and Day. Zone content is placed by
// altitude through motion.mjs, the same altitude <-> progress map the runtime plays.
import { HOLD, NEAR, motion } from './motion.mjs';
import { pano, toLayer } from './pano.mjs';
import {
  R, banana, bamboo, bloom, circ, closedTo, conifer, crown, cv, dots, f1, faces, fbm, line, lineF, noise, reseed,
  rnd, rr, snowRock, sstep, terraces,
} from './scene-lib.mjs';

/**
 * @param {{ ridge: number[][], trekker: { head: { cx: number, cy: number, r: number }, body: string,
 *   limbs: { d: string, width: number } }, route?: { start: number, highCamp: number, pass: number } }} input
 *   the ridge-mark polyline (48 x 16 frame) and the trekker figure (src/shared/ui/ridge-mark/geometry.ts), and
 *   the route's altitudes (ANNAPURNA_ROUTE: Besisahar, Thorong High Camp, Thorong La)
 */
export function buildScene({ ridge: RIDGE, trekker: TREK, route = { start: 760, highCamp: 4880, pass: 5416 } }) {
  reseed(541600);
  const { pOfAlt } = motion(route);
  // Near-strip x at the viewport centre when the readout shows altitude a (C.5, mean of 1440x900 and 390x844).
  const X = (a) => 426 + 2314 * pOfAlt(a);
  const stats = { w: [], gap: [], terr: [] };
  // Plain fills name their token in the markup (no CSS rule); everything else is a class in scene.css.
  const TOK = { 'c-millet': 'gg-terr', 'c-rho': 'oak', snow: 'n5' };
  const FILL = /^(c-(?!bloom|yak)|f\d$|(far|hi)-(snow|rock)$|dry$|gr(-tree)?$|snow$)/;
  const attr = (cls) => {
    const m = /^(dry|gr|gg)-(shade|terr)$/.exec(cls); // shaded faces and terraces share one opacity rule each
    if (m) return `fill="var(--${cls})" class="${m[2] === 'shade' ? 'sh' : 'tr'}"`;
    const o = { hz: 'sky-lo-b) fill-opacity=".97', spray: 'fall) opacity=".3', drift: 'drift) opacity=".55',
      'crest-shade': 'drift) opacity=".5' }[cls];
    if (o) return `fill="var(--${o.replace(')', ')"')}"`;
    return FILL.test(cls) ? `fill="var(--${TOK[cls] ?? cls.replace(/^c-/, '')})"` : `class="${cls}"`;
  };

  /* ---------------------------------------------------------------- symbols */
  const oakA = crown(0, -31, 15, 12, 9, 5.5, 8.5);
  const wal = crown(0, -32, 25, 9, 10, 5.5, 8.5, 0.55);
  const rho = crown(0, -22, 13, 9, 10, 3.8, 6);
  const bl2 = crown(0, -40, 12, 16, 10, 5, 8);
  const SYM = {
    pine: conifer(50, 12, 6, 1.4, 0.75), // Himalayan blue pine: broad drooping tiers
    fir: conifer(60, 9, 8, 1.3, 0.6), // silver fir: a narrow spire
    oak: oakA.d + 'M-1.9 0-1.2-13-6-22-4.9-23-.6-16 0-25 1.1-25 1.2-15 5-21 6-20 1.3-12 1.9 0Z',
    walnut: wal.d + 'M-2.6 0-2-13-12-26-10.2-27-.6-17 1.4-29 3.2-29 1.8-17 10-27 11.6-26 2.2-12 2.8 0Z',
    rhodo: rho.d + 'M-1.4 0-5-11-8-16-6.6-17-3-12-.3-18 1.2-18 .8-11 6-17 7.3-16 1.6-6 1.6 0Z',
    bloom: bloom(rho.cs, 0, -22),
    juniper: crown(0, -4, 12, 3, 8, 3, 4.5).d,
    junUp: crown(0, -10, 4, 9, 6, 2.6, 4).d,
    rockA: 'M-12 0-10-8-3-13 6-11 12-4 13 0Z', rockAh: 'M-10-8-3-13 6-11 1-7Z',
    rockB: 'M-7 0-6-6 0-9 6-5 8 0Z', rockBh: 'M-6-6 0-9 2-5Z',
    house: 'M-15 0V-12H15V0ZM-18-11.5 0-20.5 18-11.5Z', lamp: 'M-9-9h4v4h-4Z',
    chorten: 'M-10 0V-4H10V0ZM-7.5-4V-8H7.5V-4ZM-5.5-8Q-6.5-15 0-16Q6.5-15 5.5-8ZM-1.3-16 0-27 1.3-16Z',
    cairn: 'M-6 0Q-7-3-3-4H3Q7-3 6 0ZM-4-4Q-5-7-1-7.5Q4-7 3-4ZM-2.5-7.5Q-2.5-10.5 0-10.5Q2.5-10.5 2-7.5Z',
    yak:
      'M-15-5Q-16-13-9-14Q-3-18 5-15Q11-14 12-10L15-11Q18-11 18-8L16-5Q14-5 13-6L12.5-1H10.5L10-5H-6.5' +
      'L-7.5-1H-9.5L-10-5Q-12-2-14-3ZM14.5-11.5Q15-14 17.5-14.5M13-11Q12.5-13.5 10.5-14',
    wall: 'M-30 0V-6Q-30-8-28-8H28Q30-8 30-6V0Z',
    // v2, the subtropical valley: a tall broadleaf (sal, schima), banana, bamboo, a two-storey house with a
    // shallow tin roof, and the chautara's stone platform.
    sL: bl2.d + 'M-1.8 0-1.3-20-6-29-5-30-.5-24 .4-31 1.6-31 1.3-22 5.6-29 6.6-28 1.5-17 1.9 0Z',
    sB: banana(),
    sM: bamboo(),
    sH: 'M-11 0V-17H11V0Z',
    sR: 'M-13.5-15.5-11-19.5H11L13.5-15.5Z',
    sC: 'M-17 0-16-6H16L17 0Z',
  };

  /* ---------------------------------------------------------------- FAR (1800 x 420) */
  // The Annapurna wall from Manang, Annapurna II to Tilicho Peak, ray-marched over the site's heightfield.
  const VIEW = { lat: 28.6661, lon: 84.0231, alt: 3545 };
  const nJag = noise(), nFace = noise(), nSnow = noise();
  const farL = toLayer(pano(VIEW, 128, 288, 181, 3, 45, 5000), 1800, 34, 300);
  farL.forEach((q, i) => {
    const j = 4 * (fbm(nJag, i / 2, 3, 0.6) + 0.35 * fbm(nJag, i * 1.7 + 500));
    q.y += j; q.yr += j;
  });
  const farSky = farL.map((q) => [q.x, q.y]);
  const farShade = faces(farSky, 420, nFace, { depth: 0.45, win: 13 });
  const farRock = snowRock(farSky, (i) => farL[i].yr + 6, 420, nSnow, {
    gapMean: 92, kSteep: 22, bands: farShade.peaks.filter((p) => p[2] > 70).map(([x, , w]) => [x - w * 0.6, w]), stats,
  });

  /* ---------------------------------------------------------------- HIGH, DRY, GREEN: procedural ridges */
  const nRid = noise();
  function ridged(x, f, oct = 5) {
    let a = 1, fr = f, s2 = 0, nm = 0;
    for (let o = 0; o < oct; o++) {
      const v = 1 - Math.abs(nRid(x * fr + o * 13.1));
      s2 += a * v * v; nm += a; a *= 0.48; fr *= 2.1;
    }
    return s2 / nm;
  }
  function ridge(Wd, yTop, yLow, step, f, sharp) {
    const sky = [];
    for (let x = 0; x <= Wd; x += step) {
      sky.push([x, yLow - (yLow - yTop) * Math.pow(ridged(x + Wd * 0.37 * sharp, f), sharp)]);
    }
    const lo = Math.min(...sky.map((p) => p[1])), hi = Math.max(...sky.map((p) => p[1]));
    sky.forEach((p) => { p[1] = yTop + ((p[1] - lo) / (hi - lo)) * (yLow - yTop); });
    return sky;
  }
  const at = (sky) => (x) => {
    const step = sky[1][0], i = Math.min(sky.length - 2, Math.max(0, Math.floor(x / step))), t = x / step - i;
    return sky[i][1] * (1 - t) + sky[i + 1][1] * t;
  };

  // HIGH (2200 x 320): the pass country, barren rock under snow and ice
  const hiSky = ridge(2200, 60, 200, 16, 1 / 260, 1.25);
  const hiShade = faces(hiSky, 320, nFace, { depth: 0.62, win: 10 });
  const hiRock = snowRock(hiSky, () => 122, 320, nSnow, {
    gapMean: 100, kSteep: 30, bands: hiShade.peaks.filter((p) => p[2] > 60).map(([x, , w]) => [x - w * 0.5, w]), stats,
  });

  // DRY (2200 x 300): the rain-shadow slopes above Pisang, dotted with juniper
  const drySky = ridge(2200, 90, 220, 20, 1 / 420, 0.75);
  const dryTop = at(drySky);
  const dryDots = [];
  for (let i = 0; i < 26; i++) {
    const x = rr(0, 2200), y = dryTop(x) + rr(10, 110);
    if (y <= 290) dryDots.push([x, y]);
  }

  // GREEN (2400 x 300): the forested Marsyangdi walls around Timang, with terraced hills
  const grSky = ridge(2400, 40, 200, 16, 1 / 520, 0.8);
  const grY = at(grSky);
  const HILLS = [[720, 125], [1430, 110]];
  const isTerr = (x) => HILLS.some(([c, sp]) => Math.abs(x - c) < sp * 1.25);
  const tl = [];
  for (let x = 0; x < 2400;) {
    const w = rr(7, 11), hh = rr(10, 18);
    tl.push([x, grY(x) + 3], [x + w, grY(x + w) + 3 - hh]);
    x += 2 * w;
  }
  tl.push([2400, grY(2400) + 3], [2400, grY(2400) + 8]);
  for (let x = 2390; x >= 0; x -= 60) tl.push([x, grY(x) + 9]);
  let grTrees = line(tl) + 'Z';
  let grTerr = '';
  const lone = [];
  for (const [cx, span] of HILLS) {
    const t = terraces(grY, cx, span, { n: 5, d0: 16, stats: stats.terr });
    grTerr += t.d;
    t.gaps.forEach((g, k) => lone.push([g - 3, t.gapsY[k] + 3], [g + 4, t.gapsY[k] + 4]));
  }
  for (let i = 0; i < 28; i++) {
    const x = rr(0, 2400), y = grY(x) + rr(14, 120);
    if (!isTerr(x) && y < 296) lone.push([x, y]);
  }
  lone.sort((a, b) => a[0] - b[0]);
  {
    let px = R(tl[0][0]), py = R(tl[0][1]); // after Z the pen is back at the band's first point
    for (const [x, y] of lone) {
      const hh = R(rr(6, 11)), w = Math.max(2, R(hh * 0.32));
      grTrees += `m${R(x) - w - px} ${R(y) - py}l${w}-${hh} ${w} ${hh}z`.replace(/ -/g, '-');
      px = R(x) - w; py = R(y);
    }
  }
  const grShade = faces(grSky, 300, nFace, { depth: 0.38, win: 10 });

  /* ---------------------------------------------------------------- GORGE (2000 x 320), new in v2 */
  // The subtropical Marsyangdi below Tal: steep forested walls in a V that opens up-valley (the green ridges and
  // the hazed far wall show through it), a terraced spur on the left wall, cliff bands, and the Syange/Tal
  // waterfall dropping from a notch in the right wall's skyline.
  const nG = noise();
  const FALL = 1050;
  const gTop = (x) => {
    let y;
    if (x < 845) y = 36 + 16 * fbm(nG, x / 90) + (270 - 36) * Math.pow(sstep(330, 845, x), 1.3);
    else y = 46 + 14 * fbm(nG, x / 80 + 40) + (270 - 46) * Math.pow(1 - sstep(845, 1090, x), 0.85);
    y -= 34 * Math.exp(-(((x - 640) / 70) ** 2)); // the terraced spur
    y += 22 * Math.exp(-(((x - FALL) / 13) ** 2)); // the waterfall's notch
    return y - 4 * Math.abs(nG(x / 6 + 900)); // canopy lumps along the skyline
  };
  const ggSky = [];
  for (let x = 0; x <= 2000; x += 10) ggSky.push([x, gTop(x)]);
  const ggShape = closedTo(ggSky, 330);
  const ggShade = line([
    ...ggSky.filter(([x]) => x >= 350 && x <= 852),
    [852, 330], [700, 330], [560, 230], [610, 150], [470, 110], [400, 70],
  ]) + 'Z';
  // Canopy: two overlapping crown patterns of different tiles (so the repeat never lines up), lumpy masses.
  const canopyTile = (id, w, h, n, rMin, rMax, paint, rot) => {
    let d = '';
    for (let k = 0; k < n; k++) {
      const c = [R(rr(0, w)), R(rr(0, h)), R(rr(rMin, rMax))];
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
        const [x, y, r] = [c[0] + dx, c[1] + dy, c[2]];
        if (x + r > 0 && x - r < w && y + r > 0 && y - r < h) d += circ([x, y, r]);
      }
    }
    return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"` +
      ` patternTransform="rotate(${rot})">` +
      `<path ${paint} d="${d}"/></pattern>`;
  };
  const gC = canopyTile('gC', 104, 62, 10, 4, 10, 'fill="var(--nB)" fill-opacity=".8"', 14);
  const gD = canopyTile('gD', 71, 45, 6, 3, 6, 'fill="var(--f2)" fill-opacity=".05"', -27);
  // Cliff bands: ragged slanted strips of exposed rock; the waterfall's own cliff under the notch.
  const cliff = (x0, x1, y0, y1, th) => {
    const pts = [];
    for (let k = 0; k <= 4; k++) pts.push([x0 + ((x1 - x0) * k) / 4, y0 + ((y1 - y0) * k) / 4 + rr(-2, 2)]);
    for (let k = 4; k >= 0; k--) {
      const t = k / 4;
      pts.push([x0 + (x1 - x0) * t + rr(-6, 6), y0 + (y1 - y0) * t + th * (0.4 + Math.sin(t * Math.PI)) + rr(-2, 2)]);
    }
    return line(pts) + 'Z';
  };
  const fTop = gTop(FALL) + 2;
  const ggCliff =
    cliff(FALL - 12, FALL + 15, fTop - 2, fTop + 5, 44) + cliff(950, 985, 196, 214, 16) + cliff(470, 500, 104, 124, 13);
  const ggTerr = terraces(gTop, 640, 62, { n: 4, d0: 9, th: 2.4, stats: stats.terr });
  // The waterfall: three strands from the notch, widening as they fall, and the spray at the foot.
  const fBot = fTop + 112;
  let fall = '';
  // Strands: thin ribbons that leave the lip together, part, and fray into the spray.
  for (const [dx, bx, w, len] of [[-3, -12, 1.3, 0.9], [0, 0, 2, 1], [3, 10, 1.1, 0.8]]) {
    const yb = fTop + (fBot - fTop) * len, c = [FALL + dx * 1.6 + bx * 0.3, fTop + (yb - fTop) * 0.45];
    fall += lineF([
      [FALL + dx - w / 2, fTop], [c[0] - w * 0.6, c[1]], [FALL + bx - w * 1.4, yb], [FALL + bx + w * 1.4, yb],
      [c[0] + w * 0.6, c[1]], [FALL + dx + w / 2, fTop]]) + 'Z';
  }
  const spray = [[-6, 0, 7], [6, -3, 6], [-1, -8, 5]].map(([dx, dy, r]) => circ([FALL + dx, R(fBot + dy), r])).join('');

  /* ---------------------------------------------------------------- NEAR strip (3400 x 240): the trail */
  const nNear = noise();
  const CREST = NEAR.summitX, S = 11, SUM = 56, RX0 = CREST - 23 * S, RY0 = SUM - 2.5 * S; // the ridge-mark crest
  const crestPts = RIDGE.map(([x, y]) => [RX0 + x * S, RY0 + y * S]);
  const bank = (x, c, w, h) => h * Math.exp(-(((x - c) / w) ** 2));
  const RIVER = [345, 66]; // the Marsyangdi's notch: centre, half-width
  function nearBase(x) {
    return 166 + 9 * fbm(nNear, x / 140) - bank(x, 110, 125, 76) + 44 * Math.exp(-(((x - RIVER[0]) / RIVER[1]) ** 4)) -
      bank(x, 575, 80, 14) - bank(x, 815, 95, 38) - bank(x, X(2900), 120, 14) - bank(x, X(4720), 70, 26);
  }
  function nearY(x) {
    if (x >= crestPts[0][0] && x <= crestPts.at(-1)[0]) {
      for (let i = 1; i < crestPts.length; i++) {
        if (x <= crestPts[i][0]) {
          const [a, b] = [crestPts[i - 1], crestPts[i]];
          return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
        }
      }
    }
    if (x > crestPts.at(-1)[0]) return crestPts.at(-1)[1] + (x - crestPts.at(-1)[0]) * 0.13 + 3 * fbm(nNear, x / 40);
    return nearBase(x) + sstep(crestPts[0][0] - 160, crestPts[0][0], x) * (crestPts[0][1] - 166);
  }
  // Terraced banks: the surface quantised into treads (risers fall where the base crosses a step).
  const TERR = [[8, 250, 7], [712, 902, 6]]; // rice on the left bank, millet in B1
  const terrOf = (x) => TERR.find(([a, b]) => x >= a && x <= b);
  const yAt = (x) => {
    const t = terrOf(x), y = nearY(x);
    if (!t) return y;
    const [a, b, st] = t, k = sstep(a, a + 40, x) * (1 - sstep(b - 40, b, x));
    return y + (Math.ceil(y / st) * st - y) * k;
  };
  const nearPts = [];
  for (let x = 0; x <= 3400; x += terrOf(x) ? 3 : 14) nearPts.push([x, yAt(x)]);
  const nearAll = [
    ...nearPts.filter(([x]) => x < crestPts[0][0]),
    ...crestPts,
    ...nearPts.filter(([x]) => x > crestPts.at(-1)[0]),
  ];
  nearAll.unshift([-10, nearAll[0][1]]);
  const nearShape = line(nearAll) + 'V260H-10Z';
  // Fields on the treads: rice (some treads flooded, holding the sky) and golden-green millet.
  let rice = '', paddy = '', millet = '';
  for (const [a, b] of TERR) {
    let x = a + 30;
    while (x < b - 30) {
      const y = yAt(x);
      let x1 = x;
      while (x1 < b - 24 && Math.abs(yAt(x1 + 3) - y) < 0.5) x1 += 3;
      if (x1 - x > 10) {
        const d = `M${R(x + 2)} ${f1(y)}H${R(x1 - 1)}l-2 4.4H${R(x + 4)}Z`;
        if (a > 500) millet += d; else if (rnd() < 0.34) paddy += d; else rice += d;
      }
      x = x1 + 3;
    }
  }
  // The river in its notch, with moonlit ripples, and the suspension bridge with prayer flags.
  const WL = R(nearY(RIVER[0]) - 13);
  let xa = RIVER[0], xb = RIVER[0];
  while (nearY(xa - 1) > WL) xa--;
  while (nearY(xb + 1) > WL) xb++;
  const river = line([[xa, WL], ...nearPts.filter(([x]) => x > xa && x < xb), [xb, WL]]) + 'Z';
  let ripple = '';
  for (let k = 0; k < 7; k++) {
    const x = rr(xa + 8, xb - 22), y = WL + 3 + k * 4.5;
    if (nearY(x) > y + 2 && nearY(x + 16) > y + 2) ripple += `M${R(x)} ${f1(y)}h${R(rr(6, 16))}`;
  }
  const bA = [xa - 16, nearY(xa - 16) - 1], bB = [xb + 18, nearY(xb + 18) - 1];
  const span = bB[0] - bA[0], sag = 0.12 * span;
  const qpt = (P0, P1, s, t) => [P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t + 4 * s * t * (1 - t)];
  const ctl = (P0, P1, s) => `${f1((P0[0] + P1[0]) / 2)} ${f1((P0[1] + P1[1]) / 2 + 2 * s)}`;
  const deckQ = `M${f1(bA[0])} ${f1(bA[1])}Q${ctl(bA, bB, sag)} ${f1(bB[0])} ${f1(bB[1])}`;
  const uA = [bA[0], bA[1] - 11], uB = [bB[0], bB[1] - 11];
  let cable = `M${f1(uA[0])} ${f1(uA[1])}Q${ctl(uA, uB, sag * 0.92)} ${f1(uB[0])} ${f1(uB[1])}`;
  for (let k = 1; k < 8; k++) {
    const t = k / 8, [x, y] = qpt(uA, uB, sag * 0.92, t), [, y2] = qpt(bA, bB, sag, t);
    cable += `M${f1(x)} ${f1(y)}V${f1(y2)}`;
  }
  cable += `M${f1(bA[0])} ${f1(bA[1])}v-12M${f1(bB[0])} ${f1(bB[1])}v-12`;
  const bflags = ['', '', '', '', ''];
  for (let k = 1; k <= 9; k++) {
    const [x, y] = qpt(uA, uB, sag * 0.92, k / 10);
    bflags[(k - 1) % 5] += `M${f1(x - 1.8)} ${f1(y)}h3.6l-.3 4.4h-3Z`;
  }

  const Z = {
    river: [R(xa), R(xb)], gorge: R(X(1310)), mixed: R(X(2600)), conifer: R(X(3200)), dry: R(X(3800)),
    alpine: R(X(4400)), moraine: R(X(4900)), snow: R(X(5200)), hold: R(426 + 2314 * HOLD),
  };

  const uses = [];
  const put = (sym, x, s, cls, flip = false, dy = 0) => {
    const y = yAt(x) + 2 + dy;
    const [sx, sy] = Array.isArray(s) ? s : [s, s];
    const sc = sx === sy && !flip ? f1(sx) : `${flip ? -f1(sx) : f1(sx)} ${f1(sy)}`;
    uses.push(`<use href="#${sym}" ${attr(cls)} transform="translate(${R(x)} ${R(y)})scale(${sc})"/>`);
  };
  const fill = (tok) => `c-${tok}`; // a token's fill class: one rule per token in scene.css
  const rhodo = (x, s, flip) => { put('rhodo', x, s, 'c-rho', flip); put('bloom', x, s, 'c-bloom', flip); };
  // B0, 760-1,310 m: rice terraces, the village, banana and bamboo, the river and the bridge
  put('sM', 18, 1.0, fill('bamboo')); put('sL', 62, [0.9, 1.1], fill('broad'), true);
  put('sB', 96, 0.9, fill('banana'));
  put('sH', 150, 1.0, 'c-house'); put('sR', 150, 1.0, fill('roof'));
  put('sB', 182, 1.05, fill('banana'), true);
  put('sH', 214, 1.1, 'c-house'); put('sR', 214, 1.1, fill('roof')); put('lamp', 214, [-1.1, 1.1], 'c-lamp');
  put('sB', 248, 1.3, fill('banana')); put('sM', 268, 0.85, fill('bamboo'), true);
  put('sB', 438, 1.15, fill('banana'), true);
  put('sH', 470, 0.95, 'c-house'); put('sR', 470, 0.95, fill('roof'));
  put('sM', 505, 1.2, fill('bamboo'), true);
  put('sL', 548, 1.35, fill('broad')); put('sB', 572, 1.2, fill('banana'), true); put('sB', 590, 1.0, fill('banana'));
  put('sL', 628, 1.1, fill('broad'), true); put('sM', 662, 1.05, fill('bamboo'));
  put('sL', 694, [1.0, 1.25], fill('broad'));
  // B1, 1,310-2,000 m: millet terraces, alder and broadleaf, a bamboo stand, the chautara under its big tree
  put('sL', 728, [0.75, 1.15], fill('broad'), true); put('sL', 842, [0.7, 1.1], fill('broad'));
  put('sM', 900, 1.25, fill('bamboo'), true);
  put('sC', 946, 1.0, 'c-wall'); put('sL', 946, 1.75, fill('broad'), false, -5);
  put('sL', 978, [0.8, 1.2], fill('broad'), true);
  // B2, 2,000-2,600 m: walnut, oak, rhododendron in bloom, a teahouse, the first blue pine
  for (const [a, k, s, fl] of [
    [2030, 'walnut', 1.3, 0], [2100, 'oak', 1.0, 1], [2250, 'rhodo', 1.05, 1], [2320, 'oak', 1.4, 0],
    [2390, 'walnut', 1.5, 1], [2460, 'rhodo', 0.9, 0], [2520, 'oak', 1.2, 1], [2585, 'pine', 1.15, 0],
    // B3, 2,600-3,200 m: oak giving way to blue pine and fir, rhododendron
    [2650, 'rhodo', 1.1, 0], [2710, 'pine', 1.35, 0], [2780, 'oak', 1.05, 1], [2850, 'pine', 1.5, 1],
    [2930, 'fir', 1.2, 0], [3000, 'rhodo', 0.95, 1], [3070, 'pine', 1.3, 0], [3150, 'fir', 1.45, 0],
    // B4, 3,200-3,800 m: pine and fir thinning to single trees; a chorten above Pisang
    [3230, 'fir', 1.6, 0], [3290, 'pine', 1.25, 1], [3360, 'fir', 1.75, 0], [3430, 'pine', 1.3, 0],
    [3560, 'fir', 1.4, 0], [3670, 'pine', 1.1, 1], [3790, 'fir', 0.95, 0],
  ]) {
    if (k === 'rhodo') rhodo(X(a), s, !!fl);
    else put(k, X(a), s, k === 'walnut' ? 'c-wal' : k === 'oak' ? 'c-oak' : 'c-pine', !!fl);
  }
  put('house', X(2175), 1.05, 'c-house'); put('lamp', X(2175), 1.05, 'c-lamp');
  put('chorten', X(3495), 1.15, 'c-chorten');
  // B5, 3,800-4,400 m: juniper, a mani wall, a yak at Yak Kharka, the first boulders
  for (const [a, k, s] of [
    [3830, 'juniper', 1.0], [3900, 'junUp', 1.2], [3970, 'juniper', 0.9], [4110, 'juniper', 1.1], [4250, 'junUp', 0.8],
    [4370, 'juniper', 0.9],
  ]) put(k, X(a), s, 'c-jun');
  put('wall', X(4040), 0.9, 'c-wall'); put('yak', X(4185), 1.0, 'c-yak');
  put('rockB', X(4310), 1.2, 'c-rock'); put('rockBh', X(4310), 1.2, 'c-rockh');
  // B6, 4,400-4,900 m: moraine, boulders, a cairn, the first snow patches
  for (const [a, k, s, fl] of [
    [4440, 'rockA', 1.5, 0], [4510, 'rockB', 1.0, 1], [4580, 'rockA', 2.0, 1], [4700, 'rockB', 1.2, 0],
    [4775, 'rockA', 1.6, 0], [4835, 'rockB', 1.0, 1], [4890, 'rockA', 1.3, 1],
  ]) {
    put(k, X(a), s, 'c-rock', !!fl); put(k + 'h', X(a), s, 'c-rockh', !!fl);
  }
  put('cairn', X(4640), 1.2, 'c-rockh', false, -2);
  // Snow cover: thin patches over the moraine thickening into full cover below the pass, to the strip's end.
  const SNOW0 = Z.moraine + 30;
  const snowTop = nearAll.filter(([x]) => x >= SNOW0).map(([x, y]) => [x, y - 1.2]);
  snowTop.push([3410, snowTop.at(-1)[1]]);
  const snowBot = [...snowTop]
    .reverse()
    .map(([x, y]) => [x, Math.min(241, y + 5.2 + 236 * sstep(SNOW0, SNOW0 + 340, x) + 7 * fbm(nNear, x / 9))]);
  const snowCover = line([...snowTop, ...snowBot]) + 'Z';
  // Ice-blue shade on the crest's right flanks: from the summit, down a spur, ending in gully tongues.
  const crestR = crestPts.filter(([x]) => x >= CREST);
  const crestFoot = [];
  for (let k = 0; k <= 6; k++) {
    const t = k / 6, w = crestR.at(-1)[0] - CREST;
    crestFoot.push([CREST + 30 + w * t, 150 + 70 * (1 - t * 0.55) + (k % 2 ? 9 : -3) * (1 - t)]);
  }
  const [c3, c4] = [crestPts[3], crestPts[4]];
  const crestShade =
    line([...crestR, [crestR.at(-1)[0] + 40, 238], ...crestFoot.reverse(), [CREST + 10, 120], [CREST + 3, 80]]) + 'Z' +
    line([c3, c4, [c4[0] + 6, c4[1] + 40], [c3[0] + 14, c3[1] + 62], [c3[0] + 2, c3[1] + 30]]) + 'Z';
  let drifts = '';
  for (let x = X(4600); x < 3390; x += rr(110, 190)) {
    const w = rr(35, 60) + 50 * sstep(X(4600), 3000, x), y = nearY(x) + 6;
    drifts += line([[x - w, y + 2], [x - w * 0.3, y - 3], [x + w * 0.4, y - 2], [x + w, y + 3], [x + w * 0.2, y + 6]]);
    drifts += 'Z';
  }
  // Prayer flags from the summit to a cairn on the far side
  const cairnX = CREST + 120, cairnY = nearY(cairnX) + 2;
  put('cairn', cairnX, 1.5, 'c-rockh');
  const fA = [CREST + 5, SUM - 25], fB = [cairnX, cairnY - 14];
  const fC = [(fA[0] + fB[0]) / 2, Math.max(fA[1], fB[1]) + 16];
  const qAt = (t) => [0, 1].map((i) => (1 - t) ** 2 * fA[i] + 2 * (1 - t) * t * fC[i] + t * t * fB[i]);
  const flags = ['', '', '', '', ''];
  for (let i = 1; i <= 10; i++) {
    const [x, y] = qAt(i / 11);
    flags[(i - 1) % 5] += `M${f1(x - 2.6)} ${f1(y)}h5.2l-.4 6.2h-4.4Z`;
  }
  const flagLine = `M${fA[0]} ${fA[1]}Q${f1(fC[0])} ${f1(fC[1])} ${fB[0]} ${fB[1]}`;
  const h = TREK.head;
  const trek = (cls) =>
    `<g class="${cls}" transform="translate(${CREST} ${SUM - 32.5})scale(1.4)">` +
    `<circle cx="${h.cx}" cy="${h.cy}" r="${h.r}"/><path d="${TREK.body}"/>` +
    `<path d="${TREK.limbs.d}" fill="none" stroke-width="${TREK.limbs.width}" stroke-linecap="round"/></g>`;

  // Ground cover across the green-to-brown change: grass tufts thinning out, scree dots thickening.
  const g2b = [X(3500), X(4150)];
  const tufts = [], scree = [];
  for (let i = 0; i < 34; i++) {
    const x = rr(X(2600), X(4800)), k = sstep(g2b[0], g2b[1], x), y = nearY(x) + rr(5, 46);
    if (y > 238) continue;
    if (rnd() > k) { if (x < g2b[1]) tufts.push([x, y]); } else if (x > g2b[0]) scree.push([x, y]);
  }
  let tuftD = '';
  for (const [x, y] of tufts.sort((a, b) => a[0] - b[0])) tuftD += `M${R(x)} ${R(y)}l-1-3m2 3 1-3`;

  // Near ground: zone colours along x, each change spread over ≥ 260 units (420 for green to brown), with three
  // OKLab-mixed stops in between so both themes blend perceptually.
  const TR = [
    ['nA', 'nB', X(1310), 260], ['nB', 'n0', X(2000), 260], ['n0', 'n1', X(2600), 260], ['n1', 'n2', X(3740), 420],
    ['n2', 'n3', X(4420), 260], ['n3', 'n4', X(4900), 260],
  ];
  const st = (x, c) => `<stop offset="${(x / 3400).toFixed(3)}" stop-color="${c}"/>`;
  let gStops = st(0, 'var(--nA)');
  for (const [a, b, c, w] of TR) {
    const x0 = c - w / 2;
    gStops += st(x0, `var(--${a})`);
    for (const m of [25, 50, 75]) gStops += st(x0 + (w * m) / 100, `color-mix(in oklab,var(--${a}),var(--${b}) ${m}%)`);
    gStops += st(x0 + w, `var(--${b})`);
  }
  const gradNear = `<linearGradient id="gN" gradientUnits="userSpaceOnUse" x2="3400">${gStops}</linearGradient>`;
  // The far wall's glow wash and its valley haze (both vertical, in the far layer's units)
  const vGrad = (id, y1, y2, c, o1, o2) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x2="0" y1="${y1}" y2="${y2}">` +
    `<stop stop-color="var(--${c})" stop-opacity="${o1}"/>` +
    `<stop offset="1" stop-color="var(--${c})" stop-opacity="${o2}"/>` +
    '</linearGradient>';
  const gradGlow = vGrad('gW', 30, 280, 'glow', '.42', '0');
  const gradHaze = vGrad('gH', 40, 330, 'sky-lo-b', '.8', '.97');

  /* stars */
  let stars = '', starsB = '';
  for (let i = 0; i < 34; i++) {
    const x = rr(0, 1000), y = rr(0, 330), r = rnd() < 0.15 ? 1.3 : rr(0.5, 0.9);
    if (r > 1) starsB += `M${R(x)} ${R(y)}h0`; else stars += `M${R(x)} ${R(y)}h0`;
  }

  /* ---------------------------------------------------------------- markup */
  const svg = (vb, body, cls = '') =>
    `<svg${cls ? ` class="${cls}"` : ''} viewBox="${vb}" preserveAspectRatio="none">${body}</svg>`;
  const path = (cls, d) => (d ? `<path ${attr(cls)} d="${d}"/>` : '');
  const symbols = Object.entries(SYM).map(([k, d]) => `<path id="${k}" d="${d}"/>`).join('');
  const defs =
    `<svg width="0" height="0" style="position:absolute"><defs>${symbols}` +
    `<path id="mF" d="${line(farSky)}V424H0Z" vector-effect="non-scaling-stroke"/>` +
    `<path id="sV" d="${ggShape}"/><path id="sG" d="${nearShape}"/>` +
    `${gradNear}${gradGlow}${gradHaze}${gC}${gD}</defs></svg>`;
  const far =
    svg(
      '0 0 1800 420',
      '<use href="#mF" fill="var(--far-snow)"/>' + path('far-rock', farRock) + path('far-shade', farShade.d),
    ) +
    svg('0 0 1800 420', `<use href="#mF" fill="url(#gH)"/>${path('hz', 'M0 419h1800v400H0z')}`, 'haze') +
    svg('0 0 1800 420', '<use href="#mF" fill="url(#gW)"/><use href="#mF" class="glow-rim"/>', 'glow');
  const high = svg(
    '0 0 2200 320',
    path('hi-snow', closedTo(hiSky, 324)) + path('hi-rock', hiRock) + path('hi-shade', hiShade.d),
  );
  const dry = svg(
    '0 0 2200 300',
    path('dry', closedTo(drySky, 310)) + path('dry-shade', faces(drySky, 300, nFace, { depth: 0.42, win: 7 }).d) +
      path('dry-dot tx', dots(dryDots)),
  );
  const green = svg(
    '0 0 2400 300',
    path('gr', closedTo(grSky, 310)) + path('gr-shade', grShade.d) + path('gr-terr', grTerr) + path('gr-tree', grTrees),
  );
  const gorge = svg(
    '0 0 2000 320',
    '<use href="#sV" fill="var(--gg)"/><use href="#sV" fill="url(#gC)"/><use href="#sV" fill="url(#gD)"/>' +
      path('gg-shade', ggShade) + path('c-cliff', ggCliff) +
      path('gg-terr', ggTerr.d) + path('c-fall', fall) + path('spray', spray),
  );
  const near =
    svg(
      '0 0 3400 240',
      '<use href="#sG" fill="url(#gN)"/><use href="#sG" class="rim"/>' + path('c-river', river) +
        path('ripple', ripple) + path('c-rice', rice) + path('c-paddy', paddy) + path('c-millet', millet) +
        path('tx tuft', tuftD) + path('tx scree', dots(scree)) + path('snow', snowCover) +
        path('crest-shade', crestShade) + path('drift', drifts) + uses.join('') + path('deck', deckQ) +
        path('cable', cable) + bflags.map((d, i) => path(`f${i + 1}`, d)).join('') + path('flag-line', flagLine) +
        flags.map((d, i) => path(`f${i + 1}`, d)).join('') + trek('trek'),
    ) + svg('0 0 3400 240', path('glow-rim crest', lineF(crestPts)) + trek('trek-lit'), 'glow');
  const layers =
    `<div class="ly ly-far">${far}</div><div class="ly ly-high">${high}</div><div class="ly ly-dry">${dry}</div>` +
    `<div class="ly ly-green">${green}</div><div class="ly ly-gorge">${gorge}</div>` +
    `<div class="ly ly-near">${near}</div>`;
  const starSvg =
    '<svg class="stars" viewBox="0 0 1000 330" preserveAspectRatio="xMidYMid slice">' +
    `<path d="${stars}"/><path class="big" d="${starsB}"/></svg>`;

  const k2 = (a) => +cv(a).toFixed(2);
  const cvs = { couloirW: k2(stats.w), couloirGap: k2(stats.gap), terrGap: k2(stats.terr) };
  return { markup: starSvg + defs + layers, zones: { ...Z, cv: cvs }, uses: uses.length, stats: cvs };
}
