'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { hashSeed, mulberry32 } from '@/shared/lib/random';
import { BLINK_UI, type SPOT_THE_MOVER } from '../../config/content';
import { INK, LIVE, NS, r1 } from './svg';

const W = 360;
const H = 240;
/** The star field stops above the instrument strip. */
const FIELD_BOTTOM = 190;
const STARS = 200;
const FRAMES = 3;
/** One frame change every 600 ms: under 2 changes a second, well below the 3-flash limit (WCAG 2.3.1). */
const BLINK_MS = 600;
const BLINK_CYCLES = 3;
/** Spot the mover: a hit within this many CSS px of the moving dot (FINAL §4.3.3). */
const HIT_TOUCH_PX = 24;
const HIT_MOUSE_PX = 14;

export const BLINK_CAPTION = BLINK_UI.caption;

/** The moving object's position in each synthetic frame. */
const ASTEROID: ReadonlyArray<readonly [number, number]> = [
  [148, 70],
  [176, 86],
  [204, 102],
];

/**
 * About 200 seeded background stars, identical in every frame, kept clear of the asteroid's track.
 * Faint stars are zero-length segments (`h0`); bright ones small crosses, so round caps print a
 * bigger blob. All in one path per frame.
 */
function starField(): string {
  const rand = mulberry32(hashSeed('blink-comparator'));
  let d = '';
  let n = 0;
  while (n < STARS) {
    const x = r1(14 + rand() * (W - 28));
    const y = r1(12 + rand() * (FIELD_BOTTOM - 20));
    const bright = rand() < 0.14;
    if (ASTEROID.some(([ax, ay]) => (ax - x) ** 2 + (ay - y) ** 2 < 144)) continue;
    d += bright ? `M${r1(x - 1)} ${y}h2M${x} ${r1(y - 1)}v2` : `M${x} ${y}h0`;
    n += 1;
  }
  return d;
}

const FIELD = starField();
const FRAME_PATHS = ASTEROID.map(([x, y]) => `${FIELD}M${x} ${y}h0`);

/* Reduced motion: the OS setting only (FINAL "Respect only the OS setting"). */
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

const getReduced = (): boolean => window.matchMedia(REDUCE_QUERY).matches;

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, getReduced, () => false);
}

/** Blink, Previous and Next: satin steel, 36 px on a mouse, 44 px on touch; pressed = action-soft with an action rule. */
const CONTROL =
  'satin-steel inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-transparent px-3 ' +
  'font-display text-[0.875rem] font-semibold text-ink transition-[background-color,transform] duration-micro ease-settle ' +
  'active:scale-[0.97] aria-pressed:border-line-strong aria-pressed:bg-action-soft ' +
  'aria-pressed:shadow-[inset_0_-2px_0_var(--action-line)] [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-w-11';

type SpotMessage = 'prompt' | 'found' | 'miss' | 'shown';

export interface BlinkComparatorProps {
  className?: string;
  /** Rendered between the reduced-motion note and Spot the mover: the figure's caption and Watch line. */
  caption?: ReactNode;
  /** `SPOT_THE_MOVER`, passed from the server so the content module stays out of the client bundle. */
  copy: typeof SPOT_THE_MOVER;
}

/**
 * G-06 blink comparator (client), the asteroid plate of the light table: three synthetic exposures of the same star
 * field in which one dot moves. Previous and Next step frames; Blink steps them every 600 ms for three cycles or until
 * pressed again. It never runs on its own; under reduced motion Blink is not shown (stepping still works).
 * **Spot the mover**: a press near the moving dot rings it in `action`; **Show me** rings it for keyboard and
 * screen-reader users. Messages go to a polite live region. Render it inside a `<figure>`: it returns the plate,
 * the note, `caption` and the game row as siblings.
 */
