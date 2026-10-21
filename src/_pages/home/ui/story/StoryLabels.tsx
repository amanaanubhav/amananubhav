'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useSceneFrame } from '@/shared/ui/stage';

import {
  dissolveAt,
  MARK_STRIDE,
  MOBILE_MAX_WIDTH,
  S_OVERVIEW,
  type StoryFrame,
} from '../../config/story-timeline';
import { storyObstacles } from '../../lib/story-driver';
import {
  headReadout,
  joinMarkTexts,
  labelPriority,
  placeLabels,
  type Box,
  type MarkAltitude,
  type PlaceInput,
} from '../../lib/story-labels';
import styles from './story.module.css';

const HEAD = -1;
const CAP = { desktop: 9, mobile: 5 } as const;

interface Size {
  w: number;
  h: number;
}

/**
 * The map's DOM labels (§8): the scene projects every mark each frame (StoryFrame); this layer decides
 * which are named (priority), places them clear of the text, the chrome, the walker and each other, and
 * caps them at 9 (5 on phones). Transform and opacity only; aria-hidden with the stage (RouteList has
 * the same facts as text).
 */
export function StoryLabels({ altitudes, hidden }: { altitudes: readonly MarkAltitude[]; hidden: boolean }) {
  const texts = useMemo(() => joinMarkTexts(altitudes), [altitudes]);
  const labelled = useMemo(() => texts.filter((t) => t.mark.label), [texts]);
  const els = useRef(new Map<number, HTMLDivElement>());
  const temps = useRef(new Map<number, HTMLSpanElement>());
  const sizes = useRef(new Map<number, Size>());
  const shown = useRef(new Set<number>());
  const headAlt = useRef<HTMLSpanElement>(null);
  const headTemp = useRef<HTMLSpanElement>(null);
  const hereRef = useRef(-1);

  const measure = (index: number) => {
    const el = els.current.get(index);
    if (el) sizes.current.set(index, { w: el.offsetWidth, h: el.offsetHeight });
  };

  useEffect(() => {
    const all = () => {
      els.current.forEach((_, index) => measure(index));
    };
    all();
    void document.fonts?.ready.then(all);
    window.addEventListener('resize', all);
    return () => window.removeEventListener('resize', all);
  }, []);

  useSceneFrame<StoryFrame>('relief-annapurna', (frame) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = frame.s;
    const overview = s >= S_OVERVIEW;
    const ctx = { s, strip: frame.strip, overview };
    const m = frame.marks;
    const fading = dissolveAt(s) >= 0.5;

    // The readout and the "here" stop (their text changes the label size, so re-measure on change).
    const ro = headReadout(frame, texts, ctx);
    const setText = (span: HTMLSpanElement | null | undefined, value: string, index: number) => {
      if (span && span.textContent !== value) {
        span.textContent = value;
        measure(index);
      }
    };
    setText(headAlt.current, ro.alt, HEAD);
    setText(headTemp.current, ro.temp, HEAD);
    if (hereRef.current !== ro.here) {
      const prev = hereRef.current;
      if (prev >= 0) {
        els.current.get(prev)?.removeAttribute('data-here');
        setText(temps.current.get(prev), '', prev);
      }
      hereRef.current = ro.here;
    }
    if (ro.here >= 0) {
      els.current.get(ro.here)?.setAttribute('data-here', '');
      setText(temps.current.get(ro.here), ro.temp, ro.here);
    }

    const candidates: PlaceInput[] = [];
    if (!fading) {
      for (const t of labelled) {
        const o = t.index * MARK_STRIDE;
        if (m[o + 2] < 0.5) continue;
        const priority = labelPriority(t.mark, m[o + 3], m[o + 4], ctx);
        const size = sizes.current.get(t.index);
        if (priority <= 0 || !size) continue;
        candidates.push({ index: t.index, role: t.mark.role, priority, x: m[o], y: m[o + 1], ...size });
      }
      const headSize = sizes.current.get(HEAD);
      // The head readout is folded into the stop's label when the head stands at a named stop.
      if (ro.alt && ro.here < 0 && frame.head[2] > 0.5 && headSize) {
        candidates.push({ index: HEAD, role: 'head', priority: 11, x: frame.head[0], y: frame.head[1], ...headSize });
      }
    }

    const obstacles: Box[] = [];
    for (const r of storyObstacles.text) obstacles.push([r[0] + 4, r[1] + 4, r[2] - 4, r[3] - 4]);
    for (const r of storyObstacles.chrome) obstacles.push([r[0] - 2, r[1] - 2, r[2] + 2, r[3] + 2]);
    if (!overview && frame.head[2] > 0.5) {
      const [hx, hy] = frame.head;
      obstacles.push([hx - 11, hy - 11, hx + 11, hy + 11]);
    }

    const cap = vw <= MOBILE_MAX_WIDTH ? CAP.mobile : CAP.desktop;
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

  const setEl = (index: number) => (el: HTMLDivElement | null) => {
    if (el) els.current.set(index, el);
    else els.current.delete(index);
  };
  const setTemp = (index: number) => (el: HTMLSpanElement | null) => {
    if (el) temps.current.set(index, el);
    else temps.current.delete(index);
  };

  return (
    <div className={styles.labels} data-wait={hidden ? '' : undefined}>
      {labelled.map(({ mark, index, alt }) => (
        <div
          key={mark.id}
          ref={setEl(index)}
          className={styles.lbl}
          data-role={mark.role}
          data-freeze={mark.id === 'tick-freeze' ? '' : undefined}
        >
          {mark.role === 'peak' ? (
            <>
              {alt ? <span className={styles.a}>{alt}</span> : null}
              <span className={styles.n}>{mark.label}</span>
            </>
          ) : (
            <>
              <span className={styles.n}>{mark.label}</span>
              {alt ? <span className={styles.a}>{alt}</span> : null}
              {mark.sub ? <span className={styles.a}>{mark.sub}</span> : null}
              {mark.approx ? <span className={styles.q}>approx.</span> : null}
              <span ref={setTemp(index)} className={styles.t} />
            </>
          )}
        </div>
      ))}
      <div ref={setEl(HEAD)} className={styles.lbl} data-role="head">
        <span ref={headAlt} className={styles.n} />
        <span ref={headTemp} className={styles.t} />
      </div>
    </div>
  );
}
