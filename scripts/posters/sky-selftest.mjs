// Self-test of the live sky engine, in Node (no browser, no dependencies):
//   node scripts/posters/sky-selftest.mjs
// Loads src/_pages/personal/lib/sky-engine.ts and the generated catalogue directly (Node's type stripping).
// Port of docs/redesign/life/sky/selftest.mjs (21 checks), plus Lines and Names really turning off.
// The "independent" functions below are written separately from the engine on purpose: a different sidereal-time
// formula (USNO), Meeus's trigonometric precession (21.4) instead of the rotation matrix, and Meeus's tan A / sin h
// formulas (13.5, 13.6) instead of the horizon matrix.
process.removeAllListeners('warning'); // Node's "module type not specified" notice for the .ts files

const { horizontalOf, horizonMatrix, lst, altAz, precessionMatrix, solarSystem, createSky, compass16 } = await import(
  '../../src/_pages/personal/lib/sky-engine.ts'
);
const { SKY_CATALOGUE } = await import('../../src/_pages/personal/config/sky-catalogue.generated.ts');
const STARS = SKY_CATALOGUE.stars;
const STAR_FIELDS = SKY_CATALOGUE.fields;
const NAMES = SKY_CATALOGUE.names;

const D = Math.PI / 180;
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};
const angDiff = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

/* ------------------------------------------- independent maths ------------------------------------------- */
const jd = (ms) => ms / 86400000 + 2440587.5;
/** USNO: GMST hours = 18.697374558 + 24.06570982441908 D (D = days from J2000.0). */
const gmstUsnoDeg = (ms) => ((((18.697374558 + 24.06570982441908 * (jd(ms) - 2451545.0)) % 24) + 24) % 24) * 15;
/** Meeus 21.4, rigorous precession from J2000 by trigonometric formulas. */
function precessMeeus(raDeg, decDeg, ms) {
  const T = (jd(ms) - 2451545.0) / 36525;
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) / 3600;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) / 3600;
  const th = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) / 3600;
  const a = raDeg * D, d = decDeg * D;
  const A = Math.cos(d) * Math.sin(a + zeta * D);
  const B = Math.cos(th * D) * Math.cos(d) * Math.cos(a + zeta * D) - Math.sin(th * D) * Math.sin(d);
  const C = Math.sin(th * D) * Math.cos(d) * Math.cos(a + zeta * D) + Math.cos(th * D) * Math.sin(d);
  return { ra: (((Math.atan2(A, B) / D + z) % 360) + 360) % 360, dec: Math.asin(C) / D };
}
/** Meeus 13.5/13.6: azimuth from the south, westward; converted to from-north-eastward at the end. */
function horizontalMeeus(raDeg, decDeg, lstDeg, latDeg) {
  const H = (lstDeg - raDeg) * D, d = decDeg * D, p = latDeg * D;
  const Asouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(p) - Math.tan(d) * Math.cos(p)) / D;
  const h = Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H)) / D;
  return { alt: h, az: (Asouth + 180 + 360) % 360 };
}

const starByName = (name) => {
  const row = NAMES.find((r) => r[1] === name);
  const o = row[0] * STAR_FIELDS;
  return { ra: STARS[o] / 50, dec: STARS[o + 1] / 50, mag: STARS[o + 2] / 10, index: row[0] };
};

/* ------------------------------------------------- 1. Polaris ------------------------------------------------- */
{
  const polaris = starByName('Polaris');
  let worst = 0;
  const places = [[25, 85], [28.79, 83.94], [30.49, 79.22], [51.5, 0], [10, -70]];
  for (const [lat, lon] of places)
    for (let h = 0; h < 24; h += 1) {
      const ms = Date.UTC(2026, 10, 5, h, 0, 0);
      const { alt } = horizontalOf(polaris.ra, polaris.dec, ms, lat, lon);
      worst = Math.max(worst, Math.abs(alt - lat));
    }
  check('Polaris altitude within 1° of the latitude', worst < 1, `worst |alt − lat| = ${worst.toFixed(3)}° over 5 places × 24 hours (2026-11-05)`);
}

