import type { RefObject } from 'react';
import { brightestAbove, formatIST, skyTimeAt } from '@/shared/lib/astro';
import { gsap, ScrollTrigger, useGSAP } from '@/shared/lib/gsap';
import { getMotionTier, useMotionAllowed } from '@/shared/lib/motion-tier';
import { setSceneProgress } from '@/shared/ui/stage';

/** Static layout (tier 0, reduced motion): the scene's p rests here, about 20:40 IST (§G.2). */
export const SKY_STATIC_PROGRESS = 0.2;
/**
 * The static readout is worked out for the poster's own moment, so the words match the picture: G-04b
 * `SKY_POSTER` is drawn for Jan 15, 21:00 IST, which is 2.5 h into the 18:30 to 05:30 track.
 */
export const SKY_POSTER_PROGRESS = 2.5 / 11;

/** Jan 15 (noon IST) of the current year: the base date of the G-04b poster's sky. */
function posterBaseDate(): Date {
  return new Date(Date.UTC(new Date().getUTCFullYear(), 0, 15, 6, 30));
}
/** The altitude readout stops counting metres and starts counting star degrees here. */
export const SKY_MORPH_AT = 0.15;
/** "ALT 90° · zenith" holds for a beat after the morph, then the brightest named star takes over. */
const ZENITH_UNTIL = 0.19;
/** Brightest named star at least this high (degrees). */
const MIN_STAR_ALT = 20;
/** Share of the track at each end over which the ground crossfades to the sky ground and back. */
const GROUND_FADE = 0.2;

export const SKY_ZENITH_TEXT = 'ALT 90° · zenith';
export const SKY_ALT_LABEL = { metres: 'Altitude', stars: 'Star altitude, degrees above the horizon' } as const;

export type SkyPhase = 'metres' | 'stars';

