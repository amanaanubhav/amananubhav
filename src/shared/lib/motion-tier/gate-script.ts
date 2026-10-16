/**
 * Inline pre-paint script for the RootLayout `<head>` (§C.4). It sets `html[data-motion]` (OS setting
 * or the footer "Reduce motion" switch) and `html[data-lite]` (Save-Data, < 4 GB memory, weak touch
 * device) before first paint, so the static/staged layout switch never shifts after hydration.
 * Same statements as the spec, joined on one line; the storage key matches MOTION_PREF_KEY.
 */
export const MOTION_GATE_SCRIPT =
  "(function(){try{var d=document.documentElement,n=navigator,c=n.connection||{};" +
  "var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;" +
  "var u=null;try{u=localStorage.getItem('aa:reduce-motion')}catch(e){}" +
  "d.dataset.motion=(r||u==='1')?'off':'on';" +
  "var coarse=window.matchMedia('(pointer: coarse)').matches;" +
  "var lite=c.saveData||(n.deviceMemory||8)<4||(coarse&&(n.hardwareConcurrency||8)<=4);" +
  "d.dataset.lite=lite?'1':'0';}catch(e){}})();";
