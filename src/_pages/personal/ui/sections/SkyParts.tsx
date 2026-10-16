import { EXPEDITIONS, getExpeditionStats } from '@/entities/expedition';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { StarChart } from '@/shared/ui/map';
import { MediaSlot } from '@/shared/ui/media-slot';
import { SKY_COPY, SKY_EXTRA_SLOTS, SKY_PHOTO_SLOTS } from '../../config/content';
import { SKY_POSTER } from '../../config/sky-charts.generated';

const NUMBER = new Intl.NumberFormat('en');

/** "5,416 m · Thorong La": the highest point he has stood, from finished treks only. */
export function skyHighestText(): string {
  const { highestM, highestName } = getExpeditionStats(EXPEDITIONS);
  return `${NUMBER.format(highestM)} m · ${highestName}`;
}

/** Hidden when the star data has no constellation lines (§G.2). */
export function skyHasConstellations(): boolean {
  return (SKY_POSTER.lines?.length ?? 0) > 0;
}

/** h2 and body of `#sky` ([S-LIFE-SKY]); the D1 connective line only once approved (Q-91). */
export function SkyCopy() {
  return (
    <>
      <ChapterHeader as="h2" id="sky-title">
        {SKY_COPY.title}
      </ChapterHeader>
      <p className="mt-4 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{SKY_COPY.body}</p>
      {SKY_COPY.connective.approved ? (
        <p className="mt-4 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{SKY_COPY.connective.text}</p>
      ) : null}
    </>
  );
}

/** G-04b poster: rendered once per page (also the static layout's plate). */
export function SkyPoster() {
  return (
    <StarChart
      data={SKY_POSTER}
      title={SKY_COPY.posterTitle}
      desc={SKY_COPY.posterDesc}
      className="h-full w-full"
    />
  );
}

/**
 * The astrophotographs after the track (§G.2): the largest photo plates on the site, each a full 3:2 plate up
 * to 960 px with its exposure log, whether its file is supplied yet or still a pending plate.
 */
export function SkyPhotos() {
  return (
    <div className="journal-grid mt-20 lg:mt-24">
      <div className="col-[content-start/content-end] flex flex-col gap-16 lg:col-[2/span_10] lg:gap-24">
        {SKY_PHOTO_SLOTS.map((id) => (
          <MediaSlot key={id} id={id} layout="astro" ratio="3:2" />
        ))}
        <div className="grid gap-8 empty:hidden md:grid-cols-2">
          {SKY_EXTRA_SLOTS.map((id) => (
            <MediaSlot key={id} id={id} />
          ))}
        </div>
      </div>
    </div>
  );
}
