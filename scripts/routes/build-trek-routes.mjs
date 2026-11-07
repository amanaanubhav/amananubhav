// npm run gen:routes: the notebook's GPS routes (NOTEBOOK-DESIGN §3.2).
//
//   node scripts/routes/build-trek-routes.mjs [--inbox=<dir>] [--out=<file>] [--dry] [--approved=<id,id>]
//
// Nothing from a GPX reaches the page until the owner approves that trek: a route is written only for the ids in
// approved-tracks.mjs (`--approved=` replaces that list for one run; the self-test uses it). Every other track is still
// read and reported, marked "not published: awaiting approval".
//
// Reads media-inbox/gpx/treks/<expedition-id>.gpx, or day files <expedition-id>-1.gpx, -2.gpx ... joined in order,
// for every finished trek except Annapurna (the home pipeline owns it). A missing or empty folder is normal: the
// output is then `TREK_ROUTES = {}` and every notebook page draws its sketch from the entity's waypoints.
//
// Per trek: keep lat/lon/ele only (no <time>, no metadata: Q-48), drop GPS spikes, median-filter elevation over
// 5 points, simplify (Douglas-Peucker about 12 m, at most 300 points), round to 5 decimals and whole metres, and snap
// each positioned waypoint onto the line for `stopKm`. Distance, gain and the highest track elevation go in the
// printed report only (NB-7); the script never edits expeditions.ts.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { importSource, ROOT } from '../brand/shared.mjs';
import { APPROVED_TRACKS } from './approved-tracks.mjs';
import {
  cumulativeKm,
  dedupe,
  dropSpikes,
  fillElevation,
  gainM,
  haversineM,
  medianElevation,
  parseGpx,
  round,
  simplify,
  snapToTrack,
} from './gpx.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);
const INBOX = resolve(ROOT, typeof args.inbox === 'string' ? args.inbox : 'media-inbox/gpx/treks');
const OUT = resolve(ROOT, typeof args.out === 'string' ? args.out : 'src/_pages/stories/config/trek-routes.generated.ts');
const DRY = Boolean(args.dry);
const APPROVED = new Set(
  typeof args.approved === 'string'
    ? args.approved.split(',').map((id) => id.trim()).filter(Boolean)
    : args.approved === true
      ? []
      : APPROVED_TRACKS,
);
const rel = (p) => relative(ROOT, p).split('\\').join('/') || '.';

const SPIKE_M = 60;
const MEDIAN_WINDOW = 5;
const SIMPLIFY_M = 12;
const MAX_POINTS = 300;
const GAIN_BAND_M = 5;
/** A day file that starts this far from where the previous one ended is reported (the join draws a straight line). */
const DAY_GAP_REPORT_M = 200;
/** A snapped stop this far from the line is reported (the position is probably an estimate to correct). */
const SNAP_REPORT_M = 500;

const { EXPEDITIONS } = await importSource('src/entities/expedition/model/expeditions.ts');
const ELIGIBLE = EXPEDITIONS.filter((e) => e.status === 'done' && e.id !== 'annapurna');
const ids = ELIGIBLE.map((e) => e.id).sort((a, b) => b.length - a.length);

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const problems = [];
const notes = [];

// ------------------------------------------------------------------ discovery

/** expedition id -> { single?: file, days: Map<day, file> } */
const found = new Map();
let files = [];
if (existsSync(INBOX)) {
  files = readdirSync(INBOX, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.gpx$/i.test(d.name))
    .map((d) => d.name)
    .sort();
}
for (const name of files) {
  const stem = name.replace(/\.gpx$/i, '');
  const id = ids.find((i) => stem === i || new RegExp(`^${i}-\\d+$`).test(stem));
  if (!id) {
    const why = /^annapurna(-\d+)?$/.test(stem) ? 'Annapurna belongs to the home pipeline (Q-100)' : 'no finished trek has this id';
    notes.push(`skipped ${name}: ${why}`);
    continue;
  }
  const entry = found.get(id) ?? { single: undefined, days: new Map() };
  if (stem === id) entry.single = name;
  else entry.days.set(Number(stem.slice(id.length + 1)), name);
  found.set(id, entry);
}

