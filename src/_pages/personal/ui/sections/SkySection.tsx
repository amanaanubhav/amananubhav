import { SECTION_STATEMENTS, SKY_COPY, SKY_UI } from '../../config/content';
import { sectionLabel } from '../../config/sections';
import { getSkyPlaces } from '../../lib/sky-places';
import { SkyView } from '../sky/SkyView';
import { SkyExposures, SkyPoster } from './SkyParts';

/**
 * `#sky`: Night sky (FINAL-DESIGN §4.2, SKY-SPEC). A live sky you can hold: now, over Sikahar at 25° N, facing south;
 * drag it, zoom it, scrub through tonight, pick what is up, read it as a table, or (on a phone) look around full screen
 * and point the phone at the real one.
 *
 * Server component. In Night the whole section sits on one flat `ground-sky` band (the page's one change of field);
 * in Day the page stays sage paper and the plate alone is a night window (its subtree carries the Night palette scope).
 * The band pads its own field and gives the same amount back to the stack's gap, so headings keep the page's rhythm.
 * It opens with a drawn sheet edge (P1-11). The SSR poster fills the plate until the lazy sky draws its first frame.
 */
export function SkySection() {
  return (
    <section
      id="sky"
      aria-labelledby="sky-h"
      className="relative -my-[var(--sky-pad)] scroll-mt-[calc(var(--nav-clear)+16px)] border-t border-line-strong py-[var(--sky-pad)] [--sky-pad:clamp(56px,4rem+3vw,112px)] [html:not([data-theme=day])_&]:bg-ground-sky [html:not([data-theme=day])_&]:!bg-none"
    >
      <div aria-hidden="true" className="journal-grid pointer-events-none absolute inset-x-0 top-3.5">
        <p className="col-[content] m-0 flex gap-2.5 font-data text-caption leading-none text-ink-muted">
          <span>{SKY_UI.sheetEdge[0]}</span>
          <span>{SKY_UI.sheetEdge[1]}</span>
        </p>
      </div>

      <div className="journal-grid">
        <div className="col-[content] min-w-0">
          <h2 id="sky-h" tabIndex={-1} className="m-0 font-display text-h2 font-bold text-ink focus:outline-none">
            {sectionLabel('sky')}
          </h2>
          <p id="sky-statement" className="m-0 mt-4 max-w-[30em] font-body text-lead text-ink [text-wrap:pretty]">
            {SECTION_STATEMENTS.sky}
          </p>
        </div>
      </div>

      <div className="mt-8 lg:mt-12">
        <SkyView poster={<SkyPoster />} posterLegend={SKY_COPY.staticLegend} places={getSkyPlaces()} />
      </div>

      <div className="journal-grid">
        <p className="col-[content] m-0 mt-7 max-w-[36em] font-body text-caption text-ink-muted">{SKY_UI.source}</p>
      </div>

      <SkyExposures />
    </section>
  );
}
