/*
 * The climb's runtime (docs/redesign/preloader/design.md v2.4, v2.5). Plain ES5, not a Next chunk: the build
 * script (scripts/preloader/build-climb.mjs) fills in the scene markup and the motion data (M, from
 * scripts/preloader/motion.mjs: the altitude table, every layer's path as a function of progress p, the stops),
 * minifies it and writes public/boot/climb.<hash>.js, which the pre-paint gate appends only when the curtain runs.
 *
 * One clock drives everything: a segment {t0, d, f} maps time to p, and every layer and fade element plays WAAPI
 * keyframes sampled from it in time (every 25 ms, linear, explicit startTime), so the layers never drift apart and
 * a retime joins the old segment in value and velocity. The clock starts in the first animation frame after the
 * scene is in, at p 0, so the first painted frame is the journey's first. Transform and opacity only, and never two
 * animations of one property on one element, so all of it stays on the compositor: the climb moves each .ly, the
 * exit drops its svg children. The one per-frame main-thread write is the readout text; the summit reading is
 * handed to a pre-scheduled clone, so it shows even while the main thread is blocked.
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
    // J_MIN the shortest journey, LATE / GONE the script start after which there is no climb / no scene, DEC the
    // share of J's time at which it reaches p 0.70, where fast mode decides.
    var END = 5000, TJ = 2700, HOLD = 240, EXIT = 620, J_MIN = 1000, LATE = 3400, GONE = 4600, DEC = 0.597;
    // The journey's velocity: smoothstep ramps over the first 20 % and the last 38 % of its time, cruise between.
    var R1 = 0.2, R2 = 0.38, V = 1 / (1 - R1 / 2 - R2 / 2);
    var t1 = performance.now(), ti = t1, E = END;
    /*@ti*/
    function emit(ph) {
      if (ph !== 'climb') H.setAttribute('data-boot', ph);
      dispatchEvent(new CustomEvent('aa:boot', { detail: { phase: ph } }));
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
    var c = navigator.connection;
    // The mode for a start t ms after navigation start: picked when the script runs, and again in the first frame.
    function pick(t) {
      return t > GONE ? 'gone' : t > LATE ? 'late' :
        t + TJ + HOLD + EXIT <= END && !(c && c.effectiveType === '3g') ? 'fast' : 'slow';
    }
    var mode = ti <= GONE && H.getAttribute('data-motion') === 'off' ? 'reduced' : pick(ti);
    var STEP = mode === 'slow' || H.getAttribute('data-lite') === '1' ? 33 : 25;
    var scn = root.querySelector('.scn'), L = [], O = [], S = M.stops, i, l;
    if (mode !== 'gone') scn.innerHTML = /*@scene*/ '';
    for (i = 0; i < M.layers.length; i++) {
      l = M.layers[i];
      l.el = root.querySelector(l.s);
      if (l.el) {
        l.ch = [].slice.call(l.el.children);
        L.push(l);
      }
    }
    for (i = 0; i < M.fades.length; i++) {
      l = M.fades[i];
      l.els = [].slice.call(root.querySelectorAll(l.s));
      if (l.els.length) O.push(l);
    }
    var num = root.querySelector('.alt-n .n'), skip = root.querySelector('.skip'), hud = root.querySelector('.hud');
    var nf = new Intl.NumberFormat('en'), tl = d.timeline, run = 0, phase = 'pre', ready = {};
    var need = { app: 1, fonts: 1 };
    var W, Hh, cur, A = [], X = [], RF = [], raf = 0;
    var p0 = mode === 'fast' || mode === 'slow' ? 0 : 1; // the scene's p until the clock starts
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
      var x = p * 50, k = Math.min(49, x | 0); // p is in [0, 1]
      return M.alt[k] + (M.alt[k + 1] - M.alt[k]) * (x - k);
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
    // A start time for work begun outside a frame, where the timeline's value is stale (0 before the first frame):
    // max(timeline, performance.now()), which is always performance.now() (the timeline holds the last frame's time).
    function clk() {
      return performance.now();
    }

    function measure() {
      W = root.clientWidth; // the curtain's own width (a classic scrollbar stays beside it)
      Hh = root.clientHeight;
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
    function tf(y, q) {
      return 'translate3d(' + (y.x0 - q * y.tr).toFixed(1) + 'px,' + (cv(y.ty, q) * Hh).toFixed(1) + 'px,0)' +
        (y.sc ? ' scale(' + cv(y.sc, q).toFixed(4) + ')' : '');
    }
    function op(y, q) {
      return +cv(y.o, q).toFixed(3); // CSS clamps opacity to [0, 1]
    }
    // Stop k's caption into the first readout in e (the live one, or the summit clone).
    function cap(e, k) {
      e.querySelector('.d').textContent = 'Day ' + S[k][1] + ', ';
      e.querySelector('.w').textContent = S[k][2];
    }
    function stopAt(a) {
      for (var k = 0; k + 1 < S.length && S[k + 1][0] <= a; k++);
      return k;
    }
    function setP(q) {
      var k, e;
      for (k = 0; k < L.length; k++) L[k].el.style.transform = tf(L[k], q);
      for (k = 0; k < O.length; k++) for (e = 0; e < O[k].els.length; e++) O[k].els[e].style.opacity = op(O[k], q);
      shown = Math.round(altAt(q));
      num.textContent = nf.format(shown);
      cap(hud, (cj = stopAt(shown)));
    }

    // An animation from t0 on the timeline; with t0 0 it plays as soon as it can (the compositor picks the start).
    function go(el, kf, t0, o) {
      var a = el.animate(kf, o);
      if (t0) a.startTime = t0;
      return a;
    }

    // One segment on every layer and fade element: keyframes sampled in time, linear between them. Fill both: a
    // segment that starts a little ahead of the timeline already holds its first frame.
    function play(sg) {
      var n = Math.max(1, Math.ceil(sg.d / STEP)), q = [], out = [], o = { duration: sg.d, fill: 'both' }, k, m, e, kf;
      for (k = 0; k <= n; k++) q.push(sg.f(k / n));
      for (m = 0; m < L.length; m++) {
        for (kf = [], k = 0; k <= n; k++) kf.push({ transform: tf(L[m], q[k]) });
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
      return [];
    }
    function retime(sg) {
      var o = A;
      cur = sg;
      A = play(sg);
      cancel(o);
    }
    // From the clock's value and velocity at T (now) to p1 at rest: a cubic Hermite with m0 <= 2 (monotone, no
    // overshoot; m0 = 2 at the full dmax is the skip's coast, p0 + dp s (2 - s)).
    function herm(p1, dmax, drest, T) {
      T = T || now();
      var p0 = P(T), v0 = vel(T), dp = p1 - p0;
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
      }, t - performance.now()); // a negative delay runs at once
    }
    // The drops: each layer's svg children fall away (an ease-in), the front layer first and each farther one
    // dur/15.5 later. On the children, so they never stack on the climb's own transform animation of the .ly.
    function drops(t0, dur) {
      var out = [], m, e, y, dl, px;
      for (m = 0; m < L.length; m++) {
        y = L[m];
        dl = ((L.length - 1 - m) * dur) / 15.5;
        px = (y.drop * Hh).toFixed(1); // inside the far layer's scale (1.07 at rest), a little longer there
        for (e = 0; e < y.ch.length; e++) {
          out.push(go(y.ch[e], [{ transform: 'none' }, { transform: 'translate3d(0,' + px + 'px,0)' }], t0,
            { duration: dur - dl, delay: dl, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' }));
        }
      }
      return out;
    }
    // The exit, built as soon as it is known (a delayed start plays on time even through a long task). With drops,
    // the land falls away while the climb's segment holds or coasts; without, the curtain fades.
    function plan(t0, dur, drop) {
      if (drop) {
        X = drops(t0, dur);
        RF.push(go(hud, [{ opacity: 1 }, { opacity: 0 }], t0, { duration: 200, fill: 'both' }));
      }
      var dl = drop ? dur * 0.194 : 0;
      var fade = go(root, [{ opacity: 1 }, { opacity: 0 }], t0,
        { duration: dur - dl, delay: dl, easing: 'cubic-bezier(.33,0,.2,1)', fill: 'forwards' });
      RF.push(fade);
      fade.finished.then(done, function () {});
      if (t0 <= clk() + 1) leave();
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
        cap(hud, (cj = k));
      }
      raf = requestAnimationFrame(tick);
    }

    function allReady() {
      for (var k in need) if (!ready[k]) return false;
      return true;
    }
    // The plan is fixed: J (or the arrive) runs to the summit, the beat, then the exit. At the arrival a clone of the
    // readout that already reads 5,416 m, Thorong La crossfades in on the compositor, whatever the main thread does.
    function fix() {
      phase = 'arrive';
      hideSkip();
      var ta = Math.max(now(), cur.t0 + cur.d), al = hud.querySelector('.alt'), c = al.cloneNode(true);
      var k = S.length - 1;
      c.querySelector('.n').textContent = nf.format(S[k][0]);
      cap(c, k);
      c.style.opacity = 0;
      hud.appendChild(c);
      RF.push(go(c, [{ opacity: 0 }, { opacity: 1 }], ta, { duration: 160, fill: 'both' }),
        go(al, [{ opacity: 1 }, { opacity: 0 }], ta, { duration: 160, fill: 'both' }));
      plan(ta + HOLD, EXIT, 1); // last: an exit already due emits `exit` at once
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
      if (!allReady() || phase === 'pre') return;
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
      if (phase === 'exit' || phase === 'done') return;
      run++;
      X = cancel(X);
      RF = cancel(RF);
      var T = clk();
      if (A.length) {
        // coast to a stop in at most 360 ms (the + 1e-6 keeps dp above 0 at the summit)
        herm(Math.min(1, P(T) + vel(T) * 180) + 1e-6, 360, 1, T);
        plan(T, 480, 1);
      } else {
        phase = 'arrive'; // also before the first frame: the climb never starts
        plan(T, 200, 0);
      }
    }

    // Input: any click, key (no modifier), wheel or touch skips; the page under the curtain does not move.
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // the scroll keys (Space, Page*, Arrow*, Home, End), except Space on the Skip button itself
      if (/^( |Page|Arrow|Home$|End$)/.test(e.key) && !(e.target === skip && e.key === ' ')) e.preventDefault();
      doSkip();
    }
    function onScroll(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      doSkip();
    }
    // f is addEventListener or removeEventListener: capture, and not passive (wheel and touchmove are prevented)
    function lis(f) {
      var o = { capture: true, passive: false };
      f('keydown', onKey, o);
      f('wheel', onScroll, o);
      f('touchmove', onScroll, o);
    }
    function unlisten() {
      lis(removeEventListener);
    }
    lis(addEventListener);
    root.addEventListener('click', doSkip);
    // A resize rebuilds the running segment at the same timeline time.
    addEventListener('resize', function () {
      if (phase === 'done') return;
      measure();
      if (cur) retime(cur); // (drops already planned keep their lengths: the exit is at most 620 ms)
      else setP(p0);
    });
    // Restored from bfcache while frozen mid-curtain: end at once.
    addEventListener('pageshow', function (e) {
      if (e.persisted && phase !== 'done') done();
    });

    var api = { ready: onReady, skip: doSkip };
    /*@test*/
    window.__aaBoot = api;
    // Until the clock starts the scene waits at its first p, all but transparent, so its first raster (about 200 ms
    // of GPU work on a laptop) starts behind the sky. A tab hidden before the first frame starts when shown, late,
    // so it picks 'gone'.
    measure();
    if (mode !== 'gone') {
      setP(p0);
      scn.style.opacity = 0.01;
    }
    requestAnimationFrame(begin);
    function begin() {
      if (phase !== 'pre') return;
      var T = clk();
      // A first frame that comes late (the main thread was busy) shortens the climb or skips it: the curtain still
      // ends by E. A curtain gone by then never shows the scene.
      if (mode !== 'reduced') mode = pick(T - t1 + ti);
      // The fade-in and the climb's opening play as soon as they can: the compositor starts them together in its
      // first frame with the scene rastered (one start time for all, as for any animations begun in one frame), and
      // the clock adopts it (`climb`), so both are seen from their first frame.
      if (mode !== 'gone') go(scn, [{ opacity: 1 }], 0, { duration: 200, fill: 'both' }); // from its .01
      if (mode !== 'fast' && mode !== 'slow') return start(T);
      retime({ t0: 0, d: mode === 'fast' ? TJ : Math.min(TJ, Math.max(J_MIN, E - HOLD - EXIT - T)), f: J });
      cur.t0 = T; // until then
      A[0].ready.then(function () {
        if (phase === 'pre') start((cur.t0 = A[0].startTime), 1); // unless skipped meanwhile
      }, function () {});
    }
    // The clock starts at T: the climb (up), or the summit frame and the fade.
    function start(T, up) {
      phase = 'climb';
      emit('climb');
      if (up) {
        tick();
        if (mode === 'slow' || allReady()) fix();
        else at(T + DEC * TJ, decide);
      } else if (mode !== 'reduced') {
        phase = 'arrive';
        if (mode === 'gone') plan(T, 200, 0);
        else {
          setP((p0 = 1)); // late: the summit frame, then a fade that ends by E
          plan(Math.min(T + 600, E - 300), 300, 0); // late starts by GONE, so this is never before T
        }
      } else {
        phase = 'wait';
        at(t1 + 600, function () {
          if (allReady()) out();
        });
        at(t1 + Math.min(2000, Math.max(E - t1, 600)), out);
      }
    }
    d.fonts.ready.then(function () {
      onReady('fonts');
    });
    var q = window.__aaBootQ || [];
    for (i = 0; i < q.length; i++) onReady(q[i]);
    window.__aaBootQ = null;
  }
})();
