/*
 * The boot gate (docs/redesign/preloader/design.md §4.1), with `__CLIMB_SRC__` for the hashed climb script.
 * Import-free and erasable-only TS: scripts/preloader/build-climb.mjs reads it to measure the inline bytes.
 *
 * It runs during the HTML parse, before first paint. The curtain shows on the first hard load of a browser
 * session only: never on /admin*, in a hidden or prerendered tab, on a Back/Forward load, or when a session
 * cookie says it already ran (a reload, a typed URL, a new tab). Cookies that are off or do not read back fail
 * safe (no curtain). Save-Data and a 2g / slow-2g connection never get it either (design v2.5): the script
 * would cost more than the curtain is worth. When it runs: html[data-boot=run], the cookie, and the climb
 * script at high priority. The CSS failsafe hides a curtain whose script never starts after 3 s; its
 * animationend ends the boot here.
 */
export const BOOT_GATE_TEMPLATE =
  "(function(){try{var d=document,h=d.documentElement,n=performance.getEntriesByType('navigation')[0]," +
  "c=/(^|; )aa_boot=1/,x=navigator.connection;if(/^\\/admin/.test(location.pathname)||d.visibilityState!=='visible'" +
  "||d.prerendering||(n&&n.type==='back_forward')||(x&&(x.saveData||/2g/.test(x.effectiveType)))" +
  '||!navigator.cookieEnabled||c.test(d.cookie))return;' +
  "d.cookie='aa_boot=1;path=/;SameSite=Lax';if(!c.test(d.cookie))return;h.setAttribute('data-boot','run');" +
  "addEventListener('animationend',function(e){if(e.animationName==='boot-failsafe'" +
  "&&!h.hasAttribute('data-boot-live')){h.setAttribute('data-boot','done');" +
  "dispatchEvent(new CustomEvent('aa:boot',{detail:{phase:'done'}}))}});" +
  "var s=d.createElement('script');s.src='__CLIMB_SRC__';s.async=true;s.fetchPriority='high';" +
  "d.head.appendChild(s)}catch(e){}})();";
