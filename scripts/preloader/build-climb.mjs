// npm run gen:preloader
// Builds the preloader's climb (docs/redesign/preloader/design.md §5, §6, v2):
//   public/boot/climb.<hash>.js                    the scene markup, the motion data and the minified runtime
//   src/widgets/preloader/config/climb.generated.ts CLIMB_SRC, the inline skeleton, the stops and the sizes
// and prints the byte budgets (V6), failing over budget. `--preview <file>` also writes a standalone page with test
// hooks (?p=0..100, &theme=day, &motion=off, &lite=1, &ti=<ms>, &ready=<ms>|never) for render and timing checks;
// it is never published.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

import { ROOT, importSource } from '../brand/shared.mjs';
import { cv, motion } from './motion.mjs';
import { buildScene } from './scene.mjs';

const require = createRequire(import.meta.url);
const terser = require('next/dist/compiled/terser');

const BOOT_DIR = join(ROOT, 'public', 'boot');
const CONFIG_PATH = join(ROOT, 'src', 'widgets', 'preloader', 'config', 'climb.generated.ts');
const RUNTIME_PATH = join(ROOT, 'src', 'widgets', 'preloader', 'lib', 'climb-runtime.js');
const CSS_PATHS = ['boot.css', 'scene.css'].map((f) => join(ROOT, 'src', 'widgets', 'preloader', 'ui', f));
const KB = 1024;
// V6 (design v2.1): the scene, its motion data, the runtime, the inline skeleton + gate, and both curtain stylesheets.
const BUDGET = { scene: 9.5 * KB, motion: 0.6 * KB, runtime: 3.2 * KB, inline: 1.2 * KB, css: 2.8 * KB };

/* ---------------------------------------------------------------- inputs from src */
const G = await importSource('src/shared/ui/ridge-mark/geometry.ts');
const { ANNAPURNA_ROUTE } = await importSource('src/entities/expedition/model/expeditions.ts');
const { BOOT_GATE_TEMPLATE } = await importSource('src/widgets/preloader/lib/gate-template.ts');

// RIDGE_PATH is 'M1.5 14.2 6.5 10.6l3 1.6 ...': the second pair is absolute (implicit lineto), the rest relative.
function parseRidge(d) {
  const [abs, rel] = d.slice(1).split('l');
  const a = abs.trim().split(/[\s,]+/).map(Number);
  const r = rel.match(/-?\d*\.?\d+/g).map(Number);
  const pts = [];
  for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]]);
  for (let i = 0; i < r.length; i += 2) {
    const [x, y] = pts.at(-1);
    pts.push([+(x + r[i]).toFixed(2), +(y + r[i + 1]).toFixed(2)]);
  }
  return pts;
}
const RIDGE = parseRidge(G.RIDGE_PATH);
if (RIDGE.length !== 11 || RIDGE[5][0] !== G.RIDGE_SUMMIT.x || RIDGE[5][1] !== G.RIDGE_SUMMIT.y) {
  throw new Error(`RIDGE_PATH parse: expected 11 points with the summit at index 5, got ${JSON.stringify(RIDGE)}`);
}

/**
 * The caption's stops (contract C.6): his main-line waypoints by altitude from Besisahar, each the highest point so
 * far, with the day he passed it. Khudi and Bhulbhule would each show for under 100 ms, and Syange (lower than
 * Bahundanda) is the scene's waterfall. Any change in the route data fails the build instead of silently
 * re-captioning the climb.
 */
const STOP_NAMES = [
  'Besisahar', 'Ngadi', 'Bahundanda', 'Tal', 'Dharapani', 'Danagyu', 'Timang', 'Dhikur Pokhari', 'Pisang', 'Manang',
  'Shri Kharka', 'Churi Ledar', 'Thorong Phedi', 'Thorong High Camp', 'Thorong La',
];
const SHORT = { 'Thorong High Camp': 'High Camp' };
const EXPECT = [
  [760, 1, 'Besisahar'], [930, 1, 'Ngadi'], [1310, 2, 'Bahundanda'], [1700, 3, 'Tal'], [1860, 3, 'Dharapani'],
  [2300, 3, 'Danagyu'], [2750, 3, 'Timang'], [3060, 4, 'Dhikur Pokhari'], [3200, 5, 'Pisang'], [3540, 9, 'Manang'],
  [4060, 9, 'Shri Kharka'], [4200, 12, 'Churi Ledar'], [4450, 13, 'Thorong Phedi'], [4880, 13, 'High Camp'],
  [5416, 14, 'Thorong La'],
];
function waypoint(name) {
  const w = ANNAPURNA_ROUTE.find((p) => p.name === name);
  if (!w) throw new Error(`stop ${name} is not on ANNAPURNA_ROUTE`);
  return w;
}
const STOPS = STOP_NAMES.map((name) => {
  const w = waypoint(name);
  return [w.altitudeM, w.day, SHORT[name] ?? name];
});
if (JSON.stringify(STOPS) !== JSON.stringify(EXPECT)) {
  throw new Error(`the stops changed:\n  got    ${JSON.stringify(STOPS)}\n  design ${JSON.stringify(EXPECT)}`);
}

