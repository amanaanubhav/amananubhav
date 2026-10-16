import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { SKY_ALT_LABEL, SKY_ZENITH_TEXT, type SkyReadoutRefs } from '../../lib/sky-progress';

/** The readout's text nodes, one ref each (written by `useSkyProgress`, never read during render). */
export interface SkyClockLogProps {
  timeRef: SkyReadoutRefs['time'];
  phaseRef: SkyReadoutRefs['phase'];
  metresRef: SkyReadoutRefs['metres'];
  starRef: SkyReadoutRefs['star'];
  labelRef: SkyReadoutRefs['label'];
  /** The highest point he has stood, e.g. "5,416 m · Thorong La" (from `entities/expedition`). */
  highest: string;
  /** Live legend ("... tonight"): the scrubbed sky is the visitor's own night. */
  legend: string;
  /** Static-layout legend: the poster is a fixed January night (G-04b). */
  staticLegend: string;
  label: string;
}

const KEY = 'font-body italic text-ink-muted';
const VALUE_BASE = 'm-0 text-ink [font-variant-numeric:tabular-nums_slashed-zero]';
const VALUE = `${VALUE_BASE} font-data`;
const ROW = 'flex items-baseline justify-between gap-4 border-t border-line py-2 first:border-t-0 first:pt-0';

/**
 * The clock log of `#sky` (§G.2): time, latitude, direction and the altitude morph. Values are written by
 * `useSkyProgress` through refs (no React render per frame); `aria-live="off"` so a scrub never chatters.
 * SSR shows p = 0: 18:30 IST and the metres reading.
 */
export function SkyClockLog({
  timeRef,
  phaseRef,
  metresRef,
  starRef,
  labelRef,
  highest,
  legend,
  staticLegend,
  label,
}: SkyClockLogProps) {
  return (
    <div className="max-w-sm lg:mt-8">
      <dl aria-label={label} aria-live="off" className="m-0 flex flex-col text-caption">
        <div className={ROW}>
          <dt className={KEY}>time</dt>
          <dd ref={timeRef} className={VALUE}>
            18:30 IST
          </dd>
        </div>
        <div className={ROW}>
          <dt className={KEY}>latitude</dt>
          <dd className={VALUE}>25° N</dd>
        </div>
        <div className={ROW}>
          <dt className={KEY}>looking</dt>
          <dd className={`${VALUE_BASE} font-body`}>south</dd>
        </div>
        <div className={ROW}>
          <dt className={KEY}>
            <span aria-hidden="true">altitude</span>
            <VisuallyHidden>
              <span ref={labelRef}>{SKY_ALT_LABEL.metres}</span>
            </VisuallyHidden>
          </dt>
          <dd ref={phaseRef} data-phase="metres" className={`${VALUE} group/alt grid text-right`}>
            <span
              ref={metresRef}
              aria-hidden="false"
              className="opacity-100 transition-opacity duration-overlay ease-settle [grid-area:1/1] group-data-[phase=stars]/alt:opacity-0"
            >
              {highest}
            </span>
            <span
              ref={starRef}
              aria-hidden="true"
              className="text-signal opacity-0 transition-opacity duration-overlay ease-settle [grid-area:1/1] group-data-[phase=stars]/alt:opacity-100"
            >
              {SKY_ZENITH_TEXT}
            </span>
          </dd>
        </div>
      </dl>
      {/*
        The scene marks its slot data-stage-source="illustrative" when the star data failed to load (§C.5). The
        static layout (chosen before paint) shows the January poster, so its legend names that night, not tonight;
        so does a tier-0 sticky layout (failed WebGL probe), which SkySection marks with data-sky-poster.
      */}
      <p className="mt-3 font-body text-caption italic text-ink-muted">
        <span className="group-has-[[data-stage-source=illustrative]]/sky:hidden group-data-[sky-poster]/sky:hidden [html[data-motion=off]_&]:hidden [html[data-lite='1']_&]:hidden">
          {legend}
        </span>
        <span className="hidden group-has-[[data-stage-source=illustrative]]/sky:inline group-data-[sky-poster]/sky:hidden [html[data-motion=off]_&]:hidden [html[data-lite='1']_&]:hidden">
          Illustrative sky
        </span>
        <span className="hidden group-data-[sky-poster]/sky:inline [html[data-motion=off]_&]:inline [html[data-lite='1']_&]:inline">
          {staticLegend}
        </span>
      </p>
    </div>
  );
}