/* ------------------------------------- 2. Textbook: Meeus Example 13.b -------------------------------------- */
{
  // Venus from the US Naval Observatory, 1987 April 10, 19:21:00 UT. Apparent α = 23h09m16.641s, δ = −6°43'11.61".
  // Meeus: A = 68.0337° (from south, westward) = 248.0337° from north, h = 15.1249°.
  const ms = Date.UTC(1987, 3, 10, 19, 21, 0);
  const ra = (23 + 9 / 60 + 16.641 / 3600) * 15, dec = -(6 + 43 / 60 + 11.61 / 3600);
  const lat = 38 + 55 / 60 + 17 / 3600, lon = -(77 + 3 / 60 + 56 / 3600);
  const h = horizonMatrix(lst(ms, lon), lat * D);
  const v = [Math.cos(dec * D) * Math.cos(ra * D), Math.cos(dec * D) * Math.sin(ra * D), Math.sin(dec * D)];
  const e = h[0] * v[0] + h[1] * v[1] + h[2] * v[2], n = h[3] * v[0] + h[4] * v[1] + h[5] * v[2], u = h[6] * v[0] + h[7] * v[1] + h[8] * v[2];
  const got = altAz(e, n, u);
  const dAlt = Math.abs(got.alt - 15.1249), dAz = angDiff(got.az, 248.0337);
  check('Meeus Ex. 13.b (Venus, Washington, 1987-04-10 19:21 UT)', dAlt < 0.01 && dAz < 0.01,
    `module alt ${got.alt.toFixed(4)}° az ${got.az.toFixed(4)}° vs book 15.1249° / 248.0337°  (Δ ${dAlt.toFixed(4)}°, ${dAz.toFixed(4)}°)`);
}

/* ------------------------------------- 3. Precession: Meeus Example 21.b -------------------------------------- */
{
  // θ Persei, J2000 position with proper motion to 2028 Nov 13.19 TD: α0 = 41.054063°, δ0 = 49.227750°.
  // Book: α = 41.547214°, δ = 49.348483°.
  const ms = (2462088.69 - 2440587.5) * 86400000;
  const P = precessionMatrix(ms);
  const a = 41.054063 * D, d = 49.22775 * D;
  const v = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  const w = [P[0] * v[0] + P[1] * v[1] + P[2] * v[2], P[3] * v[0] + P[4] * v[1] + P[5] * v[2], P[6] * v[0] + P[7] * v[1] + P[8] * v[2]];
  const ra = (Math.atan2(w[1], w[0]) / D + 360) % 360, dec = Math.asin(w[2]) / D;
  const ok = Math.abs(ra - 41.547214) < 0.0005 && Math.abs(dec - 49.348483) < 0.0005;
  check('Meeus Ex. 21.b precession (θ Persei to 2028)', ok, `module ${ra.toFixed(6)}°, ${dec.toFixed(6)}° vs book 41.547214°, 49.348483°`);
}

/* ------------------- 4. Known stars, fixed UTC and place, module vs the independent calculation ------------------- */
{
  // The owner's bar: within 0.5° of the independent calculation (the prototype's bar was 0.01° / 0.02°).
  const cases = [
    ['Betelgeuse', Date.UTC(2026, 0, 15, 15, 30, 0), 25, 85, 'Sikahar 25° N 85° E, 2026-01-15 15:30 UTC (21:00 IST)'],
    ['Sirius', Date.UTC(2026, 0, 15, 15, 30, 0), 25, 85, 'same'],
    ['Vega', Date.UTC(2026, 10, 5, 14, 0, 0), 25, 85, 'Sikahar, 2026-11-05 14:00 UTC (19:30 IST)'],
    ['Arcturus', Date.UTC(2026, 4, 20, 16, 0, 0), 28.7935, 83.9388, 'Thorong La, 2026-05-20 16:00 UTC'],
  ];
  for (const [name, ms, lat, lon, where] of cases) {
    const s = starByName(name);
    const mod = horizontalOf(s.ra, s.dec, ms, lat, lon);
    const p = precessMeeus(s.ra, s.dec, ms);
    const ind = horizontalMeeus(p.ra, p.dec, gmstUsnoDeg(ms) + lon, lat);
    const dAlt = Math.abs(mod.alt - ind.alt), dAz = angDiff(mod.az, ind.az);
    check(`${name}: module vs independent (within 0.5°)`, dAlt < 0.5 && dAz < 0.5,
      `${where}: module alt ${mod.alt.toFixed(3)}° az ${mod.az.toFixed(3)}° (${compass16(mod.az)}); independent alt ${ind.alt.toFixed(3)}° az ${ind.az.toFixed(3)}°  (Δ ${dAlt.toFixed(4)}°, ${dAz.toFixed(4)}°)`);
  }
}

