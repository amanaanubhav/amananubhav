import { Fragment, type CSSProperties } from 'react';

import { cn } from '@/shared/lib/cn';
import { RIDGE_SUMMIT_T, trekkerFor } from '@/shared/ui/ridge-mark';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import {
  CUE_HALF_T,
  RIDGE_AMPLITUDE_EM,
  RIDGE_BAND_EM,
  TREKKER_VIEWBOX,
  restCuePath,
  restRidgePath,
} from './ridge-path';
import { RidgeNameMotion, type RidgeNameSurface } from './RidgeNameMotion';
import styles from './ridge-name.module.css';

/** `stack`: one word per line; `line`: one line; `auto`: two lines below 640 px, one line from 640 px. */
export type RidgeNameLayout = 'stack' | 'line' | 'auto';

export interface RidgeNameProps {
  text: string;
  /** `h1` for the hero; a decorative `p` for the footer sheet. */
  as?: 'h1' | 'p';
  id?: string;
  layout?: RidgeNameLayout;
  /** `name`: the hero's proportions (lift 0.12 em, ridge 0.28 em). `sheet`: the footer's, fitted to its band. */
  span?: RidgeNameSurface;
  /** Wholly `aria-hidden` (the footer: its © line carries the name). Otherwise the name is read once, as text. */
  decorative?: boolean;
  /** Footer: a new value (the route) re-arms the arrival pass. */
  replayKey?: string;
  className?: string;
}

const SURFACE_CLASS: Record<RidgeNameSurface, string> = { name: styles.hero, sheet: styles.sheet };
/** `stack` is the default frame (one word per line); `line` and `auto` change it. */
const LAYOUT_CLASS: Partial<Record<RidgeNameLayout, string>> = { line: styles.line, auto: styles.auto };
/** The trekker's usual height on each surface (px; 0.2 em of a 121 px / 172 px name), for the mark's figure rule. */
const TREKKER_PX: Record<RidgeNameSurface, number> = { name: 24, sheet: 34 };

/**
 * Survey Ridge (HERO-FOOTER-SPEC §2): his name as the terrain his own ridge mark stands on. Server-rendered and
 * complete without script: solid ink letters, the brushed-steel ridge (the mark's sheen) stretched under the last
 * line, the trekker lit bronze on its summit with the bronze cue under his feet. The letters are inline spans (the
 * name keeps its kerning); `RidgeNameMotion` is the only client part and loads the engine only when motion is
 * allowed. Never hidden or delayed: this is the hero's LCP text.
 */
export function RidgeName({
  text,
  as: Tag = 'p',
  id,
  layout = 'stack',
  span = 'name',
  decorative = false,
  replayKey,
  className,
}: RidgeNameProps) {
  const words = text.split(' ');
  const amplitude = RIDGE_AMPLITUDE_EM[span];
  const steelId = `ridge-name-steel-${span}`;
  const figure = trekkerFor(TREKKER_PX[span]);
  const cues: Array<'stack' | 'line'> = layout === 'auto' ? ['stack', 'line'] : [layout];

  return (
    <Tag
      id={id}
      aria-hidden={decorative ? true : undefined}
      className={cn(styles.root, SURFACE_CLASS[span], LAYOUT_CLASS[layout], className)}
    >
      {decorative ? null : <VisuallyHidden>{text}</VisuallyHidden>}
      <RidgeNameMotion
        surface={span}
        replayKey={replayKey}
        className={styles.vis}
        style={{ '--rn-summit': RIDGE_SUMMIT_T } as CSSProperties}
      >
        <span className={styles.rings} data-rn-rings="" />
        {words.map((word, w) => (
          // Static text: the index is the word's identity.
          <Fragment key={w}>
            {w > 0 ? <span className={styles.space}> </span> : null}
            <span className={styles.word} data-rn-word="">
              {Array.from(word).map((char, i) => (
                <span key={i} className={styles.letter} data-rn-letter="">
                  {char}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
        <svg
          className={styles.ridge}
          data-rn-ridge=""
          viewBox={`0 0 1 ${RIDGE_BAND_EM}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={steelId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={styles.steel1} />
              <stop offset="0.28" className={styles.steel2} />
              <stop offset="0.62" className={styles.steel3} />
              <stop offset="1" className={styles.steel4} />
            </linearGradient>
          </defs>
          <path className={styles.base} data-rn-base="" d={restRidgePath(amplitude)} stroke={`url(#${steelId})`} />
          {cues.map((cue) => (
            <path
              key={cue}
              className={cn(styles.cue, cue === 'stack' ? styles.cueStack : styles.cueLine)}
              data-rn-cue=""
              d={restCuePath(amplitude, CUE_HALF_T[cue])}
            />
          ))}
        </svg>
        <svg className={styles.trek} data-rn-trek="" viewBox={TREKKER_VIEWBOX} aria-hidden="true" focusable="false">
          <circle cx={figure.head.cx} cy={figure.head.cy} r={figure.head.r} />
          <path d={figure.body} />
          {figure.limbs ? <path className={styles.limbs} d={figure.limbs.d} strokeWidth={figure.limbs.width} /> : null}
        </svg>
      </RidgeNameMotion>
    </Tag>
  );
}
