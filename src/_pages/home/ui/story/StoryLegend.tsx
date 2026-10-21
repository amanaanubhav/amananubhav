'use client';

import { useEffect, useId, useState, useSyncExternalStore, type CSSProperties } from 'react';

import type { CSSVars } from '@/shared/lib/css';
import { useMotionTier } from '@/shared/lib/motion-tier';
import { setSceneParam, STORY_HYPSO_STOPS_M, STORY_TEMP_STOPS_C, storyRampGradient } from '@/shared/ui/stage';

import { LEGEND_COPY } from '../../config/copy';
import { ACTS, getPhase, getServerPhase, subscribePhase } from '../../lib/story-scroll';
import { STORY_PARAM, STORY_SCENE_ID } from '../scenes/story/frame';
import { STORY_HUE_VARS } from './palette-vars';
import styles from './story.module.css';

const TREK_DAYS = 14;

type Layer = 'alt' | 'temp';

const RAMP_STYLE: Record<Layer, CSSVars> = {
  alt: { '--ramp-night': storyRampGradient('night', 'alt'), '--ramp-day': storyRampGradient('day', 'alt') },
  temp: { '--ramp-night': storyRampGradient('night', 'temp'), '--ramp-day': storyRampGradient('day', 'temp') },
};

const TICKS: Record<Layer, { at: number; text: string }[]> = {
  alt: [
    { at: 1000, text: '1,000' },
    { at: 3000, text: '3,000' },
    { at: 5000, text: '5,000' },
    { at: 7000, text: '7,000 m' },
  ],
  temp: [
    { at: -20, text: '−20' },
    { at: -10, text: '−10' },
    { at: 0, text: '0 °C' },
    { at: 10, text: '+10' },
    { at: 20, text: '+20' },
  ],
};

function tickLeft(layer: Layer, at: number): CSSProperties {
  const range: readonly number[] = layer === 'alt' ? STORY_HYPSO_STOPS_M : STORY_TEMP_STOPS_C;
  const lo = range[0];
  const hi = range[range.length - 1];
  return { left: `${(((at - lo) / (hi - lo)) * 100).toFixed(1)}%` };
}

/**
 * The map legend (§13): fixed glass chrome. The live day and place, the Altitude | Temperature emphasis
 * (aria-pressed buttons; the scene swaps its fill, the story never changes), the ramp drawn from the same
 * stops as the shader, the isotherm key and the honesty note ("modelled from altitude, not measured").
 * "Key" discloses the line styles. Server-rendered with its default text (no layout shift when the scene
 * arrives); it fades out as the map dissolves. At tier 0 (the static plan sheet) it shows the trek line
 * and the line key only. A recede pool sits under it (`data-recede-chrome`).
 */
export function StoryLegend() {
  const tier = useMotionTier();
  const staged = tier > 0;
  const phase = useSyncExternalStore(subscribePhase, getPhase, getServerPhase);
  const [layer, setLayer] = useState<Layer>('alt');
  const [open, setOpen] = useState(false);
  const keyId = useId();

  useEffect(() => {
    setSceneParam(STORY_SCENE_ID, STORY_PARAM.layer, layer);
  }, [layer]);

  const act = ACTS[phase.act];
  const whole = !staged || phase.overview || !act.place;
  const day = whole ? LEGEND_COPY.wholeDays(TREK_DAYS) : LEGEND_COPY.day(act.day, TREK_DAYS);
  const place = whole ? LEGEND_COPY.wholePlace : act.place;

  return (
    <aside
      aria-label={LEGEND_COPY.label}
      data-recede-chrome=""
      data-hidden={staged && phase.legendHidden ? '' : undefined}
      data-open={open ? '' : undefined}
      className={styles.legend}
      style={STORY_HUE_VARS}
    >
      <p className={styles.where}>
        <span className={styles.day}>{day}</span>
        <span className={styles.place}>{place}</span>
      </p>
      <div className={styles.row}>
        {staged ? (
          <div className={styles.switch} role="group" aria-label={LEGEND_COPY.emphasis}>
            <button type="button" aria-pressed={layer === 'alt'} onClick={() => setLayer('alt')}>
              {LEGEND_COPY.altitude}
            </button>
            <button type="button" aria-pressed={layer === 'temp'} onClick={() => setLayer('temp')}>
              {LEGEND_COPY.temperature}
            </button>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={styles.more}
          aria-expanded={open}
          aria-controls={keyId}
          onClick={() => setOpen((v) => !v)}
        >
          {LEGEND_COPY.key}
        </button>
      </div>
      {staged ? (
        <>
          <div className={styles.bar} style={RAMP_STYLE[layer]} aria-hidden="true" />
          <ol className={styles.ticks} aria-label={layer === 'alt' ? LEGEND_COPY.altitudeScale : LEGEND_COPY.temperatureScale}>
            {TICKS[layer].map((t) => (
              <li key={t.text} style={tickLeft(layer, t.at)}>
                {t.text}
              </li>
            ))}
          </ol>
          <ul className={styles.iso}>
            <li>
              <span className={`${styles.line} ${styles.lineWarm}`} aria-hidden="true" />
              {LEGEND_COPY.isoWarm}
            </li>
            <li>
              <span className={styles.line} aria-hidden="true" />
              {LEGEND_COPY.isoZero}
            </li>
            <li>
              <span className={`${styles.line} ${styles.lineCold}`} aria-hidden="true" />
              {LEGEND_COPY.isoCold}
            </li>
            <li>
              <span className={styles.frost} aria-hidden="true" />
              {LEGEND_COPY.frost}
            </li>
          </ul>
          <p className={styles.note}>{layer === 'alt' ? LEGEND_COPY.noteAltitude : LEGEND_COPY.noteTemperature}</p>
        </>
      ) : null}
      <div id={keyId} hidden={!open}>
        <ul className={styles.keys}>
          {LEGEND_COPY.keys.map((k) => (
            <li key={k.id}>
              <span className={`${styles.k} ${styles[k.style]}`} aria-hidden="true" />
              {k.text}
            </li>
          ))}
        </ul>
        <p className={styles.honesty}>{LEGEND_COPY.honesty}</p>
      </div>
    </aside>
  );
}
