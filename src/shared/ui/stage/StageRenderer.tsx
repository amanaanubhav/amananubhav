'use client';

import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor';
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

import { gsap } from '@/shared/lib/gsap';
import { degradeStage } from '@/shared/lib/motion-tier';
import { StageSceneRoot, markStageFailed } from '@/shared/ui/stage-three';

import { onIdle } from './idle';
import { hasVisibleScene, useStageEntries, type StageSceneEntry } from './registry';
import { ThemeUniforms } from './ThemeUniforms';

/*
 * The three/R3F chunk (§C.5). Reached only through next/dynamic in StageCanvas, never re-exported.
 *
 * One fixed canvas behind the page, `frameloop="never"`: a gsap.ticker callback (added after
 * Lenis, which is prioritised) advances R3F in the same tick as the DOM scroll and ScrollTrigger,
 * and each scene renders itself into its slot with useSlotRender (scissored, priority 1).
 *
 * Full-bleed slots (the home story's fixed #stage): the canvas host element moves INSIDE the slot,
 * so the SSR poster and the canvas are one map element (one stage, one DOM subtree), and the DPR is
 * capped at 1.25. The canvas then fades in over 300 ms when the scene marks the slot live, above the
 * poster it replaces; a slot marked `data-stage-instant` (the home story, which loads straight in 3D and
 * has no poster to replace) shows the canvas at once on its first frame and never before. React owns
 * only the host's children (a portal), so moving the host is safe.
 */

export interface StageRendererProps {
  paused: boolean;
  isDark: boolean;
  tier: 1 | 2;
}

const DPR_CAP: Record<1 | 2, number> = { 1: 1.25, 2: 1.75 };
/** Full-bleed stages cover the whole viewport: cap the GPU cost (design §16, R42). */
const DPR_CAP_FULL_BLEED = 1.25;
const HOST_CLASS = 'stage-canvas pointer-events-none fixed inset-0 z-stage';
const HOST_CLASS_IN_SLOT = 'stage-canvas pointer-events-none absolute inset-0';
const CROSSFADE = 'opacity 300ms cubic-bezier(0.2, 0, 0, 1)';
const DPR_FLOOR = 0.75;
const DPR_STEP = 0.25;
/** This many direction changes (incline after decline or back) means the device cannot hold a frame rate. */
const MAX_FLIPS = 3;

/** Advances R3F from gsap.ticker while active; clears once when the last scene leaves the view. */
function TickerDriver({ paused, onResume }: { paused: boolean; onResume: () => void }) {
  const advance = useThree((s) => s.advance);
  const gl = useThree((s) => s.gl);
  const pausedRef = useRef(paused);
  const onResumeRef = useRef(onResume);

  useEffect(() => {
    pausedRef.current = paused;
    onResumeRef.current = onResume;
  }, [paused, onResume]);

  useEffect(() => {
    let wasActive = false;
    const tick = (time: number) => {
      const anyVisible = hasVisibleScene();
      const active = !pausedRef.current && document.visibilityState === 'visible' && anyVisible;
      if (active) {
        if (!wasActive) onResumeRef.current();
        // Seconds: with frameloop="never", R3F derives useFrame's delta and clock.elapsedTime from
        // this timestamp as given, and scenes damp with delta in seconds.
        advance(time, true);
      } else if (wasActive && !anyVisible) {
        // Nothing left to show (scrolled away, route change): do not leave a stale frame behind.
        gl.setScissorTest(false);
        gl.clear(true, true, false);
      }
      wasActive = active;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [advance, gl]);

  return null;
}

/** Clears the whole canvas at the start of every frame, before the slot renders (priority 1). */
function FrameClear() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.clear(true, true, false);
  }, 0.5);
  return null;
}

/** Warms shader programs once a scene's module has resolved (idle callback). */
function CompileWhenIdle() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(
    () =>
      onIdle(() => {
        try {
          gl.compile(scene, camera);
        } catch {
          // Compilation is only a warm-up; the first real frame compiles anything left.
        }
      }, 2000),
    [gl, scene, camera],
  );
  return null;
}

/**
 * A failing scene (chunk load error, a throw) renders nothing and marks its slot `data-stage-failed`
 * (the home story then shows its static map); a poster simply stays.
 */