/* ---------------------------------------------------------------- the motion data (contract C.4) */
// The readout starts at Besisahar's altitude as the 3D map labels it, so the two always agree, and ends on the pass.
const ROUTE = {
  start: waypoint('Besisahar').altitudeM,
  highCamp: waypoint('Thorong High Camp').altitudeM,
  pass: waypoint('Thorong La').altitudeM,
};
const { data } = motion(ROUTE);
checkMotion(data);
// Injected as a JS literal, not parsed as JSON: unquoted keys, no leading zeros, 4 decimals (0.1 px on the strip).
const MOTION = JSON.stringify({ ...data, stops: STOPS }, (_k, v) => (typeof v === 'number' ? +v.toFixed(4) : v))
  .replace(/"([a-z]\w*)":/gi, '$1:')
  .replace(/([^\d.])0\./g, '$1.');

/** The invariants the runtime relies on (contract C.4); any break fails the build. */
function checkMotion({ alt, hold, layers, fades }) {
  const fail = (msg) => {
    throw new Error(`motion data: ${msg}`);
  };
  if (!Array.isArray(layers) || !Array.isArray(fades)) fail('layers and fades must be arrays');
  if (ROUTE.pass !== 5416) fail(`Thorong La is ${ROUTE.pass} m on ANNAPURNA_ROUTE`);
  if (alt.length !== 51 || alt[0] !== ROUTE.start || alt[42] !== ROUTE.highCamp || alt[50] !== ROUTE.pass) {
    fail(`alt[0] ${alt[0]} (want ${ROUTE.start}), alt[42] ${alt[42]} (want ${ROUTE.highCamp}), alt[50] ${alt[50]}`);
  }
  if (alt.some((a, i) => !Number.isFinite(a) || (i > 0 && a < alt[i - 1]))) fail(`alt decreases: ${alt}`);
  if (hold * 50 !== 42) fail(`hold ${hold} is not 0.84 (High Camp, alt[42])`);
  const curves = [
    ...layers.flatMap((l) => [['ty', l.s, l.ty], ...(l.sc ? [['sc', l.s, l.sc]] : [])]),
    ...fades.map((f) => ['o', f.s, f.o]),
  ];
  for (const [key, sel, c] of curves) {
    for (let i = 0; i <= 200; i++) {
      if (!Number.isFinite(cv(c, i / 200))) fail(`${sel} ${key} is not finite at p ${i / 200}`);
    }
  }
  for (const l of layers) {
    if (!(l.drop > 0 && l.drop < 1)) fail(`${l.s} drop ${l.drop} is not in (0, 1)`);
    if (!(l.k > 0) && !(l.sx > 0 && l.a?.length === 2)) fail(`${l.s} needs k, or sx and a[2]`);
  }
}

/* ---------------------------------------------------------------- the scene and the runtime */
const scene = buildScene({ ridge: RIDGE, trekker: G.TREKKER, route: ROUTE });
const runtimeSrc = readFileSync(RUNTIME_PATH, 'utf8');
/** The runtime with the scene and the motion data filled in; `test` adds the preview's hooks (contract C.8). */
function runtime(test, markup = scene.markup, motionJson = MOTION) {
  let src = runtimeSrc
    .replace("/*@scene*/ ''", () => JSON.stringify(markup))
    .replace('/*@motion*/ {}', () => motionJson);
  if (test) {
    src = src
      .replace('/*@ti*/', () => 'if(window.__aaTi!=null){ti=+window.__aaTi;E=t1+END-ti}')
      .replace(
        '/*@test*/',
        () =>
          'api.setP=function(q){run++;cancel(A);cancel(X);cancel(RF);A=[];X=[];RF=[];cancelAnimationFrame(raf);' +
          'phase="done";unlisten();root.hidden=false;scn.style.opacity="";measure();setP(q)};' + // done: inert
          // the planned exit and end, from the root fade (its start, and its delay + duration)
          'api.st=function(){var f=RF.filter(function(a){return a.effect.target===root})[0];' +
          'return{phase:phase,mode:mode,p:cur?P(now()):1,ti:ti,exitAt:f?f.startTime:0,' +
          'end:f?f.startTime+f.effect.getComputedTiming().endTime:0}};',
      );
  }
  if (src.includes('/*@scene*/') || src.includes('/*@motion*/')) throw new Error('runtime placeholders not replaced');
  return src;
}
async function minify(src) {
  const out = await terser.minify(src, { ecma: 5, compress: { passes: 2 }, mangle: true, format: { comments: false } });
  return out.code;
}
const climbJs = await minify(runtime(false));
const runtimeOnly = await minify(runtime(false, '', '{}'));