// ------------------------------------------------------------------ per trek

function readTrack(id, entry) {
  if (entry.single && entry.days.size) {
    problems.push(`${id}: both ${entry.single} and day files exist; keep one form. Skipped.`);
    return null;
  }
  const names = entry.single ? [entry.single] : [...entry.days.keys()].sort((a, b) => a - b).map((d) => entry.days.get(d));
  if (!entry.single) {
    const days = [...entry.days.keys()].sort((a, b) => a - b);
    const expected = days.map((_, i) => i + 1);
    if (days.join() !== expected.join()) notes.push(`${id}: day files are ${days.join(', ')} (not 1..${days.length}); joined in that order`);
  }
  const all = [];
  let skipped = 0;
  for (const name of names) {
    const parsed = parseGpx(readFileSync(join(INBOX, name), 'utf8'));
    skipped += parsed.skipped;
    if (parsed.truncated) notes.push(`WARNING ${id}: ${name} has no closing </gpx>; it may be cut short, so the track may be partial`);
    if (parsed.unclosed) notes.push(`WARNING ${id}: ${name} has ${parsed.unclosed} unclosed point tag(s); each was read up to the next point`);
    if (parsed.kind === 'rte') notes.push(`${id}: ${name} has no <trkpt>; read its <rtept> route points instead`);
    if (parsed.points.length === 0) {
      problems.push(`${id}: ${name} has no readable track points. Skipped the trek.`);
      return null;
    }
    const prev = all[all.length - 1];
    if (prev) {
      const gap = haversineM([prev.lon, prev.lat], [parsed.points[0].lon, parsed.points[0].lat]);
      if (gap > DAY_GAP_REPORT_M) notes.push(`${id}: ${name} starts ${fmt(gap)} m from where the previous day ended`);
    }
    all.push(...parsed.points);
  }
  if (skipped) notes.push(`${id}: ${skipped} point(s) without a valid lat/lon ignored`);
  return { names, raw: all };
}

function buildRoute(exp, raw) {
  const deduped = dedupe(raw);
  const { points: clean, dropped } = dropSpikes(deduped, SPIKE_M);
  if (clean.length < 2) {
    problems.push(`${exp.id}: fewer than 2 points after cleaning. Skipped.`);
    return null;
  }
  const hasEle = fillElevation(clean);
  const smooth = hasEle ? medianElevation(clean, MEDIAN_WINDOW) : clean;
  const fullKm = cumulativeKm(smooth);
  const { points: simple, tolM } = simplify(smooth, SIMPLIFY_M, MAX_POINTS);

  // Round first, so stopKm is measured on exactly the line the page draws.
  const pts = simple.map((p) => ({ lon: round(p.lon, 5), lat: round(p.lat, 5), ele: hasEle ? Math.round(p.ele) : undefined }));
  const km = cumulativeKm(pts);

  const stopKm = {};
  const snaps = [];
  const unplaced = [];
  let fromKm = 0;
  for (const wp of exp.waypoints) {
    if (typeof wp.lat !== 'number' || typeof wp.lon !== 'number') {
      unplaced.push(wp.name);
      continue;
    }
    const s = snapToTrack(pts, km, [wp.lon, wp.lat], fromKm);
    stopKm[wp.name] = round(s.km, 2);
    snaps.push({ name: wp.name, km: s.km, offsetM: s.offsetM, backward: s.backward });
    if (!s.backward) fromKm = s.km;
  }

  const top = hasEle ? smooth.reduce((m, p) => (p.ele > m.ele ? p : m), smooth[0]) : undefined;
  return {
    route: {
      source: 'gpx',
      points: pts.map((p) => [p.lon, p.lat]),
      ele: hasEle ? pts.map((p) => p.ele) : [],
      km: km.map((k) => round(k, 2)),
      stopKm,
    },
    report: {
      rawPoints: raw.length,
      repeats: raw.length - deduped.length,
      spikes: dropped,
      kept: pts.length,
      tolM,
      distanceKm: fullKm[fullKm.length - 1],
      gainM: hasEle ? gainM(smooth, GAIN_BAND_M) : undefined,
      topM: top?.ele,
      hasEle,
      snaps,
      unplaced,
    },
  };
}

