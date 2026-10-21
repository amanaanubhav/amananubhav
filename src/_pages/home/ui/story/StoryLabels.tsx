'use client';

import { useEffect, useRef } from 'react';

import { useSceneFrame } from '@/shared/ui/stage';

import { storyObstacles } from '../../lib/story-driver';
import {
  formatTempC,
  markAltitude,
  placeLabels,
  readoutAltitude,
  type Box,
  type PlaceInput,
} from '../../lib/story-labels';
import { STORY_SCENE_ID, type StoryFrame } from '../scenes/story/frame';
import { STORY_MARKS } from '../scenes/story/marks';
import { STORY_MOBILE_MAX_WIDTH } from '../scenes/story/timeline';
import styles from './story.module.css';

const CAP = { desktop: 9, mobile: 5 } as const;
const HEAD_INDEX = STORY_MARKS.findIndex((m) => m.kind === 'head');

/** The marks that carry a label (the head readout is placed like one). */
const LABELLED = STORY_MARKS.map((mark, index) => ({ mark, index })).filter(
  ({ mark }) => mark.name !== '' && mark.kind !== 'head',
);

interface Size {
  w: number;
  h: number;
}

/**
 * The map's DOM labels (§8): the scene projects every mark each frame and says which want a label
 * (priority, visibility, "here"); this layer places them clear of the text, the chrome, the walker and
 * each other, capped at 9 (5 on phones). Transform and opacity only; aria-hidden with the stage (the
 * route list has the same facts as text). `hidden` until the relief has risen far enough (the slot's
 * `data-stage-shown`); the layer then fades in over 240 ms.
 */
export function StoryLabels({ hidden }: { hidden: boolean }) {
  const els = useRef(new Map<number, HTMLDivElement>());
  const temps = useRef(new Map<number, HTMLSpanElement>());
  const sizes = useRef(new Map<number, Size>());
  const shown = useRef(new Set<number>());
  const here = useRef(-1);
  const headAlt = useRef<HTMLSpanElement>(null);
  const headTemp = useRef<HTMLSpanElement>(null);

  const root = useRef<HTMLDivElement>(null);

  const measure = (index: number) => {
    const el = els.current.get(index);
    if (el) sizes.current.set(index, { w: el.offsetWidth, h: el.offsetHeight });
  };

  useEffect(() => {
    // Index the label elements once (the list is static): the label and its "here" °C slot.
    root.current?.querySelectorAll<HTMLDivElement>('[data-index]').forEach((el) => {
      const index = Number(el.dataset.index);
      els.current.set(index, el);
      const t = el.querySelector<HTMLSpanElement>('[data-temp]');
      if (t) temps.current.set(index, t);
    });
    const all = () => els.current.forEach((_, index) => measure(index));
    all();
    void document.fonts?.ready.then(all);
    window.addEventListener('resize', all);
    return () => window.removeEventListener('resize', all);
  }, []);

  useSceneFrame<StoryFrame>(STORY_SCENE_ID, (frame) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const setText = (span: HTMLSpanElement | null | undefined, value: string, index: number) => {
      if (span && span.textContent !== value) {
        span.textContent = value;
        measure(index);
      }
    };

    // The readout: folded into the "here" stop's label (its °C), or on its own beside the head.
    const temp = frame.readout ? formatTempC(frame.readout.tempC) : '';
    // The stop the head is at: the scene's "here", or the stop whose cited altitude the readout shows.
    let hereIndex = frame.marks.findIndex((m) => m.here);
    if (hereIndex < 0 && frame.readout?.at) hereIndex = STORY_MARKS.findIndex((m) => m.id === frame.readout?.at);
    if (here.current !== hereIndex) {
      if (here.current >= 0) {
        els.current.get(here.current)?.removeAttribute('data-here');
        setText(temps.current.get(here.current), '', here.current);
      }
      here.current = hereIndex;
      if (hereIndex >= 0) els.current.get(hereIndex)?.setAttribute('data-here', '');
    }
    if (hereIndex >= 0) setText(temps.current.get(hereIndex), temp, hereIndex);
    setText(headAlt.current, frame.readout && hereIndex < 0 ? readoutAltitude(frame) : '', HEAD_INDEX);
    setText(headTemp.current, frame.readout && hereIndex < 0 ? temp : '', HEAD_INDEX);

    const candidates: PlaceInput[] = [];
    if (frame.dissolve < 0.5 && frame.live) {
      for (const { index } of LABELLED) {
        const m = frame.marks[index];
        const size = sizes.current.get(index);
        if (!m || !m.visible || m.pri <= 0 || !size) continue;
        candidates.push({ index, role: m.kind, priority: m.pri, x: m.x, y: m.y, ...size });
      }
      const headSize = sizes.current.get(HEAD_INDEX);
      if (frame.readout && hereIndex < 0 && frame.head.visible && headSize) {
        candidates.push({ index: HEAD_INDEX, role: 'head', priority: 11, x: frame.head.x, y: frame.head.y, ...headSize });
      }
    }

    const obstacles: Box[] = [];
    for (const r of storyObstacles.text) obstacles.push([r[0] + 4, r[1] + 4, r[2] - 4, r[3] - 4]);
    for (const r of storyObstacles.chrome) obstacles.push([r[0] - 2, r[1] - 2, r[2] + 2, r[3] + 2]);
    if (frame.head.visible) {
      const { x, y } = frame.head;
      obstacles.push([x - 11, y - 11, x + 11, y + 11]);
    }

    const cap = vw <= STORY_MOBILE_MAX_WIDTH ? CAP.mobile : CAP.desktop;
    const placed = placeLabels(candidates, obstacles, vw, vh, cap);
    const on = new Set<number>();
    for (const p of placed) {
      const el = els.current.get(p.index);
      if (!el) continue;
      on.add(p.index);
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      if (!shown.current.has(p.index)) el.setAttribute('data-on', '');
    }
    shown.current.forEach((index) => {
      if (!on.has(index)) els.current.get(index)?.removeAttribute('data-on');
    });
    shown.current = on;
  });

  return (
    <div ref={root} className={styles.labels} data-wait={hidden ? '' : undefined}>
      {LABELLED.map(({ mark, index }) => {
        const alt = markAltitude(mark);
        return (
          <div
            key={mark.id}
            data-index={index}
            className={styles.lbl}
            data-role={mark.kind}
            data-freeze={mark.level === 'freeze' ? '' : undefined}
          >
            {mark.kind === 'peak' ? (
              <>
                {alt ? <span className={styles.a}>{alt}</span> : null}
                <span className={styles.n}>{mark.name}</span>
              </>
            ) : (
              <>
                <span className={styles.n}>{mark.name}</span>
                {alt ? <span className={styles.a}>{alt}</span> : null}
                {mark.sub ? <span className={styles.a}>{mark.sub}</span> : null}
                {mark.approxPlace ? <span className={styles.q}>approx.</span> : null}
                <span data-temp="" className={styles.t} />
              </>
            )}
          </div>
        );
      })}
      {HEAD_INDEX >= 0 ? (
        <div data-index={HEAD_INDEX} className={styles.lbl} data-role="head">
          <span ref={headAlt} className={styles.n} />
          <span ref={headTemp} className={styles.t} />
        </div>
      ) : null}
    </div>
  );
}
