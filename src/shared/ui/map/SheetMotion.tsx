'use client';

import { useEffect, useLayoutEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { MOTION } from '@/shared/config';
import type { CSSVars } from '@/shared/lib/css';
import { useBootDone } from '@/shared/lib/boot';
import { useMotionAllowed } from '@/shared/lib/motion-tier';

const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(', ')})`;
const EASE_GLIDE = bezier(MOTION.bezier.glide);
const EASE_SETTLE = bezier(MOTION.bezier.settle);

function inViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
}

/** Ease for the headlamp: the glide curve, evaluated through its cubic in t (close enough for 1.6 s). */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface Choreography {
  /** Puts every animated part in its start state (called only when motion is allowed). */
  arm: () => void;
  /** Plays once (later calls are ignored); calls its `onDone` at the end. */
  play: () => void;
  /** Returns every part to the server-rendered final frame and stops anything running. */
  finish: () => void;
}

function drawChoreography(root: HTMLElement, onDone: () => void): Choreography {
  // A path that cannot be measured (e.g. inside a hidden layout in some engines) stays drawn.
  const measured = Array.from(root.querySelectorAll<SVGPathElement>('[data-sheet-draw]')).map((p) => {
    try {
      return { p, len: p.getTotalLength() };
    } catch {
      return { p, len: 0 };
    }
  });
  const paths = measured.filter((m) => m.len > 0).map((m) => m.p);
  const lengths = measured.filter((m) => m.len > 0).map((m) => m.len);
  const contours = root.querySelector<SVGGElement>('[data-sheet-contours]');
  const after = root.querySelector<SVGGElement>('[data-sheet-after]');
  const anims: Animation[] = [];
  let hero = false;
  let played = false;

  const finish = () => {
    anims.splice(0).forEach((a) => a.cancel());
    paths.forEach((p) => {
      p.style.strokeDasharray = '';
      p.style.strokeDashoffset = '';
    });
    if (contours) contours.style.opacity = '';
    if (after) after.style.opacity = '';
  };

  return {
    arm() {
      hero = inViewport(root);
      paths.forEach((p, i) => {
        p.style.strokeDasharray = `${lengths[i]} ${lengths[i]}`;
        p.style.strokeDashoffset = `${lengths[i]}`;
      });
      if (contours) contours.style.opacity = '0.6';
      if (after) after.style.opacity = '0';
    },
    play() {
      if (played) return;
      played = true;
      const fade = 600;
      // The hero (above the fold at mount) draws over --dur-hero; other sheets by path length.
      const screenScale = root.getBoundingClientRect().width / Math.max(1, (root.querySelector('svg')?.viewBox.baseVal.width ?? 1));
      const longest = Math.max(0, ...lengths) * screenScale;
      const drawMs = (hero ? MOTION.dur.hero : MOTION.drawDuration(longest)) * 1000;
      if (contours) {
        anims.push(contours.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: fade, easing: EASE_SETTLE, fill: 'forwards' }));
      }
      paths.forEach((p, i) => {
        anims.push(
          p.animate([{ strokeDashoffset: lengths[i] }, { strokeDashoffset: 0 }], {
            duration: drawMs,
            delay: fade,
            easing: EASE_GLIDE,
            fill: 'forwards',
          }),
        );
      });
      if (after) {
        anims.push(
          after.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: fade + drawMs, easing: EASE_SETTLE, fill: 'forwards' }),
        );
      }
      const last = anims[anims.length - 1];
      if (last) {
        last.finished.then(() => {
          finish();
          onDone();
        }, () => {});
      } else {
        finish();
        onDone();
      }
    },
    finish,
  };
}

function alpineChoreography(root: HTMLElement, onDone: () => void): Choreography {
  const light = root.querySelector<SVGPathElement>('[data-sheet-tent-light]');
  const ridge = root.querySelector<SVGPathElement>('[data-sheet-ridge]');
  const lamp = root.querySelector<SVGCircleElement>('[data-sheet-headlamp]');
  const route = root.querySelector<SVGPathElement>('[data-sheet-planned]');
  const lampEnd = lamp ? { cx: lamp.getAttribute('cx'), cy: lamp.getAttribute('cy') } : null;
  const anims: Animation[] = [];
  let raf = 0;
  let played = false;

  const placeLamp = (t: number) => {
    if (!lamp || !route) return;
    try {
      const pt = route.getPointAtLength(route.getTotalLength() * t);
      lamp.setAttribute('cx', pt.x.toFixed(1));
      lamp.setAttribute('cy', pt.y.toFixed(1));
    } catch {
      /* unmeasurable (hidden layout): the lamp keeps its final position */
    }
  };

  const finish = () => {
    cancelAnimationFrame(raf);
    anims.splice(0).forEach((a) => a.cancel());
    if (light) light.style.opacity = '';
    if (ridge) ridge.style.opacity = '';
    if (lamp && lampEnd) {
      lamp.style.opacity = '';
      if (lampEnd.cx) lamp.setAttribute('cx', lampEnd.cx);
      if (lampEnd.cy) lamp.setAttribute('cy', lampEnd.cy);
    }
  };

  return {
    arm() {
      if (light) light.style.opacity = '1';
      if (ridge) ridge.style.opacity = '0';
      if (lamp) lamp.style.opacity = '0';
      placeLamp(0);
    },
    play() {
      if (played) return;
      played = true;
      if (light) anims.push(light.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, easing: EASE_SETTLE, fill: 'forwards' }));
      if (ridge) {
        anims.push(ridge.animate([{ opacity: 0 }, { opacity: 0.5 }], { duration: 800, delay: 400, easing: EASE_SETTLE, fill: 'forwards' }));
      }
      if (lamp) anims.push(lamp.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 800, fill: 'forwards' }));
      const start = performance.now() + 800;
      const travel = 1600;
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / travel));
        placeLamp(easeInOut(t));
        if (t < 1) raf = requestAnimationFrame(tick);
        else {
          finish();
          onDone();
        }
      };
      raf = requestAnimationFrame(tick);
    },
    finish,
  };
}

/**
 * Client island for `ContourSheet`: draws the route once (after boot; the hero over --dur-hero) and
 * plays the alpine start once at 50% in view. Server HTML is the final frame; start states are
 * applied before paint only when motion is allowed, and every exit path restores the final frame.
 */
export function SheetMotion({
  drawRoute,
  alpineStart,
  className,
  style,
  children,
}: {
  drawRoute: boolean;
  alpineStart: boolean;
  className?: string;
  style?: CSSVars;
  children: ReactNode;
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const allowed = useMotionAllowed();
  const bootDone = useBootDone();
  const draw = useRef<Choreography | null>(null);
  const alpine = useRef<Choreography | null>(null);
  const done = useRef({ draw: false, alpine: false });

  // Arm (before paint): put the animated parts in their start state.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !allowed) return;
    if (drawRoute && !done.current.draw) {
      draw.current = drawChoreography(root, () => {
        done.current.draw = true;
      });
      draw.current.arm();
    }
    // An alpine start already in view on a client navigation stays on its final frame.
    if (alpineStart && !done.current.alpine && !(bootDone && inViewport(root))) {
      alpine.current = alpineChoreography(root, () => {
        done.current.alpine = true;
      });
      alpine.current.arm();
    }
    return () => {
      draw.current?.finish();
      alpine.current?.finish();
      draw.current = null;
      alpine.current = null;
    };
    // Arming happens once per motion permission; boot only gates playback (effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, drawRoute, alpineStart]);

  // Play: after boot, once each part reaches its threshold.
  useEffect(() => {
    const root = ref.current;
    if (!root || !allowed || !bootDone) return;
    const observers: IntersectionObserver[] = [];
    const watch = (threshold: number, run: () => void) => {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= threshold)) {
            io.disconnect();
            run();
          }
        },
        { threshold: [threshold] },
      );
      io.observe(root);
      observers.push(io);
    };
    if (draw.current && !done.current.draw) {
      const c = draw.current;
      watch(0.3, () => c.play());
    }
    if (alpine.current && !done.current.alpine) {
      const c = alpine.current;
      watch(0.5, () => c.play());
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [allowed, bootDone]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