/** Text nodes the readout writes into. Written per frame through refs, never through React state. */
export interface SkyReadoutRefs {
  /** The `time` value. */
  time: RefObject<HTMLElement | null>;
  /** Wrapper of the two stacked altitude values; carries `data-phase` (CSS crossfades on it). */
  phase: RefObject<HTMLElement | null>;
  /** The "5,416 m · Thorong La" value. */
  metres: RefObject<HTMLElement | null>;
  /** The "ALT 42° · Sirius" value. */
  star: RefObject<HTMLElement | null>;
  /** Visually hidden accessible name of the altitude row. */
  label: RefObject<HTMLElement | null>;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

/** 0 at both ends of the track, 1 through the middle: the ground blend toward `ground-sky`. */
export function skyGroundMix(progress: number): number {
  const p = clamp01(progress);
  if (p < GROUND_FADE) return p / GROUND_FADE;
  if (p > 1 - GROUND_FADE) return (1 - p) / GROUND_FADE;
  return 1;
}

/** The star line for a scrubbed time: zenith right after the morph, then the brightest named star above 20°. */
export function skyStarText(progress: number, date: Date): string {
  if (progress < ZENITH_UNTIL) return SKY_ZENITH_TEXT;
  const best = brightestAbove(date, MIN_STAR_ALT);
  return best ? `ALT ${Math.round(best.altDeg)}° · ${best.star.name}` : SKY_ZENITH_TEXT;
}

/**
 * A writer for the clock log. `base` is the visitor's current date (so the sky is tonight's); it only writes a
 * text node when its string changes, so the star line updates only when the integer degree changes.
 */
export function createSkyReadout(refs: SkyReadoutRefs, base: Date): (progress: number) => void {
  let lastTime = '';
  let lastPhase: SkyPhase | '' = '';
  let lastStar = '';

  return (progress: number) => {
    const p = clamp01(progress);
    const date = skyTimeAt(p, base);

    const time = formatIST(date);
    if (time !== lastTime && refs.time.current) {
      refs.time.current.textContent = time;
      lastTime = time;
    }

    const phase: SkyPhase = p < SKY_MORPH_AT ? 'metres' : 'stars';
    if (phase !== lastPhase) {
      refs.phase.current?.setAttribute('data-phase', phase);
      refs.metres.current?.setAttribute('aria-hidden', phase === 'metres' ? 'false' : 'true');
      refs.star.current?.setAttribute('aria-hidden', phase === 'stars' ? 'false' : 'true');
      if (refs.label.current) refs.label.current.textContent = SKY_ALT_LABEL[phase];
      lastPhase = phase;
    }

    if (phase === 'stars') {
      const star = skyStarText(p, date);
      if (star !== lastStar && refs.star.current) {
        refs.star.current.textContent = star;
        lastStar = star;
      }
    }
  };
}

export interface SkyProgressOptions {
  /** The `#sky` section: scope for the GSAP context. */
  section: RefObject<HTMLElement | null>;
  /** The scrub range (`start: 'top top'`, `end: 'bottom bottom'`): the whole track at >= 1024 px; below, from
   * where the band sticks to the end of the track. */
  track: RefObject<HTMLElement | null>;
  readout: SkyReadoutRefs;
}

/**
 * The Night ground crossfade `ground` -> `ground-sky` (§G.2). The stage canvas sits behind the page with a transparent
 * clear, so a background on the section would hide the scene; the blend is painted on the body instead, which
 * is only visible through the track while 0 < p < 1 (the track then fills the viewport). Writes only when the
 * rounded percentage changes; `null` restores the stylesheet ground.
 */
interface GroundPainter {
  paint: (mix: number | null) => void;
  /** Stops watching the theme and restores the stylesheet ground. */
  dispose: () => void;
}

function createGroundPainter(): GroundPainter {
  const root = document.documentElement;
  let last = -1;
  let mix: number | null = null;

  const write = () => {
    // Night only: in Day the star field prints as ink on paper (§G.2).
    const day = root.dataset.theme === 'day';
    const pct = mix === null || day ? 0 : Math.round(mix * 100);
    if (pct === last) return;
    last = pct;
    document.body.style.backgroundColor =
      pct === 0 ? '' : `color-mix(in srgb, var(--ground-sky) ${pct}%, var(--ground))`;
  };

  // A theme switch mid-track repaints at once instead of waiting for the next scroll update.
  const observer = new MutationObserver(write);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  return {
    paint: (next) => {
      mix = next;
      write();
    },
    dispose: () => {
      observer.disconnect();
      mix = null;
      write();
    },
  };
}

/**
 * The one ScrollTrigger of `/personal#sky` (§G.2, §C.2): scrubbed progress p over the track drives the scene
 * (`setSceneProgress('sky', p)`), the clock log and the `ALT 90°` morph, and the ground crossfade. Created only
 * when motion is allowed; reverted on unmount through `useGSAP`. In the static layout p rests at
 * {@link SKY_STATIC_PROGRESS} and the readout shows its final ALT form for the poster's night
 * ({@link SKY_POSTER_PROGRESS}, Jan 15).
 */
export function useSkyProgress({ section, track, readout }: SkyProgressOptions): void {
  const motionAllowed = useMotionAllowed();

  useGSAP(
    () => {
      const trackEl = track.current;
      if (!section.current || !trackEl) return;
      const write = createSkyReadout(readout, new Date());

      // Static layout: the poster (a January night) replaces the scene, so the readout describes that night.
      const rest = () => {
        createSkyReadout(readout, posterBaseDate())(SKY_POSTER_PROGRESS);
        setSceneProgress('sky', SKY_STATIC_PROGRESS);
      };

      if (!motionAllowed) {
        // The tier store's server snapshot is 0 during hydration; only rest when the real tier is 0 too,
        // otherwise the next render (motion allowed) creates the trigger and nothing flickers.
        if (getMotionTier() === 0) rest();
        return;
      }

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const ground = createGroundPainter();
        const apply = (p: number) => {
          setSceneProgress('sky', p);
          write(p);
          ground.paint(skyGroundMix(p));
        };
        const trigger = ScrollTrigger.create({
          trigger: trackEl,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        });
        apply(trigger.progress);
        return () => ground.dispose();
      });
      mm.add('(prefers-reduced-motion: reduce)', rest);

      return () => mm.revert();
    },
    { scope: section, dependencies: [motionAllowed], revertOnUpdate: true },
  );
}
