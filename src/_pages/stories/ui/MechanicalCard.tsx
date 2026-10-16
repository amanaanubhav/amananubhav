'use client';

import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { storyLayoutIds, type Story } from '@/entities/story';
import { openStory } from '@/features/read-story';
import type { CSSVars } from '@/shared/lib/css';
import { Log } from '@/shared/ui/journal';
import { storyDateTime } from '../lib/story-date';

interface MechanicalCardProps {
  story: Story;
  index: number;
  /** The 3:2 cover plate, rendered on the server (StoryCover). */
  cover: ReactNode;
}

/**
 * One field note as a journal page on the stack (§G.4): `surface`, `rounded-panel`, `shadow-float`; a log
 * (date, category, place); the title and subtitle; the 3:2 cover. The cover sits in the exact shared-element
 * structure the story reader uses (`storyLayoutIds`: container > image > cover, plus the title), so opening
 * a card morphs into the reader (§K.8). The title's button is the card's one control; its hit area covers
 * the whole page.
 */
export function MechanicalCard({ story, index, cover }: MechanicalCardProps) {
  const ids = storyLayoutIds(story.id);
  const titleId = `field-note-${story.id}`;
  const dateTime = storyDateTime(story.date);
  const style: CSSVars = { zIndex: index + 1, '--card-index': index };

  return (
    <div className="blog-card fn-card" style={style}>
      <article
        aria-labelledby={titleId}
        className={
          'group relative mx-auto grid w-full max-w-5xl gap-5 rounded-panel border border-line bg-surface p-4 shadow-float ' +
          'md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8 md:p-6 lg:p-8 ' +
          'has-[:focus-visible]:[outline-style:solid] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-signal'
        }
      >
        <div data-fn-dim="" className="min-w-0 md:order-2">
          <motion.div layoutId={ids.container} className="relative w-full">
            <motion.div layoutId={ids.image} className="relative w-full">
              {cover}
            </motion.div>
          </motion.div>
        </div>

        <div data-fn-dim="" className="flex min-w-0 flex-col md:order-1">
          <Log
            layout="strip"
            label="Field note log"
            items={[
              { key: 'date', value: dateTime ? <time dateTime={dateTime}>{story.date}</time> : story.date },
              { key: 'category', value: story.category, mono: false },
              { key: 'place', value: story.place, mono: false },
            ]}
          />
          <motion.h3
            layoutId={ids.title}
            id={titleId}
            className="m-0 mt-4 font-display text-h3 font-[650] text-ink [--wdth:104] [text-wrap:balance] md:text-h2"
          >
            <button
              type="button"
              onClick={() => openStory(story)}
              aria-haspopup="dialog"
              className={
                'rounded-control text-left decoration-signal decoration-1 underline-offset-[0.12em] ' +
                'group-hover:underline focus-visible:outline-none ' +
                "after:absolute after:inset-0 after:rounded-panel after:content-['']"
              }
            >
              {story.title}
            </button>
          </motion.h3>
          <p className="fn-sub m-0 mt-3 line-clamp-2 font-body text-body text-ink-muted [text-wrap:pretty] md:line-clamp-3">
            {story.subtitle}
          </p>
          <p
            aria-hidden="true"
            className="m-0 mt-auto hidden items-center gap-2 pt-6 font-display text-ui font-semibold text-ink md:flex"
          >
            Read the field note
            <ArrowUpRight className="size-[18px] transition-transform duration-hover ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
          </p>
        </div>
      </article>
    </div>
  );
}
