import { SECTION_STATEMENTS } from '../config/content';
import { sectionLabel } from '../config/sections';
import { getHighPoints } from '../lib/high-points';
import { HighPointsChart } from './altitude/HighPointsChart';
import { StandardPanel } from './altitude/StandardPanel';
import { TrainingLedger } from './altitude/TrainingLedger';

/**
 * `#athletics`: Altitude (FINAL-DESIGN §4.5). One claim, one home: the heights he reached (High points, to scale,
 * anchor `#heights`), the standard they set (the Annapurna panel beside it) and how the week trains for it.
 */
export function AthleticsSection() {
  return (
    <section id="athletics" aria-labelledby="athletics-h" className="scroll-mt-[calc(var(--nav-clear)+16px)]">
      <div className="journal-grid">
        <div className="col-[content-start/content-end] min-w-0">
          <h2 id="athletics-h" tabIndex={-1} className="m-0 font-display text-h2 font-bold text-ink focus:outline-none">
            {sectionLabel('athletics')}
          </h2>
          <p className="m-0 mt-4 max-w-[30em] font-body text-lead text-ink [text-wrap:pretty]">
            {SECTION_STATEMENTS.athletics}
          </p>

          <div className="mt-8 grid items-start gap-6 md:mt-12 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
            <HighPointsChart points={getHighPoints()} />
            <StandardPanel />
          </div>

          <div className="mt-14">
            <TrainingLedger />
          </div>
        </div>
      </div>
    </section>
  );
}
