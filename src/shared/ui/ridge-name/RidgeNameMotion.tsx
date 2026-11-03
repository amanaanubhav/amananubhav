'use client';

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

import { useBootPhase } from '@/shared/lib/boot';
import { getMotionTier, useMotionAllowed } from '@/shared/lib/motion-tier';

import type { RidgeField } from './ridge-field';
import { RIDGE_AMPLITUDE_EM, RIDGE_LIFT_EM } from './ridge-path';

export type RidgeNameSurface = 'name' | 'sheet';

export interface RidgeNameMotionProps {
  surface: RidgeNameSurface;
  /** Footer: a new value (the route) re-arms the arrival pass. */
  replayKey?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** The hero's first light and survey pass play once per session. */
const SESSION_KEY = 'aa:ridge-name';
/** The footer's keyboard pass waits this long before it plays again. */
const KEYBOARD_COOLDOWN_MS = 8000;
/** The footer's arrival pass plays once this share of the name is in view. */
const ARRIVAL_RATIO = 0.6;

type EngineModule = typeof import('./ridge-field');
let engineModule: Promise<EngineModule> | null = null;
/** The engine is its own chunk: fetched only when motion is allowed, once for both names. */
const loadEngine = () => (engineModule ??= import('./ridge-field'));

function playedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markPlayed(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Private mode: the pass may play again on the next visit to the page.
  }
}

const motionNow = () => getMotionTier() > 0;

/**
 * The client island of a Survey Ridge name (RidgeName renders everything else on the server). It owns the visual
 * span and, only while motion is allowed, attaches the engine (a dynamic import) on boot `done`, on the first
 * pointer over the name, or as the footer's name nears the viewport. Hero: first light under the boot curtain, then
 * one survey pass per session. Footer: one pass when the name is 60 % in view (once per route) and on keyboard focus
 * entering the footer (8 s cooldown). Turning motion off at runtime puts the server's rest frame back.
 */
export function RidgeNameMotion({ surface, replayKey, className, style, children }: RidgeNameMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const attachRef = useRef<(() => Promise<RidgeField | null>) | null>(null);
  const awaitingLight = useRef(false);
  /** The route the footer's arrival pass last played for (null: not yet). */
  const arrivedFor = useRef<string | null>(null);
  const motion = useMotionAllowed();
  const phase = useBootPhase();

  // First light (hero): while the boot curtain is up, the trekker waits unlit until the curtain is done. Before
  // paint, so a client navigation never shows him lit and then dark.
  useLayoutEffect(() => {
    const vis = ref.current;
    if (!vis || surface !== 'name' || playedThisSession() || !motionNow()) return;
    const boot = document.documentElement.dataset.boot;
    if (boot === 'run' || boot === 'exit') {
      vis.removeAttribute('data-summit');
      awaitingLight.current = true;
    }
  }, [surface]);

  // The engine's lifetime: attached on demand while motion is allowed, destroyed when it is not.
  useEffect(() => {
    const vis = ref.current;
    if (!vis || !motion) return;
    let engine: RidgeField | null = null;
    let pending: Promise<RidgeField | null> | null = null;
    let cancelled = false;
    const surfaceOptions = { lift: RIDGE_LIFT_EM[surface], amplitude: RIDGE_AMPLITUDE_EM[surface] };

    const attach = () =>
      (pending ??= (async () => {
        await (document.fonts?.ready ?? Promise.resolve());
        const { RidgeField: Field } = await loadEngine();
        if (cancelled) return null;
        engine = new Field(vis, surfaceOptions);
        return engine;
      })().catch(() => {
        vis.setAttribute('data-summit', '');
        return null;
      }));
    attachRef.current = attach;

    // The first pointer over the name loads the engine and is handed to it: a mouse still over the name raises the
    // ground under it (the engine sees the leave); a touch it did not see begin rises and sinks like a tap.
    const onFirstPointer = (event: PointerEvent) => {
      const mouse = event.pointerType === 'mouse';
      if (event.type === 'pointerenter' && !mouse) return;
      void attach().then((field) => {
        if (!field) return;
        if (!mouse) field.tap(event);
        else if (vis.matches(':hover')) field.point(event, true);
      });
    };
    vis.addEventListener('pointerenter', onFirstPointer, { once: true });
    vis.addEventListener('pointerdown', onFirstPointer, { once: true });

    return () => {
      cancelled = true;
      attachRef.current = null;
      vis.removeEventListener('pointerenter', onFirstPointer);
      vis.removeEventListener('pointerdown', onFirstPointer);
      if (engine) engine.destroy();
      else vis.setAttribute('data-summit', '');
      awaitingLight.current = false;
    };
  }, [motion, surface]);

  // Hero: on boot `done`, first light (if it waited) and the survey pass, once per session.
  useEffect(() => {
    if (surface !== 'name' || !motion || phase !== 'done') return;
    if (!awaitingLight.current && playedThisSession()) return;
    let live = true;
    void attachRef.current?.().then((field) => {
      if (!live || !field) return;
      markPlayed();
      awaitingLight.current = false;
      field.survey();
    });
    return () => {
      live = false;
    };
  }, [surface, motion, phase]);

  // Footer: the arrival pass (60 % in view, once per route) and the keyboard pass; the engine loads on approach.
  useEffect(() => {
    const vis = ref.current;
    if (surface !== 'sheet' || !vis || !motion) return;
    const play = () => void attachRef.current?.().then((field) => field?.survey());
    const route = replayKey ?? '';

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        void attachRef.current?.();
        near.disconnect();
      },
      { rootMargin: '0px 0px 50% 0px' },
    );
    const arrival = new IntersectionObserver(
      ([entry]) => {
        // The first callback reports any overlap; the pass waits for 60 % of the name.
        if (!entry || entry.intersectionRatio < ARRIVAL_RATIO - 0.01 || arrivedFor.current === route) return;
        arrivedFor.current = route;
        play();
      },
      { threshold: ARRIVAL_RATIO },
    );
    near.observe(vis);
    arrival.observe(vis);

    const footer = vis.closest('footer');
    let lastKeyboard = -Infinity;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null;
      if (!target?.matches(':focus-visible')) return;
      const now = performance.now();
      if (now - lastKeyboard < KEYBOARD_COOLDOWN_MS) return;
      lastKeyboard = now;
      play();
    };
    footer?.addEventListener('focusin', onFocusIn);

    return () => {
      near.disconnect();
      arrival.disconnect();
      footer?.removeEventListener('focusin', onFocusIn);
    };
  }, [surface, motion, replayKey]);

  return (
    <span ref={ref} aria-hidden="true" data-summit="" className={className} style={style}>
      {children}
    </span>
  );
}
