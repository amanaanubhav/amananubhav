'use client';

import { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { MOTION } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { gsap, useGSAP } from '@/shared/lib/gsap';
import { useMotionAllowed } from '@/shared/lib/motion-tier';
import { Button } from '@/shared/ui/button';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { Note, Sheet, sheetId } from './parts';
import type { BlueprintProps } from './parts';

/* ── Geometry (sheet units) ─────────────────────────────────────────────────────────────────────── */

type Point = readonly [x: number, y: number];

/** The ambulance's route: east along the avenue, then a diversion around the jammed block, then east again. */
const ROUTE: readonly Point[] = [
  [60, 510],
  [660, 510],
  [660, 690],
  [900, 690],
  [900, 510],
  [1120, 510],
];

const SEGMENTS = ROUTE.slice(1).map((end, i) => {
  const start = ROUTE[i] as Point;
  return { start, end, length: Math.hypot(end[0] - start[0], end[1] - start[1]) };
});
const TOTAL = SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);
const FULL_D = `M${ROUTE.map(([x, y]) => `${x} ${y}`).join('L')}`;

/** Signals at the junctions on the route, with their distance along it. */
const SIGNALS: readonly { x: number; y: number; at: number }[] = [
  { x: 420, y: 510, at: 360 },
  { x: 660, y: 510, at: 600 },
  { x: 660, y: 690, at: 780 },
  { x: 900, y: 690, at: 1020 },
  { x: 900, y: 510, at: 1200 },
  { x: 1080, y: 510, at: 1380 },
];
/** A signal clears this far (sheet units) before the vehicle reaches it. */
const LEAD = 210;

const STREETS_X = [60, 180, 420, 660, 900, 1080, 1140] as const;
const STREETS_Y = [90, 150, 330, 510, 690, 760] as const;
const HALF_STREET = 14;

/** City blocks between the streets (outer edges cut at the sheet margin), as one path. */
const BLOCKS = (() => {
  let d = '';
  for (let c = 0; c < STREETS_X.length - 1; c += 1) {
    for (let r = 0; r < STREETS_Y.length - 1; r += 1) {
      const x0 = STREETS_X[c] as number;
      const x1 = STREETS_X[c + 1] as number;
      const y0 = STREETS_Y[r] as number;
      const y1 = STREETS_Y[r + 1] as number;
      const left = c === 0 ? x0 : x0 + HALF_STREET;
      const right = c === STREETS_X.length - 2 ? x1 : x1 - HALF_STREET;
      const top = r === 0 ? y0 : y0 + HALF_STREET;
      const bottom = r === STREETS_Y.length - 2 ? y1 : y1 - HALF_STREET;
      d += `M${left} ${top}H${right}V${bottom}H${left}Z`;
    }
  }
  return d;
})();

const PLAY_SECONDS = 3.2;

/** Position, heading and the drawn part of the route at distance `s`. */
function routeAt(s: number): { x: number; y: number; angle: number; d: string } {
  let remaining = Math.max(0, Math.min(TOTAL, s));
  let d = `M${ROUTE[0]?.[0] ?? 0} ${ROUTE[0]?.[1] ?? 0}`;
  for (const { start, end, length } of SEGMENTS) {
    const angle = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;
    if (remaining <= length) {
      const t = length === 0 ? 0 : remaining / length;
      const x = start[0] + (end[0] - start[0]) * t;
      const y = start[1] + (end[1] - start[1]) * t;
      return { x, y, angle, d: `${d}L${x.toFixed(1)} ${y.toFixed(1)}` };
    }
    remaining -= length;
    d += `L${end[0]} ${end[1]}`;
  }
  const last = ROUTE[ROUTE.length - 1] as Point;
  return { x: last[0], y: last[1], angle: 0, d };
}

const FINAL = routeAt(TOTAL);

/**
 * The portrait layout (840 × 1120) turns the same street grid a quarter turn so the vehicle drives down the sheet:
 * landscape (x, y) lands at (728 - 0.92 (y - 90), 63 + 0.92 (x - 60)). The route, signals and vehicle keep their
 * landscape coordinates inside this group, so the timeline is the same for both layouts.
 */
const PORTRAIT_MAP = 'translate(728 63) scale(0.92) rotate(90) translate(-60 -90)';

/**
 * The notes stay upright: their places in each layout. Landscape: above the jam and inside the block the diversion
 * rounds. Portrait (blocks there are only 140 units wide): beside the jam and under the diversion, on a halo where
 * they cross the faint street grid, never across the route.
 */
const NOTES = {
  landscape: { anchor: 'middle', halo: false, congestion: [780, 470], diversion: [780, 584], distance: [780, 630] },
  portrait: { anchor: 'start', halo: true, congestion: [360, 726], diversion: [116, 892], distance: [116, 936] },
} as const;

/**
 * G-05b: the DIVERT corridor (animated). A street grid; the vehicle marker drives the route while the signals
 * ahead of it turn from ink to signal in sequence, and the route bends into a diversion of about 800 m around a
 * congested block. Plays once (about 3.2 s) when 30% is in view, rests on its final frame, and a Play button replays
 * it; the button appears only after that first play. Server markup and reduced motion show the final frame and the
 * button; already in view at mount, it does not auto-play.
 */
