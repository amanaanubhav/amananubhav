// Self-test for gen:routes: node scripts/routes/selftest.mjs
// Builds synthetic GPX files in a temp folder (never media-inbox), runs build-trek-routes.mjs against them with a
// temp output, and checks the privacy and shape rules. Also checks the empty-inbox case. Touches nothing in src/.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fillElevation, parseGpx } from './gpx.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'build-trek-routes.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'gen-routes-'));
let failed = 0;
const check = (ok, what) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failed += 1;
};

/** A wiggly walk through the given [lon, lat, ele] anchors, `perLeg` points per leg, with timestamps and extras. */
function gpx(anchors, perLeg, { spikeAt = -1, noEleEvery = 0, rte = false, startHour = 6 } = {}) {
  const pts = [];
  for (let a = 0; a < anchors.length - 1; a += 1) {
    const [x0, y0, z0] = anchors[a];
    const [x1, y1, z1] = anchors[a + 1];
    for (let i = 0; i < perLeg; i += 1) {
      const t = i / perLeg;
      const wiggle = Math.sin(t * Math.PI * 14) * 0.0015;
      pts.push([x0 + (x1 - x0) * t + wiggle, y0 + (y1 - y0) * t - wiggle * 0.5, z0 + (z1 - z0) * t + Math.sin(i) * 2]);
    }
  }
  pts.push(anchors[anchors.length - 1]);
  if (spikeAt >= 0) pts.splice(spikeAt, 0, [pts[spikeAt][0] + 0.01, pts[spikeAt][1] + 0.01, 9999]);
  const tag = rte ? 'rtept' : 'trkpt';
  const body = pts
    .map(([lon, lat, ele], i) => {
      const time = new Date(Date.UTC(2026, 9, 18, startHour, 0, i * 5)).toISOString();
      const eleTag = noEleEvery && i % noEleEvery === 0 ? '' : `<ele>${ele.toFixed(1)}</ele>`;
      return `<${tag} lon='${lon.toFixed(7)}' lat="${lat.toFixed(7)}">${eleTag}<time>${time}</time><extensions><gpxtpx:hr>131</gpxtpx:hr></extensions></${tag}>`;
    })
    .join('\n');
  const wrap = rte ? `<rte><name>Morning hike</name>${body}</rte>` : `<trk><name>Morning hike</name><trkseg>${body}</trkseg></trk>`;
  return `<?xml version="1.0"?>\n<gpx version="1.1" creator="StravaGPX"><metadata><time>2026-10-18T06:00:00Z</time></metadata>${wrap}</gpx>`;
}