// A selector the runtime animates but the markup lacks is skipped at run time: warn, never fail (contract C.4).
for (const { s: sel } of [...data.layers, ...data.fades]) {
  const cls = sel.replace(/^\./, '');
  if (!/^sky-/.test(cls) && !new RegExp(`class="[^"]*\\b${cls}\\b`).test(scene.markup)) {
    console.warn(`  warn ${sel} is not in the scene markup; the runtime skips it`);
  }
}

/* ---------------------------------------------------------------- the inline skeleton (every HTML response) */
const T = G.TREKKER_SMALL;
const mark =
  `<svg viewBox="${G.MARK_VIEWBOX}" fill="none">` +
  `<path d="${G.RIDGE_PATH}" transform="translate(0 ${G.RIDGE_OFFSET_Y})"` +
  ` stroke="currentColor" stroke-width="${G.ridgeStroke(20)}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<g transform="${G.TREKKER_TRANSFORM}" fill="var(--glow)">` +
  `<circle cx="${T.head.cx}" cy="${T.head.cy}" r="${T.head.r}"/>` +
  `<path d="${T.body}"/></g></svg>`;
const [firstAlt, firstDay, firstName] = STOPS[0];
const skeleton =
  '<button type="button" class="skip">Skip</button><p class="vh" role="status">Loading</p>' +
  '<div class="sky sky-lo"></div><div class="sky sky-sub"></div><div class="sky sky-hi"></div>' +
  '<div class="scn" aria-hidden="true"></div><div class="hud" aria-hidden="true">' +
  `<div class="top"><span class="who">${mark}Aman Anubhav</span><span>Annapurna Circuit, 2026</span></div>` +
  `<div class="alt"><svg class="alt-n"><text x="0" y="100%"><tspan class="n">${firstAlt.toLocaleString('en')}</tspan>` +
  '<tspan class="u" dx=".16em">m</tspan></text></svg><svg class="alt-c"><text x="0" y="20">' +
  `<tspan class="d">Day ${firstDay}, </tspan><tspan class="w">${firstName}</tspan></text></svg></div></div>`;

/* ---------------------------------------------------------------- write */
const hash = createHash('sha256').update(climbJs).digest('hex').slice(0, 10);
const src = `/boot/climb.${hash}.js`;
mkdirSync(BOOT_DIR, { recursive: true });
for (const f of readdirSync(BOOT_DIR)) {
  if (/^climb\.[0-9a-f]+\.js$/.test(f) && f !== `climb.${hash}.js`) unlinkSync(join(BOOT_DIR, f));
}
writeFileSync(join(BOOT_DIR, `climb.${hash}.js`), climbJs);

const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;
const gate = BOOT_GATE_TEMPLATE.replace('__CLIMB_SRC__', src);
const cssFiles = CSS_PATHS.filter((f) => existsSync(f));
if (cssFiles.length < CSS_PATHS.length) console.warn('  warn scene.css is missing; measuring boot.css alone');
const cssSrc = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
const cssMin = cssSrc
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .replace(/([^\d.])0\./g, '$1.');
const sizes = {
  sceneGz: gz(scene.markup),
  motionGz: gz(MOTION),
  runtimeGz: gz(runtimeOnly),
  climbGz: gz(climbJs),
  inlineGz: gz(skeleton + gate),
  cssGz: gz(cssMin),
};
mkdirSync(dirname(CONFIG_PATH), { recursive: true });
writeFileSync(
  CONFIG_PATH,
  `// Generated by scripts/preloader/build-climb.mjs (npm run gen:preloader). Do not edit.

/** The climb script (scene, motion data and runtime), requested by the pre-paint gate only when the curtain runs. */
export const CLIMB_SRC = '${src}';

/** The curtain's inline skeleton (inside #boot): Skip, the status, the sky, the layer host and the HUD at Besisahar. */
export const BOOT_SKELETON_HTML =
  '${skeleton.replace(/'/g, "\\'")}';

/** The caption's stops: [altitude m, day, waypoint], from ANNAPURNA_ROUTE (design v2, contract C.6). */
export const CLIMB_STOPS: readonly (readonly [number, number, string])[] = ${JSON.stringify(STOPS)};

/** Gzip sizes in bytes at generation time (design V6). */
export const CLIMB_SIZES = ${JSON.stringify(sizes)} as const;
`,
);

