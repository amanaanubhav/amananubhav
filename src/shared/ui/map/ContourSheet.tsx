import { useId, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import type { CSSVars } from '@/shared/lib/css';
import { LabelLayer, OverlayBox, type LayerLabel } from './SheetLabels';
import { SheetMotion } from './SheetMotion';
import type { ContourSheetData, SheetRoute } from './types';

export interface ContourSheetProps {
  data: ContourSheetData;
  title: string;
  desc: string;
  /** define renders the symbols `sheet-${data.id}-minor` and `-index` once per page; reference uses <use href>. */
  mode?: 'define' | 'reference';
  routeState?: 'hidden' | 'graph' | 'solid' | 'planned';
  /** Draw the main route on view (hero: MOTION.dur.hero after the preloader). */
  drawRoute?: 'once' | 'none';
  /**
   * all: every label plus the graticule, scale and north furniture. priority: priority-1 labels only.
   * responsive: `all` from 1024 px, `priority` below it, from one instance (the hero's define plate, §G.1).
   */
  labels?: 'all' | 'priority' | 'responsive' | 'none';
  /**
   * meet (default): the sheet sizes itself to the viewBox ratio. slice: the sheet fills a frame that
   * the caller sizes through `className` (e.g. `aspect-[4/5] w-full` or `size-full`) and is cropped.
   */
  aspect?: 'slice' | 'meet';
  /** G-09: tent light fades, a headlamp line climbs the planned route (once, in view). */
  alpineStart?: boolean;
  className?: string;
  /** HTML overlays positioned in percent of the viewBox (pins, cards, readouts). */
  children?: ReactNode;
}

/** The honesty note a sheet carries for its relief source (§A.4, §D.2). */
export function sheetSourceNote(data: Pick<ContourSheetData, 'source'>): string | undefined {
  if (data.source === 'procedural') return 'Illustrative relief';
  if (data.source === 'stub') return 'Schematic. Relief to come';
  return undefined;
}

const NON_SCALING = 'non-scaling-stroke' as const;
const r1 = (v: number) => Math.round(v * 10) / 10;
const ROUTE: CSSProperties = {
  stroke: 'rgb(var(--c-signal-line))',
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
const INK_LINE: CSSProperties = { stroke: 'rgb(var(--c-ink))', fill: 'none', strokeWidth: 1 };

type RouteLook = { width: number; dash?: string; rings: boolean; plannedLabel: boolean };

function routeLook(route: SheetRoute, state: NonNullable<ContourSheetProps['routeState']>): RouteLook | null {
  if (state === 'hidden') return null;
  if (route.kind === 'planned') return { width: 1.5, dash: '6 5', rings: false, plannedLabel: true };
  if (route.kind === 'done') return { width: 2, rings: false, plannedLabel: false };
  const side = route.kind === 'side-trip';
  if (state === 'graph') return { width: side ? 1.5 : 2, dash: '6 5', rings: true, plannedLabel: false };
  if (state === 'planned' && !side) return { width: 1.5, dash: '6 5', rings: false, plannedLabel: true };
  return { width: side ? 1.5 : 2, rings: false, plannedLabel: false };
}

function surveyGrid(w: number, h: number): string {
  const step = Math.max(w, h) / 20;
  let d = '';
  for (let x = step; x < w; x += step) d += `M${Math.round(x)} 0V${h}`;
  for (let y = step; y < h; y += step) d += `M0 ${Math.round(y)}H${w}`;
  return d;
}

/**
 * Contour sheet (G-01, G-03, G-09): a printed map plate. Contours and water live in a <symbol>
 * defined once per page; every instance draws its own routes, labels and furniture, so one sheet can
 * serve the hero, the stage poster and the static plates at different route states.
 * Server-safe; route drawing and the alpine start are a small client island (`SheetMotion`).
 */
export function ContourSheet({
  data,
  title,
  desc,
  mode = 'define',
  routeState = 'solid',
  drawRoute = 'none',
  labels = 'all',
  aspect = 'meet',
  alpineStart = false,
  className,
  children,
}: ContourSheetProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [w, h] = data.viewBox;
  const symbolId = `sheet-${data.id}`;
  const titleId = `cs-${uid}-t`;
  const descId = `cs-${uid}-d`;
  const maskId = `cs-${uid}-m`;
  const stub = data.source === 'stub';
  const note = sheetSourceNote(data);
  // Marks (rings, tent, headlamp) keep a readable size whatever the viewBox scale.
  const mark = Math.max(1, Math.max(w, h) / 560);

  const looks = data.routes.map((r) => ({ route: r, look: routeLook(r, routeState) }));
  const visible = looks.filter((x): x is { route: SheetRoute; look: RouteLook } => x.look !== null);
  const isLead = (r: SheetRoute) => r.kind === 'main' || r.kind === 'done';
  const animateDraw = drawRoute === 'once' && visible.some((x) => isLead(x.route));
  const lead = visible.filter((x) => !animateDraw || isLead(x.route));
  const after = animateDraw ? visible.filter((x) => !isLead(x.route)) : [];

  // The route the headlamp climbs: the first planned route as drawn on this instance.
  const plannedRoute = visible.find((x) => x.look.plannedLabel)?.route;
  const ridge = alpineStart && data.index.length > 0 ? data.index[data.index.length - 1] : undefined;
  const headlampAt = plannedRoute?.nodes[plannedRoute.nodes.length - 1];

  const full = labels === 'all' || labels === 'responsive';
  const layerLabels: LayerLabel[] = [];
  if (labels !== 'none') {
    for (const l of data.labels) if (full || l.priority === 1) layerLabels.push(l);
    for (const { route, look } of visible) {
      const mid = route.nodes[Math.floor(route.nodes.length / 2)];
      if (look.plannedLabel && mid) {
        layerLabels.push({ x: mid.x + 12, y: mid.y, text: 'planned', kind: 'note', anchor: 'start', priority: 1 });
      }
    }
    if (full) {
      for (const g of data.graticule ?? []) {
        if (typeof g.x === 'number') layerLabels.push({ x: g.x, y: 14, text: g.text, kind: 'note', anchor: 'middle', priority: 2, data: true, place: 'below' });
        if (typeof g.y === 'number') layerLabels.push({ x: 14, y: g.y, text: g.text, kind: 'note', anchor: 'start', priority: 2, data: true });
      }
      if (data.scaleBar) {
        const s = data.scaleBar;
        layerLabels.push({ x: s.x + s.lengthPx / 2, y: s.y - 6, text: s.text, kind: 'note', anchor: 'middle', priority: 2, data: true, place: 'above' });
      }
      if (data.northArrow) {
        layerLabels.push({ x: data.northArrow.x, y: data.northArrow.y, text: 'N', kind: 'note', anchor: 'middle', priority: 2, display: true, place: 'above' });
      }
    }
  }

  const routeGroup = (items: typeof visible) =>
    items.map(({ route, look }) => (
      <g key={route.id}>
        <path
          d={route.d}
          className="route-line"
          style={{ ...ROUTE, strokeWidth: look.width, strokeDasharray: look.dash }}
          vectorEffect={NON_SCALING}
          data-sheet-planned={plannedRoute?.id === route.id ? '' : undefined}
        />
        {look.rings &&
          route.nodes.map((n) => (
            <circle key={`${n.name}-${n.x}`} cx={n.x} cy={n.y} r={r1(5 * mark)} className="fill-ground signal-mark"
              style={{ stroke: 'rgb(var(--c-signal-line))', strokeWidth: 1.5 }} vectorEffect={NON_SCALING} />
          ))}
      </g>
    ));

  const svg = (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio={`xMidYMid ${aspect}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="absolute inset-0 size-full"
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>
        {desc}
        {note ? ` ${note}.` : ''}
      </desc>

      {(mode === 'define' || animateDraw) && (
        <defs>
          {/* Minor and index contours are separate symbols, so the hero can drift them by different amounts (§G.1). */}
          {mode === 'define' && (
            <symbol id={`${symbolId}-minor`} viewBox={`0 0 ${w} ${h}`}>
              {data.minor.length > 0 && (
                <path d={data.minor.join(' ')} style={{ stroke: 'var(--ink-contour)', fill: 'none', strokeWidth: 1 }}
                  vectorEffect={NON_SCALING} />
              )}
            </symbol>
          )}
          {mode === 'define' && (
            <symbol id={`${symbolId}-index`} viewBox={`0 0 ${w} ${h}`}>
              {data.index.length > 0 && (
                <path d={data.index.join(' ')} style={{ stroke: 'var(--ink-contour-index)', fill: 'none', strokeWidth: 1 }}
                  vectorEffect={NON_SCALING} />
              )}
              {data.water && data.water.length > 0 && (
                <path d={data.water.join(' ')} style={{ stroke: 'rgb(var(--c-water))', fill: 'none', strokeWidth: 1.25 }}
                  vectorEffect={NON_SCALING} />
              )}
            </symbol>
          )}
          {animateDraw && (
            <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
              {lead.map(({ route }) => (
                <path key={route.id} d={route.d} data-sheet-draw="" fill="none" stroke="white" strokeWidth={28}
                  strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </mask>
          )}
        </defs>
      )}

      <g data-sheet-contours="" aria-hidden="true">
        <g data-sheet-minor="">
          <use href={`#${symbolId}-minor`} width={w} height={h} />
        </g>
        <g data-sheet-index="">
          <use href={`#${symbolId}-index`} width={w} height={h} />
        </g>
      </g>

      {stub && <path d={surveyGrid(w, h)} aria-hidden="true" style={{ stroke: 'var(--ink-contour)', strokeWidth: 1 }} vectorEffect={NON_SCALING} />}

      {ridge && (
        <path d={ridge} data-sheet-ridge="" aria-hidden="true" opacity={0.5}
          style={{ stroke: 'rgb(var(--c-signal-line))', fill: 'none', strokeWidth: 1 }} vectorEffect={NON_SCALING} />
      )}

      {full && (
        <g
          aria-hidden="true"
          className={labels === 'responsive' ? 'max-lg:hidden' : undefined}
          style={{ ...INK_LINE, stroke: 'rgb(var(--c-ink-muted))' }}
        >
          {(data.graticule ?? []).map((g, i) => (
            <path key={i} vectorEffect={NON_SCALING}
              d={typeof g.x === 'number' ? `M${g.x} 0V14M${g.x} ${h - 14}V${h}` : `M0 ${g.y}H14M${w - 14} ${g.y}H${w}`} />
          ))}
          {data.scaleBar && (
            <path vectorEffect={NON_SCALING}
              d={`M${data.scaleBar.x} ${data.scaleBar.y - 6}V${data.scaleBar.y}H${data.scaleBar.x + data.scaleBar.lengthPx}V${data.scaleBar.y - 6}`} />
          )}
          {data.northArrow && (
            <g>
              <path vectorEffect={NON_SCALING} d={`M${data.northArrow.x} ${data.northArrow.y + 40}V${data.northArrow.y + 6}`} />
              <path
                d={`M${data.northArrow.x} ${data.northArrow.y}l${r1(5 * mark)} ${r1(12 * mark)}l${r1(-5 * mark)} ${r1(-4 * mark)}l${r1(-5 * mark)} ${r1(4 * mark)}Z`}
                className="fill-ink-muted"
                style={{ stroke: 'none' }}
              />
            </g>
          )}
        </g>
      )}

      <g aria-hidden="true" mask={animateDraw ? `url(#${maskId})` : undefined}>
        {routeGroup(lead)}
      </g>
      {after.length > 0 && (
        <g aria-hidden="true" data-sheet-after="">
          {routeGroup(after)}
        </g>
      )}

      {data.tent && (
        <g aria-hidden="true" transform={`translate(${data.tent.x} ${data.tent.y}) scale(${mark.toFixed(2)})`}>
          <path d="M-11 7L0 -9L11 7Z" className="fill-ground" style={{ ...INK_LINE, strokeWidth: 1.25, strokeLinejoin: 'round' }}
            vectorEffect={NON_SCALING} />
          <path d="M-5 7L0 -1L5 7Z" data-sheet-tent-light="" opacity={alpineStart ? 0 : 1} className="fill-signal signal-mark" />
        </g>
      )}

      {alpineStart && headlampAt && (
        <circle data-sheet-headlamp="" aria-hidden="true" cx={headlampAt.x} cy={headlampAt.y} r={r1(4 * mark)}
          className="signal-mark" style={{ fill: 'rgb(var(--c-signal-line))' }} />
      )}
    </svg>
  );

  const inner = (
    <>
      {svg}
      {layerLabels.length > 0 && (
        <OverlayBox w={w} h={h} aspect={aspect} ariaHidden>
          <LabelLayer labels={layerLabels} w={w} h={h} priorityBelowLg={labels === 'responsive'} />
        </OverlayBox>
      )}
      {children && (
        <OverlayBox w={w} h={h} aspect={aspect} className="[&_*]:pointer-events-auto">
          {children}
        </OverlayBox>
      )}
      {labels !== 'none' && (data.sheetTitle || note) && (
        <p className="pointer-events-none absolute bottom-2 left-3 right-3 font-body text-caption italic text-ink-muted" aria-hidden="true">
          {data.sheetTitle}
          {data.sheetTitle && note ? ' ' : ''}
          {note ? `${note}.` : ''}
        </p>
      )}
    </>
  );

  const rootClass = cn(
    'plate relative overflow-hidden',
    aspect === 'meet' && 'aspect-[var(--sheet-ar)] w-full',
    className,
  );
  const rootStyle = { '--sheet-ar': `${w} / ${h}`, containerType: 'size' } as CSSVars;

  if (animateDraw || (alpineStart && (Boolean(data.tent) || Boolean(ridge) || Boolean(headlampAt)))) {
    return (
      <SheetMotion className={rootClass} style={rootStyle} drawRoute={animateDraw} alpineStart={alpineStart}>
        {inner}
      </SheetMotion>
    );
  }
  return (
    <div className={rootClass} style={rootStyle}>
      {inner}
    </div>
  );
}
