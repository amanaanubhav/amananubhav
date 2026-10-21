'use client';

import { useEffect, useRef } from 'react';

import type { CSSVars } from '@/shared/lib/css';
import { useMotionTier } from '@/shared/lib/motion-tier';
import { useSceneFrame } from '@/shared/ui/stage';

import { numeralAt, onStoryTick } from '../../lib/story-scroll';
import { STORY_SCENE_ID, type StoryFrame } from '../scenes/story/frame';
import { STORY_NUMERAL } from '../scenes/story/timeline';
import styles from './story.module.css';

const NUMBER = new Intl.NumberFormat('en');

export interface StoryNumeralProps {
  kicker: string;
  after: string;
  /** The span (s, vh) in which the numeral sticks: from the climb into the summit hold. */
  span: readonly [number, number];
}

/**
 * The summit numeral (§5.4): DOM text, sticky while the head climbs to Thorong La and holds there. It
 * counts 4,880 -> 5,416 with the walk (one value per tick, written to the text node, no React render) and
 * sits at 5,416 for the hold. Static layout: the final value, not sticky. Decorative (aria-hidden): the
 * pass altitude is in entry 4's log and the route list.
 */
export function StoryNumeral({ kicker, after, span }: StoryNumeralProps) {
  const tier = useMotionTier();
  const valueRef = useRef<HTMLSpanElement>(null);
  const sceneLive = useRef(false);

  const write = (metres: number) => {
    const el = valueRef.current;
    const text = NUMBER.format(metres);
    if (el && el.textContent !== text) el.textContent = text;
  };

  // The live scene's count (the same clock as the head); the page's own damped story before it arrives.
  useSceneFrame<StoryFrame>(STORY_SCENE_ID, (frame) => {
    sceneLive.current = frame.live;
    if (frame.live) write(Math.round(frame.numeralM / 2) * 2);
  });

  useEffect(() => {
    if (tier === 0) {
      write(STORY_NUMERAL.toM);
      return;
    }
    return onStoryTick((s) => {
      if (!sceneLive.current) write(numeralAt(s));
    });
  }, [tier]);

  const style: CSSVars = { '--wdth': 75 };
  return (
    <li aria-hidden="true" data-story-span={`${span[0]},${span[1]}`}>
      <div data-story-stick="" data-recede="" className={`${styles.stick} py-6`}>
        <span className="block font-display text-[0.9375rem] font-semibold text-ink">{kicker}</span>
        <span
          style={style}
          className="mt-2 block font-display text-[clamp(5.25rem,10.5vw,10.5rem)] font-bold leading-[0.9] tracking-[-0.04em] text-ink tabular [font-variation-settings:'wdth'_var(--wdth,100)] max-md:text-[5.75rem]"
        >
          <span ref={valueRef}>{NUMBER.format(STORY_NUMERAL.toM)}</span>
          <span className="ml-[0.12em] text-[0.32em] font-semibold tracking-normal">m</span>
        </span>
        <span className="mt-3 block max-w-[24em] font-body text-body text-ink">{after}</span>
      </div>
      <div aria-hidden="true" className="motion-stage" style={{ height: `${span[1] - span[0]}vh` }} />
    </li>
  );
}
