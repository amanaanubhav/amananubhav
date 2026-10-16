import { STAGE_COPY } from '../../config/copy';
import { HOME_WAYPOINTS } from '../../config/sections';
import { AnnapurnaProfile } from './AnnapurnaProfile';
import { AskEntry } from './AskEntry';
import { HowEntry } from './HowEntry';
import { OriginEntry } from './OriginEntry';
import { PassEntry } from './PassEntry';
import { SummitReadout } from './SummitReadout';
import { WorkEntry } from './WorkEntry';
import { WriteEntry } from './WriteEntry';

/**
 * The six entries of `#meander` in walking order, plus the summit-hold spacer (segment `pass-hold`,
 * t 4 to 4.6) between the pass and the terminal. The spacer exists only in the staged layout; from 1024 px
 * it carries the summit readout, sticky and centred in the entries column (the page's one display moment;
 * kept in the column rather than on the canvas so no text sits on the relief, §J.1). The optional altimeter
 * photo lives in entry 4's extras, outside this aria-hidden spacer.
 */
export function MeanderEntries() {
  const pass = HOME_WAYPOINTS.pass;
  return (
    <>
      <OriginEntry />
      <WorkEntry />
      <HowEntry />
      <PassEntry />
      <li id="pass-hold" data-segment="pass-hold" aria-hidden="true" className="motion-stage h-[30svh] lg:h-[60svh]">
        {pass.altitudeM !== undefined ? (
          <SummitReadout
            variant="column"
            altitudeM={pass.altitudeM}
            place={pass.name || STAGE_COPY.summitLabel}
          />
        ) : null}
      </li>
      <AskEntry staticProfile={<AnnapurnaProfile className="w-full max-w-[360px]" />} />
      <WriteEntry />
    </>
  );
}