/** The figure a page draws without a GPX (§2.4), so the report shows every page. */
function fallbackFigure(exp) {
  if (['triund', 'kheerganga', 'yulla-kanda'].includes(exp.id)) return 'locator (Himachal page, from the trailhead)';
  const placed = exp.waypoints.filter((w) => typeof w.lat === 'number' && typeof w.lon === 'number');
  if (placed.length >= 2) return `plan (dashed, ${placed.length} of ${exp.waypoints.length} stops placed)`;
  const heights = exp.waypoints.filter((w) => w.altitudeM !== undefined && w.showAltitude !== false);
  if (heights.length >= 2) return `profile (${heights.length} stops with a height)`;
  return 'none';
}

const routes = {};
const reports = [];
for (const exp of ELIGIBLE) {
  const entry = found.get(exp.id);
  if (!entry) {
    reports.push({ exp, figure: fallbackFigure(exp) });
    continue;
  }
  const track = readTrack(exp.id, entry);
  const built = track && buildRoute(exp, track.raw);
  if (!built) {
    reports.push({ exp, figure: `${fallbackFigure(exp)} (GPX failed, see problems)` });
    continue;
  }
  if (!APPROVED.has(exp.id)) {
    reports.push({
      exp,
      figure: `${fallbackFigure(exp)}; track read, not published: awaiting approval (add '${exp.id}' to approved-tracks.mjs)`,
      files: track.names,
      ...built.report,
    });
    continue;
  }
  routes[exp.id] = built.route;
  reports.push({ exp, figure: 'track (solid, from GPX, approved)', files: track.names, ...built.report });
}

// ------------------------------------------------------------------ write

const HEADER =
  '/* GENERATED by scripts/routes/build-trek-routes.mjs (npm run gen:routes) from media-inbox/gpx/treks/. Do not edit. */';

function chunked(items, perLine, indent) {
  const lines = [];
  for (let i = 0; i < items.length; i += perLine) lines.push(`${indent}${items.slice(i, i + perLine).join(', ')},`);
  return lines.join('\n');
}

function routeTs(id, r) {
  const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const key = /^[A-Za-z_$][\w$]*$/.test(id) ? id : q(id);
  const stops = Object.entries(r.stopKm);
  return [
    `  ${key}: {`,
    `    source: 'gpx',`,
    `    points: [\n${chunked(r.points.map((p) => `[${p[0]}, ${p[1]}]`), 5, '      ')}\n    ],`,
    r.ele.length ? `    ele: [\n${chunked(r.ele, 16, '      ')}\n    ],` : '    ele: [],',
    `    km: [\n${chunked(r.km, 14, '      ')}\n    ],`,
    stops.length ? `    stopKm: {\n${stops.map(([n, k]) => `      ${q(n)}: ${k},`).join('\n')}\n    },` : '    stopKm: {},',
    '  },',
  ].join('\n');
}

