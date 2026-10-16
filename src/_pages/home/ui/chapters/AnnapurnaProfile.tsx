import { ANNAPURNA_ROUTE } from '@/entities/expedition';
import { ElevationProfile } from '@/shared/ui/charts';

import { STAGE_COPY } from '../../config/copy';
import { toProfilePoints } from '../../lib/profile-points';

const POINTS = toProfilePoints(ANNAPURNA_ROUTE);

/**
 * The full Annapurna profile (G-02, `variant="full"`): the DOM half of the section cut. Same
 * `profileMapping` as the 3D curtain, labelled axes and a "Show data" table. Server-rendered.
 */
export function AnnapurnaProfile({ className }: { className?: string }) {
  return (
    <ElevationProfile
      points={POINTS}
      variant="full"
      highlight={STAGE_COPY.summitLabel}
      title={STAGE_COPY.profileTitle}
      desc={STAGE_COPY.profileDesc}
      className={className}
    />
  );
}
