import { JournalGrid } from '@/shared/ui/journal';
import { NEXT_ENTRY } from '../config/content';

/** Drawing strokes: steel, 1.5 px, never oxblood (nothing on it is done yet); CanvasText under forced colours. */
const STROKE = 'fill-none stroke-steel [stroke-width:1.5] forced-colors:![stroke:CanvasText]';

/**
 * `#next`: Next on the route (FINAL-DESIGN §4.7), the close. A field entry that ends the page on the present: a `<dl>`
 * of `NEXT_ENTRY.rows` on a steel panel, beside a small survey drawing (a solid steel line from a filled trig mark into
 * a dashed one ending in an open mark; `aria-hidden`, no numbers). Not a rail stop. No motion.
 *
 * The rows live in `NEXT_ENTRY` (config/content.ts): the next climb (Annapurna North Base Camp, never dated, Q-48), the
 * next skill and the base. The "as of" row stays hidden until he gives a date (Q-F8). This component renders whatever
 * rows it holds.
 */
export function NextSection() {
  return (
    <section id={NEXT_ENTRY.id} aria-labelledby="next-h" className="scroll-mt-[calc(var(--nav-clear)+16px)]">
      <JournalGrid>
        <div className="col-[content-start/content-end] min-w-0">
          <h2 id="next-h" tabIndex={-1} className="m-0 font-display text-h2 font-bold text-ink [text-wrap:balance] focus:outline-none">
            {NEXT_ENTRY.title}
          </h2>
          <div className="mt-8 grid items-center gap-6 lg:mt-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12">
            <div className="rounded-panel border bg-surface px-[22px] pb-[18px] pt-[22px] panel-steel">
              <dl className="m-0 grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2.5">
                {NEXT_ENTRY.rows.map((row) => (
                  <div key={row.key} className="contents">
                    <dt className="font-body text-caption italic text-accent-2">{row.key}</dt>
                    <dd className="m-0 font-display text-ui font-semibold text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <svg
              viewBox="0 0 400 120"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
              className="order-first block h-16 w-full lg:order-none lg:h-[120px]"
            >
              <line x1={20} y1={64} x2={190} y2={64} className={STROKE} />
              <line x1={200} y1={64} x2={356} y2={64} className={`${STROKE} [stroke-dasharray:6_6]`} />
              <path d="M24 50 34 66H14Z" className="fill-steel stroke-steel [stroke-width:1.5] forced-colors:![fill:CanvasText] forced-colors:![stroke:CanvasText]" />
              <path d="M370 46 382 66H358Z" className="fill-ground stroke-steel [stroke-width:1.5] forced-colors:![fill:Canvas] forced-colors:![stroke:CanvasText]" />
            </svg>
          </div>
        </div>
      </JournalGrid>
    </section>
  );
}