export function DivertCorridor({ className, variant = 'landscape' }: BlueprintProps) {
  const notes = NOTES[variant];
  const rootRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const signalRefs = useRef<(SVGCircleElement | null)[]>([]);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const settledRef = useRef(false);
  const armedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const playRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  // §G.3: the Play button shows once the corridor has played (or rests on its final frame without playing); it is
  // absent while the sheet waits below the fold for its first play. True on the server: final frame + Play.
  const [replayShown, setReplayShown] = useState(true);
  const motionAllowed = useMotionAllowed();

  const apply = (s: number) => {
    const { x, y, angle, d } = routeAt(s);
    routeRef.current?.setAttribute('d', d);
    vehicleRef.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle})`);
    SIGNALS.forEach((signal, i) => {
      const el = signalRefs.current[i];
      if (el) el.style.opacity = s >= signal.at - LEAD ? '1' : '0';
    });
  };

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      if (!root || !contextSafe) return;

      // The one way to run the corridor: from the start, over about 3.2 s, then rest on the final frame.
      playRef.current = contextSafe(() => {
        tweenRef.current?.kill();
        observerRef.current?.disconnect();
        armedRef.current = false;
        settledRef.current = true;
        setPlaying(true);
        const proxy = { s: 0 };
        apply(0);
        // One timeline: the vehicle drives the route; each signal's clear is driven from the same progress.
        tweenRef.current = gsap
          .timeline({
            onComplete: () => {
              apply(TOTAL);
              tweenRef.current = null;
              setPlaying(false);
              setReplayShown(true);
            },
          })
          .to(proxy, {
            s: TOTAL,
            duration: PLAY_SECONDS,
            ease: MOTION.ease.glide,
            onUpdate: () => apply(proxy.s),
          });
      });

      observerRef.current?.disconnect();
      if (!motionAllowed) {
        // Motion switched off while waiting to play: rest on the final frame, never on an empty sheet.
        if (armedRef.current) {
          armedRef.current = false;
          settledRef.current = true;
          apply(TOTAL);
          setReplayShown(true);
        }
        return;
      }
      if (settledRef.current || armedRef.current || typeof IntersectionObserver === 'undefined') return;
      const rect = root.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Already in view at mount: keep the finished drawing; the Play button replays it.
        settledRef.current = true;
        return;
      }
      armedRef.current = true;
      apply(0);
      setReplayShown(false);
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.3)) {
            observer.disconnect();
            playRef.current?.();
          }
        },
        { threshold: 0.3 },
      );
      observerRef.current = observer;
      observer.observe(root);
      return () => observer.disconnect();
    },
    { scope: rootRef, dependencies: [motionAllowed] },
  );

  return (
    <div ref={rootRef} className={cn('relative h-full w-full', className)}>
      <Sheet
        id={sheetId('bp-divert', variant)}
        variant={variant}
        title="Animated diagram: the DIVERT signal corridor"
        desc="A street grid. An emergency vehicle drives east along an avenue; ahead of it, each traffic signal on its route turns to clear in sequence. Where the avenue is jammed, the route takes a diversion of about 800 metres around the congested block, then rejoins the avenue. The final frame shows the whole route drawn and every signal on it cleared. The highlighted line is the vehicle's route."
      >
        <g transform={variant === 'portrait' ? PORTRAIT_MAP : undefined}>
          <path d={BLOCKS} fill="none" style={{ stroke: 'var(--ink-contour-index)' }} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />

          {/* The jam on the direct street. */}
          <path
            d="M680 510H880"
            className="stroke-ink-muted"
            fill="none"
            strokeWidth={5}
            strokeDasharray="14 9"
            vectorEffect="non-scaling-stroke"
          />

          {/* The route (signal), drawn up to the vehicle. */}
          <path
            ref={routeRef}
            d={FULL_D}
            className="route-line stroke-signal-line"
            fill="none"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Signals: ink rings that clear to signal ahead of the vehicle. */}
          {SIGNALS.map((signal, i) => (
            <g key={`${signal.x}-${signal.y}`}>
              <circle
                cx={signal.x}
                cy={signal.y}
                r={11}
                className="fill-ground stroke-ink"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                ref={(el) => {
                  signalRefs.current[i] = el;
                }}
                cx={signal.x}
                cy={signal.y}
                r={7}
                className="signal-mark fill-signal-line transition-opacity duration-ui ease-settle"
              />
            </g>
          ))}

          {/* The vehicle marker. */}
          <g ref={vehicleRef} transform={`translate(${FINAL.x} ${FINAL.y}) rotate(${FINAL.angle})`}>
            <rect x={-18} y={-11} width={36} height={22} rx={4} className="signal-mark fill-signal-line stroke-ground" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <path d="M8 -6V6" className="stroke-ground" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
        </g>

        <Note x={notes.congestion[0]} y={notes.congestion[1]} anchor={notes.anchor} halo={notes.halo}>
          congestion
        </Note>
        <Note x={notes.diversion[0]} y={notes.diversion[1]} anchor={notes.anchor} halo={notes.halo}>
          diversion,
        </Note>
        <Note x={notes.distance[0]} y={notes.distance[1]} anchor={notes.anchor} halo={notes.halo}>
          about 800 m
        </Note>
      </Sheet>

      {replayShown ? (
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
          <Button
            variant="secondary"
            icon={Play}
            onClick={() => {
              if (!playing) playRef.current?.();
            }}
            aria-disabled={playing || undefined}
            className="bg-ground px-3 sm:px-4"
          >
            Play
            <VisuallyHidden> the DIVERT corridor</VisuallyHidden>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
