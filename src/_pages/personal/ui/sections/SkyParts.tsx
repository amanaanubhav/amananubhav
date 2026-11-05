import { getMedia } from '@/shared/config';
import { StarChart } from '@/shared/ui/map';
import { MediaSlot } from '@/shared/ui/media-slot';
import { SKY_COPY, SKY_PHOTO_SLOTS } from '../../config/content';
import { SKY_POSTER } from '../../config/sky-charts.generated';

/** G-04b poster: the plate's server render, and the whole plate without script (FINAL-DESIGN §4.2.6). */
export function SkyPoster() {
  return <StarChart data={SKY_POSTER} title={SKY_COPY.posterTitle} desc={SKY_COPY.posterDesc} className="h-full w-full" />;
}

/** The second sentence of `SKY_COPY.body`: the Exposures strip's lead line. */
function exposuresLead(): string {
  return SKY_COPY.body.split(/(?<=\.)\s+/)[1] ?? '';
}

/**
 * Exposures (FINAL-DESIGN §4.2.1): the astrophotographs `M-LIFE-SKY-01..04` as a strip of 3:2 frames under the sky,
 * with the lead line from `SKY_COPY.body`. Only frames whose registry status is `existing` are shown; while every one
 * of them is still a placeholder, the strip and its line render nothing at all (no "photo to come" plates).
 */
export function SkyExposures() {
  const ready = SKY_PHOTO_SLOTS.filter((id) => getMedia(id)?.status === 'existing');
  if (ready.length === 0) return null;
  return (
    <div className="journal-grid mt-block">
      <div className="col-[content] grid gap-4">
        <p className="m-0 max-w-[36em] font-body text-body text-ink [text-wrap:pretty]">{exposuresLead()}</p>
        <div className="grid gap-item sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((id) => (
            <MediaSlot key={id} id={id} layout="grid" ratio="3:2" />
          ))}
        </div>
      </div>
    </div>
  );
}
