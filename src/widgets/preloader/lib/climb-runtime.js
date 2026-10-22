/*
 * The climb's runtime (docs/redesign/preloader/design.md v2.4, v2.5). Plain ES5, not a Next chunk: the build
 * script (scripts/preloader/build-climb.mjs) fills in the scene markup and the motion data (M, from
 * scripts/preloader/motion.mjs: the altitude table, every layer's path as a function of progress p, the stops),
 * minifies it and writes public/boot/climb.<hash>.js, which the pre-paint gate appends only when the curtain runs.
 *
 * One clock drives everything: a segment {t0, d, f} maps time to p, and every layer and fade element plays WAAPI
 * keyframes sampled from it in time (every 25 ms, linear, explicit startTime), so the layers never drift apart and
 * a retime joins the old segment in value and velocity. Transform and opacity only (compositor); the one per-frame
 * main-thread write is the readout text.
 *
 * window.__aaBoot = { ready(key), skip() }; ready() calls made before this script arrived are queued on
 * window.__aaBootQ (shared/lib/boot) and replayed here. html[data-boot] goes run -> exit -> done, and window
 * receives `aa:boot` with detail.phase climb | exit | done.
 */
(function () {
  var d = document;
  // An async script can run before the parser reaches <body> (a cached copy): wait for the curtain's markup.
  if (!d.getElementById('boot') && d.readyState === 'loading') d.addEventListener('DOMContentLoaded', climb);
  else climb();

  function climb() {
    var H = d.documentElement, root = d.getElementById('boot');
    if (!root) return;
    var M = /*@motion*/ {};
    // v2.5: END the curtain is gone (ms after navigation start), TJ the natural journey, HOLD the summit beat, EXIT,
    // J_MIN the shortest journey, LATE / GONE the script start after which there is no climb / no scene.
    var END = 5000, TJ = 2700, HOLD = 240, EXIT = 620, J_MIN = 1000, LATE = 3400, GONE = 4600, DEC = 0.7;
    // The journey's velocity: smoothstep ramps over the first 20 % and the last 38 % of its time, cruise between.
    var R1 = 0.2, R2 = 0.38, V = 1 / (1 - R1 / 2 - R2 / 2);
    var t1 = performance.now(), ti = t1, E = END;
    /*@ti*/
    function emit(ph) {
      if (ph !== 'climb') H.setAttribute('data-boot', ph);
      try {
        dispatchEvent(new CustomEvent('aa:boot', { detail: { phase: ph } }));
      } catch (_e) {}
    }
    // The CSS failsafe already hid the curtain (this script arrived after 3 s), or the gate never ran it: finish
    // without ever showing, so the curtain cannot come back over a page the visitor is already reading.
    if (H.getAttribute('data-boot') !== 'run' || getComputedStyle(root).visibility === 'hidden' ||
      d.visibilityState === 'hidden') {
      root.hidden = true;
      if (H.getAttribute('data-boot') === 'run') {
        emit('exit');
        emit('done');
      }
      return;
    }
    H.setAttribute('data-boot-live', '');
    var c = navigator.connection, reduced = H.getAttribute('data-motion') === 'off';
    var mode = ti > GONE ? 'gone' : reduced ? 'reduced' : ti > LATE ? 'late' :
      ti + TJ + HOLD + EXIT <= END && !(c && c.effectiveType === '3g') ? 'fast' : 'slow';
    var STEP = mode === 'slow' || H.getAttribute('data-lite') === '1' ? 33 : 25;
    var scn = root.querySelector('.scn'), L = [], O = [], S = M.stops, i, l;
    if (mode !== 'gone') scn.innerHTML = /*@scene*/ '';
    for (i = 0; i < M.layers.length; i++) {
      l = M.layers[i];
      l.el = root.querySelector(l.s);
      if (l.el) L.push(l);
    }
    for (i = 0; i < M.fades.length; i++) {
      l = M.fades[i];
      l.els = [].slice.call(root.querySelectorAll(l.s));
      if (l.els.length) O.push(l);
    }
    var num = root.querySelector('.alt-n .n'), day = root.querySelector('.alt-c .d');
    var way = root.querySelector('.alt-c .w'), skip = root.querySelector('.skip'), hud = root.querySelector('.hud');
    var nf = new Intl.NumberFormat('en'), tl = d.timeline, run = 0, phase = 'climb', ready = {}, need = { app: 1, fonts: 1 };
    // xa / xe: the planned exit and end, read only by the preview's st() hook
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var W, Hh, cur, ex, A = [], X = [], RF = [], raf = 0, xa = 0, xe = 0;
    var shown = M.alt[0], la = shown, lt = 0, cj = 0, ct = 0;
    if (location.pathname === '/') need.stage = 1;

    // A path curve [base, [a, b, delta], ...]: base + sum(delta * smootherstep((p - a) / (b - a))).
    function cv(cu, p) {
      for (var v = cu[0], k = 1; k < cu.length; k++) {
        var t = (p - cu[k][0]) / (cu[k][1] - cu[k][0]);
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        v += cu[k][2] * t * t * t * (t * (6 * t - 15) + 10);
      }
      return v;
    }
    function altAt(p) {
      var x = Math.min(50, Math.max(0, p * 50)), k = Math.min(49, x | 0);
      return M.alt[k] + (M.alt[k + 1] - M.alt[k]) * (x - k);
    }
    // The increasing f's argument in [0, 1] where it reaches y.
    function inv(f, y) {
      for (var lo = 0, hi = 1, k = 0; k < 20; k++) {
        var m = (lo + hi) / 2;
        if (f(m) < y) lo = m;
        else hi = m;
      }
      return lo;
    }
    // The exit's ease-in, cubic-bezier(.55,0,1,.45)
    function bez(x) {
      var t = inv(function (s) {
        return s * (1.65 * (1 - s) * (1 - s) + 3 * (1 - s) * s + s * s);
      }, x);
      return t * t * (1.35 * (1 - t) + t);
    }
    function g(u) {
      return u * u * u * (1 - u / 2);
    }
    // The natural journey, 0 -> 1 over s in [0, 1] (the integral of the trapezoid velocity).
    function J(s) {
      return V * (s < R1 ? R1 * g(s / R1) : s > 1 - R2 ? 1 / V - R2 * g((1 - s) / R2) : s - R1 / 2);
    }
    function P(T) {
      var s = (T - cur.t0) / cur.d;
      return cur.f(s < 0 ? 0 : s > 1 ? 1 : s);
    }
    function vel(T) {
      return (P(T + 0.25) - P(T - 0.25)) * 2;
    }
    function now() {
      return tl.currentTime;
    }

    function measure() {
      W = root.clientWidth || innerWidth; // the curtain's own width (a classic scrollbar stays beside it)
      Hh = root.clientHeight || innerHeight;
      for (var k = 0; k < L.length; k++) {
        var y = L[k], w = y.el.offsetWidth;
        if (y.sx) {
          // The summit lands at a·W, and the strip never runs out on the right.
          y.tr = Math.max(0, Math.min(y.sx * w - y.a[W > Hh ? 0 : 1] * W, w - W));
          y.x0 = 0;
        } else {
          y.tr = y.k * W;
          y.x0 = Math.min(0, -(w - W - y.tr) / 2);
        }
      }
    }
    function tf(y, q, dy) {
      return 'translate3d(' + (y.x0 - q * y.tr).toFixed(1) + 'px,' + ((cv(y.ty, q) + dy) * Hh).toFixed(1) + 'px,0)' +
        (y.sc ? ' scale(' + cv(y.sc, q).toFixed(4) + ')' : '');
    }
    function op(y, q) {
      var v = cv(y.o, q);
      return v < 0 ? 0 : v > 1 ? 1 : +v.toFixed(3);
    }
    function caption(k) {
      cj = k;
      day.textContent = 'Day ' + S[k][1] + ', ';
      way.textContent = S[k][2];
    }
    function stopAt(a) {
      for (var k = 0; k + 1 < S.length && S[k + 1][0] <= a; k++);
      return k;
    }
    function setP(q) {
      var k, e;
      for (k = 0; k < L.length; k++) L[k].el.style.transform = tf(L[k], q, 0);
      for (k = 0; k < O.length; k++) for (e = 0; e < O[k].els.length; e++) O[k].els[e].style.opacity = op(O[k], q);
      shown = Math.round(altAt(q));
      num.textContent = nf.format(shown);
      caption(stopAt(shown));
    }

    function go(el, kf, t0, o) {
      var a = el.animate(kf, o);
      a.startTime = t0;
      return a;
    }
    // One segment on every layer and fade element: keyframes sampled in time, linear between them.
    function play(sg) {
      var n = Math.max(1, Math.ceil(sg.d / STEP)), q = [], out = [], o = { duration: sg.d, fill: 'forwards' }, k, m, e, kf;
      for (k = 0; k <= n; k++) q.push(sg.f(k / n));
      for (m = 0; m < L.length; m++) {
        for (kf = [], k = 0; k <= n; k++) {
          kf.push({ transform: tf(L[m], q[k], sg.D ? L[m].drop * sg.D(L.length - 1 - m, (k / n) * sg.d) : 0) });
        }
        out.push(go(L[m].el, kf, sg.t0, o));
      }
      for (m = 0; m < O.length; m++) {
        for (kf = [], k = 0; k <= n; k++) kf.push({ opacity: op(O[m], q[k]) });
        for (e = 0; e < O[m].els.length; e++) out.push(go(O[m].els[e], kf, sg.t0, o));
      }
      return out;
    }
    function cancel(a) {
      for (var k = 0; k < a.length; k++) a[k].cancel();
    }
    function retime(sg) {
      var o = A;
      cur = sg;
      A = play(sg);
      cancel(o);
    }
    // From the clock's value and velocity now to p1 at rest: a cubic Hermite with m0 <= 2 (monotone, no overshoot).
    function herm(p1, dmax, drest) {
      var T = now(), p0 = P(T), v0 = vel(T), dp = p1 - p0;
      var dd = v0 > 1e-5 ? Math.min(dmax, (2 * dp) / v0) : drest, m = (v0 * dd) / dp;
      retime({ t0: T, d: dd, f: function (s) {
        return p0 + dp * (m * s * (1 - s) * (1 - s) + s * s * (3 - 2 * s));
      } });
      return T + dd;
    }
    function at(t, fn) {
      var r = run;
      setTimeout(function () {
        if (r === run) fn();
      }, Math.max(0, t - performance.now()));
    }
    // The exit, built as soon as it is known (a delayed start plays on time even through a long task). With drops,
    // the land falls away, the front layer first and each farther one dur/15.5 later; without, the curtain fades.
    function plan(t0, dur, drop) {
      xa = t0;
      xe = t0 + dur;
      if (drop) {
        ex = { t0: t0, d: dur, f: function (s) {
          return P(t0 + s * dur);
        }, D: function (j, t) {
          var dl = (j * dur) / 15.5;
          return bez((t - dl) / (dur - dl));
        } };
        X = play(ex);
        RF.push(go(hud, [{ opacity: 1 }, { opacity: 0 }], t0, { duration: 200, fill: 'forwards' }));
      }
      var dl = drop ? dur * 0.194 : 0;
      var fade = go(root, [{ opacity: 1 }, { opacity: 0 }], t0,
        { duration: dur - dl, delay: dl, easing: 'cubic-bezier(.33,0,.2,1)', fill: 'forwards' });
      RF.push(fade);
      fade.finished.then(done, function () {});
      if (t0 <= now() + 1) leave();
      else at(t0, leave);
    }
    function leave() {
      if (phase === 'exit' || phase === 'done') return;
      phase = 'exit';
      unlisten();
      hideSkip();
      emit('exit');
    }
    function done() {
      if (phase === 'done') return;
      leave();
      phase = 'done';
      run++;
      cancel(A);
      cancel(X);
      cancel(RF);
      cancelAnimationFrame(raf);
      // Focus never stays on a hidden element: from Skip it moves to the page's skip link.
      var focusIn = root.contains(d.activeElement);
      root.hidden = true;
      if (focusIn) toLink();
      emit('done');
    }
    function toLink() {
      var link = d.querySelector('.skip-link');
      if (link) link.focus({ preventScroll: true });
    }
    // Skip turns `visibility: hidden` when it goes, which would drop its focus on <body>: hand it to the skip link.
    function hideSkip() {
      if (d.activeElement === skip) toLink();
      skip.classList.remove('on');
    }

    // The readout: one rAF loop on the same clock, monotonic, 10 m steps while it runs fast, each stop held 160 ms.
    function tick() {
      var T = now(), a = altAt(P(T)), r = (a - la) / (T - lt || 16);
      la = a;
      lt = T;
      a = r > 1.2 ? Math.floor(a / 10) * 10 : Math.round(a);
      if (a > shown) num.textContent = nf.format((shown = a));
      var k = stopAt(shown);
      if (k !== cj && (T - ct >= 160 || T >= cur.t0 + cur.d)) {
        ct = T;
        caption(k);
      }
      raf = requestAnimationFrame(tick);
    }

    function allReady() {
      for (var k in need) if (!ready[k]) return false;
      return true;
    }
    // Fast mode, the plan is fixed: J (or the arrive) runs to the summit, the beat, then the exit.
    function fix() {
      phase = 'arrive';
      hideSkip();
      plan(Math.max(now(), cur.t0 + cur.d) + HOLD, EXIT, 1);
    }
    // At p 0.70 and not ready: settle into High Camp (unless the decision ran too late for it), wait for the keys.
    function decide() {
      if (phase !== 'climb') return;
      if (allReady()) return fix();
      var T = now(), se = T;
      if (P(T) < M.hold - 0.02) {
        phase = 'settle';
        se = herm(M.hold, 1000, 1000);
      }
      at(T + 400, function () {
        if (phase === 'settle' || phase === 'climb') skip.classList.add('on');
      });
      at(Math.max(E - EXIT - HOLD - 640, se), function () {
        if (phase === 'settle') arrive();
        else if (phase === 'climb') fix();
      });
    }
    function arrive() {
      herm(1, 900, 640);
      fix();
    }
    function onReady(k) {
      ready[k] = 1;
      if (!allReady()) return;
      if (phase === 'climb' && mode === 'fast') fix();
      else if (phase === 'settle') arrive();
      else if (phase === 'wait' && performance.now() >= t1 + 600) out();
    }
    // Reduced motion: the static arrival frame for 600 ms to 2,000 ms, then a 200 ms fade.
    function out() {
      if (phase !== 'wait') return;
      phase = 'arrive';
      plan(now(), 200, 0);
    }
    // Any input ends it at once: the clock coasts to a stop (360 ms at most) while a short exit runs.
    function doSkip() {
      if (phase === 'exit' || phase === 'done' || phase === 'scrub') return;
      run++;
      cancel(X);
      cancel(RF);
      X = [];
      RF = [];
      var T = now();
      if (cur && A.length) {
        var p0 = P(T), v0 = Math.max(0, vel(T)), dp = Math.min(1 - p0, v0 * 180);
        cur = { t0: T, d: v0 > 1e-5 ? Math.max(1, Math.min(360, (2 * dp) / v0)) : 1, f: function (s) {
          return p0 + dp * s * (2 - s);
        } };
        cancel(A);
        A = [];
        plan(T, 480, 1);
      } else plan(T, 200, 0);
    }

    // Input: any click, key (no modifier), wheel or touch skips; the page under the curtain does not move.
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // the scroll keys (Space, Page*, Arrow*, Home, End), except Space on the Skip button itself
      if (/^( |Spacebar|Page|Arrow|Home$|End$)/.test(e.key) && !(e.target === skip && e.key === ' ')) e.preventDefault();
      doSkip();
    }
    function onScroll(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      doSkip();
    }
    var LO = { capture: true, passive: false };
    function unlisten() {
      removeEventListener('keydown', onKey, true);
      removeEventListener('wheel', onScroll, LO);
      removeEventListener('touchmove', onScroll, LO);
    }
    addEventListener('keydown', onKey, true);
    addEventListener('wheel', onScroll, LO);
    addEventListener('touchmove', onScroll, LO);
    root.addEventListener('click', doSkip);
    // A resize rebuilds the running segments at the same timeline time.
    addEventListener('resize', function () {
      if (phase === 'done' || phase === 'scrub' || !L.length) return;
      measure();
      if (cur) {
        var o = A.concat(X);
        A = play(cur);
        X = ex ? play(ex) : [];
        cancel(o);
      } else setP(1);
    });
    // Restored from bfcache while frozen mid-curtain: end at once.
    addEventListener('pageshow', function (e) {
      if (e.persisted && phase !== 'done') done();
    });

    var api = { ready: onReady, skip: doSkip };
    /*@test*/
    window.__aaBoot = api;
    emit('climb');
    measure();
    var T = now();
    if (mode !== 'gone') go(scn, [{ opacity: 0 }, { opacity: 1 }], T, { duration: 200 });
    if (mode === 'fast' || mode === 'slow') {
      var jd = mode === 'fast' ? TJ : Math.min(TJ, Math.max(J_MIN, E - HOLD - EXIT - T));
      retime({ t0: T, d: jd, f: J });
      tick();
      if (mode === 'slow') fix();
      else at(T + inv(J, DEC) * TJ, decide);
    } else if (mode === 'gone') {
      phase = 'arrive';
      plan(T, 200, 0);
    } else {
      setP(1);
      if (mode === 'late') {
        phase = 'arrive';
        plan(T + 600, 300, 0);
      } else {
        phase = 'wait';
        at(t1 + 600, function () {
          if (allReady()) out();
        });
        at(t1 + Math.min(2000, Math.max(E - t1, 600)), out);
      }
    }
    if (d.fonts && d.fonts.ready) {
      d.fonts.ready.then(function () {
        onReady('fonts');
      });
    } else ready.fonts = 1;
    var q = window.__aaBootQ || [];
    for (i = 0; i < q.length; i++) onReady(q[i]);
    window.__aaBootQ = null;
  }
})();
