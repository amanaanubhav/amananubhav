import { ChevronLeft, ChevronRight } from 'lucide-react';

import { IconButton } from '@/shared/ui/button';

import { BUILD_NAV, BUILD_STAMPS, EARLY_BUILDS } from '../../config/content';
import { BuildFigure, STAMP_CLASS } from './BuildFigure';
import { BuildsViewer } from './BuildsViewer';

const headingId = (id: string): string => `build-${id}-h`;

/**
 * Early builds as a light table (FINAL §4.3). Desktop (≥ 1024 px): the index of five articles in columns 1-5 and a
 * sticky viewer in columns 6-12 that shows the active build's plate (scroll or press drives it). Phones and tablets:
 * the chip index over a swipeable strip, one article at a time, plate first, with the next one peeking in and a
 * "n of 5" counter with previous and next below. The plates are rendered twice (article and viewer) and CSS shows one
 * set, so the server sends finished drawings and the client only switches and draws.
 */
export function BuildsLightTable() {
  const [first] = EARLY_BUILDS;
  return (
    <BuildsViewer>
      <nav aria-label={BUILD_NAV.label} className="lg:hidden">
        <ul
          data-lenis-prevent=""
          className="-mx-[var(--margin)] my-0 flex list-none snap-x snap-mandatory scroll-px-[var(--margin)] gap-2 overflow-x-auto px-[var(--margin)] py-0.5 [mask-image:linear-gradient(to_right,currentColor_calc(100%_-_40px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {EARLY_BUILDS.map((build) => (
            <li key={build.id} className="flex-none snap-start">
              <a
                href={`#build-${build.id}`}
                data-build-chip={build.id}
                className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 font-display text-[0.9375rem] font-semibold leading-none text-ink no-underline transition-transform duration-micro ease-settle active:scale-[0.97] aria-[current=true]:border-action aria-[current=true]:bg-action-soft"
              >
                {BUILD_NAV.chips[build.id]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 grid gap-12 max-lg:gap-0 lg:mt-0 lg:grid-cols-12 lg:items-start lg:gap-x-[var(--gutter)]">
        <ol
          data-build-strip=""
          data-lenis-prevent=""
          aria-label={BUILD_NAV.strip.label}
          className="m-0 list-none p-0 max-lg:-mx-[var(--margin)] max-lg:flex max-lg:snap-x max-lg:snap-mandatory max-lg:scroll-px-[var(--margin)] max-lg:gap-4 max-lg:overflow-x-auto max-lg:overscroll-x-contain max-lg:px-[var(--margin)] max-lg:pb-1 max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden lg:col-span-5 lg:grid lg:gap-1"
        >
          {EARLY_BUILDS.map((build) => {
            const stamp = BUILD_STAMPS[build.id];
            const hId = headingId(build.id);
            return (
              <li key={build.id} data-build-card="" className="max-lg:w-[min(86%,26rem)] max-lg:shrink-0 max-lg:snap-start">
                <article
                  id={`build-${build.id}`}
                  data-build={build.id}
                  data-active={build.id === first.id ? 'true' : 'false'}
                  aria-labelledby={hId}
                  className="group relative grid scroll-mt-[calc(var(--nav-clear)+16px)] gap-3 lg:gap-2 lg:rounded-panel lg:px-5 lg:pb-[22px] lg:pt-5 lg:transition-colors lg:duration-hover lg:ease-settle lg:hover:bg-[var(--hover-wash)] lg:data-[active=true]:bg-action-soft"
                >
                  {/* The active mark: a 2 px action bar on the left (desktop). */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-4 left-0 top-4 hidden w-0.5 rounded-full bg-action opacity-0 lg:block lg:group-data-[active=true]:opacity-100 forced-colors:bg-[Highlight]"
                  />
                  <div className="mb-2 lg:hidden">
                    <BuildFigure build={build} variant="phone" headingId={hId} />
                  </div>
                  <h3
                    id={hId}
                    tabIndex={-1}
                    className="m-0 font-display text-title font-semibold text-ink focus:outline-none max-md:text-lead max-md:leading-[1.3]"
                  >
                    {build.title}
                  </h3>
                  <p className="m-0 max-w-[56ch] font-body text-ui leading-[1.6] text-ink [text-wrap:pretty] md:text-body lg:text-ui lg:leading-[1.6]">
                    {build.desc}
                  </p>
                  <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-caption text-ink-muted">
                    {build.year ? <span className="font-data text-[0.8125rem] tabular text-ink">{build.year}</span> : null}
                    <span className="italic">{build.tags.join(' · ')}</span>
                    {stamp ? <span className={`relative z-[2] ${STAMP_CLASS}`}>{stamp}</span> : null}
                  </p>
                  {/* Desktop: the whole row shows its plate in the viewer. A list, not a tablist: scroll drives it too. */}
                  <button
                    type="button"
                    data-build-show={build.id}
                    aria-label={BUILD_NAV.show[build.id]}
                    aria-controls="builds-viewer"
                    className="absolute inset-0 z-[1] hidden w-full cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 focus-visible:outline-offset-[-2px] lg:block"
                  />
                </article>
              </li>
            );
          })}
        </ol>

        {/* Phones and tablets: where the strip is, and a step either way (44 px targets). */}
        <div className="mt-4 flex items-center justify-between gap-4 lg:hidden">
          <p
            data-strip-count=""
            data-template={BUILD_NAV.strip.count}
            aria-live="polite"
            className="m-0 font-data text-caption tabular text-ink-muted"
          >
            {BUILD_NAV.strip.count.replace('{n}', '1').replace('{total}', String(EARLY_BUILDS.length))}
          </p>
          <div className="flex gap-2">
            <IconButton icon={ChevronLeft} label={BUILD_NAV.strip.prev} variant="outline" data-strip-step="-1" disabled />
            <IconButton icon={ChevronRight} label={BUILD_NAV.strip.next} variant="outline" data-strip-step="1" />
          </div>
        </div>

        <div
          id="builds-viewer"
          data-viewer=""
          className="hidden lg:sticky lg:top-[calc(var(--nav-clear)+16px)] lg:col-span-7 lg:block"
        >
          {EARLY_BUILDS.map((build, i) => (
            <div key={build.id} data-viewer-fig={build.id} data-shown={i === 0 ? 'true' : 'false'} className="data-[shown=false]:hidden">
              <BuildFigure build={build} variant="viewer" drawOnView={i === 0} headingId={headingId(build.id)} />
            </div>
          ))}
        </div>
      </div>
    </BuildsViewer>
  );
}