class SceneBoundary extends Component<{ id: string; slot: HTMLElement; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    markStageFailed(this.props.slot);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Stage scene "${this.props.id}" failed; keeping its poster.`, error);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function SceneHost({ entry, tier, isDark }: { entry: StageSceneEntry; tier: 1 | 2; isDark: boolean }) {
  const { Scene } = entry;
  return (
    <StageSceneRoot visible={entry.visible}>
      <SceneBoundary id={entry.id} slot={entry.slot}>
        <Suspense fallback={null}>
          <Scene id={entry.id} tier={tier} slot={entry.slot} isDark={isDark} />
          <CompileWhenIdle />
        </Suspense>
      </SceneBoundary>
    </StageSceneRoot>
  );
}

/**
 * DPR steps of 0.25 between the floor and `cap` (the tier cap, never above the device ratio).
 * drei reports an incline every sampling window while frames are fast, so an incline at the cap is
 * a no-op and never counts; only real direction changes count as flip-flops. Three flip-flops, or
 * a decline already at the floor, => degradeStage() (posters for the rest of the session).
 */
function AdaptiveDpr({ cap, epoch }: { cap: number; epoch: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useThree((s) => s.viewport.dpr);
  const flips = useRef(0);
  const lastDirection = useRef<1 | -1 | 0>(0);
  const dprRef = useRef(dpr);

  useEffect(() => {
    dprRef.current = dpr;
  }, [dpr]);

  // A lower cap (a full-bleed stage registered) applies at once.
  useEffect(() => {
    if (dprRef.current > cap) {
      dprRef.current = cap;
      setDpr(cap);
    }
  }, [cap, setDpr]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const current = dprRef.current;
      if (direction > 0 && current >= cap) return;
      if (direction < 0 && current <= DPR_FLOOR) {
        degradeStage();
        return;
      }
      if (lastDirection.current !== 0 && lastDirection.current !== direction) flips.current += 1;
      lastDirection.current = direction;
      if (flips.current >= MAX_FLIPS) {
        degradeStage();
        return;
      }
      const next = Math.min(cap, Math.max(DPR_FLOOR, current + direction * DPR_STEP));
      if (next !== current) {
        dprRef.current = next;
        setDpr(next);
      }
    },
    [cap, setDpr],
  );

  // Remounted (epoch) whenever rendering resumes, so pauses never read as dropped frames.
  return <PerformanceMonitor key={epoch} onIncline={() => step(1)} onDecline={() => step(-1)} />;
}

/** Where the canvas host goes inside a full-bleed slot: `[data-stage-canvas]`, else after the poster. */
function placeHostInSlot(host: HTMLElement, slot: HTMLElement): void {
  const container = slot.querySelector<HTMLElement>('[data-stage-canvas]');
  if (container) {
    if (host.parentElement !== container) container.appendChild(host);
    return;
  }
  if (host.parentElement === slot) return;
  const poster = slot.querySelector(':scope > .stage-poster, :scope > [data-stage-poster]');
  slot.insertBefore(host, poster ? poster.nextSibling : slot.firstChild);
}

/**
 * Keeps the canvas host in the full-bleed slot while one is registered (else in the shell's
 * placeholder), and fades it in when the scene marks the slot live (300 ms, over the poster). With
 * `data-stage-instant` on the slot the host is hidden until the slot is live and shown on that frame,
 * with no transition, so a clear or half-built frame is never seen.
 */
function useCanvasHost(
  hostRef: RefObject<HTMLDivElement | null>,
  home: HTMLElement | null,
  fullBleed: HTMLElement | null,
): void {
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!fullBleed) {
      host.className = HOST_CLASS;
      host.style.opacity = '';
      host.style.transition = '';
      if (home && host.parentElement !== home) home.appendChild(host);
      return;
    }
    host.className = HOST_CLASS_IN_SLOT;
    placeHostInSlot(host, fullBleed);
    const instant = fullBleed.hasAttribute('data-stage-instant');
    const sync = () => {
      const live = fullBleed.hasAttribute('data-stage-live');
      const hasPoster = !instant && fullBleed.querySelector('.stage-poster, [data-stage-poster]') !== null;
      host.style.opacity = live || (!instant && !hasPoster) ? '1' : '0';
    };
    host.style.transition = instant ? '' : CROSSFADE;
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(fullBleed, {
      attributes: true,
      attributeFilter: ['data-stage-live'],
      childList: true,
    });
    return () => observer.disconnect();
  }, [hostRef, home, fullBleed]);
}

export default function StageRenderer({ paused, isDark, tier }: StageRendererProps) {
  const entries = useStageEntries();
  const fullBleedSlot = entries.find((e) => e.fullBleed)?.slot ?? null;
  // Never render above the device's own ratio (supersampling buys nothing but GPU time).
  const deviceCap = Math.max(DPR_FLOOR, Math.min(window.devicePixelRatio || 1, DPR_CAP[tier]));
  const cap = fullBleedSlot ? Math.min(deviceCap, Math.max(DPR_FLOOR, DPR_CAP_FULL_BLEED)) : deviceCap;
  const [initialDpr] = useState(cap);
  // The canvas host: created once, outside React's tree (a portal container), so it can move.
  const [host] = useState(() => {
    const el = document.createElement('div');
    el.className = HOST_CLASS;
    el.setAttribute('aria-hidden', 'true');
    return el;
  });
  const hostRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    hostRef.current = host;
    return () => {
      hostRef.current?.remove();
      hostRef.current = null;
    };
  }, [host]);
  const [home, setHome] = useState<HTMLElement | null>(null);
  useCanvasHost(hostRef, home, fullBleedSlot);
  const [epoch, setEpoch] = useState(0);
  const onResume = useCallback(() => setEpoch((value) => value + 1), []);

  const onCreated = useCallback((state: RootState) => {
    state.gl.setClearAlpha(0); // transparent clear: the page ground shows through outside the slots
    state.gl.domElement.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        degradeStage();
      },
      { once: true },
    );
  }, []);

  return (
    <div ref={setHome} className="contents">
      {createPortal(
        <Canvas
          frameloop="never"
          flat
          dpr={initialDpr}
          gl={{
            antialias: false,
            alpha: true,
            stencil: false,
            powerPreference: 'high-performance',
          }}
          resize={{ scroll: false }}
          style={{ pointerEvents: 'none' }}
          onCreated={onCreated}
        >
          <TickerDriver paused={paused} onResume={onResume} />
          <FrameClear />
          <ThemeUniforms isDark={isDark} />
          <AdaptiveDpr cap={cap} epoch={epoch} />
          {entries.map((entry) => (
            <SceneHost key={entry.id} entry={entry} tier={tier} isDark={isDark} />
          ))}
        </Canvas>,
        host,
      )}
    </div>
  );
}