export function BlinkComparator({ className, caption, copy }: BlinkComparatorProps) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [frame, setFrame] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [found, setFound] = useState(false);
  const [message, setMessage] = useState<SpotMessage>('prompt');
  const reduced = useReducedMotion();
  const running = blinking && !reduced;

  useEffect(() => {
    if (!running) return;
    let steps = 0;
    const timer = window.setInterval(() => {
      steps += 1;
      setFrame((f) => (f + 1) % FRAMES);
      if (steps >= FRAMES * BLINK_CYCLES) setBlinking(false);
    }, BLINK_MS);
    // Stop when the plate leaves the viewport: no loop runs off-screen.
    const svg = svgRef.current;
    const observer =
      svg && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            if (entries.some((entry) => !entry.isIntersecting)) setBlinking(false);
          })
        : null;
    if (svg) observer?.observe(svg);
    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [running]);

  const step = useCallback((delta: 1 | -1) => {
    setBlinking(false);
    setFrame((f) => (f + delta + FRAMES) % FRAMES);
  }, []);

  const toggleBlink = useCallback(() => {
    if (reduced) return;
    setBlinking((on) => !on);
  }, [reduced]);

  const onPointerUp = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const m = event.currentTarget.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
      const [ax, ay] = ASTEROID[frame];
      const scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      const distPx = Math.hypot(p.x - ax, p.y - ay) * scale;
      if (distPx <= (event.pointerType === 'touch' ? HIT_TOUCH_PX : HIT_MOUSE_PX)) {
        setFound(true);
        setMessage('found');
      } else {
        setMessage('miss');
      }
    },
    [frame],
  );

  const showMe = useCallback(() => {
    setFound(true);
    setMessage('shown');
  }, []);

  const [ax, ay] = ASTEROID[frame];

  return (
    <>
      <div data-plate="" className={cn('plate-cyanotype relative isolate overflow-hidden rounded-panel', className)}>
        {/* Below 1024 px the controls sit under the field, so the empty foot of the frame is cropped (9:5, top-aligned). */}
        <div className="relative aspect-[9/5] w-full lg:aspect-[3/2]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMin slice"
            role="img"
            aria-labelledby={`${id}-t`}
            aria-describedby={`${id}-d`}
            className="absolute inset-0 block size-full cursor-crosshair touch-manipulation text-ink"
            style={{ fontSize: 'var(--plate-fs, 13px)' }}
            onPointerUp={onPointerUp}
          >
            <title id={`${id}-t`}>{`Blink comparator, frame ${frame + 1} of ${FRAMES}`}</title>
            <desc id={`${id}-d`}>
              {`${BLINK_UI.caption}. ${BLINK_UI.description}`}
            </desc>
            <path d={FRAME_PATHS[frame]} style={{ ...INK, strokeWidth: 1.6, opacity: 0.8 }} vectorEffect={NS} />
            {/* The reticle: hidden until found, then it rings the dot in every frame. Scales in 180 ms; fades only
                under reduced motion. */}
            <g
              aria-hidden="true"
              className={cn(
                'origin-center transition-[opacity,transform] duration-[180ms] ease-settle [transform-box:fill-box]',
                'motion-reduce:transition-opacity motion-reduce:duration-150',
                found ? 'scale-100 opacity-100' : 'scale-90 opacity-0 motion-reduce:scale-100',
              )}
            >
              <circle cx={ax} cy={ay} r={8} style={{ ...LIVE, strokeDasharray: '3 4' }} vectorEffect={NS} />
              <path
                d={`M${ax - 16} ${ay}h5M${ax + 11} ${ay}h5M${ax} ${ay - 16}v5M${ax} ${ay + 11}v5`}
                style={{ ...LIVE, strokeWidth: 1.5 }}
                vectorEffect={NS}
              />
            </g>
            <text x={16} y={FIELD_BOTTOM - 4} className="font-display fill-ink-muted">
              {BLINK_UI.fieldLabel}
            </text>
          </svg>
        </div>

        {/* Below the field on phones and tablets (44 px controls would cover the stars); over its foot on desktop. */}
        <div className="flex items-center gap-1.5 border-t border-line bg-surface px-2.5 py-2 lg:absolute lg:inset-x-0 lg:bottom-0 lg:z-[2]">
          <button
            type="button"
            className={cn(CONTROL, 'motion-reduce:hidden')}
            aria-pressed={running}
            onClick={toggleBlink}
          >
            {BLINK_UI.blink}
          </button>
          <button type="button" className={CONTROL} aria-label={BLINK_UI.previous} onClick={() => step(-1)}>
            <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.75} />
          </button>
          <button type="button" className={CONTROL} aria-label={BLINK_UI.next} onClick={() => step(1)}>
            <ChevronRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </button>
          <p
            className="m-0 ml-auto font-data text-[0.875rem] tabular text-aqua"
            aria-live={running ? 'off' : 'polite'}
            aria-atomic="true"
          >
            {BLINK_UI.frame(frame + 1, FRAMES)}
          </p>
        </div>
      </div>

      {/* Shown by CSS before paint, so there is no shift once the client knows the setting. */}
      <p className="m-0 hidden max-w-[36em] font-body text-caption text-ink-muted motion-reduce:block">
        {copy.reducedMotion}
      </p>

      {caption}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-body text-caption text-ink">
        <p className="m-0" aria-live="polite">
          {message === 'prompt' ? (
            <>
              <b className="font-display font-semibold">{copy.label}</b> {copy.prompt}
            </>
          ) : (
            copy[message]
          )}
        </p>
        <button type="button" className={CONTROL} onClick={showMe}>
          {copy.showMe}
        </button>
      </div>
    </>
  );
}
