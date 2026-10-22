// node scripts/preloader/frame.mjs <out.html>
// A static frame tool for the scene (design v2.C, C.8): writes a standalone page from buildScene() + motion() that
// applies the C.5 transform at ?p=0..100 (&theme=night|day), so the scene can be rendered without the runtime.
// Never published.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, importSource } from '../brand/shared.mjs';
import { motion } from './motion.mjs';
import { buildScene } from './scene.mjs';

const G = await importSource('src/shared/ui/ridge-mark/geometry.ts');
const { ANNAPURNA_ROUTE } = await importSource('src/entities/expedition/model/expeditions.ts');
const alt = (name) => ANNAPURNA_ROUTE.find((w) => w.name === name).altitudeM;
const route = { start: ANNAPURNA_ROUTE[0].altitudeM, highCamp: alt('Thorong High Camp'), pass: alt('Thorong La') };

function parseRidge(d) {
  const [abs, rel] = d.slice(1).split('l');
  const a = abs.trim().split(/[\s,]+/).map(Number), r = rel.match(/-?\d*\.?\d+/g).map(Number), pts = [];
  for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]]);
  for (let i = 0; i < r.length; i += 2) {
    const [x, y] = pts.at(-1);
    pts.push([+(x + r[i]).toFixed(2), +(y + r[i + 1]).toFixed(2)]);
  }
  return pts;
}

const scene = buildScene({ ridge: parseRidge(G.RIDGE_PATH), trekker: G.TREKKER, route });
const { data } = motion(route);
const ui = join(ROOT, 'src', 'widgets', 'preloader', 'ui');
const css = readFileSync(join(ui, 'boot.css'), 'utf8') + readFileSync(join(ui, 'scene.css'), 'utf8');
const out = process.argv[2];
if (!out) throw new Error('usage: node scripts/preloader/frame.mjs <out.html>');

const apply = `(function(){var M=${JSON.stringify(data)},q=new URLSearchParams(location.search),
h=document.documentElement;
h.dataset.theme=q.get('theme')||'night';var p=+(q.get('p')||0)/100,b=document.getElementById('boot');
function s5(t){return t<=0?0:t>=1?1:t*t*t*(t*(6*t-15)+10)}
function cv(c,p){var v=c[0];for(var i=1;i<c.length;i++)v+=c[i][2]*s5((p-c[i][0])/(c[i][1]-c[i][0]));return v}
var W=b.clientWidth,H=b.clientHeight;M.layers.forEach(function(L){var e=b.querySelector(L.s);if(!e)return;
var w=e.offsetWidth,tr,x0;if(L.sx!=null){tr=Math.max(0,Math.min(L.sx*w-(W>H?L.a[0]:L.a[1])*W,w-W));x0=0}
else{tr=L.k*W;x0=Math.min(0,-(w-W-tr)/2)}
e.style.transform='translate3d('+(x0-p*tr)+'px,'+cv(L.ty,p)*H+'px,0)'+(L.sc?' scale('+cv(L.sc,p)+')':'')});
M.fades.forEach(function(F){b.querySelectorAll(F.s).forEach(function(e){
e.style.opacity=Math.max(0,Math.min(1,cv(F.o,p)))})});
var i=Math.min(49,Math.floor(p*50)),t=p*50-i,a=M.alt[i]+(M.alt[i+1]-M.alt[i])*t;
document.getElementById('n').textContent=Math.round(a).toLocaleString('en-US')+' m · p '+(p*100).toFixed(0)})()`;

writeFileSync(
  out,
  `<!doctype html><html lang="en" data-theme="night" data-boot="run" data-boot-live="1"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Scene frame</title>
<style>${css}
.boot .ly{transition:none}#n{position:absolute;left:24px;top:20px;font:600 22px system-ui;color:var(--b-ink);z-index:3}
</style></head><body style="margin:0"><div id="boot" class="boot"><div class="sky sky-lo"></div>
<div class="sky sky-sub"></div>
<div class="sky sky-hi"></div><div class="scn">${scene.markup}</div><div id="n"></div></div>
<script>${apply}</script></body></html>`,
);
console.log(`frame ${out}  zones ${JSON.stringify(scene.zones)}`);