const body = Object.entries(routes);
const text = `${HEADER}
import 'server-only';

import type { ExpeditionId } from '@/entities/expedition';

/**
 * One trek's GPS route, simplified for the notebook sketch (NOTEBOOK-DESIGN §3.2). No timestamps, no dates.
 * \`points\`, \`ele\` and \`km\` are parallel arrays in walking order. \`ele\` is empty when the GPX had no elevation.
 * \`stopKm\` maps a waypoint \`name\` (as in the entity) to its distance along \`points\`; unplaced stops are absent.
 * Distance, gain and the track's highest point are not exported: they stay off the page until the owner confirms
 * them (NB-7).
 */
export interface TrekRoute {
  readonly source: 'gpx';
  readonly points: readonly (readonly [lon: number, lat: number])[];
  /** Whole metres, median-filtered; parallel to \`points\`. */
  readonly ele: readonly number[];
  /** Cumulative km along \`points\` (2 decimals), for spacing a profile; parallel to \`points\`. */
  readonly km: readonly number[];
  readonly stopKm: Readonly<Record<string, number>>;
}

/** Server components only (the import above fails in a client chunk). A trek without a GPX has no entry. */
export const TREK_ROUTES: Partial<Record<ExpeditionId, TrekRoute>> = ${body.length ? `{\n${body.map(([id, r]) => routeTs(id, r)).join('\n')}\n}` : '{}'};
`;

// --json=<file>: the same routes as JSON, for scripts/routes/selftest.mjs.
if (typeof args.json === 'string') writeFileSync(resolve(ROOT, args.json), JSON.stringify(routes));

let wrote = 'unchanged';
if (DRY) wrote = 'dry run, not written';
else {
  const before = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (before !== text) {
    writeFileSync(OUT, text);
    wrote = 'written';
  }
}

// ------------------------------------------------------------------ report

console.log(`gen:routes  inbox ${rel(INBOX)}${existsSync(INBOX) ? '' : ' (missing: no GPX yet)'}, ${files.length} .gpx file(s)`);
for (const r of reports) {
  const hp = r.exp.highPoint;
  console.log(`\n  ${r.exp.id}: ${r.figure}`);
  if (!r.kept) {
    const unplaced = r.exp.waypoints.filter((w) => typeof w.lat !== 'number').map((w) => w.name);
    if (unplaced.length && !r.figure.startsWith('locator')) console.log(`    unplaced stops (listed, not drawn): ${unplaced.join(', ')}`);
    continue;
  }
  console.log(`    files ${r.files.join(' + ')}`);
  console.log(`    points ${fmt(r.rawPoints)} read, ${r.repeats} repeats, ${r.spikes} spikes, ${r.kept} kept (tolerance ${r.tolM.toFixed(1)} m)`);
  console.log(`    REPORT ONLY (NB-7, not on the page): distance ${r.distanceKm.toFixed(1)} km${r.hasEle ? `, gain ${fmt(r.gainM)} m, highest ${fmt(r.topM)} m` : ', no elevation in the GPX'}`);
  if (r.hasEle && hp.altitudeM) {
    const diff = r.topM - hp.altitudeM;
    console.log(`    high point: entity ${hp.approx ? '~' : ''}${fmt(hp.altitudeM)} m ${hp.name} vs track ${fmt(r.topM)} m (${diff >= 0 ? '+' : ''}${fmt(diff)} m)`);
  }
  for (const s of r.snaps) {
    const flag = [s.offsetM > SNAP_REPORT_M ? 'FAR from the line' : '', s.backward ? 'out of walking order' : ''].filter(Boolean).join(', ');
    console.log(`    stop ${s.name}: km ${s.km.toFixed(2)}, ${fmt(s.offsetM)} m off the line${flag ? `  <- ${flag}` : ''}`);
  }
  if (r.unplaced.length) console.log(`    unplaced stops (owner question, never placed): ${r.unplaced.join(', ')}`);
}
for (const n of notes) console.log(`\n  note: ${n}`);
for (const p of problems) console.log(`\n  PROBLEM: ${p}`);
console.log(`\n  ${rel(OUT)}: ${Object.keys(routes).length} route(s), ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB, ${wrote}`);
if (problems.length) process.exitCode = 1;
