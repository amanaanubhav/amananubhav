// node scripts/preloader/owner-preview.mjs <preview.html> <out.html>
// Turns the build's test preview (build-climb.mjs --preview) into a self-contained page for review: the fonts
// inlined as data URIs, and a bar with a progress scrubber (0-100 %), Replay and Night / Day. Never published.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error('usage: owner-preview.mjs <preview.html> <out.html>');
let html = readFileSync(src, 'utf8');

// url(<relative font path>.woff2) -> url(data:font/woff2;base64,...)
html = html.replace(/url\(([^)]+?\.woff2)\)/g, (_m, rel) => {
  const data = readFileSync(resolve(dirname(src), rel)).toString('base64');
  return `url(data:font/woff2;base64,${data})`;
});
if (/url\((?!data:)[^)]*\.woff2\)/.test(html)) throw new Error('a font was not inlined');

const bar = `<div id="pv" role="group" aria-label="Preview controls">
<label>Progress <input id="pv-p" type="range" min="0" max="100" step="0.5" value="0"><output id="pv-o">live</output></label>
<button type="button" id="pv-r">Replay</button>
<button type="button" id="pv-t" aria-pressed="false">Day</button></div>
<style>
#pv{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:200;display:flex;gap:12px;align-items:center;
  flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 32px);box-sizing:border-box;padding:8px 14px;
  border-radius:999px;font:500 13px/1.2 Manrope,system-ui,sans-serif;color:#DEDEE2;background:rgba(18,19,22,.82);
  border:1px solid rgba(222,222,226,.2)}
#pv label{display:flex;gap:8px;align-items:center}#pv input{width:min(42vw,320px)}#pv output{min-width:3.6em}
#pv button{font:inherit;color:inherit;background:transparent;border:1px solid rgba(222,222,226,.35);border-radius:999px;
  padding:6px 12px;cursor:pointer}
</style>
<script>(function(){var q=new URLSearchParams(location.search),h=document.documentElement,p=document.getElementById('pv-p'),
o=document.getElementById('pv-o'),t=document.getElementById('pv-t');
function th(){var d=h.dataset.theme==='day';t.textContent=d?'Night':'Day';t.setAttribute('aria-pressed',String(d))}th();
if(q.get('p')!==null){p.value=q.get('p');o.textContent=p.value+' %'}
p.addEventListener('input',function(){if(window.__aaBoot&&__aaBoot.setP){__aaBoot.setP(+p.value/100);o.textContent=p.value+' %'}});
document.getElementById('pv-r').addEventListener('click',function(){q.delete('p');location.search=q.toString()});
t.addEventListener('click',function(){h.dataset.theme=h.dataset.theme==='day'?'night':'day';q.set('theme',h.dataset.theme);
history.replaceState(null,'','?'+q.toString());th()});
})();</script>`;
// While the climb plays live, a key or wheel on the bar skips it, as on the site; once scrubbed, input is inert.
html = html.replace('</body>', `${bar}</body>`);
writeFileSync(out, html);
console.log(`  owner preview ${out} (${(html.length / 1024).toFixed(0)} KB)`);
