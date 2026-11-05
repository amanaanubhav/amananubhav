import { SECTION_STATEMENTS } from '../config/content';
import { sectionLabel } from '../config/sections';
import { BuildsLightTable } from './builds/BuildsLightTable';

/**
 * `#stem`: Early builds (FINAL §4.3), the light table. The h2 is the rail label; the statement sits under it; then the
 * five plates the owner liked (Schrödinger cloud, PAVANA, VYOMAGAMI, the asteroid blink comparator, RAKSHAK), on a
 * sticky viewer on desktop and stacked plate-first on phones.
 */
export function StemSection() {
  return (
    <section id="stem" aria-labelledby="stem-h" className="journal-grid scroll-mt-[calc(var(--nav-clear)+16px)]">
      <div className="col-[content] min-w-0">
        <h2 id="stem-h" tabIndex={-1} className="m-0 font-display text-h2 font-bold text-ink focus:outline-none">
          {sectionLabel('stem')}
        </h2>
        <p className="m-0 mt-4 max-w-[30em] font-body text-lead text-ink [text-wrap:pretty]">{SECTION_STATEMENTS.stem}</p>
        <div className="mt-8 lg:mt-12">
          <BuildsLightTable />
        </div>
      </div>
    </section>
  );
}
