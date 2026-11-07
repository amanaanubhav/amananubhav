import { Mail } from 'lucide-react';

import { getExpedition } from '@/entities/expedition';
import { PROFILE } from '@/entities/profile';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { OverlapBand } from '@/shared/ui/charts';
import { Trail } from '@/shared/ui/journal';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import { NEXT_COPY } from '../../config/copy';
import { NEXT_TRAIL } from '../../config/trail';
import { OpenTerminalButton, SecureContactButton } from './HomeActions';
import { NEXT_S } from './next/anchors';
import { MapKey } from './next/MapKey';
import styles from './next/next.module.css';
import { NorthSheet } from './next/NorthSheet';

/**
 * `#next`, the next trek (docs/redesign/next-trek/NEXT-DESIGN.md §2-§4): home's one full remote ask.
 *
 * Staged (the 3D map): the story map no longer dissolves. The 320 vh transition (the jeep leg, caption C1) is the
 * story's own slot before this section (Meander, the scene step); at the rest anchor the map holds a still view of the
 * expected foot route and this copy floats over it, left of the subject (content cols 1-6), with no panels: the map
 * recedes under each `data-recede` box. The header carries the rest anchor (`data-next-anchor="rest"`, next/anchors.ts).
 *
 * Static (reduced motion, lite devices, no JavaScript, tier 0 or a failed 3D load): the north
 * plan sheet sits in flow beside the copy (cols 7-12; above the log on phones), and the Trail returns.
 *
 * Ink: everything over the map is ink (muted ink never sits on the relief). Actions: one row from 1024 px; on phones
 * they keep the dock band and the chat bead clear, and the section ends clear of the bead.
 */
export function NextSection() {
  const last = getExpedition('dodital');
  const next = NEXT_COPY.nextTrek;
  const [headFirst, headSecond] = NEXT_COPY.headlineLines;

  return (
    <section
      id="next"
      data-static-anchor=""
      aria-labelledby="next-title"
      className={cn('journal-grid relative z-[1] pb-0', styles.section, styles.end)}
    >
      <header
        data-next-anchor="rest"
        data-next-at={NEXT_S.rest}
        data-recede=""
        className={cn('col-[content-start/content-end] lg:col-[2/span_7] lg:row-start-2', styles.restHead)}
      >
        <p className="m-0 mb-3 font-data text-caption font-medium uppercase tracking-[0.08em] text-ink">
          {NEXT_COPY.kicker}
        </p>
        <ChapterHeader as="h2" id="next-title" size="h3" reveal="none">
          <span className={styles.headFirst}>{headFirst}</span>{' '}
          <span className={styles.headSecond}>{headSecond}</span>
        </ChapterHeader>
      </header>

      {/* The static plan sheet: the still poster of the rest view (beside the copy from 1024 px, above the log below). */}
      <figure
        className={cn(
          'col-[content-start/content-end] m-0 mt-8 lg:col-[8/span_5] lg:row-[3/span_3] lg:mt-8 lg:self-start',
          styles.staticOnly,
        )}
      >
        <NorthSheet className="w-full" />
      </figure>

      <div data-recede="" className="col-[content-start/content-end] mt-8 lg:col-[2/span_6] lg:row-start-3">
        <dl aria-label="Field log: next" className={cn('text-caption font-body', styles.log)}>
          <dt>last</dt>
          <dd>{last.when ? `${last.name}, ${last.when}` : last.name}</dd>
          <dt>next</dt>
          <dd>{`${next.name}, ${next.region}`}</dd>
          <dt>status</dt>
          <dd>planned</dd>
          <dt>route</dt>
          <dd>
            {NEXT_COPY.route} <i>{NEXT_COPY.routeNote}</i>
          </dd>
          <dt>then</dt>
          <dd>{NEXT_COPY.then}</dd>
        </dl>
        <Trail items={NEXT_TRAIL} label="Trail: next" summitTone="bronze" className={cn('mt-6', styles.staticOnly)} />
        {/* From 1024 px the key sits under the log; below it, after the body (the rest frame keeps it off the dock). */}
        <MapKey className="mt-6 hidden lg:block" />
      </div>

      <div data-recede="" className="col-[content-start/content-end] mt-6 lg:col-[2/span_6] lg:row-start-4 lg:mt-8">
        <p className="text-body m-0 max-w-[60ch] text-ink [text-wrap:pretty]">{NEXT_COPY.body}</p>
        <MapKey className="mt-6 lg:hidden" />
      </div>

      {/* One row from 1024 px (§3.4 item 6); on phones the row wraps and clears the dock and the chat bead. */}
      <div
        data-recede=""
        className={cn('col-[content-start/content-end] mt-8 lg:col-[2/span_6] lg:row-start-5 lg:mt-10', styles.actions)}
      >
        <div className="flex flex-wrap items-center gap-3">
          <OpenTerminalButton label={NEXT_COPY.terminal} />
          <SecureContactButton label={NEXT_COPY.vault} />
          <Button variant="secondary" icon={Mail} href={`mailto:${PROFILE.links.email}`}>
            {NEXT_COPY.email}
          </Button>
        </div>
        {last.status === 'done' && last.storyId ? (
          <Button variant="text" href={`/stories#${last.id}`} className="mt-4 min-h-11">
            {NEXT_COPY.storyLink}
          </Button>
        ) : null}
      </div>

      <div data-recede="" className="col-[content-start/content-end] mt-16 lg:col-[2/span_8] lg:row-start-6 lg:mt-20">
        <OverlapBand workWindowIST={PROFILE.availability?.workWindowIST} caption={NEXT_COPY.overlapCaption} />
      </div>

      <VisuallyHidden as="div">
        <ol aria-label={NEXT_COPY.routeList.label}>
          {NEXT_COPY.routeList.stops.map((stop) => (
            <li key={stop}>{stop}</li>
          ))}
        </ol>
      </VisuallyHidden>
    </section>
  );
}
