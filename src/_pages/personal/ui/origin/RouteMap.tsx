import { clsx } from 'clsx';
import { ROUTE_MAP } from '../../config/content';
import { ROUTE_STOPS } from '../../config/sections';
import type { PersonalSection } from '../../config/sections';
import { InPageLink } from './InPageLink';

/** An open trig mark (survey triangle): `ground` fill so the traverse line stops at its edge. Never oxblood. */
function TrigMark() {
  return (
    <svg viewBox="0 0 24 20" aria-hidden="true" className="mt-0.5 h-5 w-6 flex-none overflow-visible lg:mt-0">
      <path
        d="M12 3 21 17H3Z"
        className="fill-ground stroke-ink forced-colors:stroke-[CanvasText]"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The route map under the title block (§4.1.2): the page's contents as five stops on a survey traverse. Desktop: a
 * level 1 px `line-strong` traverse across the content width, one stop per fifth. Phone: an `<ol>` with a 2 px rule at
 * left and one 56 px row per stop. Each stop is one link (mark, label, tag, teaser), at least 44 px tall, and lands
 * per BUILD-PLAN §2.3. `data-dock-avoid="shown"`: the phone dock steps aside while this map is on screen (it shows the
 * same contents).
 */
export function RouteMap({ className }: { className?: string }) {
  const stops: readonly PersonalSection[] = ROUTE_STOPS;
  return (
    <nav aria-label={ROUTE_MAP.navLabel} data-dock-avoid="shown" className={className}>
      <h2 className="sr-only">{ROUTE_MAP.heading}</h2>
      <ol
        className={clsx(
          'relative m-0 grid list-none p-0',
          "before:absolute before:bottom-[30px] before:left-[11px] before:top-[14px] before:w-0.5 before:bg-line-strong before:content-['']",
          'forced-colors:before:bg-[CanvasText]',
          'lg:grid-cols-5 lg:gap-x-6 lg:before:bottom-auto lg:before:left-3 lg:before:right-0 lg:before:top-[11px] lg:before:h-px lg:before:w-auto',
        )}
      >
        {stops.map((stop) => (
          <li key={stop.id} className="relative min-w-0">
            <InPageLink
              href={stop.routeHref}
              prefetch={stop.id === 'sky'}
              className={clsx(
                'grid min-h-14 grid-cols-[24px_minmax(0,1fr)] items-start gap-x-3.5 rounded-control py-2.5 pr-2 no-underline',
                'transition-[background-color,transform] duration-hover hover:bg-[var(--hover-wash)] active:bg-[var(--press-wash)]',
                'lg:min-h-11 lg:grid-cols-1 lg:gap-y-2.5 lg:pb-3 lg:pr-3 lg:pt-0',
              )}
            >
              <TrigMark />
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-display text-ui font-semibold leading-[1.3] text-ink">{stop.label}</span>
                {stop.tag && (
                  <em className="inline-flex items-center gap-1.5 font-body text-caption italic text-aqua">
                    {stop.tag.live && (
                      <span
                        aria-hidden="true"
                        className="live-halo size-1.5 self-center rounded-full bg-live forced-colors:bg-[Highlight]"
                      />
                    )}
                    {stop.tag.label}
                  </em>
                )}
              </span>
              {stop.teaser && (
                <span className="col-start-2 font-body text-caption leading-[1.4] text-ink-muted [text-wrap:pretty] lg:col-start-1 lg:max-w-[22ch]">
                  {stop.teaser}
                </span>
              )}
            </InPageLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
