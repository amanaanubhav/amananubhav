import { getExpedition, waypointLabel, type Expedition } from '@/entities/expedition';
import { STORIES } from '@/entities/story';
import { getMedia, type MediaSlotId } from '@/shared/config';
import { ElevationProfile, type ProfilePoint } from '@/shared/ui/charts';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { isMediaSlotShown, MediaSlot, type MediaLayout } from '@/shared/ui/media-slot';
import { NOTEBOOK_COPY, type TrekCopy } from '../../config/treks';
import type { TrekRoute } from '../../config/trek-routes.generated';
import { pageHeadingId, type NotebookPageId } from '../../lib/notebook-pages';
import {
  figureKindFor,
  isStopPlaced,
  planSketch,
  shownAltitude,
  sketchText,
  trackSketch,
} from '../../lib/route-sketch';
import { trekProfilePoints, trekProfileText } from '../../lib/trek-profile';
import { ReadFieldNoteButton } from '../ReadFieldNoteButton';
import { trekLog } from '../trek-log';
import { RouteSketch } from './RouteSketch';
import { StopList, type StopRow } from './StopList';
import styles from './notebook.module.css';

const CAPTION = 'm-0 mt-3 font-body text-caption italic text-ink-muted';

/** At most two plates (NB-9 decides the rest): ready photos first, in slot order, then the first pending ones. */
function pickPlates(slots: readonly MediaSlotId[]): { id: MediaSlotId; layout: MediaLayout }[] {
  const ready = slots.filter((id) => getMedia(id)?.status === 'existing');
  const pending = slots.filter((id) => getMedia(id)?.status !== 'existing');
  return [...ready, ...pending]
    .slice(0, 2)
    // The first plate is a plate-column slot (a pending one is the one-line "Photo to come" strip in production);
    // the second is a grid cell (a pending one collapses).
    .map((id, i) => ({ id, layout: (i === 0 ? 'standard' : 'grid') as MediaLayout }))
    .filter(({ id, layout }) => isMediaSlotShown(id, layout));
}

/** The strip profile under a GPX track: distance-spaced, no labels, no numbers (NB-7). */
function trackProfilePoints(route: TrekRoute): ProfilePoint[] {
  return route.ele.map((altitudeM, i) => ({ name: `p${i}`, altitudeM, distanceKm: route.km[i], kind: 'camp' }));
}

function RouteFigure({ exp, pageId, route }: { exp: Expedition; pageId: NotebookPageId; route?: TrekRoute }) {
  const kind = figureKindFor(exp, route);
  if ((kind === 'track' && route) || kind === 'plan') {
    const geometry = kind === 'track' && route ? trackSketch(exp, route) : planSketch(exp);
    const text = sketchText(geometry.kind === 'track' ? 'track' : 'plan', exp, route);
    const strip = kind === 'track' && route && route.ele.length > 1;
    return (
      <figure className={styles.figure}>
        <RouteSketch geometry={geometry} idPrefix={`nb-${pageId}-sketch`} title={text.title} desc={text.desc} />
        {strip ? (
          <ElevationProfile
            className="mt-3 h-16"
            variant="strip"
            draw="none"
            showData={false}
            spacing="distance"
            points={trackProfilePoints(route)}
            title={`Elevation along the ${exp.shortName} GPS track`}
            desc="The shape of the climb along the recorded line, spaced by distance."
          />
        ) : null}
        <figcaption className={CAPTION}>{NOTEBOOK_COPY.caption[kind === 'track' ? 'track' : 'plan']}</figcaption>
      </figure>
    );
  }
  if (kind === 'profile') {
    const text = trekProfileText(exp);
    return (
      <ElevationProfile
        variant="compact"
        draw="none"
        showData={false}
        points={trekProfilePoints(exp)}
        title={text.title}
        desc={text.desc}
      />
    );
  }
  const none: string = NOTEBOOK_COPY.caption.none;
  return none ? <p className={CAPTION.replace(' mt-3', '')}>{none}</p> : null;
}

function stopRows(exp: Expedition, route?: TrekRoute): StopRow[] {
  const kind = figureKindFor(exp, route);
  const onMap = kind === 'track' || kind === 'plan';
  return exp.waypoints.map((wp, i) => ({
    number: i + 1,
    name: waypointLabel(wp),
    altitudeM: shownAltitude(wp),
    approx: wp.approx,
    notPlaced: onMap && !isStopPlaced(wp, kind, route),
  }));
}

/**
 * One field notebook page for a single trek (NOTEBOOK-DESIGN §2.4, §2.5), as direct children of the page wrapper the
 * controller renders, in reading order: the h3 and log, the route figure and the stop list (the left page from
 * 1024 px), the lead, up to two photos, and the action ("Read the journal entry" or "Entry coming.").
 */
export function NotebookPage({ pageId, trek, route }: { pageId: NotebookPageId; trek: TrekCopy; route?: TrekRoute }) {
  const exp = getExpedition(trek.expeditionId);
  const story = exp.storyId ? STORIES.find((item) => item.id === exp.storyId) : undefined;
  const plates = pickPlates([...trek.leadSlots, ...trek.rowSlots]);
  const callouts = new Set(trek.calloutSlots ?? []);
  const sizes = plates.length > 1 ? '(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 100vw' : '(min-width: 1024px) 40vw, 100vw';

  return (
    <>
      <header className={styles.head}>
        <ChapterHeader
          as="h3"
          size="h3"
          id={pageHeadingId(pageId)}
          altitudeM={exp.highPoint.altitudeM}
          className="focus:outline-none"
        >
          {trek.headline}
        </ChapterHeader>
        <Log items={trekLog(exp)} layout="strip" label={`${exp.shortName} field log`} />
      </header>

      <div className={styles.route}>
        <RouteFigure exp={exp} pageId={pageId} route={route} />
        <StopList rows={stopRows(exp, route)} label={NOTEBOOK_COPY.stopsLabel} />
      </div>

      <p className={`${styles.lead} max-w-measure font-body text-body text-ink [text-wrap:pretty]`}>{trek.lead}</p>

      {plates.length > 0 ? (
        <ul role="list" className={styles.media} data-count={plates.length}>
          {plates.map(({ id, layout }) => (
            <li key={id} className="min-w-0 empty:hidden">
              <MediaSlot id={id} layout={layout} ratio="3:2" caption="short" sizes={sizes} callouts={callouts.has(id)} />
            </li>
          ))}
        </ul>
      ) : null}

      {story ? (
        <div className={styles.action}>
          <ReadFieldNoteButton storyId={story.id} />
        </div>
      ) : trek.noteComing ? (
        <p className={`${styles.action} font-body text-caption italic text-ink-muted`}>{trek.noteComing}</p>
      ) : null}
    </>
  );
}
