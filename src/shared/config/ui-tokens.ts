/**
 * Motion and layering tokens (DESIGN-SPEC §B.7, §B.8): the TS mirror of the CSS variables in
 * src/_app/styles/globals.css (`--ease-*`, `--dur-*`) and of the Tailwind `z-*` keys. Hand-written.
 * No overshoot anywhere; exits run at about 65% of the entrance; reveals travel 24 px at most.
 */
export const MOTION = {
  /** GSAP ease names matching the CSS cubic-beziers below. */
  ease: { settle: 'expo.out', glide: 'power2.inOut', pen: 'power1.inOut', depart: 'power2.in', breath: 'sine.inOut' },
  /** cubic-bezier control points for motion/react `ease` and the Web Animations API. */
  bezier: {
    settle: [0.16, 1, 0.3, 1], glide: [0.65, 0, 0.35, 1], pen: [0.45, 0.05, 0.25, 1],
    depart: [0.55, 0, 1, 0.45], breath: [0.37, 0, 0.63, 1],
  },
  /** Durations in seconds. */
  dur: { micro: 0.12, hover: 0.18, ui: 0.28, overlay: 0.45, overlayOut: 0.3, reveal: 0.8, theme: 0.7, hero: 2.4 },
  /** stroke draw: 600 ms + 0.6 ms per px of path, capped at 1600 ms */
  drawDuration: (pathPx: number) => Math.min(1.6, 0.6 + pathPx * 0.0006),
  stagger: { lines: 0.07, rows: 0.04, rowsCap: 0.24, frames: 0.08, framesMax: 6 },
  /** The one calm spring of the site (`spring-calm` in §H). Pass it as the motion `transition`. */
  spring: { type: 'spring', visualDuration: 0.45, bounce: 0 },
  lenis: { lerp: 0.09 },
} as const;

/** One z-index scale for the whole site (§B.7); the Tailwind `z-*` keys carry the same numbers. */
export const Z_INDEX = {
  stage: 0, grain: 5, content: 10, rail: 40, chat: 60, chatWindow: 61, reader: 90, navbar: 95, progress: 96,
  terminal: 100, vault: 105, themeEdge: 110, preloader: 120, skip: 130,
} as const;