if (process.argv.includes('--preview')) {
  const out = process.argv[process.argv.indexOf('--preview') + 1];
  const fonts = relative(dirname(out), join(ROOT, 'src', '_app', 'layout', 'fonts')).split('\\').join('/');
  writeFileSync(out, previewPage(await minify(runtime(true)), fonts));
  console.log(`  preview ${out}`);
}

const rows = [
  ['scene', sizes.sceneGz, BUDGET.scene],
  ['motion data', sizes.motionGz, BUDGET.motion],
  ['runtime (minified)', sizes.runtimeGz, BUDGET.runtime],
  ['inline skeleton + gate', sizes.inlineGz, BUDGET.inline],
  ['curtain CSS (boot + scene)', sizes.cssGz, BUDGET.css],
  ['climb script total', sizes.climbGz, undefined],
];
let ok = true;
console.log(`  public/boot/climb.${hash}.js  (${scene.uses} symbols, zones ${JSON.stringify(scene.zones)})`);
for (const [name, bytes, budget] of rows) {
  const pass = budget === undefined || bytes <= budget;
  ok &&= pass;
  const limit = budget ? ` (budget ${(budget / KB).toFixed(1)})` : '';
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name.padEnd(27)} ${(bytes / KB).toFixed(2)} KB gz${limit}`);
}
if (!ok) process.exit(1);

/**
 * A standalone page for render and timing checks: the real skeleton, CSS and climb, a mock hero, and the hooks:
 * ?p=0..100 (a static frame), &theme, &motion=off, &lite=1, &ti=<ms> (pretend the script started then, which picks
 * the mode) and &ready=<ms>|never (when the app and stage keys arrive; at once by default).
 */
function previewPage(js, fonts) {
  return `<!doctype html>
<html lang="en" data-theme="night" data-motion="on" data-lite="0" data-boot="run">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Climb preview</title>
<style>
@font-face{font-family:Archivo;src:url(${fonts}/archivo-latin-normal.woff2) format('woff2');font-weight:100 900;
  font-stretch:62% 125%}
@font-face{font-family:Literata;src:url(${fonts}/literata-latin-italic.woff2) format('woff2');font-style:italic;
  font-weight:200 900}
@font-face{font-family:Manrope;src:url(${fonts}/manrope-latin-normal.woff2) format('woff2');font-weight:200 800}
@font-face{font-family:'IBM Plex Mono';src:url(${fonts}/ibm-plex-mono-latin-normal-400.woff2) format('woff2')}
:root{--font-display:Archivo;--font-text:Literata;--font-ui:Manrope;--font-data:'IBM Plex Mono'}
html,body{margin:0;background:#121316;color:#DEDEE2}
html[data-theme=day],html[data-theme=day] body{background:#EEF0EA;color:#1B1E1C}
h1{font:750 72px/1 Archivo;margin:30svh 56px 0}
${cssSrc}</style>
<script>(function(){var q=new URLSearchParams(location.search),h=document.documentElement;
if(q.get('theme'))h.dataset.theme=q.get('theme');if(q.get('motion'))h.dataset.motion=q.get('motion');
if(q.get('lite'))h.dataset.lite=q.get('lite');if(q.get('ti'))window.__aaTi=+q.get('ti');
var r=q.get('ready');function k(){['app','stage'].forEach(function(x){window.__aaBoot?__aaBoot.ready(x):
(window.__aaBootQ=window.__aaBootQ||[]).push(x)})}if(r===null)k();else if(r!=='never')setTimeout(k,+r);
addEventListener('load',function(){var p=q.get('p');if(p!==null)__aaBoot.setP(+p/100)})})();</script>
</head><body><div id="boot" class="boot">${skeleton}</div><h1>Everything I need, I carry.</h1>
<script>${js}</script></body></html>`;
}