/* ------------------------------------ 5. Rise in the east, set in the west ------------------------------------ */
{
  let n = 0, ok = 0, crossed = 0;
  const t0 = Date.UTC(2026, 10, 5, 15, 0, 0);
  for (const lat of [25, 28.79]) {
    for (let i = 0; i < STARS.length / STAR_FIELDS; i++) {
      const o = i * STAR_FIELDS;
      if (STARS[o + 2] / 10 > 4) continue;
      const ra = STARS[o] / 50, dec = STARS[o + 1] / 50;
      const a = horizontalOf(ra, dec, t0, lat, 85), b = horizontalOf(ra, dec, t0 + 3600_000, lat, 85);
      if (a.alt < 2 || a.alt > 80) continue;
      const eastA = a.az > 0 && a.az < 180, eastB = b.az > 0 && b.az < 180;
      if (eastA !== eastB) {
        crossed++; // culminates (crosses the meridian) inside the hour
        continue;
      }
      n++;
      if ((eastA && b.alt > a.alt) || (!eastA && b.alt < a.alt)) ok++;
    }
  }
  check('Stars rise in the east and set in the west over 1 h', ok === n && n > 300,
    `${ok}/${n} stars (V ≤ 4, 2° < alt < 80°) at 25° N and 28.8° N, 2026-11-05 15:00→16:00 UTC (${crossed} that crossed the meridian inside the hour excluded)`);
}

/* --------------------------------------------- 6. Sun, Moon, Venus --------------------------------------------- */
{
  const s = solarSystem(Date.UTC(1992, 9, 13, 0, 0, 0) - 59_000).sun;
  check('Meeus Ex. 25.a Sun (1992-10-13)', angDiff(s.ra, 198.38083) < 0.03 && Math.abs(s.dec + 7.78507) < 0.03, `module ${s.ra.toFixed(4)}°, ${s.dec.toFixed(4)}°`);
  const m = solarSystem(Date.UTC(1992, 3, 12, 0, 0, 0) - 59_000).moon;
  check('Meeus Ex. 47.a Moon (1992-04-12)', angDiff(m.ra, 134.68847) < 0.3 && Math.abs(m.dec - 13.768368) < 0.3,
    `module ${m.ra.toFixed(3)}°, ${m.dec.toFixed(3)}°, ${(m.distEr * 6378.14).toFixed(0)} km (book 368410 km)`);
  const v = solarSystem(Date.UTC(1992, 11, 20, 0, 0, 0) - 59_000).venus;
  check('Meeus Ex. 33.a Venus (1992-12-20)', angDiff(v.ra, 316.172725) < 0.1 && Math.abs(v.dec + 18.888011) < 0.1, `module ${v.ra.toFixed(4)}°, ${v.dec.toFixed(4)}°, mag ${v.mag.toFixed(1)}`);
  const sol = solarSystem(Date.UTC(2026, 5, 21, 8, 24)).sun;
  check('Sun at the 2026 June solstice', Math.abs(sol.dec - 23.436) < 0.02, `δ = ${sol.dec.toFixed(4)}°`);
  const fm = solarSystem(Date.UTC(2026, 0, 3, 10, 3)).moon;
  check('Full Moon 2026-01-03 10:03 UTC', fm.lit > 0.995, `lit ${(fm.lit * 100).toFixed(2)}%, elongation ${fm.elong.toFixed(2)}°`);
}

