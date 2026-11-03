import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

export type TrailLane = 'systems' | 'summit' | 'planned';

export interface TrailItem {
  lane: TrailLane;
  label: string;
  /** Display date, e.g. "Nov 2025". Omitted when unknown (no <time> renders). */
  date?: string;
  /** Machine-readable date for <time dateTime>, e.g. "2025-11". Omitted when not given (display text is not a valid datetime). */
  datetime?: string;
  href?: string;
}

export interface TrailMarkProps {
  lane: TrailLane;
  /** The mark turns oxblood ("you are here"). */
  active?: boolean;
  /** Accessible name; without it the mark is decorative. */
  title?: string;
  /** systems lane only: a filled square (the item links somewhere). */
  filled?: boolean;
  /** summit lane only, colour only: the resting summit triangle in ink (default) or bronze (graphics only). */
  summitTone?: 'ink' | 'bronze';
  className?: string;
}

/**
 * Two-lane trail marks (§D.1, D1 graft). Shape carries the meaning, not color:
 * systems = 8 px square (1.5 px ink stroke, filled when it links); summit = 10 px filled triangle;
 * planned = 10 px dashed outline triangle in line-strong. `active` turns the mark oxblood (the trek's "you are here", Update 1.1 §11); `summitTone="bronze"`
 * fills a resting summit in bronze.
 */
export function TrailMark({
  lane,
  active = false,
  title,
  filled = false,
  summitTone = 'ink',
  className,
}: TrailMarkProps) {
  // palette-allow: currentColor stroke and fill of the "you are here" trail mark (oxblood is the trek's graphics role)
  const color = active ? 'text-oxblood' : lane === 'planned' ? 'text-line-strong' : 'text-ink';
  const labelled = Boolean(title);
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 10 10"
      fill="none"
      focusable="false"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn('shrink-0 overflow-visible', color, className)}
    >
      {lane === 'systems' ? (
        <rect
          x={1.75}
          y={1.75}
          width={6.5}
          height={6.5}
          stroke="currentColor"
          strokeWidth={1.5}
          fill={filled ? 'currentColor' : 'none'}
        />
      ) : lane === 'summit' ? (
        !active && summitTone === 'bronze' ? (
          <path d="M5 0.6 9.6 9.4H0.4Z" className="fill-bronze" />
        ) : (
          <path d="M5 0.6 9.6 9.4H0.4Z" fill="currentColor" />
        )
      ) : (
        <path
          d="M5 1.2 9.2 9H0.8Z"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeDasharray="2 1.6"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  );
}

const LANE_NAME: Record<TrailLane, string> = {
  systems: 'Systems',
  summit: 'Summit',
  planned: 'Planned',
};

export interface TrailProps {
  items: readonly TrailItem[];
  /** Accessible name of the list. */
  label?: string;
  /** Passed to each summit mark (colour only); default ink. */
  summitTone?: 'ink' | 'bronze';
  className?: string;
}

/** A trail link (PALETTE-SPEC §5.3, §11): ink with the 1 px link-underline (action-line), 2 px action on hover and focus. */
const LINK_CLASSES =
  'rounded-control text-link-ink underline decoration-link-underline decoration-1 underline-offset-[0.22em] ' +
  'transition-[text-decoration-thickness] duration-hover hover:decoration-2 hover:decoration-action ' +
  'focus-visible:decoration-2 focus-visible:decoration-action';

/**
 * One dated trail with two lanes (systems and summits) on a single spine (§D.1).
 * Each item: mark, then <time dateTime> (only when the date is known), then the label (a link when `href`).
 */
export function Trail({ items, label, summitTone = 'ink', className }: TrailProps) {
  if (items.length === 0) return null;
  return (
    <ol aria-label={label} className={cn('relative m-0 list-none p-0', className)}>
      {items.map((item, index) => {
        const internal = item.href?.startsWith('/') && !item.href.startsWith('//');
        const labelNode = item.href ? (
          internal ? (
            <Link href={item.href} className={LINK_CLASSES}>
              {item.label}
            </Link>
          ) : (
            <a href={item.href} className={LINK_CLASSES}>
              {item.label}
            </a>
          )
        ) : (
          item.label
        );
        return (
          <li
            key={`${item.lane}-${item.label}-${index}`}
            className={`text-caption ${cn(
              'relative grid grid-cols-[10px_minmax(0,1fr)] items-start gap-x-3 py-1',
              // spine segment from this mark to the next one, stopping 7 px short of each mark
              "after:absolute after:bottom-[calc(3px-0.725em)] after:left-[4.5px] after:top-[calc(11px+0.725em)] after:w-px after:bg-line-strong after:content-[''] last:after:hidden",
            )}`}
          >
            <span className="flex h-[1.45em] items-center">
              <TrailMark
                lane={item.lane}
                filled={item.lane === 'systems' && Boolean(item.href)}
                summitTone={summitTone}
                title={LANE_NAME[item.lane]}
              />
            </span>
            <span className="min-w-0 font-body text-ink [text-wrap:pretty]">
              {item.date ? (
                <time
                  dateTime={item.datetime}
                  className="mr-2 font-data text-ink-muted [font-variant-numeric:tabular-nums_slashed-zero]"
                >
                  {item.date}
                </time>
              ) : null}
              {labelNode}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
