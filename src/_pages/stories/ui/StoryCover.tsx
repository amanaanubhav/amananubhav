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
 * so the media registry never ships to the browser. `layout="cover"` (C-05): until the photo arrives the cover
 * is a finished plate, never a "to come" frame: trek stories draw their `ElevationProfile variant="cover"`, the
 * others the registry's generated fill (seeded contours, or stars for sky slots). A story without a cover slot
 * gets the same plain contour plate, so every card on the stack reads as one set.
 */
export function StoryCover({ story }: { story: Story }) {
  if (!story.coverSlot) {
    return (
      <PlateFrame as="div" ratio="3:2" tone="pending">
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
    <MediaSlot
      id={story.coverSlot}
      layout="cover"
      ratio="3:2"
      caption="none"
      reveal="none"
      sizes={COVER_SIZES}
      fill={fill}
    />
  );
}
