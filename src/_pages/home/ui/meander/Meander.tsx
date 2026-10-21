import type { CSSVars } from '@/shared/lib/css';

import { NUMERAL_COPY, STORY_CAPTIONS } from '../../config/copy';
import { AskEntry } from '../chapters/AskEntry';
import { HowEntry } from '../chapters/HowEntry';
import { OriginEntry } from '../chapters/OriginEntry';
import { PassEntry } from '../chapters/PassEntry';
import type { StorySlot } from '../chapters/RouteEntry';
import { WorkEntry } from '../chapters/WorkEntry';
import { WriteEntry } from '../chapters/WriteEntry';
import { STORY_TEXT_AT as AT } from '../scenes/story/timeline';
import styles from '../story/story.module.css';
import { StoryCaption } from '../story/StoryCaption';
import { StoryNumeral } from '../story/StoryNumeral';

/*
 * Slot heights (vh) from the anchors (§15.3): each block's slot runs from the midpoint with the previous
 * anchor to the midpoint with the next, so its centre lands near its anchor; the scroll map
 * (lib/story-scroll.ts) reads the real positions, so taller copy never desynchronises the walk.
 */
const mid = (a: number, b: number) => (a + b) / 2;
const HERO_END = 50; // the hero is one viewport: its bottom is the viewport centre at s 50
const NUMERAL_STICK_START = AT.numeralFrom + 28; // the wrapper's top at 28 vh when it starts sticking
const END = 1765; // #next's top at the viewport bottom when the dissolve ends (S_END + 100)

const slot = (at: number, from: number, to: number): StorySlot => ({ at, vh: Math.round((to - from) * 10) / 10 });

const SLOTS = {
  origin: slot(AT.entry1, HERO_END, mid(AT.entry1, AT.entry2)),
  work: slot(AT.entry2, mid(AT.entry1, AT.entry2), mid(AT.entry2, AT.entry3)),
  how: slot(AT.entry3, mid(AT.entry2, AT.entry3), mid(AT.entry3, AT.day6)),
  day6: slot(AT.day6, mid(AT.entry3, AT.day6), mid(AT.day6, AT.day7)),
  day7: slot(AT.day7, mid(AT.day6, AT.day7), mid(AT.day7, AT.days9and10)),
  days910: slot(AT.days9and10, mid(AT.day7, AT.days9and10), mid(AT.days9and10, AT.entry4)),
  pass: slot(AT.entry4, mid(AT.days9and10, AT.entry4) + 50, NUMERAL_STICK_START),
  ask: slot(AT.entry5, AT.numeralTo + 28 + 15, mid(AT.entry5, AT.entry6) + 50),
  write: slot(AT.entry6, mid(AT.entry5, AT.entry6) + 50, END),
} as const;

const CAPTION_SLOTS = { day6: SLOTS.day6, day7: SLOTS.day7, days910: SLOTS.days910 } as const;

/**
 * `#meander`, the story (§3, §4): the six entries, the three Manang captions and the summit numeral, in
 * normal flow over the fixed story map. No backgrounds, borders or panels at any breakpoint: under each
 * text box the map recedes softly, and it comes back once the text has passed. The section takes focus
 * (tabindex -1, set by the hero's "Read my story") so the next Tab starts in the route.
 *
 * `data-story-end` (after entry 6) is where the dissolve ends: #next starts on plain ground.
 */
export function Meander() {
  return (
    <section id="meander" aria-label="The route" className="journal-grid relative z-[1] focus:outline-none">
      <ol className="col-[content-start/content-end] m-0 list-none p-0 lg:col-[2/span_5]">
        <OriginEntry slot={SLOTS.origin} />
        <WorkEntry slot={SLOTS.work} />
        <HowEntry slot={SLOTS.how} />
        {STORY_CAPTIONS.map((c) => (
          <StoryCaption key={c.id} head={c.head} text={c.text} at={CAPTION_SLOTS[c.id].at} slotVh={CAPTION_SLOTS[c.id].vh} />
        ))}
        <PassEntry slot={SLOTS.pass} />
        <StoryNumeral kicker={NUMERAL_COPY.kicker} after={NUMERAL_COPY.after} span={[AT.numeralFrom, AT.numeralTo]} />
        <AskEntry slot={SLOTS.ask} />
        <WriteEntry slot={SLOTS.write} />
      </ol>
      <div
        aria-hidden="true"
        data-story-end=""
        className={`${styles.slot} col-[full-start/full-end] motion-stage`}
        style={{ '--slot-h': '0vh' } as CSSVars}
      />
    </section>
  );
}
