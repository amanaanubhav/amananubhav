import { STORIES } from '@/entities/story';
import { MediaSlot } from '@/shared/ui/media-slot';

import { ENTRY_LINKS, STAGE_COPY } from '../../config/copy';
import { HOME_WAYPOINTS } from '../../config/sections';
import { EntryStaticPlate } from './EntryStaticPlate';
import { ReadFieldNoteButton } from './HomeActions';
import { RouteEntry } from './RouteEntry';
import { SummitNumeral } from './SummitNumeral';

/**
 * Entry 4, Thorong La: everything on my back. Extras (§G.1): the ridge photo `M-HERO-02` (3:2, 400 px) and
 * the altimeter photo `M-ALTIMETER-01` (1:1, 200 px), both optional, so each renders nothing until its file
 * exists; they sit here, outside the aria-hidden summit hold, so their alt text reaches assistive tech in
 * every layout. Then the field note, which opens the Annapurna story in the reader. At tier 0 the static
 * plate is followed by the "5,416 m" readout, under the plate so it hides none of the sheet's labels.
 */
export function PassEntry() {
  const story = STORIES.find((s) => s.id === ENTRY_LINKS.pass.storyId);
  const pass = HOME_WAYPOINTS.pass;
  return (
    <RouteEntry
      id="pass"
      extras={
        <>
          <MediaSlot id="M-HERO-02" sizes="400px" ratio="3:2" caption="short" className="w-full max-w-[400px]" />
          <MediaSlot id="M-ALTIMETER-01" sizes="200px" ratio="1:1" caption="none" className="w-[200px]" />
          {story ? <ReadFieldNoteButton label={ENTRY_LINKS.pass.label} story={story} /> : null}
        </>
      }
      staticPlate={
        <div>
          <EntryStaticPlate id="pass" />
          {pass.altitudeM !== undefined ? (
            <div aria-hidden="true" className="mt-4">
              <SummitNumeral altitudeM={pass.altitudeM} place={STAGE_COPY.summitLabel} />
            </div>
          ) : null}
        </div>
      }
    />
  );
}
