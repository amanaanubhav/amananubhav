import { getExpedition } from '@/entities/expedition';
import type { Story } from '@/entities/story';
import { ElevationProfile } from '@/shared/ui/charts';
import { PlateFrame } from '@/shared/ui/journal';
import { MediaFill, MediaSlot } from '@/shared/ui/media-slot';
import { trekProfilePoints, trekProfileText } from '../lib/trek-profile';

/** The card's cover column: about 7/12 of a 1024 px card on desktop, full card width on phones. */
const COVER_SIZES = '(min-width: 1024px) 560px, (min-width: 768px) 55vw, 100vw';

/**
 * A story card's 3:2 cover (§G.4, G-17), rendered on the server and handed to the client card as a node,
 * so the media registry never ships to the browser. Trek stories pass an `ElevationProfile variant="cover"`
 * as the pending fill; the others keep the registry's fill (stars, grid and glyph).
 */
export function StoryCover({ story }: { story: Story }) {
  if (!story.coverSlot) {
    return (
      <PlateFrame ratio="3:2" tone="pending" ticks grid captionHidden caption={story.title}>
        <MediaFill kind="contour" seed={story.id} />
      </PlateFrame>
    );
  }

  const exp = story.expeditionId ? getExpedition(story.expeditionId) : undefined;
  const profile = exp ? trekProfileText(exp) : null;
  const fill =
    exp && profile ? (
      <ElevationProfile variant="cover" points={trekProfilePoints(exp)} title={profile.title} desc={profile.desc} />
    ) : undefined;

  return (
    <MediaSlot id={story.coverSlot} ratio="3:2" caption="none" reveal="none" sizes={COVER_SIZES} fill={fill} />
  );
}