function run(inbox, label, extra = []) {
  const out = join(tmp, `${label}.ts`);
  const json = join(tmp, `${label}.json`);
  const r = spawnSync(process.execPath, [SCRIPT, `--inbox=${inbox}`, `--out=${out}`, `--json=${json}`, ...extra], { encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout + r.stderr, ts: readFileSync(out, 'utf8'), routes: JSON.parse(readFileSync(json, 'utf8')) };
}

try {
  console.log('gen:routes self-test');

  // 1. No inbox at all.
  const none = run(join(tmp, 'missing'), 'none');
  check(none.code === 0, 'missing inbox exits 0');
  check(/TREK_ROUTES: Partial<Record<ExpeditionId, TrekRoute>> = \{\};/.test(none.ts), 'missing inbox writes TREK_ROUTES = {}');
  check(none.ts.includes("import 'server-only';"), 'output imports server-only');

  // 2. Empty inbox.
  const emptyDir = join(tmp, 'empty');
  mkdirSync(emptyDir);
  check(run(emptyDir, 'empty').routes && Object.keys(run(emptyDir, 'empty').routes).length === 0, 'empty inbox gives no routes');

  // 3. Dodital as two day files (with a spike and gaps in elevation), Chandrashila as route points, plus noise.
  const inbox = join(tmp, 'inbox');
  mkdirSync(inbox);
  writeFileSync(join(inbox, 'dodital-1.gpx'), gpx([[78.48, 30.8, 2000], [78.53, 30.87, 3020]], 1500, { spikeAt: 700, noEleEvery: 7 }));
  writeFileSync(join(inbox, 'dodital-2.gpx'), gpx([[78.53, 30.87, 3020], [78.55, 30.92, 4080], [78.53, 30.87, 3020]], 900, { startHour: 7 }));
  writeFileSync(join(inbox, 'chandrashila.gpx'), gpx([[79.13, 30.52, 2400], [79.17, 30.5, 2900], [79.21, 30.49, 2700], [79.22, 30.49, 3990]], 200, { rte: true }));
  writeFileSync(join(inbox, 'annapurna.gpx'), gpx([[84.38, 28.23, 800], [84.4, 28.3, 900]], 50));
  writeFileSync(join(inbox, 'somewhere.gpx'), gpx([[0, 0, 0], [0.1, 0.1, 0]], 10));
  writeFileSync(join(inbox, 'notes.txt'), 'not a gpx');
  // 3a. Not approved (the default list is the owner's): every track is read and reported, none is published.
  const gated = run(inbox, 'gated', ['--approved=']);
  check(gated.code === 0 && Object.keys(gated.routes).length === 0, 'unapproved tracks are not published');
  check(/dodital: .*not published: awaiting approval/.test(gated.stdout) && /REPORT ONLY/.test(gated.stdout), 'unapproved tracks still reported, marked awaiting approval');

  // 3b. Approved.
  const full = run(inbox, 'full', ['--approved=dodital,chandrashila']);
  const d = full.routes.dodital;
  const c = full.routes.chandrashila;
  check(full.code === 0, 'full inbox exits 0');
  check(Object.keys(full.routes).sort().join() === 'chandrashila,dodital', 'only dodital and chandrashila routes (annapurna and unknown skipped)');
  check(/annapurna\.gpx: Annapurna belongs/.test(full.stdout) && /somewhere\.gpx: no finished trek/.test(full.stdout), 'skipped files reported');
  check(!/T\d\d:\d\d|2026-10|<time|gpxtpx|Morning hike|StravaGPX/.test(full.ts), 'no timestamps, dates, names or extensions in the output');
  check(d.points.length <= 300 && c.points.length <= 300, `at most 300 points (dodital ${d.points.length}, chandrashila ${c.points.length})`);
  check(d.points.length === d.ele.length && d.points.length === d.km.length, 'points, ele and km are parallel');
  check(d.points.every(([lon, lat]) => String(lon).split('.')[1]?.length <= 5 && String(lat).split('.')[1]?.length <= 5), 'coordinates rounded to 5 decimals');
  check(d.ele.every(Number.isInteger) && Math.max(...d.ele) < 4200, `elevations whole metres, spike removed (max ${Math.max(...d.ele)})`);
  check(d.km.every((k, i) => i === 0 || k >= d.km[i - 1]), 'km increases');
  check(Object.keys(d.stopKm).join() === 'Trailhead,Dodital,Darwa Top', 'dodital stops snapped in order');
  check(d.stopKm.Trailhead < d.stopKm.Dodital && d.stopKm.Dodital < d.stopKm['Darwa Top'], 'stopKm follows walking order on an out-and-back day');
  check(!('Jhandi Top' in c.stopKm) && 'Chandrashila' in c.stopKm, 'unplaced stop (Jhandi Top) is never placed');
  check(/unplaced stops \(owner question, never placed\): Jhandi Top/.test(full.stdout), 'unplaced stop reported');
  check(/REPORT ONLY/.test(full.stdout) && !/distance|gain/i.test(full.ts.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'distance and gain only in the report, not exported');

  // 4. Both forms for one trek is a problem, not a silent pick.
  const clash = join(tmp, 'clash');
  mkdirSync(clash);
  writeFileSync(join(clash, 'kun-tso.gpx'), gpx([[88.74, 27.92, 4400], [88.76, 27.95, 4990]], 300));
  writeFileSync(join(clash, 'kun-tso-1.gpx'), gpx([[88.74, 27.92, 4400], [88.76, 27.95, 4990]], 300));
  const cl = run(clash, 'clash');
  check(cl.code === 1 && Object.keys(cl.routes).length === 0, 'single file plus day files is reported and skipped');

  // 5. Malformed files, all approved: each bad trek is skipped or warned about; the good parts still build.
  const bad = join(tmp, 'bad');
  mkdirSync(bad);
  const good = gpx([[78.48, 30.8, 2000], [78.53, 30.87, 3020]], 400);
  writeFileSync(join(bad, 'kun-tso.gpx'), '');
  writeFileSync(join(bad, 'chandrashila.gpx'), Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 131 + 7) % 256)));
  writeFileSync(join(bad, 'dodital.gpx'), good.slice(0, Math.floor(good.length * 0.6)));
  writeFileSync(join(bad, 'triund.gpx'), '<gpx><trk><trkseg><trkpt lat="32.24" lon="76.32"><ele>2850</ele></trkpt></trkseg></trk></gpx>');
  writeFileSync(join(bad, 'kheerganga.gpx'), '<gpx><trk><trkseg><trkpt lat="32,0" lon="77,4"/><trkpt lat="32,01" lon="77,41"/></trkseg></trk></gpx>');
  const b = run(bad, 'bad', ['--approved=kun-tso,chandrashila,dodital,triund,kheerganga']);
  check(b.code === 1, 'malformed files exit 1');
  check(/kun-tso: kun-tso\.gpx has no readable track points/.test(b.stdout), 'empty file: trek skipped');
  check(/chandrashila: chandrashila\.gpx has no readable track points/.test(b.stdout), 'binary file: trek skipped');
  check(/triund: fewer than 2 points/.test(b.stdout), 'single point: trek skipped');
  check(/kheerganga: kheerganga\.gpx has no readable track points/.test(b.stdout), 'comma decimals: trek skipped');
  check(/WARNING dodital: dodital\.gpx has no closing <\/gpx>/.test(b.stdout) && Object.keys(b.routes).join() === 'dodital', 'truncated file: warned, partial track kept');

  // 6. Parser details.
  const attrs = parseGpx('<gpx><trk><trkpt data-lat="9" foo:lon="1" lat="30.1" lon="78.2"/></trk></gpx>').points[0];
  check(attrs && attrs.lat === 30.1 && attrs.lon === 78.2, 'lat/lon read from the attributes themselves, not data-lat or foo:lon');
  const open = parseGpx('<gpx><trk><trkpt lat="30" lon="78"><ele>100</ele><trkpt lat="30.1" lon="78.1"><ele>200</ele></trkpt></trk></gpx>');
  check(open.points.length === 2 && open.points[0].ele === 100 && open.points[1].ele === 200 && open.unclosed === 1, 'an unclosed point does not swallow the next one');
  const many = Array.from({ length: 40_000 }, (_, i) => ({ lon: 0, lat: 0, ele: i % 2 ? undefined : i }));
  const t0 = performance.now();
  fillElevation(many);
  const ms = performance.now() - t0;
  check(ms < 200 && many[1].ele === 1 && many[39_999].ele === 39_998, `fillElevation is linear (40k points, half missing: ${ms.toFixed(0)} ms)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exitCode = failed ? 1 : 0;