/* ------------------------------ 7. The interactive sky itself, on a stubbed canvas ------------------------------ */
{
  const listeners = {};
  const noop = () => {};
  const grad = { addColorStop: noop };
  const calls = { texts: [], strokes: [] };
  const ctx = new Proxy(
    {},
    {
      get: (t, k) => {
        if (k in t) return t[k];
        if (k === 'measureText') return (s) => ({ width: String(s).length * 6.5 });
        if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => grad;
        if (k === 'fillText') return (s) => calls.texts.push(String(s));
        if (k === 'stroke') return () => calls.strokes.push(t.strokeStyle);
        return noop;
      },
      set: (t, k, v) => {
        t[k] = v;
        return true;
      },
    },
  );
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 500 }),
    addEventListener: (ev, fn) => {
      (listeners[ev] ||= []).push(fn);
    },
    removeEventListener: noop,
    setPointerCapture: noop,
  };
  const frames = [];
  globalThis.window = { devicePixelRatio: 2, addEventListener: noop, removeEventListener: noop };
  globalThis.document = { visibilityState: 'visible', addEventListener: noop, removeEventListener: noop };
  globalThis.requestAnimationFrame = (fn) => {
    frames.push(fn);
    return frames.length;
  };
  globalThis.cancelAnimationFrame = noop;
  const flush = (n = 400) => {
    let t = 1000;
    for (let i = 0; i < n && frames.length; i++) {
      const f = frames.shift();
      t += 16.7;
      f(t);
    }
  };
  const fire = (ev, o) =>
    (listeners[ev] || []).forEach((fn) => fn({ button: 0, pointerId: 1, pointerType: 'mouse', timeStamp: o.ts ?? 0, preventDefault: noop, ...o }));

  // Placeholder theme: the stub context never paints, so these are labels, not colours.
  const theme = {
    sky: 'sky', skyHorizon: 'sky-horizon', ground: 'ground', horizon: 'horizon', line: 'figure-line', label: 'label',
    labelStrong: 'label-strong', halo: 'halo', starHot: 'star-hot', starSun: 'star-sun', starCool: 'star-cool',
    planet: 'planet', moon: 'moon', moonDark: 'moon-dark', sun: 'sun', select: 'select', selectLine: 'select-line',
    grid: 'grid', glow: true, fontLabel: '600 11px sans-serif', fontName: '500 12px monospace', fontCompass: '600 13px sans-serif',
  };
  const place = { id: 'sikahar', lat: 25, lon: 85, label: 'Sikahar, 25° N', short: '25° N', timeZone: 'Asia/Kolkata', tzLabel: 'IST' };
  const base = { catalogue: SKY_CATALOGUE, place, theme };

  let selected = null;
  const sky = createSky(canvas, { ...base, reducedMotion: true, onSelect: (i) => (selected = i) });
  const fixed = Date.UTC(2026, 0, 15, 15, 30, 0);
  sky.setTime(fixed);
  flush();
  const up = sky.upNow();
  check('Text alternative', /^Up now from 25° N, 21:00 IST: /.test(up.text), up.text);

  // By day Up now names only the Moon and the bright planets, as the day note says (review P1-2).
  sky.setTime(Date.UTC(2026, 0, 15, 7, 0, 0)); // 12:30 IST
  {
    const day = sky.upNow();
    const kinds = [...new Set(day.items.map((o) => o.kind))];
    check('Day: Up now holds only the Moon and planets', day.phase === 'day' && kinds.every((k) => k === 'moon' || k === 'planet'),
      `${day.phase}: ${day.items.map((o) => o.name).join(', ') || 'nothing'}`);
  }
  // Rise and set: present by default, skipped on request (the table's closed state), below-horizon line says the rise.
  {
    const withRs = sky.info('moon'), without = sky.info('moon', { riseSet: false });
    const rs = withRs?.lines.find(([k]) => k === 'Rise / set')?.[1] ?? '';
    check('Rise / set is optional', /\d\d:\d\d/.test(rs) && !without?.lines.some(([k]) => k === 'Rise / set'), rs);
  }
  sky.setTime(fixed);
  flush();

  // Centre Betelgeuse, then click the middle of the canvas: the card must be Betelgeuse.
  const bet = starByName('Betelgeuse');
  sky.select(`star:${bet.index}`, { exact: true });
  sky.select(null);
  flush();
  fire('pointerdown', { clientX: 400, clientY: 250, ts: 0 });
  fire('pointerup', { clientX: 400, clientY: 250, ts: 50 });
  flush();
  check('Tap hit-test picks the star under the pointer', selected?.title === 'Betelgeuse',
    `card: ${selected ? `${selected.title} · ${selected.kicker} · ${selected.lines.map((l) => l.join(': ')).join(' · ')}` : 'none'}`);

  // Drag right by 100 px: the grabbed sky point stays under the pointer; no momentum in reduced motion.
  const v0 = sky.getView();
  fire('pointerdown', { clientX: 400, clientY: 250, ts: 100 });
  for (let i = 1; i <= 10; i++) fire('pointermove', { clientX: 400 + i * 10, clientY: 250, ts: 100 + i * 16 });
  fire('pointerup', { clientX: 500, clientY: 250, ts: 270 });
  flush();
  const v1 = sky.getView();
  const dAz = ((((v1.az - v0.az) % 360) + 540) % 360) - 180;
  const k = 250 / (2 * Math.tan((v1.fov * D) / 4));
  const dir = (alt, az) => [Math.cos(alt * D) * Math.sin(az * D), Math.cos(alt * D) * Math.cos(az * D), Math.sin(alt * D)];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  {
    const f = dir(v1.alt, v1.az), r = [Math.cos(v1.az * D), -Math.sin(v1.az * D), 0], u = dir(v1.alt + 90, v1.az);
    const g = dir(v0.alt, v0.az);
    const m = (2 / (1 + dot(g, f))) * k, gx = 400 + dot(g, r) * m, gy = 250 - dot(g, u) * m;
    const err = Math.hypot(gx - 500, gy - 250);
    check('Drag: the grabbed sky point stays under the pointer', dAz < 0 && err < 3 && selected?.title === 'Betelgeuse',
      `+100 px at fov ${v0.fov}°, alt ${v0.alt.toFixed(1)}°: view turned ${dAz.toFixed(2)}° in azimuth; the grabbed point is ${err.toFixed(2)} px from the pointer`);
  }

  // Ctrl+wheel zoom about the cursor: the sky point under the cursor stays under it.
  {
    sky.setView({ az: 200, alt: 35, fov: 90 }, { animate: false });
    const vA = sky.getView();
    const k0 = 250 / (2 * Math.tan((vA.fov * D) / 4));
    const X = (600 - 400) / k0, Y = -(150 - 250) / k0, r2 = (X * X + Y * Y) / 4;
    const zc = (1 - r2) / (1 + r2), xs = X / (1 + r2), ys = Y / (1 + r2);
    const fA = dir(vA.alt, vA.az), rA = [Math.cos(vA.az * D), -Math.sin(vA.az * D), 0], uA = dir(vA.alt + 90, vA.az);
    const G = [0, 1, 2].map((i) => rA[i] * xs + uA[i] * ys + fA[i] * zc);
    fire('wheel', { clientX: 600, clientY: 150, deltaY: -120, deltaMode: 0, ctrlKey: true });
    const vB = sky.getView();
    const kB = 250 / (2 * Math.tan((vB.fov * D) / 4));
    const fB = dir(vB.alt, vB.az), rB = [Math.cos(vB.az * D), -Math.sin(vB.az * D), 0], uB = dir(vB.alt + 90, vB.az);
    const mB = (2 / (1 + dot(G, fB))) * kB;
    const err = Math.hypot(400 + dot(G, rB) * mB - 600, 250 - dot(G, uB) * mB - 150);
    check('Wheel zoom keeps the point under the cursor', vB.fov < vA.fov && err < 1,
      `view az ${vA.az.toFixed(1)}° alt ${vA.alt.toFixed(1)}°: fov ${vA.fov.toFixed(1)}° → ${vB.fov.toFixed(1)}°, cursor point drift ${err.toFixed(2)} px`);
  }

  // Keyboard: "n" faces north (instant under reduced motion).
  fire('keydown', { key: 'n' });
  flush();
  const az = sky.getView().az;
  check('Keyboard N faces north', Math.abs(az) < 0.01 || Math.abs(az - 360) < 0.01, `az = ${az.toFixed(2)}°`);

  // Tonight from Sikahar, 15 Jan (the design's 17:22 → 06:36 IST).
  const night = sky.getNight();
  const fmt = (ms) => new Date(ms + 5.5 * 3600_000).toISOString().slice(11, 16);
  check('Tonight from Sikahar (sunset → sunrise)', fmt(night.start) === '17:22' && fmt(night.end) === '06:36',
    `${fmt(night.start)} → ${fmt(night.end)} IST (${((night.end - night.start) / 3600_000).toFixed(2)} h)`);

  // Lines off: no stick figure is stroked, except the selection's own. Names off: no star or constellation name is
  // written, except the selection's.
  {
    sky.setView({ az: 180, alt: 35, fov: 90 }, { animate: false });
    const frameCalls = () => {
      calls.texts.length = 0;
      calls.strokes.length = 0;
      sky.setView({ az: 180.01 }, { animate: false });
      flush(1);
      return { lines: calls.strokes.filter((s) => s === 'figure-line').length, sel: calls.strokes.filter((s) => s === 'select-line').length, texts: [...calls.texts] };
    };
    sky.select(null);
    const on = frameCalls();
    sky.setOptions({ lines: false });
    const off = frameCalls();
    sky.select('constellation:Ori', { center: false });
    const offSel = frameCalls();
    check('Lines off really turns the figures off', on.lines > 0 && off.lines === 0 && off.sel === 0 && offSel.lines === 0 && offSel.sel === 1,
      `figure strokes on ${on.lines}, off ${off.lines}; off with Orion selected: ${offSel.lines} plain, ${offSel.sel} for the selection`);
    sky.setOptions({ lines: true });
    sky.select(null);
    const starNames = new Set(NAMES.filter((r) => r[1]).map((r) => r[1]));
    const named = (texts) => texts.filter((t) => starNames.has(t) || /^[A-Z ]{4,}$/.test(t));
    const nOn = named(frameCalls().texts);
    sky.setOptions({ names: false });
    const nOff = named(frameCalls().texts);
    sky.select(`star:${bet.index}`, { center: false });
    const nSel = named(frameCalls().texts);
    check('Names off really hides star and constellation names', nOn.length > 3 && nOff.length === 0 && nSel.length === 1 && nSel[0] === 'Betelgeuse',
      `names on ${nOn.length} (${nOn.slice(0, 5).join(', ')}…), off ${nOff.length}, off with Betelgeuse selected: ${nSel.join(', ')}`);
    sky.setOptions({ names: true });
    sky.select(null);
  }

  // Frame cost: 200 frames with a stub context (maths, culling and labels; paint is the browser's).
  const t0 = performance.now();
  for (let i = 0; i < 200; i++) {
    sky.setView({ az: i * 1.8, alt: 35 }, { animate: false });
    flush(1);
  }
  const per = (performance.now() - t0) / 200;
  check('Per-frame JS (projection, culling, labels), stubbed paint', per < 4, `${per.toFixed(2)} ms/frame in Node`);
  sky.destroy();

  // Momentum (motion allowed): a flick keeps turning after release, decays and stops by itself.
  const sky2 = createSky(canvas, { ...base, reducedMotion: false });
  sky2.setTime(fixed);
  sky2.setView({ az: 180, alt: 30, fov: 90 }, { animate: false });
  flush();
  fire('pointerdown', { clientX: 300, clientY: 250, ts: 1000 });
  for (let i = 1; i <= 6; i++) fire('pointermove', { clientX: 300 + i * 20, clientY: 250, ts: 1000 + i * 16 });
  const atRelease = sky2.getView().az;
  fire('pointerup', { clientX: 420, clientY: 250, ts: 1100 });
  let n2 = 0;
  while (frames.length && n2 < 2000) {
    frames.shift()(2000 + n2 * 16.7);
    n2++;
  }
  const coast = ((((sky2.getView().az - atRelease) % 360) + 540) % 360) - 180;
  check('Flick momentum coasts, then stops', coast < -5 && frames.length === 0,
    `coasted ${coast.toFixed(1)}° in azimuth over ${n2} frames (${((n2 * 16.7) / 1000).toFixed(1)} s) after release, then the loop went idle`);
  sky2.destroy();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
